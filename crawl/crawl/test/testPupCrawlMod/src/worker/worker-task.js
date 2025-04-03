const { Browser } = require('./browser');
const { PageExtractor } = require('./page-extractor');
const { ScriptExecutor } = require('./script-executor');
const { ResultManager } = require('./result-manager');
const { URLCollector } = require('./url-collector');
const { WorkerPool } = require('../worker/worker-pool');
const { WorkerTask } = require('../worker/worker-task');

class CrawlerManager {
  constructor(options = {}) {
    this.options = {
      headless: true,
      maxConcurrency: 5,
      outputDir: '.',
      scriptTimeout: 30000,
      maxRetries: 2,
      ...options
    };

    this.browser = null;
    this.urlCollector = new URLCollector();
    this.resultManager = new ResultManager({ outputDir: this.options.outputDir });
    this.workerPool = new WorkerPool(this.options.maxConcurrency);
    this.results = [];
  }

  // [기존 코드...]

  async processInlineScripts(currentUrl, inlineScripts) {
    if (!inlineScripts || inlineScripts.length === 0) {
      console.log("인라인 스크립트가 없습니다.");
      return [];
    }

    console.log("=== 인라인 스크립트 처리 중... ===");

    // WorkerTask 객체로 변환
    const tasks = inlineScripts.map((script, index) =>
      WorkerTask.createScriptTask({
        index: index + 1,
        content: script.content,
        url: currentUrl,
        total: inlineScripts.length,
        timeout: this.options.scriptTimeout
      })
    );

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

    // 성능 통계 기록
    const stats = this.workerPool.getPerformanceStats();
    console.log(`인라인 스크립트 실행 통계: ${tasks.length}개 작업, ${stats.completed}개 완료, ${stats.failed}개 실패`);

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

    // WorkerTask 객체로 변환
    const tasks = filteredOnclicks.map((item, index) =>
      WorkerTask.createOnclickTask({
        index: index + 1,
        content: item.onclick,
        elementInfo: {
          tagName: item.tagName,
          id: item.id,
          className: item.className,
          text: item.text
        },
        url: currentUrl,
        total: filteredOnclicks.length,
        timeout: this.options.scriptTimeout
      })
    );

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

  // [기존 코드...]
}

module.exports = { CrawlerManager };