import { WebCrawler ,webCralwer} from './WebCrawler';
import { defaultLogger as logger } from '../utils/logger';
import { EventEmitter } from 'stream';


export class ConcurrentWebCrawler extends EventEmitter{
  private crawler: WebCrawler;

  constructor(crawler: WebCrawler) {
    super();
    this.crawler = crawler;
    this.on('start', this.run);
    this.on('stop', this.stop);


  }

  async run(concurrency : number): Promise<void> {
    logger.debug(`ConcurrentWebCrawler 실행 (동시성: ${concurrency}})`);

    await this.crawler.initialize();

    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      this.crawler.processQueue(i ,concurrency).then(() => {
        logger.debug(`[processQueue] ${i+1}번쨰 작업자 종료 `);
      })
    }

  }

  getStatus(): boolean{
    return this.crawler.running;
  }

  async stop(): Promise<void> {
    try {
      await this.crawler.stop();
      logger.info('크롤러 중지 완료');
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`[ConcurrentWebCrawler][stop] 크롤러 중지 중 오류 발생: ${error.message}`);
      }
    }
  }

}



export const concurrentWebCrawler = new ConcurrentWebCrawler(webCralwer);