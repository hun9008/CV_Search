// src/crawler/BrowserManager.js
class BrowserManager {
  constructor(config = {}) {
    this.config = {
      headless: true,
      ...config
    };
    this.browser = null;
    this.pages = new Set();
  }

  async initialize() {
    this.browser = await puppeteer.launch(this.config);
  }

  async createPage() {
    if (!this.browser) {
      throw new Error('브라우저가 초기화되지 않았습니다');
    }

    const page = await this.browser.newPage();
    this.setupPageDefaults(page);
    this.pages.add(page);
    return page;
  }

  setupPageDefaults(page) {
    // 대화상자 처리 등 기본 설정
    page.on('dialog', async dialog => {
      console.log(`대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });
  }

  async closePage(page) {
    if (this.pages.has(page)) {
      await page.close();
      this.pages.delete(page);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.pages.clear();
    }
  }
}
module.exports = { BrowserManager };