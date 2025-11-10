const config = require('./index');

const puppeteerConfig = {
  headless: 'new',
  executablePath: config.puppeteer.executablePath,
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

