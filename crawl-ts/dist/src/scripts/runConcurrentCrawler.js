"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebCrawler_1 = require("../crawler/WebCrawler");
const CocurrentCralwer_1 = require("../crawler/CocurrentCralwer");
const ChromeBrowserManager_1 = require("../browser/ChromeBrowserManager");
const WebContentExtractor_1 = require("../content/WebContentExtractor");
const RedisUrlManager_1 = require("../url/RedisUrlManager");
const logger_1 = require("../utils/logger");
const Producer_1 = require("@message/Producer");
const enums_1 = require("@message/enums");
/**
 * ConcurrentWebCrawler 실행 스크립트
 * 여러 개의 작업자를 이용해 병렬로 URL을 처리합니다.
 */
async function runConcurrentCrawler() {
    try {
        logger_1.defaultLogger.debug('ConcurrentWebCrawler 실행 스크립트 시작');
        // 1. 필요한 컴포넌트 인스턴스 생성
        const browserManager = new ChromeBrowserManager_1.ChromeBrowserManager();
        const contentExtractor = new WebContentExtractor_1.WebContentExtractor();
        const urlManager = new RedisUrlManager_1.RedisUrlManager();
        const rawContentProducer = new Producer_1.Producer(enums_1.QueueNames.VISIT_RESULTS);
        // 2. WebCrawler 인스턴스 생성
        const webCrawler = new WebCrawler_1.WebCrawler({
            browserManager,
            contentExtractor,
            urlManager,
            rawContentProducer,
        });
        // 3. 동시성 수준 설정 (환경 변수에서 가져오거나 기본값 사용)
        const concurrencyLevel = parseInt(process.env.CONCURRENCY_LEVEL || '4');
        // 4. ConcurrentWebCrawler 인스턴스 생성
        const concurrentCrawler = new CocurrentCralwer_1.ConcurrentWebCrawler(webCrawler, concurrencyLevel);
        // 5. ConcurrentWebCrawler 실행
        logger_1.defaultLogger.debug(`ConcurrentWebCrawler 실행 (동시성 수준: ${concurrencyLevel})`);
        await concurrentCrawler.run();
        logger_1.defaultLogger.debug('ConcurrentWebCrawler 실행 완료');
    }
    catch (error) {
        logger_1.defaultLogger.error('ConcurrentWebCrawler 실행 중 오류 발생:', error);
    }
    finally {
        // 필요한 리소스 정리 작업이 있다면 여기에 추가
        process.exit(0);
    }
}
// 스크립트 실행
runConcurrentCrawler();
//# sourceMappingURL=runConcurrentCrawler.js.map