import puppeteer, { Browser, Page } from 'puppeteer';
import { WebContentExtractor } from '../../src/content/WebContentExtractor';
import { defaultLogger as logger } from '../../src/utils/logger'; // Assuming logger path



jest.setTimeout(30_000); // Keep reasonable timeout for Puppeteer

describe('WebContentExtractor', () => {
  let browser: Browser;
  let page: Page;
  let contentExtractor: WebContentExtractor;

  beforeAll(async () => {
    try {
      browser = await puppeteer.launch({
        headless: true, // Keep headless true for typical CI/testing
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      console.log('[SETUP] Puppeteer browser launched.');
    } catch (error) {
      console.error('[ERROR] Failed to launch browser:', error);
      // Throwing ensures the test suite fails clearly if setup fails
      throw error;
    }
    contentExtractor = new WebContentExtractor();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Set content for each test to ensure isolation
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WebContentExtractor Test Page</title>
        <meta name="description" content="Test description for WebContentExtractor">
        <meta name="keywords" content="test, extractor, content">
        <meta property="og:title" content="OG Title">
      </head>
      <body>
        <h1>Test Content for WebContentExtractor</h1>
        <p>This is a test paragraph for content extraction testing.</p>
        <div style="display:none">This text should not be extracted</div>
        <a href="https://example.com/normal-link">Normal Link</a>
        <a href="https://another.com/other-link">Other Domain Link</a>
        <a href="javascript:void(0)">JavaScript Link</a>
        <a href="mailto:test@example.com">Email Link</a>
        <a id="clickable-link" onclick="window.location.href='https://example.com/redirect'">Click Me Redirect</a>
        <a id="clickable-link-2" onclick="someFunction()">Click Me Function</a>
      </body>
      </html>
    `);
    // console.log('[TEST] Test page content loaded.'); // Optional: Keep if useful for debugging
  });

  afterEach(async () => {
    // Restore all mocks created with jest.spyOn
    jest.restoreAllMocks();
    if (page && !page.isClosed()) { // Check if page is closed before closing
      await page.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('[TEARDOWN] Puppeteer browser closed.');
    }
  });

  // --- Integration Style Tests (Rely on Puppeteer's DOM interaction) ---

  test('[Integration] should extract title, meta and visible text accurately', async () => {
    const content = await contentExtractor.extractPageContent(page);

    expect(content.title).toBe('WebContentExtractor Test Page');
    // Check specific meta tags
    expect(content.meta).toEqual(expect.objectContaining({
        'description': 'Test description for WebContentExtractor',
        'keywords': 'test, extractor, content',
        'og:title': 'OG Title'
    }));
    // Check text content - be specific about what should/shouldn't be included
    expect(content.text).toContain('Test Content for WebContentExtractor');
    expect(content.text).toContain('This is a test paragraph for content extraction testing.');
    expect(content.text).not.toContain('This text should not be extracted'); // Check hidden text exclusion
    expect(content.text).toContain('Normal Link'); // Link text should be included
    expect(content.text).toContain('Click Me Redirect');

    // Ensure no errors were logged
    // expect(logger.error).not.toHaveBeenCalled();
  });

  test('[Integration] should extract valid href links filtered by domain', async () => {
    // Assuming extractLinks returns a specific structure, e.g., { hrefLinks: string[] }
    // Adjust based on the actual return type of your method. If it just returns string[], update accordingly.
    const linkResult = await contentExtractor.extractLinks(page, ['example.com']); // Filter by example.com

    // Expecting a specific structure. Modify if your method returns just string[]
    const expectedLinks = ['https://example.com/normal-link'];

    // Check the structure and content. Adjust if your method returns only string[]
    expect(linkResult).toBeDefined();
    // If linkResult is directly string[]:
    expect(linkResult).toEqual(expectedLinks);
    // If linkResult is { hrefLinks: string[] }:
    // expect(linkResult).toHaveProperty('hrefLinks');
    // expect(linkResult.hrefLinks).toEqual(expect.arrayContaining(expectedLinks));
    // expect(linkResult.hrefLinks).not.toContain('https://another.com/other-link'); // Verify filtering
    // expect(linkResult.hrefLinks).not.toContain('javascript:void(0)');
    // expect(linkResult.hrefLinks).not.toContain('mailto:test@example.com');
    // expect(logger.error).not.toHaveBeenCalled();
  });

  // --- Unit Style Tests (Mocking dependencies) ---

  test('[Unit] collectOnclickScriptsWithScroll should query DOM for onclick attributes', async () => {
    const mockOnClickScripts = [
      "window.location.href='https://example.com/redirect'",
      "someFunction()"
    ];
    // Mock the Puppeteer method used internally by collectOnclickScriptsWithScroll
    const $$evalSpy = jest.spyOn(page, '$$eval').mockResolvedValue(mockOnClickScripts);

    const scripts = await contentExtractor.collectOnclickScriptsWithScroll(page);

    // Verify the correct selector was used (adjust '*[onclick]' if needed)
    expect($$evalSpy).toHaveBeenCalledWith('*[onclick]', expect.any(Function));
    // Verify the result matches the mocked value
    expect(scripts).toEqual(mockOnClickScripts);
    // expect(logger.error).not.toHaveBeenCalled();
  });

  test('[Unit] extractOnclickLinks should process scripts and simulate clicks correctly', async () => {
    const collectedScripts = [
        "window.location.href='https://www.google.com'", // Valid redirect
        "someOtherFunction()", // Not a location change
        "window.open('https://www.naver.com')", // Window open might be handled differently? Assume we extract this too for now.
    ];
    const baseUrl = 'https://base.com'; // Assume a base URL for relative paths

    // 1. Mock the script collection step
    const collectSpy = jest.spyOn(contentExtractor, 'collectOnclickScriptsWithScroll')
                           .mockResolvedValue(collectedScripts);

    // Execute the method under test
    const allowedDomains = ['example.com', 'naver.com', 'google.com']; // Include base.com for the relative path result
    const links = await contentExtractor.extractOnclickLinks(page, allowedDomains);

    // Verify mocks and results
    expect(collectSpy).toHaveBeenCalledWith(page); // Was script collection called?


    expect(links).toEqual(expect.arrayContaining([
      'https://www.google.com/',
      'https://www.naver.com/', // Assuming window.open is extracted
    ]));

  });
});