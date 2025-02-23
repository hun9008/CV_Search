const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://recruit.snowcorp.com/rcrt/list.do', { waitUntil: 'networkidle2' });
    const title = await page.title();
    console.log('Page title:', title);
    await browser.close();
})();