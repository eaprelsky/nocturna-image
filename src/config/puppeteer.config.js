const config = require('./index');

const puppeteerConfig = {
  headless: 'new',
  // Only use executablePath if explicitly set, otherwise let Puppeteer use its bundled Chromium
  // This avoids issues with broken system Chromium installations (e.g., snap in WSL)
  ...(config.puppeteer.executablePath && { executablePath: config.puppeteer.executablePath }),
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
  ],
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
};

module.exports = puppeteerConfig;

