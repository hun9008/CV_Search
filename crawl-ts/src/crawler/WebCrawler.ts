import { IContentExtractor } from '../content/IContentExtractor';
import { SubUrl } from '../models/VisitResult';
import { defaultLogger as logger } from '../utils/logger';
import { extractDomain } from '../url/urlUtils';
import  { BrowserContext, Dialog ,Page, TimeoutError} from 'puppeteer';
import {redisUrlManager, RedisUrlManager } from '../url/RedisUrlManager';
import { URLSTAUS } from '../models/ReidsModel';
import { producer, Producer } from '../message/Producer';
import { IRawContent, RawContentSchema } from '../models/RawContentModel';
import { chromeBrowserManager, ChromeBrowserManager, timeoutAfter } from '../browser/ChromeBrowserManager';
import { webContentExtractor } from '../content/WebContentExtractor';

  /**
   * 웹 크롤러 구현체
   * 브라우저, 콘텐츠 추출, URL 관리, DB 연결 컴포넌트를 조합한 크롤러
   */
  export class WebCrawler  {
    browserManager: ChromeBrowserManager;
    contentExtractor: IContentExtractor;
    urlManager: RedisUrlManager;
    rawContentProducer: Producer;
    running: boolean = false;

    /**
     * 웹 크롤러 생성자
     * @param options 크롤러 옵션
     */
    constructor(options: {
      browserManager: ChromeBrowserManager;
      contentExtractor: IContentExtractor;
      rawContentProducer: Producer;
      urlManager: RedisUrlManager;

    }) {
      this.browserManager = options.browserManager;
      this.contentExtractor = options.contentExtractor;
      this.urlManager = options.urlManager;
      this.rawContentProducer = options.rawContentProducer;
    }

    /**
     * 크롤러 초기화
     */
    async initialize(): Promise<void> {
      // 데이터베이스 연결
      await this.rawContentProducer.connect();

      await this.urlManager.connect();

      await this.browserManager.initBrowser(10, 3000);

      this.running = true;

      logger.info('크롤러 초기화 완료');
    }


    async stop(): Promise<void> {
      try {
        await this.browserManager.closeBrowser();
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`[Crawler][stop] 브라우저 종료 중 오류 발생: ${error.message}`);
        }
      }

      try {
        await this.rawContentProducer.close();
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`[Crawler][stop] 브라우저 종료 중 오류 발생: ${error.message}`);
        }
      }

      logger.info('크롤러 정지 완료');

      this.running = false;
    }

  /**
   * 페이지 방문 및 데이터 추출
   * @param urlInfo 방문할 URL 정보
   * @returns 방문 결과
   */
  async visitUrl(url: string, domain: string ,context: BrowserContext ): Promise<SubUrl | void> {


    logger.debug(`[Crawler][visitUrl] URL 방문 시작: ${url}`);
    const startTime = Date.now();

    let subUrlResult = new SubUrl({
      url: url,
      domain: domain,
    });
    let page : Page;
    //페이지 생성
    return context.newPage()
      .then((newPage) => {
      logger.debug(`[Crawler][visitUrl] URL 페이지 생성: ${url}`);
        page = newPage;
        return page.on('dialog', async (dialog: Dialog) => {
          await dialog.dismiss().catch((error) => {
            logger.error(`[Crawler][visitUrl] 다이얼로그 처리 중 오류 발생: ${error.message}`);
          });
        })
      })
      // 페이지 방문
      .then(() => {
        if (page.isClosed()===true) {
          logger.error(`[Crawler][visitUrl] 페이지가 이미 닫혀있음: ${url}`);
          throw new Error(`[Crawler][visitUrl] 페이지가 이미 닫혀있음: ${url}`);
        }
        logger.debug(`[Crawler][visitUrl] URL 페이지 방문 ${url}`);
        return  page.goto(url, {
          waitUntil: 'load',
          timeout: 20000 // 20초
        })
      })
      //페이지  내용 추출
      .then(() => {
        logger.debug(`[Crawler][visitUrl] URL 페이지 추출 ${url}`);
        subUrlResult.finalUrl = page.url();
        subUrlResult.finalDomain = subUrlResult.finalUrl ? extractDomain(subUrlResult.finalUrl) : domain;
        return timeoutAfter(this.contentExtractor.extractPageContent(page).then((results) => ({ page, results })),60_000, new TimeoutError('extracPage 수집 시간 초과'));
      })
      //페이지  링크 추출
      .then((context) => {
        subUrlResult.title = context.results.title;
        subUrlResult.text = context.results.text;
        return timeoutAfter(this.contentExtractor.extractLinks(context.page, [domain]).then((results) => ({ ...context, results })),60_000, new TimeoutError('extracklinks 수집 시간 초과'));
      })
      .then((context) => {
      //페이지  클릭 링크  추출
        subUrlResult.herfUrls = context.results;
        return timeoutAfter(this.contentExtractor.extractOnclickLinks(context.page, [domain]).then((results) => ({ ...context, results })) ,60_000, new TimeoutError('onclick link 수집 시간 초과'));
      })
      .then((context) => {
        subUrlResult.onclickUrls = context.results;
        subUrlResult.crawledUrls = Array.from(new Set([
          ...subUrlResult.herfUrls,
          ...subUrlResult.onclickUrls
        ]));
        subUrlResult.crawlStats = {
          total: subUrlResult.crawledUrls.length,
          href: subUrlResult.herfUrls?.length || 0,
          onclick: subUrlResult.onclickUrls?.length || 0,
          blocked_by_robots: 0,
          allowed_after_robots: subUrlResult.crawledUrls.length
        };
        subUrlResult.success = true;
        logger.eventInfo(`[Crawler][visitUrl] URL 방문 성공: ${url} (${subUrlResult.crawlStats.total}개 링크)`);
        subUrlResult.onclickUrls.forEach((url) => {
          logger.debug(url);
        })
        logger.eventInfo(`[Crawler][visitUrl] URL 방문 완료: ${url} (${subUrlResult.crawlStats.total}개 링크)`);
        return subUrlResult
      }).catch((error) => {
        logger.error(`[Crawler][visitUrl] URL 방문 중 오류 발생 ${url}: ${error.message}`);
        throw error;
      })
      .finally(() => {
        if (!page) {
          logger.error(`[Crawler][visitUrl] 페이지가 생성되지 않았습니다: ${url}`);
          return;
        }
        if (page.isClosed() === true) {
          logger.error(`[Crawler][visitUrl] 페이지가 이미 닫혀있음: ${url}`);
          return
        }
        else {
          page.close().catch((error) => {
            logger.error(`[Crawler][visitUrl] 페이지 닫기 중 오류 발생 ${url}: ${error.message}`);
          })
        }
      }
      )
  }



  /**
   * URL에서 추출한 RawContent RabbitMQ에 전송
   * @param result 방문 결과
   * @returns
   */
    async sendRawContent(result: SubUrl): Promise<boolean> {

    if (RawContentSchema.safeParse(result).success === false) {
      logger.debug('[RabbitMQ] Invalid message format:', result);
      return false;
    }

    const rawContent: IRawContent = {
      url: result.url,
      title: result.title!,
      domain: result.domain,
      text: result.text!,
    };

    return this.rawContentProducer.sendMessage(rawContent)
      .then(() => true)
      .catch((error) => {
        logger.error(`[RabbitMQ] RAW CONTENT 전송 중 오류 발생: ${error.message}`);
        throw error;
      });
  }



