const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const browserService = require('./browser.service');
const logger = require('../utils/logger');
const config = require('../config');
const { RenderError, TimeoutError } = require('../utils/errors');
const {
  chartRendersTotal,
  chartRenderDuration,
  chartRenderErrors,
} = require('../utils/metrics');

class ChartRendererService {
  constructor() {
    this.templateCache = new Map();
    this.localServer = null;
    this.localServerPort = null;
    this.currentHtml = null;
  }

  async loadTemplate(templateName = 'chart.html') {
    // In development mode, always reload template from disk to avoid caching issues
    if (config.env === 'development') {
      this.templateCache.delete(templateName);
    }

    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(__dirname, '../templates', templateName);
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(templateName, template);
      logger.debug(`Template ${templateName} loaded from disk`);
      return template;
    } catch (error) {
      logger.error(`Failed to load template ${templateName}:`, error);
      throw new RenderError(`Template ${templateName} not found`);
    }
  }

  async renderChart(chartData, renderOptions = {}) {
    const startTime = Date.now();
    const chartType = chartData.chartType || 'natal';
    let page = null;

    try {
      logger.info(`Starting ${chartType} chart render`, {
        format: renderOptions.format || 'png',
        dimensions: `${renderOptions.width || 800}x${renderOptions.height || 800}`,
      });

      // Get a browser page
      page = await browserService.getPage();

      // Set viewport size to match render options exactly
      const width = renderOptions.width || 800;
      const height = renderOptions.height || 800;
      await page.setViewport({
        width: width,
        height: height,
        deviceScaleFactor: 1,
      });

      // No need to block requests - icons are now embedded as data URLs in v3.0.0

      // Set up console logging BEFORE loading content
      page.on('console', (msg) => {
        const text = msg.text();
        logger.debug(`Browser console: ${text}`);
        // Log errors more prominently
        if (msg.type() === 'error') {
          logger.error(`Browser console error: ${text}`);
        }
      });
      page.on('pageerror', (error) => logger.error(`Browser page error: ${error.message}\n${error.stack}`));

      // Load HTML template
      const template = await this.loadTemplate('chart.html');

      // Prepare chart configuration
      const chartConfig = this.prepareChartConfig(chartData, renderOptions);

      // Inject data into template (now async - inlines library)
      const html = await this.injectDataIntoTemplate(template, chartConfig);

      // Save HTML for debugging (only in development) - BEFORE sending to browser
      // This ensures library is inlined in the saved file
      if (config.env === 'development') {
        const debugPath = path.join(__dirname, '../../debug-chart.html');
        await fs.writeFile(debugPath, html, 'utf8');
        logger.debug(`Debug HTML saved to: ${debugPath} (before browser load)`);
      }

      // Start local HTTP server to serve HTML with proper base URL
      const serverUrl = await this.startLocalServer(html);
      
      // Navigate to local server URL - this allows relative paths to work correctly
      await page.goto(serverUrl, { waitUntil: 'networkidle0' });

      // Wait for chart to render - check that SVG exists and has content
      await page.waitForSelector('#chart-container svg', {
        timeout: config.puppeteer.renderTimeout,
      });
      logger.debug('SVG element detected');

      // Wait for SVG to have actual content (not empty) and chart to be rendered
      await page.waitForFunction(
        () => {
          const svg = document.querySelector('#chart-container svg');
          if (!svg) return false;
          // Check that SVG has children (groups) - this means chart is rendered
          return svg.children.length > 0;
        },
        { timeout: config.puppeteer.renderTimeout }
      );
      logger.debug('SVG children ready');

      // Wait for actual content to be rendered inside SVG groups
      // nocturna-wheel uses <image> elements for icons, not circles  
      try {
        await page.waitForFunction(
          () => {
            const svg = document.querySelector('#chart-container svg');
            if (!svg) return false;
            
            // Check for any rendered elements inside groups
            // nocturna-wheel uses: image (icons), path (aspects), line (divisions), text (labels)
            const hasImages = svg.querySelectorAll('image').length > 0;
            const hasPaths = svg.querySelectorAll('path').length > 0;
            const hasLines = svg.querySelectorAll('line').length > 0;
            const hasText = svg.querySelectorAll('text').length > 0;
            
            // Chart should have at least images (planet/zodiac icons) or paths (aspects)
            return hasImages || hasPaths || hasLines || hasText;
          },
          {
            timeout: Math.min(config.puppeteer.renderTimeout, 15000),
          }
        );
        logger.debug('SVG has drawable content');
      } catch (error) {
        logger.warn('Timed out waiting for drawable SVG content, proceeding anyway');
      }

      // Debug: Log SVG information
      const svgInfo = await page.evaluate(() => {
        const svg = document.querySelector('#chart-container svg');
        const container = document.querySelector('#chart-container');
        if (!svg) return { error: 'SVG not found' };
        const rect = svg.getBoundingClientRect();
        const images = svg.querySelectorAll('image').length;
        const circles = svg.querySelectorAll('circle').length;
        const paths = svg.querySelectorAll('path').length;
        const lines = svg.querySelectorAll('line').length;
        const texts = svg.querySelectorAll('text').length;
        return {
          svgExists: !!svg,
          svgWidth: svg.getAttribute('width'),
          svgHeight: svg.getAttribute('height'),
          svgViewBox: svg.getAttribute('viewBox'),
          svgChildren: svg.children.length,
          renderedElements: { images, circles, paths, lines, texts },
          containerWidth: container ? container.offsetWidth : 0,
          containerHeight: container ? container.offsetHeight : 0,
          svgBoundingBox: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        };
      });
      logger.info('SVG debug info:', JSON.stringify(svgInfo, null, 2));
      
      // HTML is already saved before browser load (with inlined library)
      // If needed, we can also save after browser load for comparison

      // Wait for actual rendered content to appear in SVG
      // This ensures the chart is visually rendered, not just SVG structure created
      await page.waitForFunction(
        () => {
          const svg = document.querySelector('#chart-container svg');
          if (!svg) return false;
          // Count actual rendered elements (nocturna-wheel uses image elements for icons)
          const images = svg.querySelectorAll('image').length;
          const circles = svg.querySelectorAll('circle').length;
          const paths = svg.querySelectorAll('path').length;
          const lines = svg.querySelectorAll('line').length;
          const texts = svg.querySelectorAll('text').length;
          // Chart should have at least some rendered elements
          return (images + circles + paths + lines + texts) > 0;
        },
        { timeout: 5000 }
      ).catch(() => {
        // If timeout, continue anyway - chart might be rendered differently
        logger.warn('Timeout waiting for rendered elements, proceeding with screenshot');
      });

      // Wait for images to load (data URLs might need time to decode)
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const images = document.querySelectorAll('svg image');
          if (images.length === 0) {
            resolve();
            return;
          }
          
          let loadedCount = 0;
          const checkComplete = () => {
            loadedCount++;
            if (loadedCount >= images.length) {
              resolve();
            }
          };
          
          images.forEach((img) => {
            if (img.complete) {
              checkComplete();
            } else {
              img.addEventListener('load', checkComplete);
              img.addEventListener('error', checkComplete); // Continue even on error
            }
          });
          
          // Timeout after 2 seconds even if images not loaded
          setTimeout(resolve, 2000);
        });
      });
      
      // Small additional delay to ensure rendering is stable
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture image IMMEDIATELY after rendering - don't wait for resource loading
      const imageBuffer = await this.captureImage(page, renderOptions);

      // Record metrics
      const renderTime = Date.now() - startTime;
      chartRendersTotal.labels(chartType, 'success').inc();
      chartRenderDuration.labels(chartType).observe(renderTime / 1000);

      logger.info(`Chart rendered successfully in ${renderTime}ms`, {
        type: chartType,
        size: imageBuffer.length,
      });

      return {
        image: imageBuffer.toString('base64'),
        format: renderOptions.format || 'png',
        size: imageBuffer.length,
        dimensions: {
          width: renderOptions.width || 800,
          height: renderOptions.height || 800,
        },
        renderTime,
      };
    } catch (error) {
      const renderTime = Date.now() - startTime;
      chartRendersTotal.labels(chartType, 'error').inc();
      chartRenderErrors.labels(chartType, error.code || 'UNKNOWN').inc();

      logger.error('Chart render failed:', {
        type: chartType,
        error: error.message,
        renderTime,
      });

      if (error.name === 'TimeoutError') {
        throw new TimeoutError('Chart rendering timed out');
      }

      throw new RenderError('Failed to render chart', {
        originalError: error.message,
      });
    } finally {
      if (page) {
        await browserService.closePage(page);
      }
    }
  }

  prepareChartConfig(chartData, renderOptions) {
    const config = {
      planets: chartData.planets || {},
      houses: chartData.houses || [],
      aspectSettings: chartData.aspectSettings || {
        enabled: true,
        orb: 6,
        types: {
          conjunction: { enabled: true },
          opposition: { enabled: true },
          trine: { enabled: true },
          square: { enabled: true },
          sextile: { enabled: true },
        },
      },
      renderOptions: {
        width: renderOptions.width || 800,
        height: renderOptions.height || 800,
        theme: renderOptions.theme || 'light',
      },
    };

    // Handle transit chart
    if (chartData.natal && chartData.transit) {
      config.planets = chartData.natal.planets;
      config.secondaryPlanets = chartData.transit.planets;
      config.houses = chartData.natal.houses;
      config.primaryAspectSettings = chartData.aspectSettings?.natal || { enabled: true, orb: 6 };
      config.secondaryAspectSettings = chartData.aspectSettings?.transit || {
        enabled: false,
        orb: 6,
      };
      config.synastryAspectSettings = chartData.aspectSettings?.natalToTransit || {
        enabled: true,
        orb: 3,
      };
    }

    // Handle synastry chart
    if (chartData.person1 && chartData.person2) {
      config.planets = chartData.person1.planets;
      config.secondaryPlanets = chartData.person2.planets;
      
      // Select houses based on synastrySettings.useHousesFrom
      const useHousesFrom = chartData.synastrySettings?.useHousesFrom || 'person1';
      if (useHousesFrom === 'person2') {
        config.houses = chartData.person2.houses;
      } else {
        config.houses = chartData.person1.houses;
      }
      
      config.primaryAspectSettings = chartData.synastrySettings?.aspectSettings?.person1 || {
        enabled: true,
        orb: 6,
      };
      config.secondaryAspectSettings = chartData.synastrySettings?.aspectSettings?.person2 || {
        enabled: false,
        orb: 6,
      };
      config.synastryAspectSettings = chartData.synastrySettings?.aspectSettings?.interaspects || {
        enabled: true,
        orb: 6,
      };
    }

    return config;
  }

  async injectDataIntoTemplate(template, chartConfig) {
    // Replace chart config placeholder
    let html = template.replace(
      '/* CHART_CONFIG_PLACEHOLDER */',
      `const chartConfig = ${JSON.stringify(chartConfig, null, 2)};`
    );

    // Always inline the library to avoid CDN issues and certificate problems
    // This makes the HTML self-contained and reliable
    try {
      const libraryPath = path.join(
        __dirname,
        '../../node_modules/@eaprelsky/nocturna-wheel/dist/nocturna-wheel.min.js'
      );
      
      // Check if library file exists
      try {
        await fs.access(libraryPath);
      } catch (error) {
        logger.error(`Nocturna-wheel library not found at: ${libraryPath}`);
        throw new RenderError('Nocturna-wheel library not found. Please run npm install.');
      }
      
      const libraryContent = await fs.readFile(libraryPath, 'utf-8');
      logger.debug(`Library file read: ${libraryContent.length} bytes`);
      
      // Check if script tag exists in HTML - use simple pattern that matches any script with nocturna-wheel
      const scriptTagPattern = /<script\s+src\s*=\s*["'][^"']*nocturna-wheel[^"']*\.js[^"']*["']\s*>\s*<\/script>/i;
      const scriptTagMatch = html.match(scriptTagPattern);
      
      if (!scriptTagMatch) {
        // Try alternative pattern - script tag might be on multiple lines
        const multilinePattern = /<script[^>]*src\s*=\s*["'][^"']*nocturna-wheel[^"']*\.js[^"']*["'][^>]*>\s*<\/script>/is;
        const multilineMatch = html.match(multilinePattern);
        if (multilineMatch) {
          logger.debug('Found script tag (multiline pattern):', multilineMatch[0]);
          html = html.replace(multilinePattern, `<script>\n${libraryContent}\n</script>`);
        } else {
          logger.error('No nocturna-wheel script tag found in HTML template');
          logger.error('HTML template sample (first 2000 chars):', html.substring(0, 2000));
          throw new RenderError('Failed to inline nocturna-wheel library: script tag not found in template');
        }
      } else {
        logger.debug('Found script tag:', scriptTagMatch[0]);
        html = html.replace(scriptTagPattern, `<script>\n${libraryContent}\n</script>`);
      }
      
      // Verify replacement worked - check that script tag is gone and library content is present
      const hasScriptTag = /<script[^>]*src\s*=\s*["'][^"']*nocturna-wheel[^"']*\.js[^"']*["']/i.test(html);
      const hasLibraryContent = html.includes('NocturnaWheel') || html.includes('nocturna-wheel');
      
      if (hasScriptTag) {
        logger.error('Script tag still present after replacement - replacement failed');
        logger.error('HTML may contain multiple script tags or pattern did not match');
        throw new RenderError('Failed to inline nocturna-wheel library: replacement failed');
      }
      
      if (!hasLibraryContent) {
        logger.warn('Library content may not be properly inlined - NocturnaWheel not found in HTML');
        logger.warn('This may indicate that the library file does not contain expected content');
      } else {
        logger.info(`Nocturna-wheel library successfully inlined into HTML (${libraryContent.length} bytes)`);
      }
    } catch (error) {
      if (error instanceof RenderError && error.message.includes('not found')) {
        // If library file not found, throw error
        throw error;
      }
      // For other errors (like file read errors), log and fallback to local server
      logger.error(`Failed to inline library: ${error.message}`, error);
      logger.warn('Falling back to local server for library loading');
      // Don't throw - allow fallback to local server
    }

    return html;
  }

  async startLocalServer(html) {
    // Store current HTML for serving
    this.currentHtml = html;

    // Path to nocturna-wheel library in node_modules
    const nocturnaWheelPath = path.join(
      __dirname,
      '../../node_modules/@eaprelsky/nocturna-wheel/dist'
    );

    // Verify library file exists (async check)
    const libraryFile = path.join(nocturnaWheelPath, 'nocturna-wheel.min.js');
    try {
      await fs.access(libraryFile);
      logger.debug(`Nocturna-wheel library found at: ${libraryFile}`);
    } catch (error) {
      logger.error(`Nocturna-wheel library not found at: ${libraryFile}`, error);
      throw new RenderError('Nocturna-wheel library not found. Please run npm install.');
    }

    return new Promise((resolve, reject) => {
      if (this.localServer) {
        // Server already running, just return the URL
        resolve(`http://127.0.0.1:${this.localServerPort}`);
        return;
      }

      this.localServer = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        // Serve HTML for root path
        if (url.pathname === '/' || url.pathname === '/index.html') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.currentHtml || html);
          return;
        }

        // Serve nocturna-wheel library files from node_modules
        if (url.pathname.startsWith('/nocturna-wheel/')) {
          const filePath = url.pathname.replace('/nocturna-wheel/', '');
          const fullPath = path.join(nocturnaWheelPath, filePath);
          
          // Security check: ensure file is within library directory
          if (!fullPath.startsWith(nocturnaWheelPath)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
          }

          // Read file asynchronously
          fs.readFile(fullPath)
            .then((fileContent) => {
              const ext = path.extname(filePath);
              let contentType = 'application/javascript';
              
              if (ext === '.js') {
                contentType = 'application/javascript';
              } else if (ext === '.css') {
                contentType = 'text/css';
              } else if (ext === '.map') {
                contentType = 'application/json';
              }
              
              res.writeHead(200, { 'Content-Type': contentType });
              res.end(fileContent);
            })
            .catch((error) => {
              logger.debug(`Failed to serve ${filePath}:`, error.message);
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Not found');
            });
          return;
        }

        // Silently handle favicon requests to avoid noisy console errors
        if (url.pathname === '/favicon.ico') {
          res.writeHead(204);
          res.end();
          return;
        }
        
        logger.debug(`Local server 404: ${url.pathname}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      });

      this.localServer.listen(0, '127.0.0.1', () => {
        this.localServerPort = this.localServer.address().port;
        const serverUrl = `http://127.0.0.1:${this.localServerPort}`;
        logger.debug(`Local server started on ${serverUrl}`);
        resolve(serverUrl);
      });

      this.localServer.on('error', (error) => {
        logger.error(`Local server error: ${error.message}`);
        reject(error);
      });
    });
  }

  async stopLocalServer() {
    if (this.localServer) {
      return new Promise((resolve) => {
        this.localServer.close(() => {
          this.localServer = null;
          this.localServerPort = null;
          logger.debug('Local server stopped');
          resolve();
        });
      });
    }
  }

  async captureImage(page, renderOptions) {
    const format = renderOptions.format || 'png';
    const quality = renderOptions.quality || 90;
    const width = renderOptions.width || 800;
    const height = renderOptions.height || 800;

    // Always use full page screenshot with explicit clip to ensure we capture everything
    // This is more reliable than element screenshots for SVG content
    const screenshotOptions = {
      type: format === 'jpeg' ? 'jpeg' : 'png',
      encoding: 'binary',
      clip: {
        x: 0,
        y: 0,
        width: width,
        height: height,
      },
    };

    // Quality is only supported for JPEG format, not PNG
    if (format === 'jpeg') {
      screenshotOptions.quality = quality;
    }

    // Use full page screenshot with clip - this is more reliable for SVG
    logger.debug('Taking full page screenshot with clip:', screenshotOptions.clip);
    return await page.screenshot(screenshotOptions);
  }
}

module.exports = new ChartRendererService();


