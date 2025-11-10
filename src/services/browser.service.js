const puppeteer = require('puppeteer');
const puppeteerConfig = require('../config/puppeteer.config');
const logger = require('../utils/logger');
const { browserInstancesActive } = require('../utils/metrics');

class BrowserService {
  constructor() {
    this.browser = null;
    this.activePagesCount = 0;
    this.maxConcurrentRenders = require('../config').puppeteer.maxConcurrentRenders;
  }

  async initialize() {
    if (this.browser) {
      return this.browser;
    }

    try {
      logger.info('Initializing Puppeteer browser...');
      this.browser = await puppeteer.launch(puppeteerConfig);
      browserInstancesActive.set(1);
      logger.info('Browser initialized successfully');

      // Handle unexpected browser closure
      this.browser.on('disconnected', () => {
        logger.warn('Browser disconnected unexpectedly');
        this.browser = null;
        browserInstancesActive.set(0);
      });

      return this.browser;
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      browserInstancesActive.set(0);
      throw error;
    }
  }

  async getPage() {
    if (!this.browser) {
      await this.initialize();
    }

    // Check if we've reached the concurrent limit
    if (this.activePagesCount >= this.maxConcurrentRenders) {
      throw new Error('Maximum concurrent renders reached');
    }

    try {
      const page = await this.browser.newPage();
      this.activePagesCount++;
      logger.debug(`Page created. Active pages: ${this.activePagesCount}`);
      return page;
    } catch (error) {
      logger.error('Failed to create new page:', error);
      throw error;
    }
  }

  async closePage(page) {
    try {
      if (page && !page.isClosed()) {
        await page.close();
        this.activePagesCount = Math.max(0, this.activePagesCount - 1);
        logger.debug(`Page closed. Active pages: ${this.activePagesCount}`);
      }
    } catch (error) {
      logger.error('Error closing page:', error);
    }
  }

  async restart() {
    logger.info('Restarting browser...');
    await this.close();
    await this.initialize();
    logger.info('Browser restarted successfully');
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.activePagesCount = 0;
        browserInstancesActive.set(0);
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Error closing browser:', error);
      }
    }
  }

  getActivePagesCount() {
    return this.activePagesCount;
  }

  isReady() {
    return this.browser !== null && this.browser.isConnected();
  }
}

// Export singleton instance
module.exports = new BrowserService();