async processQueue(processNumber : number, concurrency: number): Promise<void> {
    while (this.running===true) {
      try {
        const nextUrlInfo = await this.urlManager.getNextUrl();
        if (!nextUrlInfo) {
          logger.debug("[Crawler] 큐에 처리할 URL이 없습니다.");
          continue;
        }

        const context = await this.browserManager.getBrowserContext(processNumber);
        const visitResult = await timeoutAfter(this.visitUrl(nextUrlInfo.url, nextUrlInfo.domain ,context), 60_000, new TimeoutError('visitUrl 수집 시간 초과'))
          .catch((error) => {
            logger.error(`[Crawler][process] URL 방문 중 오류 발생: ${error.message}`);
            this.urlManager.setURLStatusByOldStatus(nextUrlInfo.url, URLSTAUS.VISITED ,URLSTAUS.NOT_VISITED);
            throw new Error("[Crawler][process] 큐 처리 중 오류 발생");
          });

        if (!visitResult || !visitResult.text) {
          logger.debug("[Crawler] 텍스트 없음, 건너뜀.");
          continue;
        }

        const isSaveSuccess = await this.urlManager.saveTextHash(visitResult.text);
        if (isSaveSuccess && await this.urlManager.checkIsSeedUrl(visitResult.domain, visitResult.url) === false) {
          logger.debug("[Crawler] 중복된 텍스트, 저장하지 않음.");
          this.urlManager.setURLStatusByOldStatus(visitResult.url,URLSTAUS.VISITED , URLSTAUS.NO_RECRUITINFO);
          continue;
        }

        // allowed_prefix_필터링
        await this.urlManager.saveUrlLinks(visitResult.domain ,visitResult.crawledUrls).then(() => {
          logger.info(`[Crawler] URL 방문 결과 저장 완료: ${visitResult.url}`)
        });

        //url Manger allowed_prefix 사용
        if (await this.urlManager.checkAllowedUrlPrefix(visitResult.url) === true) {
          await this.sendRawContent(visitResult).then(() => {
            logger.info(`[Crawler][RabbitMQ] URL 방문 전송 완료: ${visitResult.url}`)
          });
        }

      } catch (error) {
        if (error instanceof Error) {
          logger.error(`[Crawler][process] 큐 처리 중 오류 발생: ${error.message}`);
          await this.browserManager.closeBrowser();
          await this.browserManager.initBrowser(concurrency, 10, 3000);
          // throw new Error("[Crawler][process] 큐 처리 중 오류 발생");
        }
      }
    }
}

  }

export const webCralwer = new WebCrawler({

  browserManager: chromeBrowserManager,
  contentExtractor: webContentExtractor,
  rawContentProducer: producer,
  urlManager: redisUrlManager,
});