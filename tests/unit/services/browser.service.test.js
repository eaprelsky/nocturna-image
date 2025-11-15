const browserService = require('../../../src/services/browser.service');

// Mock puppeteer
jest.mock('puppeteer');
const puppeteer = require('puppeteer');

describe('BrowserService', () => {
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    // Reset service state
    browserService.browser = null;
    browserService.activePagesCount = 0;

    // Setup mocks
    mockPage = {
      close: jest.fn().mockResolvedValue(undefined),
      isClosed: jest.fn().mockReturnValue(false),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      on: jest.fn(),
    };

    puppeteer.launch = jest.fn().mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    test('should initialize browser successfully', async () => {
      const browser = await browserService.initialize();

      expect(browser).toBe(mockBrowser);
      expect(puppeteer.launch).toHaveBeenCalledTimes(1);
      expect(mockBrowser.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });

    test('should return existing browser if already initialized', async () => {
      await browserService.initialize();
      const browser = await browserService.initialize();

      expect(browser).toBe(mockBrowser);
      expect(puppeteer.launch).toHaveBeenCalledTimes(1); // Only called once
    });

    test('should handle browser initialization failure', async () => {
      const error = new Error('Failed to launch browser');
      puppeteer.launch.mockRejectedValueOnce(error);

      await expect(browserService.initialize()).rejects.toThrow('Failed to launch browser');
    });

    test('should handle browser disconnection', async () => {
      await browserService.initialize();

      // Simulate disconnection
      const disconnectHandler = mockBrowser.on.mock.calls.find(
        call => call[0] === 'disconnected'
      )[1];
      disconnectHandler();

      expect(browserService.browser).toBeNull();
    });
  });

  describe('getPage', () => {
    test('should create and return a new page', async () => {
      await browserService.initialize();
      const page = await browserService.getPage();

      expect(page).toBe(mockPage);
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
      expect(browserService.activePagesCount).toBe(1);
    });

    test('should initialize browser if not already initialized', async () => {
      const page = await browserService.getPage();

      expect(page).toBe(mockPage);
      expect(puppeteer.launch).toHaveBeenCalledTimes(1);
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
    });

    test('should throw error when max concurrent renders reached', async () => {
      await browserService.initialize();
      browserService.activePagesCount = browserService.maxConcurrentRenders;

      await expect(browserService.getPage()).rejects.toThrow('Maximum concurrent renders reached');
    });

    test('should handle page creation failure', async () => {
      await browserService.initialize();
      mockBrowser.newPage.mockRejectedValueOnce(new Error('Page creation failed'));

      await expect(browserService.getPage()).rejects.toThrow('Page creation failed');
    });
  });

  describe('closePage', () => {
    test('should close page and decrement counter', async () => {
      await browserService.initialize();
      await browserService.getPage();
      
      await browserService.closePage(mockPage);

      expect(mockPage.close).toHaveBeenCalledTimes(1);
      expect(browserService.activePagesCount).toBe(0);
    });

    test('should not close already closed page', async () => {
      mockPage.isClosed.mockReturnValue(true);
      await browserService.closePage(mockPage);

      expect(mockPage.close).not.toHaveBeenCalled();
    });

    test('should handle null page gracefully', async () => {
      await expect(browserService.closePage(null)).resolves.not.toThrow();
    });

    test('should handle page close error', async () => {
      mockPage.close.mockRejectedValueOnce(new Error('Close failed'));
      
      await expect(browserService.closePage(mockPage)).resolves.not.toThrow();
    });
  });

  describe('close', () => {
    test('should close browser and reset state', async () => {
      await browserService.initialize();
      await browserService.getPage();
      
      await browserService.close();

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
      expect(browserService.browser).toBeNull();
      expect(browserService.activePagesCount).toBe(0);
    });

    test('should handle close when browser is not initialized', async () => {
      await expect(browserService.close()).resolves.not.toThrow();
      expect(mockBrowser.close).not.toHaveBeenCalled();
    });

    test('should handle browser close error', async () => {
      await browserService.initialize();
      mockBrowser.close.mockRejectedValueOnce(new Error('Close failed'));
      
      await expect(browserService.close()).resolves.not.toThrow();
    });
  });

  describe('restart', () => {
    test('should close and reinitialize browser', async () => {
      await browserService.initialize();
      
      await browserService.restart();

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
      expect(puppeteer.launch).toHaveBeenCalledTimes(2); // Once for init, once for restart
    });
  });

  describe('getActivePagesCount', () => {
    test('should return current active pages count', async () => {
      expect(browserService.getActivePagesCount()).toBe(0);

      await browserService.getPage();
      expect(browserService.getActivePagesCount()).toBe(1);

      await browserService.getPage();
      expect(browserService.getActivePagesCount()).toBe(2);
    });
  });

  describe('isReady', () => {
    test('should return true when browser is initialized and connected', async () => {
      await browserService.initialize();
      
      expect(browserService.isReady()).toBe(true);
    });

    test('should return false when browser is not initialized', () => {
      expect(browserService.isReady()).toBe(false);
    });

    test('should return false when browser is not connected', async () => {
      await browserService.initialize();
      mockBrowser.isConnected.mockReturnValue(false);
      
      expect(browserService.isReady()).toBe(false);
    });
  });
});

