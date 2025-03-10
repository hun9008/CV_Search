const puppeteer = require('puppeteer');

class Browser {
  constructor(browser) {
    this.browser = browser;
  }

  static async create(options = {}) {
    const browser = await puppeteer.launch({
      headless: options.headless !== false,
      slowMo: options.slowMo || 0,
      defaultViewport: options.defaultViewport || null
    });

    return new Browser(browser);
  }

  async newPage() {
    const page = await this.browser.newPage();

    // 기본 대화상자 핸들러 설정
    page.on('dialog', async dialog => {
      console.log(`대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    return page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = { Browser };