// src/crawler/Crawler.js
const { BrowserManager } = require('./BrowserManager');
const { ElementExtractor } = require('./ElementExtractor');
const { ResultCollector } = require('../utils/ResultCollector');
const { UrlTracker } = require('../utils/UrlTracker');
const { InlineScriptRunner } = require('../script-executor/InlineScriptRunner');
const { OnClickRunner } = require('../script-executor/OnClickRunner');

class Crawler {
  constructor(config = {}) {
    this.config = config;
    this.browserManager = new BrowserManager(config);
    this.elementExtractor = new ElementExtractor();
    this.resultCollector = new ResultCollector();
    this.urlTracker = new UrlTracker();
  }

  async crawl(url) {
    try {
      // 브라우저 설정
      await this.browserManager.initialize();

      // 페이지 로드
      const page = await this.browserManager.createPage();
      await page.goto(url);

      // 페이지 요소 추출
      const elements = await this.elementExtractor.extract(page);

      // 스크립트 실행
      const inlineScriptRunner = new InlineScriptRunner(this.browserManager, this.urlTracker);
      const inlineResults = await inlineScriptRunner.execute(elements.inlineScripts, page.url());

      const onClickRunner = new OnClickRunner(this.browserManager, this.urlTracker);
      const onClickResults = await onClickRunner.execute(elements.onclicks, page.url());

      // 결과 저장
      const allResults = [...inlineResults, ...onClickResults];
      await this.resultCollector.saveResults(allResults);
      await this.resultCollector.saveUrls(this.urlTracker.getAllUrls());

      return allResults;
    } catch (error) {
      console.error('크롤링 중 오류:', error);
      return { error: error.toString() };
    } finally {
      if (!this.config.keepBrowserOpen) {
        await this.browserManager.close();
      }
    }
  }
}
module.exports = { Crawler };