"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebCrawler = void 0;
const VisitResult_1 = require("../models/VisitResult");
const logger_1 = require("../utils/logger");
const urlUtils_1 = require("../url/urlUtils");
const RawContentModel_1 = require("@models/RawContentModel");
/**
 * 웹 크롤러 구현체
 * 브라우저, 콘텐츠 추출, URL 관리, DB 연결 컴포넌트를 조합한 크롤러
 */
class WebCrawler {
    /**
     * 웹 크롤러 생성자
     * @param options 크롤러 옵션
     */
    constructor(options) {
        this.browserManager = options.browserManager;
        this.contentExtractor = options.contentExtractor;
        this.urlManager = options.urlManager;
        this.rawContentProducer = options.rawContentProducer;
    }
    /**
     * 크롤러 초기화
     */
    async initialize() {
        // 데이터베이스 연결
        await this.rawContentProducer.connect();
        await this.urlManager.connect();
        await this.browserManager.initBrowser(10, 3000);
        logger_1.defaultLogger.debug('크롤러 초기화 완료');
    }
    /**
     * 페이지 방문 및 데이터 추출
     * @param urlInfo 방문할 URL 정보
     * @returns 방문 결과
     */
    async visitUrl(url, domain) {
        logger_1.defaultLogger.debug(`[Crawler][visitUrl] URL 방문 시작: ${url}`);
        const startTime = Date.now();
        let subUrlResult = new VisitResult_1.SubUrl({
            url: url,
            domain: domain,
        });
        let page;
        //페이지 생성
        return this.browserManager.getNewPage()
            .then((newPage) => {
            page = newPage;
            return page.on('dialog', async (dialog) => {
                await dialog.dismiss();
            });
        })
            // 페이지 방문
            .then(() => {
            return page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 20000 // 20초
            });
        })
            //페이지  내용 추출
            .then(() => {
            subUrlResult.finalUrl = page.url();
            subUrlResult.finalDomain = subUrlResult.finalUrl ? (0, urlUtils_1.extractDomain)(subUrlResult.finalUrl) : domain;
            return this.contentExtractor.extractPageContent(page).then((results) => ({ page, results }));
        })
            //페이지  링크 추출
            .then((context) => {
            subUrlResult.title = context.results.title;
            subUrlResult.text = context.results.text;
            return this.contentExtractor.extractLinks(context.page, [domain]).then((results) => ({ ...context, results }));
        })
            .then((context) => {
            //페이지  클릭 링크  추출
            subUrlResult.herfUrls = context.results;
            return this.contentExtractor.extractOnclickLinks(context.page, [domain]).then((results) => ({ ...context, results }));
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
            return context.page.close().then(() => subUrlResult);
        }).catch((error) => {
            logger_1.defaultLogger.error(`[Crawler][visitUrl] URL 방문 중 오류 발생: ${error.message}`);
            throw error;
        })
            .finally(() => {
            return page.close().catch((error) => {
                logger_1.defaultLogger.error(`[Crawler][visitUrl] 페이지 닫기 중 오류 발생: ${error.message}`);
            });
        });
    }
    /**
     * 방문한 URL 링크 레디스에 저장
     * @param result 방문 결과
     * @returns
     */
    async saveLinkUrls(result) {
        return await Promise.all(result.crawledUrls.map((url) => {
            this.urlManager.addUrl(url, result.domain, "notvisited" /* URLSTAUS.NOT_VISITED */);
        })).then(() => true)
            .catch((error) => {
            logger_1.defaultLogger.error(`[Redis] 링크 URL 저장 중 오류 발생: ${error.message}`);
            throw error;
        });
    }
    /**
     * URL에서 추출한 RawContent RabbitMQ에 전송
     * @param result 방문 결과
     * @returns
     */
    async sendRawContent(result) {
        if (RawContentModel_1.RawContentSchema.safeParse(result).success === false) {
            logger_1.defaultLogger.debug('[RabbitMQ] Invalid message format:', result);
            return false;
        }
        const rawContent = {
            url: result.url,
            title: result.title,
            domain: result.domain,
            text: result.text,
        };
        return this.rawContentProducer.sendMessage(rawContent)
            .then(() => true)
            .catch((error) => {
            logger_1.defaultLogger.error(`[RabbitMQ] RAW CONTENT 전송 중 오류 발생: ${error.message}`);
            throw error;
        });
    }
    async processQueue() {
        while (true) {
            try {
                const nextUrlInfo = await this.urlManager.getNextUrl();
                if (!nextUrlInfo) {
                    logger_1.defaultLogger.debug("[Crawler] 큐에 처리할 URL이 없습니다.");
                    continue;
                }
                const visitResult = await this.visitUrl(nextUrlInfo.url, nextUrlInfo.domain);
                if (!visitResult.text) {
                    logger_1.defaultLogger.debug("[Crawler] 텍스트 없음, 건너뜀.");
                    continue;
                }
                const isSaveSuccess = await this.urlManager.saveTextHash(visitResult.text);
                if (isSaveSuccess === false) {
                    logger_1.defaultLogger.debug("[Crawler] 중복된 텍스트, 저장하지 않음.");
                    this.urlManager.setURLStatus(visitResult.url, "noRecruitInfo" /* URLSTAUS.NO_RECRUITINFO */);
                    continue;
                }
                await this.saveLinkUrls(visitResult).then(() => {
                    logger_1.defaultLogger.debug(`[Crawler] URL 방문 결과 저장 완료: ${visitResult.url}`);
                });
                await this.sendRawContent(visitResult).then(() => {
                    logger_1.defaultLogger.debug(`[Crawler] URL 방문 결과 저장 완료: ${visitResult.url}`);
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    await this.browserManager.closeBrowser();
                    await this.browserManager.initBrowser(10, 3000);
                    logger_1.defaultLogger.error(`[Crawler][process] 큐 처리 중 오류 발생: ${error.message}`);
                }
            }
        }
    }
    /**
     * 크롤러 실행
     */
    async run() {
        logger_1.defaultLogger.debug(`WebCrawler 실행`);
        try {
            await this.initialize();
            await this.processQueue();
        }
        finally {
            await this.browserManager.closeBrowser();
        }
        logger_1.defaultLogger.debug('WebCrawler 실행 완료');
    }
}
exports.WebCrawler = WebCrawler;
//# sourceMappingURL=WebCrawler.js.map