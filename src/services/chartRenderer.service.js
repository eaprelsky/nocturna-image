const path = require('path');
const fs = require('fs').promises;
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
  }

  async loadTemplate(templateName = 'chart.html') {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(__dirname, '../templates', templateName);
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(templateName, template);
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

      // Load HTML template
      const template = await this.loadTemplate('chart.html');

      // Prepare chart configuration
      const chartConfig = this.prepareChartConfig(chartData, renderOptions);

      // Inject data into template
      const html = this.injectDataIntoTemplate(template, chartConfig);

      // Set page content
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for chart to render
      await page.waitForSelector('#chart-container svg', {
        timeout: config.puppeteer.renderTimeout,
      });

      // Add small delay to ensure chart is fully rendered
      await page.waitForTimeout(500);

      // Capture image
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
      config.houses = chartData.person1.houses;
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

  injectDataIntoTemplate(template, chartConfig) {
    return template.replace(
      '/* CHART_CONFIG_PLACEHOLDER */',
      `const chartConfig = ${JSON.stringify(chartConfig, null, 2)};`
    );
  }

  async captureImage(page, renderOptions) {
    const format = renderOptions.format || 'png';
    const quality = renderOptions.quality || 90;

    const element = await page.$('#chart-container');
    if (!element) {
      throw new RenderError('Chart container not found');
    }

    const screenshotOptions = {
      type: format === 'jpeg' ? 'jpeg' : 'png',
      encoding: 'binary',
    };

    if (format === 'jpeg' || format === 'png') {
      screenshotOptions.quality = quality;
    }

    return await element.screenshot(screenshotOptions);
  }
}

module.exports = new ChartRendererService();

