import { WebCrawler } from './WebCrawler';
import { defaultLogger as logger } from '../utils/logger';


export class ConcurrentWebCrawler {
  private crawler: WebCrawler;
  private concurrency: number;

  constructor(crawler: WebCrawler, concurrency: number = 4) {
    this.crawler = crawler;
    this.concurrency = concurrency;
  }

  async run(): Promise<void> {
    logger.debug(`ConcurrentWebCrawler 실행 (동시성: ${this.concurrency})`);

    await this.crawler.initialize();



    const workers = [];
    for (let i = 0; i < this.concurrency; i++) {
      workers.push(this.crawler.processQueue(i ,this.concurrency));
    }
    await Promise.all(workers)


    logger.debug('ConcurrentWebCrawler 실행 완료');
  }

}