import puppeteer, { Browser, Page } from 'puppeteer';
import express from 'express';
import * as http from 'http';
import path from 'path';
import fs from 'fs';
import { WebContentExtractor } from '../../src/content/WebContentExtractor';

jest.setTimeout(30_000);

const fixturesDir = path.join(__dirname, './');
const testHtmlPath = path.join(fixturesDir, 'web-extractor-test.html');

let server: http.Server;
let serverUrl: string;


describe('WebContentExtractor', () => {
  let browser: Browser;
  let page: Page;
  let server: http.Server;
  let serverUrl: string;
  let contentExtractor: WebContentExtractor;

  beforeAll(async () => {
    console.log('[SETUP] Starting test server setup...');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir);
      console.log('[SETUP] Created fixtures directory.');
    }



    const app = express();
    app.use(express.static(fixturesDir));

    server = await new Promise((resolve) => {
      const s = app.listen(0, () => {
        console.log('[SERVER] Express server started.');
        resolve(s);
      });
    });

    const port = (server.address() as any).port;
    serverUrl = `http://127.0.0.1:${port}/web-extractor-test.html`;
    // serverUrl = 'https://recruit.navercorp.com/rcrt/list.do';
    console.log('[SERVER] Server running at:', serverUrl);

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch(error) {
      console.log(error);
    }


    console.log('[SETUP] Puppeteer browser launched.');
  });


  beforeEach(async () => {
    console.log('[TEST] Opening new page...');
    page = await browser.newPage();

    console.log(`[TEST] Navigating to ${serverUrl}`);
    await page.goto(serverUrl, { waitUntil: 'load' });
    console.log('[TEST] Page loaded successfully.');

    contentExtractor = new WebContentExtractor();
  });

   afterAll(async () => {
    console.log('[TEARDOWN] Closing Puppeteer and server...');
    if (browser) await browser.close();
    if (server) await new Promise((res) => server.close(res));
    console.log('[TEARDOWN] Done.');
  });


  afterEach(async () => {
    if (page) {
      console.log('[TEST] Closing page.');
      await page.close();
    }
  });

  test('should extract title, meta and visible text', async () => {
    console.log('[TEST] Running title/meta/text test');
    const content = await contentExtractor.extractPageContent(page);
    console.log('[RESULT] Extracted content:', content);

    expect(content.title).toBe('WebContentExtractor Test Page');
    expect(content.meta['description']).toBe('Test description for WebContentExtractor');
    expect(content.meta['keywords']).toBe('test, extractor, content');
    expect(content.meta['og:title']).toBe('OG Title');

    expect(content.text).toContain('Test Content for WebContentExtractor');
    expect(content.text).toContain('This is a test paragraph for content extraction testing.');
    expect(content.text).not.toContain('This text should not be extracted');
  });

  test('should extract links from onclick handlers with redirect', async () => {
    // 클릭 가능한 div를 추가해도 되지만 이미 존재하므로 바로 실행
    const onclickLinks = await contentExtractor.extractOnclickLinks(page ,['example.com']);
    console.log('[RESULT] Extracted onclick links:', onclickLinks);

    expect(onclickLinks).toContain('https://example.com/redirect');
  });

  test('should extract valid links only', async () => {
    const links = await contentExtractor.extractLinks(page, ['example.com']);
    expect(links).toContain('https://example.com/normal-link');
    expect(links).not.toContain('javascript:void(0)');
    expect(links).not.toContain('mailto:test@example.com');
  });

  test('should filter links by allowed domains', async () => {
    const links = await contentExtractor.extractLinks(page, ['otherdomain.com']);
    expect(links.length).toBe(0);
  });

  test('should support multiple allowed domains', async () => {
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = 'https://otherdomain.com/test';
      a.textContent = 'Other Domain';
      document.body.appendChild(a);
    });

    const links = await contentExtractor.extractLinks(page, ['example.com', 'otherdomain.com']);
    expect(links).toContain('https://example.com/normal-link');
    expect(links).toContain('https://otherdomain.com/test');
  });

  test('should return empty content on evaluate error', async () => {
    const originalEvaluate = page.evaluate;
    page.evaluate = jest.fn().mockRejectedValue(new Error('forced error')) as typeof page.evaluate;

    const content = await contentExtractor.extractPageContent(page);
    expect(content).toEqual({ title: '', meta: {}, text: '' });

    page.evaluate = originalEvaluate;
  });

  test('should return empty links on error', async () => {
    const originalEvaluate = page.evaluate;
    page.evaluate = jest.fn().mockRejectedValue(new Error('forced error')) as typeof page.evaluate;

    const links = await contentExtractor.extractLinks(page, ['example.com']);
    expect(links).toEqual([]);

    page.evaluate = originalEvaluate;
  });
});