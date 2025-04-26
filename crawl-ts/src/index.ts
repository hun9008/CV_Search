/**
 * 크롤러 애플리케이션 진입점
 */
import { ChromeBrowserManager } from './browser/ChromeBrowserManager';
import { WebContentExtractor } from './content/WebContentExtractor';
import { WebCrawler } from './crawler/WebCrawler';
import CONFIG from './config/config';
import { defaultLogger as logger } from './utils/logger';
import MessageService from './message/MessageService';
import { RedisUrlManager } from './url/RedisUrlManager';


/**
 * 크롤러 생성
 * @param options 크롤러 옵션
 * @returns 크롤러 인스턴스
 */
function createCrawler(options = {}) {
  // 명령줄 인수에서 옵션 추출
  const args = process.argv.slice(2);
  const strategy = args[0] || CONFIG.CRAWLER.STRATEGY;
  const specificDomain = args[1] || CONFIG.CRAWLER.BASE_DOMAIN;
  const startUrl = args[2] || CONFIG.CRAWLER.START_URL;

  logger.debug(`크롤러 생성 - 전략: ${strategy}, 도메인: ${specificDomain}, 시작 URL: ${startUrl}`);

  // 각 컴포넌트 초기화
  const browserManager = new ChromeBrowserManager();
  const contentExtractor = new WebContentExtractor();
  const messageService = new MessageService();
  const urlManager = new RedisUrlManager();

  // 크롤러 인스턴스 생성
  return new WebCrawler({
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
  logger.debug('===== 크롤링 시작 =====');

  try {
    // 크롤러 생성 및 실행
    const crawler = createCrawler();
    await crawler.run();

    logger.debug('===== 크롤링 요약 =====');

    // 종료 처리
    process.exit(0);
  } catch (error) {
    logger.error(`실행 중 오류가 발생했습니다: ${error}`);
    process.exit(1);
  }
}

// 이 파일이 직접 실행될 때 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    logger.error('프로그램 실행 중 처리되지 않은 오류:', error);
    process.exit(1);
  });
}

export { createCrawler };