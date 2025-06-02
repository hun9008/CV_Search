"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const WebCrawler_1 = require("../../src/crawler/WebCrawler");
describe('WebCrawler', () => {
    let server;
    let serverUrl;
    let crawler;
    let mockUrlManager;
    let mockBrowserManager;
    let mockContentExtractor;
    let mockProducer;
    let mockPage;
    let mockBrowser;
    const fixturesDir = path_1.default.join(__dirname, './');
    beforeAll(async () => {
        // Set up a local server to serve test HTML files
        const app = (0, express_1.default)();
        app.use(express_1.default.static(fixturesDir));
        server = await new Promise((resolve) => {
            const s = app.listen(0, () => resolve(s)); // Random available port
        });
        const port = server.address().port;
        serverUrl = `http://localhost:${port}/web-crawler-test.html`;
    });
    afterAll(async () => {
        if (server)
            await new Promise((res) => server.close(res));
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
            content: jest.fn().mockResolvedValue('<html><body>Test Content</body></html>')
        };
        // Create mock Browser
        mockBrowser = {
            newPage: jest.fn().mockResolvedValue(mockPage),
            close: jest.fn().mockResolvedValue(null)
        };
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
        };
        // Create mock BrowserManager
        mockBrowserManager = {
            initBrowser: jest.fn().mockResolvedValue(mockBrowser),
            closeBrowser: jest.fn().mockResolvedValue(undefined),
            getNewPage: jest.fn().mockResolvedValue(mockPage),
            killChromeProcesses: jest.fn(),
            saveErrorScreenshot: jest.fn().mockResolvedValue('/path/to/screenshot.png')
        };
        // Create mock ContentExtractor
        mockContentExtractor = {
            extractLinks: jest.fn().mockResolvedValue(['https://localhost/normal', 'https://localhost/page2.html']),
            extractPageContent: jest.fn().mockResolvedValue({ title: 'Test Crawler Page', text: 'This is a test page' }),
            extractOnclickLinks: jest.fn().mockResolvedValue(['http://localhost/onclick1.html', 'http://localhost/onclick2.html']),
        };
        // Create crawler with mocked dependencies
        crawler = new WebCrawler_1.WebCrawler({
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
        test('should successfully visit a URL and extract data', async () => {
            const result = await crawler.visitUrl(serverUrl, 'localhost');
            // Verify the result
            expect(result.success).toBe(true);
            expect(result.url).toBe(serverUrl);
            expect(result.title).toBe('Test Crawler Page');
            expect(result.text).toContain('This is a test page');
            expect(result.herfUrls).toContain('https://localhost/normal');
            expect(result.onclickUrls).toContain('http://localhost/onclick1.html');
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
                await crawler.visitUrl(serverUrl, 'localhost');
            }
            catch (error) {
                expect(error.message).toContain('Browser');
            }
            // Verify error handling
            expect(mockProducer.sendMessage).toHaveBeenCalledTimes(0);
            expect(mockUrlManager.setURLStatus).toHaveBeenCalledTimes(0);
        });
        test('should handle navigation errors', async () => {
            // Mock navigation error
            mockPage.goto.mockRejectedValue(new Error('Navigation error'));
            try {
                const result = await crawler.visitUrl(serverUrl, 'localhost');
                fail('Expected error was not thrown');
            }
            catch (error) {
                expect(error.message).toContain('Navigation error');
            }
        });
    });
});
//# sourceMappingURL=WebCrawler.test.js.map