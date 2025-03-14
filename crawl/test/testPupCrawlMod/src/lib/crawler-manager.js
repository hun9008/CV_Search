const { Browser } = require('./browser');
const { PageExtractor } = require('./page-extractor');
const { ScriptExecutor } = require('./script-executor');
const { ResultManager } = require('./result-manager');
const { URLCollector } = require('./url-collector');
const { WorkerPool } = require('../worker/worker-pool');

class CrawlerManager {
  constructor(options = {}) {
    this.options = {
      headless: true,
      maxConcurrency: 5,
      outputDir: '.',
      ...options
    };

    this.browser = null;
    this.urlCollector = new URLCollector();
    this.resultManager = new ResultManager({ outputDir: this.options.outputDir });
    this.workerPool = new WorkerPool(this.options.maxConcurrency);
    this.results = [];
  }

  async crawl(url) {
    this.browser = await Browser.create(this.options);
    this.urlCollector.add(url);

    try {
      // 메인 페이지 열기
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      console.log(`페이지 로드 완료: ${url}`);

      // 현재 URL 저장
      const currentUrl = page.url();
      console.log(`현재 URL: ${currentUrl}`);
      this.urlCollector.add(currentUrl);

      // 페이지 데이터 추출
      const pageExtractor = new PageExtractor(page);
      const pageData = await pageExtractor.extract();

      console.log(`${pageData.scripts.length}개의 스크립트, ${pageData.links.length}개의 링크, ${pageData.onclicks.length}개의 onclick 요소를 찾았습니다.`);

      // URL 수집
      this.collectUrls(pageData);

      // 스크립트 및 onclick 이벤트 처리
      await this.processInlineScripts(currentUrl, pageData.inlineScripts);
      await this.processOnclickEvents(currentUrl, pageData.onclicks);

      // 결과 저장
      await this.resultManager.saveResults(this.results, 'script_execution_results.json');
      await this.resultManager.saveUrls(this.urlCollector.getUrls(), 'total_url.json', url);

      return this.results;
    } catch (error) {
      console.error('크롤링 중 오류 발생:', error);
      throw error;
    }
  }

  async processInlineScripts(currentUrl, inlineScripts) {
    if (!inlineScripts || inlineScripts.length === 0) {
      console.log("인라인 스크립트가 없습니다.");
      return [];
    }

    console.log("=== 인라인 스크립트 처리 중... ===");

    const tasks = inlineScripts.map((script, index) => ({
      type: 'inline-script',
      index: index + 1,
      content: script.content,
      url: currentUrl,
      total: inlineScripts.length
    }));

    const scriptResults = await this.workerPool.processTasks(tasks,
      async (task, worker) => {
        console.log(`인라인 스크립트 ${task.index}/${task.total} 실행 중...`);
        const executor = new ScriptExecutor(worker.page, task.url);
        const result = await executor.executeScript(task.content, task.index);
        console.log(`스크립트 ${task.index} 실행 결과:`,
          result.success ? (result.urlChanged ? '페이지 이동 감지' : '정상 실행') : '실패');
        return result;
      }
    );

    // 결과 처리
    scriptResults.forEach(result => {
      this.handleScriptResult(result);
      this.results.push(result);
    });

    return scriptResults;
  }

  async processOnclickEvents(currentUrl, onclicks) {
    if (!onclicks || onclicks.length === 0) {
      console.log("onclick 이벤트가 없습니다.");
      return [];
    }

    console.log("=== onclick 스크립트 처리 중... ===");

    const filteredOnclicks = onclicks.filter(item => item.onclick);

    if (filteredOnclicks.length === 0) {
      console.log("유효한 onclick 이벤트가 없습니다.");
      return [];
    }

    const tasks = filteredOnclicks.map((item, index) => ({
      type: 'onclick',
      index: index + 1,
      content: item.onclick,
      elementInfo: {
        tagName: item.tagName,
        id: item.id,
        className: item.className,
        text: item.text
      },
      url: currentUrl,
      total: filteredOnclicks.length
    }));

    const onclickResults = await this.workerPool.processTasks(tasks,
      async (task, worker) => {
        console.log(`onclick 스크립트 ${task.index}/${task.total} 실행 중...`);
        const executor = new ScriptExecutor(worker.page, task.url);
        const result = await executor.executeOnclick(
          task.content,
          task.elementInfo,
          task.index
        );
        console.log(`onclick ${task.index} 실행 결과:`,
          result.success ? (result.urlChanged ? '페이지 이동 감지' : '정상 실행') : '실패');
        return result;
      }
    );

    // 결과 처리
    onclickResults.forEach(result => {
      this.handleScriptResult(result);
      this.results.push(result);
    });

    return onclickResults;
  }

  handleScriptResult(result) {
    if (result.detectedUrl && result.detectedUrl.startsWith('http')) {
      this.urlCollector.add(result.detectedUrl);
    }
  }

  collectUrls(pageData) {
    // 링크 URL 수집
    const linkUrlsAdded = this.urlCollector.addFromLinks(pageData.links);

    // 스크립트 소스 URL 수집
    const scriptUrlsAdded = this.urlCollector.addFromScripts(pageData.scripts);

    console.log(`수집된 URL: 링크 ${linkUrlsAdded}개, 스크립트 소스 ${scriptUrlsAdded}개`);
  }

  getURLChanges() {
    return this.resultManager.getUrlChanges(this.results);
  }

  getUrlCollector() {
    return this.urlCollector;
  }

  getResults() {
    return this.results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }

    if (this.workerPool) {
      await this.workerPool.close();
    }

    console.log('브라우저와 워커 풀이 종료되었습니다.');
  }
}

module.exports = { CrawlerManager };