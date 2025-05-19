"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentWebCrawler = void 0;
const logger_1 = require("../utils/logger");
class ConcurrentWebCrawler {
    constructor(crawler, concurrency = 4) {
        this.crawler = crawler;
        this.concurrency = concurrency;
    }
    async run() {
        logger_1.defaultLogger.debug(`ConcurrentWebCrawler 실행 (동시성: ${this.concurrency})`);
        await this.crawler.initialize();
        const workers = [];
        for (let i = 0; i < this.concurrency; i++) {
            workers.push(this.crawler.processQueue());
        }
        await Promise.all(workers);
        logger_1.defaultLogger.debug('ConcurrentWebCrawler 실행 완료');
    }
}
exports.ConcurrentWebCrawler = ConcurrentWebCrawler;
//# sourceMappingURL=CocurrentCralwer.js.map