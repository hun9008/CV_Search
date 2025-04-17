import puppeteer, { Browser, Page } from 'puppeteer';
import express from 'express';
import * as http from 'http';
import path from 'path';
import fs from 'fs';
import { WebCrawler } from '../../src/crawler/WebCrawler';
import {createCrawler} from '../../src/index';
import { SubUrl } from '../../src/models/visitResult';

describe('WebCrawler - visitUrl', () => {
  let server: http.Server;
  let serverUrl: string;
  let browser: Browser;
  let crawler: WebCrawler;

  const fixturesDir = path.join(__dirname, './');


  beforeAll(async () => {

    const app = express();
    app.use(express.static(fixturesDir));

    server = await new Promise((resolve) => {
      const s = app.listen(80, () => resolve(s));
    });

    const port = (server.address() as any).port;
    serverUrl = `http://localhost:${port}/web-crawler-test.html`;

    browser = await puppeteer.launch({ headless: true });
    crawler = createCrawler();
  });

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((res) => server.close(res));
  });

  test('should visit a page and extract data including href and onclick URLs', async () => {
    const result: SubUrl = await crawler.visitUrl({ url: serverUrl, domain: 'localhost' });

    expect(result.success).toBe(true);
    expect(result.url).toBe(serverUrl);
    expect(result.finalUrl).toContain('web-crawler-test.html');
    expect(result.title).toBe('Test Crawler Page');
    expect(result.text).toContain('Redirect Me');
    expect(result.herfUrls).toContain('https://localhost/normal');
    // NOTE: If onclick processing is implemented in visitUrl, then assert that too
    expect(result.onclickUrls).toContain('http://localhost/redirect.html');
  });
});
