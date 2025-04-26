"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const WebCrawler_1 = require("../../src/crawler/WebCrawler");
// Mock WebContentExtractor
jest.mock('../../src/content/WebContentExtractor', () => {
    return {
        WebContentExtractor: jest.fn().mockImplementation(() => ({
            extractLinks: jest.fn().mockResolvedValue(['https://localhost/normal', 'https://localhost/page2.html']),
            extractTitle: jest.fn().mockResolvedValue('Test Crawler Page'),
            extractText: jest.fn().mockResolvedValue('This is a test page with some text content. Redirect Me')
        }))
    };
});
describe('WebCrawler', () => {
    let server;
    let serverUrl;
    let crawler;
    let mockUrlManager;
    let mockMessageService;
    let mockBrowserManager;
    let mockContentExtractor;
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
        mockMessageService = {
            sendVisitResult: jest.fn().mockResolvedValue(true),
            sendRecruitInfo: jest.fn().mockResolvedValue(true),
            sendRawContent: jest.fn().mockResolvedValue(true),
            consumeMessages: jest.fn().mockResolvedValue([]),
            handleLiveMessage: jest.fn().mockResolvedValue(undefined),
            connect: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
            sendAck: jest.fn().mockResolvedValue(undefined)
        };
        // Create mock BrowserManager
        mockBrowserManager = {
            initBrowser: jest.fn().mockResolvedValue(mockBrowser),
            closeBrowser: jest.fn().mockResolvedValue(undefined),
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
            messageService: mockMessageService,
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
            const result = await crawler.visitUrl({ url: serverUrl, domain: 'localhost' });
            // Verify the result
            expect(result.success).toBe(true);
            expect(result.url).toBe(serverUrl);
            expect(result.title).toBe('Test Crawler Page');
            expect(result.text).toContain('This is a test page');
            expect(result.herfUrls).toContain('https://localhost/normal');
            expect(result.onclickUrls).toContain('http://localhost/onclick1.html');
            // Verify browser interactions
            expect(mockBrowserManager.initBrowser).toHaveBeenCalled();
            expect(mockPage.goto).toHaveBeenCalledWith(serverUrl, expect.any(Object));
            expect(mockPage.close).toHaveBeenCalled();
            // Verify content extractor was called
            expect(mockContentExtractor.extractLinks).toHaveBeenCalled();
        });
        test('should handle errors when visiting a URL', async () => {
            // Mock browser error
            mockBrowserManager.initBrowser.mockRejectedValueOnce(new Error('Browser error'));
            try {
                await crawler.visitUrl({ url: serverUrl, domain: 'localhost' });
            }
            catch (error) {
                expect(error.message).toContain('Browser');
            }
            // Verify error handling
            expect(mockMessageService.sendVisitResult).toHaveBeenCalledTimes(0);
            expect(mockUrlManager.setURLStatus).toHaveBeenCalledTimes(0);
        });
        test('should handle navigation errors', async () => {
            // Mock navigation error
            mockPage.goto.mockRejectedValueOnce(new Error('Navigation error'));
            const result = await crawler.visitUrl({ url: serverUrl, domain: 'localhost' });
            // Verify error handling
            expect(result.success).toBe(false);
            expect(result.error).toContain('Navigation error');
        });
    });
    describe('run', () => {
        test('should process URLs until no more are available', async () => {
            // Setup URL manager to return a URL once, then null
            mockUrlManager.getNextUrl
                .mockResolvedValueOnce({ url: serverUrl, domain: 'localhost' })
                .mockResolvedValueOnce(null);
            // console.log(await crawler.urlManager.getNextUrl());
            // console.log(await crawler.urlManager.getNextUrl());
            await crawler.run();
            // Verify URL was processed
            expect(mockUrlManager.getNextUrl).toHaveBeenCalledTimes(2);
            expect(mockUrlManager.setURLStatus).toHaveBeenCalledWith(serverUrl, "visited" /* URLSTAUS.VISITED */);
            expect(mockUrlManager.addUrl).toHaveBeenCalled();
        });
        test('should handle errors during URL processing', async () => {
            // Setup URL manager to return a URL
            mockUrlManager.getNextUrl.mockResolvedValueOnce({ url: serverUrl, domain: 'localhost' })
                .mockResolvedValueOnce(null);
            // Setup visitUrl to throw an error
            mockBrowserManager.initBrowser.mockRejectedValueOnce(new Error('Browser error'));
            try {
                await crawler.run();
            }
            catch (error) {
                expect(error.message).toContain('Browser');
            }
            // Verify error was handled
            expect(mockUrlManager.getNextUrl).toHaveBeenCalled();
            expect(mockMessageService.sendVisitResult).toHaveBeenCalledTimes(0);
            expect(mockUrlManager.setURLStatus).toHaveBeenCalledTimes(0);
        });
        test('should stop when browser manager fails to initialize', async () => {
            // Mock browser manager to fail initialization
            mockBrowserManager.initBrowser.mockResolvedValueOnce(false);
            try {
                await crawler.run();
            }
            catch (error) {
                expect(error.message).toContain('browser');
            }
            // Verify early exit
            expect(mockUrlManager.getNextUrl).toHaveBeenCalledTimes(1);
        });
        test('should skip duplicate content', async () => {
            // Setup URL manager to return a URL
            mockUrlManager.getNextUrl.mockResolvedValueOnce({ url: serverUrl, domain: 'localhost' })
                .mockResolvedValueOnce(null);
            // Mock content already exists
            mockUrlManager.saveTextHash.mockResolvedValueOnce(false);
            await crawler.run();
            // Verify duplicate handling
            expect(mockUrlManager.setURLStatus).toHaveBeenCalledWith(serverUrl, "noRecruitInfo" /* URLSTAUS.NO_RECRUITINFO */);
            expect(mockMessageService.sendVisitResult).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=WebCrawler.test.js.map