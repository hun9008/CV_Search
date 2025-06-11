import { ChromeBrowserManager } from '../../src/browser/ChromeBrowserManager';
import puppeteer, { Browser, Page, BrowserContext } from 'puppeteer';

jest.mock('puppeteer');

describe('ChromeBrowserManager', () => {
  let browserManager: ChromeBrowserManager;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;
  let mockContext: jest.Mocked<BrowserContext>;

  beforeEach(() => {
    browserManager = new ChromeBrowserManager();
    mockBrowser = {
      newPage: jest.fn(),
      close: jest.fn(),
      process: jest.fn(() => ({ pid: 1234 })),
      browserContexts: jest.fn(() => [mockContext]),
      createBrowserContext: jest.fn(),
      on: jest.fn(),
      targets: jest.fn(() => []),
      pages: jest.fn(() => Promise.resolve([])),
    } as unknown as jest.Mocked<Browser>;

    mockPage = {
      screenshot: jest.fn(),
    } as unknown as jest.Mocked<Page>;

    mockContext = {} as jest.Mocked<BrowserContext>;

    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize the browser', async () => {
    // Given
    const concurrency = 8;

    // When
    const browser = await browserManager.initBrowser(concurrency);

    // Then
    expect(puppeteer.launch).toHaveBeenCalledWith({
      headless: expect.any(Boolean),
      args: expect.any(Array),
      protocolTimeout: expect.any(Number),
      timeout: expect.any(Number),
    });
    expect(browser).toBe(mockBrowser);
    expect(mockBrowser.createBrowserContext).toHaveBeenCalledTimes(concurrency);
  });

  test('should return a new page', async () => {
    // Given
    mockBrowser.newPage.mockResolvedValue(mockPage);
    await browserManager.initBrowser();
    // When
    const page = await browserManager.getNewPage();

    // Then
    expect(mockBrowser.newPage).toHaveBeenCalled();
    expect(page).toBe(mockPage);
  });

  test('should close the browser', async () => {
    // Given
    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser); // Ensure mockBrowser is assigned to this.browser
    await browserManager.initBrowser();

    // When
    await browserManager.closeBrowser();

    // Then
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  test('should save an error screenshot', async () => {
    // Given
    const url = 'https://example.com';
    const mockScreenshotPath = Buffer.from('/path/to/screenshot.png'); // Use Buffer to match the expected type
    mockPage.screenshot.mockResolvedValue(mockScreenshotPath);

    // When
    const screenshotPath = await browserManager.saveErrorScreenshot(mockPage, url);

    // Then
    expect(mockPage.screenshot).toHaveBeenCalledWith({
      path: expect.stringContaining('screenshot'),
      fullPage: true,
    });
    expect(screenshotPath).toContain('screenshot');
  });

  test('should kill Chrome processes', () => {
    // Given
    const execSyncMock = jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {});

    // When
    browserManager.killChromeProcesses();

    // Then
    expect(execSyncMock).toHaveBeenCalled();
    execSyncMock.mockRestore();
  });
});
