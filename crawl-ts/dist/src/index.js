"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrawler = createCrawler;
/**
 * 크롤러 애플리케이션 진입점
 */
const ChromeBrowserManager_1 = require("./browser/ChromeBrowserManager");
const WebContentExtractor_1 = require("./content/WebContentExtractor");
const WebCrawler_1 = require("./crawler/WebCrawler");
const config_1 = __importDefault(require("./config/config"));
const logger_1 = require("./utils/logger");
const MessageService_1 = __importDefault(require("./message/MessageService"));
const RedisUrlManager_1 = require("./url/RedisUrlManager");
/**
 * 크롤러 생성
 * @param options 크롤러 옵션
 * @returns 크롤러 인스턴스
 */
function createCrawler(options = {}) {
    // 명령줄 인수에서 옵션 추출
    const args = process.argv.slice(2);
    const strategy = args[0] || config_1.default.CRAWLER.STRATEGY;
    const specificDomain = args[1] || config_1.default.CRAWLER.BASE_DOMAIN;
    const startUrl = args[2] || config_1.default.CRAWLER.START_URL;
    logger_1.defaultLogger.debug(`크롤러 생성 - 전략: ${strategy}, 도메인: ${specificDomain}, 시작 URL: ${startUrl}`);
    // 각 컴포넌트 초기화
    const browserManager = new ChromeBrowserManager_1.ChromeBrowserManager();
    const contentExtractor = new WebContentExtractor_1.WebContentExtractor();
    const messageService = new MessageService_1.default();
    const urlManager = new RedisUrlManager_1.RedisUrlManager();
    // 크롤러 인스턴스 생성
    return new WebCrawler_1.WebCrawler({
        browserManager,
        contentExtractor,
        messageService,
        urlManager,
    });
}
/**
 * 애플리케이션 실행
 */
async function main() {
    logger_1.defaultLogger.debug('===== 크롤링 시작 =====');
    try {
        // 크롤러 생성 및 실행
        const crawler = createCrawler();
        await crawler.run();
        logger_1.defaultLogger.debug('===== 크롤링 요약 =====');
        // 종료 처리
        process.exit(0);
    }
    catch (error) {
        logger_1.defaultLogger.error(`실행 중 오류가 발생했습니다: ${error}`);
        process.exit(1);
    }
}
// 이 파일이 직접 실행될 때 main 함수 호출
if (require.main === module) {
    main().catch(error => {
        logger_1.defaultLogger.error('프로그램 실행 중 처리되지 않은 오류:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map