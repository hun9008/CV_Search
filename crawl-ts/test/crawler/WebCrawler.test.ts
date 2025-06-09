import{ Browser, BrowserContext, Page } from 'puppeteer';
import express from 'express';
import * as http from 'http';
import path from 'path';
import { WebCrawler } from '../../src/crawler/WebCrawler';
import { IUrlManager } from '../../src/url/IUrlManager';
import { IContentExtractor } from '../../src/content';
import { Producer } from '@message/Producer';
import { ChromeBrowserManager } from '@browser/ChromeBrowserManager';


describe('WebCrawler', () => {
  let server: http.Server;
  let serverUrl: string;
  let crawler: WebCrawler;
  let mockUrlManager: jest.Mocked<IUrlManager>;
  let mockBrowserManager: jest.Mocked<ChromeBrowserManager>;
  let mockContentExtractor: jest.Mocked<IContentExtractor>;
  let mockProducer: jest.Mocked<Producer>;
  let mockPage: jest.Mocked<Page>;
  let mockBrowser: jest.Mocked<Browser>;
  let mockContext: jest.Mocked<BrowserContext>;

  const fixturesDir = path.join(__dirname, './');

  beforeAll(async () => {
    // Set up a local server to serve test HTML files
    const app = express();
    app.use(express.static(fixturesDir));

    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s)); // Random available port
    });

    const port = (server.address() as any).port;
    serverUrl = `http://localhost:${port}/web-crawler-test.html`;
  });

  afterAll(async () => {
    if (server) await new Promise((res) => server.close(res));
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Page
    mockPage = {
      on: jest.fn().mockResolvedValue(undefined),
      goto: jest.fn().mockResolvedValue({ ok: () => true }),
      $eval: jest.fn().mockResolvedValue("Test Title"),
      evaluate: jest.fn().mockResolvedValue("Test Content"),
      url: jest.fn().mockReturnValue(serverUrl),
      waitForNavigation: jest.fn().mockResolvedValue(null),
      close: jest.fn().mockResolvedValue(null),
      isClosed: jest.fn().mockResolvedValue(false),
      content: jest.fn().mockResolvedValue('<html><body>Test Content</body></html>')
    } as unknown as jest.Mocked<Page>;

    // Create mock Browser
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(null)
    } as unknown as jest.Mocked<Browser>;

     // Create mock Browser
     mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(null)
    } as unknown as jest.Mocked<BrowserContext>;

    // Create mock UrlManager
    mockUrlManager = {
      getNextUrl: jest.fn().mockResolvedValue({ url: serverUrl, domain: 'localhost' }),
      addUrl: jest.fn().mockResolvedValue(undefined),
      setURLStatus: jest.fn().mockResolvedValue(undefined),
      textExists: jest.fn().mockResolvedValue(false),
      saveTextHash: jest.fn().mockResolvedValue(true),
      connect: jest.fn().mockResolvedValue(undefined),
      getNextUrlFromDomain: jest.fn().mockResolvedValue(undefined),
    };

    // Create mock MessageService
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Producer>;


    // Create mock BrowserManager
    mockBrowserManager = {
      browser: undefined,
      browserPid: undefined,
      getBrowser: jest.fn(),               // 누락된 부분 추가
      getBrowserContext: jest.fn().mockResolvedValue(mockContext),        // 누락된 부분 추가
      initBrowser: jest.fn().mockResolvedValue(mockBrowser),
      closeBrowser: jest.fn().mockResolvedValue(undefined),
      getNewPage : jest.fn().mockResolvedValue(mockPage),
      killChromeProcesses: jest.fn(),
      saveErrorScreenshot: jest.fn().mockResolvedValue('/path/to/screenshot.png')
    } as unknown as jest.Mocked<ChromeBrowserManager>;

   // Create mock ContentExtractor
    mockContentExtractor = {
      extractLinks: jest.fn().mockResolvedValue(['https://localhost/normal', 'https://localhost/page2.html']
      ),
      extractPageContent : jest.fn().mockResolvedValue({title:'Test Crawler Page',text:'This is a test page'}),
      extractOnclickLinks: jest.fn().mockResolvedValue(['http://localhost/onclick1.html', 'http://localhost/onclick2.html']),
    } as jest.Mocked<IContentExtractor>;

    // Create crawler with mocked dependencies
    crawler = new WebCrawler({
      urlManager: mockUrlManager,
      rawContentProducer: mockProducer,
      browserManager: mockBrowserManager,
      contentExtractor: mockContentExtractor,
    });
  });

  describe('initialization', () => {
    test('should initialize correctly with all dependencies', () => {
      expect(crawler).toBeDefined();
    });
  });

  describe('visitUrl', () => {

    let context: BrowserContext;
    beforeEach(async () => {

      context = await mockBrowserManager.getBrowserContext(0);
    })

    test('should successfully visit a URL and extract data', async () => {
      const result = await crawler.visitUrl( serverUrl, 'localhost' ,context);

      expect(result).toBeDefined();
      // Verify the result
      if (result) {
        expect(result.success).toBe(true);
        expect(result.url).toBe(serverUrl);
        expect(result.title).toBe('Test Crawler Page');
        expect(result.text).toContain('This is a test page');
        expect(result.herfUrls).toContain('https://localhost/normal');
        expect(result.onclickUrls).toContain('http://localhost/onclick1.html');

      }

      // Verify browser interactions
      // expect(mockBrowserManager.initBrowser).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith(serverUrl, expect.any(Object));
      expect(mockPage.close).toHaveBeenCalled();

      // Verify content extractor was called
      expect(mockContentExtractor.extractLinks).toHaveBeenCalled();
    });

    test('should handle errors when visiting a URL', async () => {
      // Mock browser error
      mockBrowserManager.initBrowser.mockRejectedValueOnce(new Error('Browser error'));

      try {
        await crawler.visitUrl( serverUrl, 'localhost',context );
      } catch(error)
      {
        expect((error as Error).message).toContain('Browser');
      }
      // Verify error handling
      expect(mockProducer.sendMessage).toHaveBeenCalledTimes(0);
      expect(mockUrlManager.setURLStatus).toHaveBeenCalledTimes(0);
    });

    test('should handle navigation errors', async () => {
      // Mock navigation error
      mockPage.goto.mockRejectedValue(new Error('Navigation error'));
      try {
        const result = await crawler.visitUrl(serverUrl, 'localhost',context);
        fail('Expected error was not thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Navigation error');
      }
    });
  });


});
