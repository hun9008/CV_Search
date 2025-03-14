// src/script-executor/ScriptExecutor.js
class ScriptExecutor {
  constructor(browserManager, urlTracker) {
    this.browserManager = browserManager;
    this.urlTracker = urlTracker;
  }

  async createExecutionEnvironment(baseUrl) {
    const page = await this.browserManager.createPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    return page;
  }

  setupConsoleLogging(page, identifier) {
    page.on('console', msg => console.log(`${identifier} 콘솔:`, msg.text()));
  }

  async detectUrlChange(page, beforeUrl) {
    const afterUrl = await page.url();
    const urlChanged = afterUrl !== beforeUrl;

    if (urlChanged && afterUrl.startsWith('http')) {
      this.urlTracker.addUrl(afterUrl);
    }

    return {
      urlChanged,
      detectedUrl: urlChanged ? afterUrl : null
    };
  }
}