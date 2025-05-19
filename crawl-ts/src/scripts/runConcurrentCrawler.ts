import { WebCrawler } from '../crawler/WebCrawler';
import { ConcurrentWebCrawler } from '../crawler/CocurrentCralwer';
import { ChromeBrowserManager } from '../browser/ChromeBrowserManager';
import { WebContentExtractor } from '../content/WebContentExtractor';
import { RedisUrlManager, URLSTAUS } from '../url/RedisUrlManager';
import { defaultLogger as logger } from '../utils/logger';
import { Producer } from '../message/Producer';
import { QueueNames } from '../message/enums';

/**
 * ConcurrentWebCrawler 실행 스크립트
 * 여러 개의 작업자를 이용해 병렬로 URL을 처리합니다.
 */
async function runConcurrentCrawler() {
  try {
    logger.debug('ConcurrentWebCrawler 실행 스크립트 시작');

    // 1. 필요한 컴포넌트 인스턴스 생성
    const browserManager = new ChromeBrowserManager();
    const contentExtractor = new WebContentExtractor();
    const urlManager = new RedisUrlManager();
    const rawContentProducer = new Producer(QueueNames.VISIT_RESULTS);

    // 2. WebCrawler 인스턴스 생성
    const webCrawler = new WebCrawler({
      browserManager,
      contentExtractor,
      urlManager,
      rawContentProducer,
    });

    // 3. 동시성 수준 설정 (환경 변수에서 가져오거나 기본값 사용)
    const concurrencyLevel = parseInt(process.env.CONCURRENCY_LEVEL || '8');

    // 4. ConcurrentWebCrawler 인스턴스 생성
    const concurrentCrawler = new ConcurrentWebCrawler(webCrawler, concurrencyLevel);

    // 5. ConcurrentWebCrawler 실행
    logger.debug(`ConcurrentWebCrawler 실행 (동시성 수준: ${concurrencyLevel})`);
    await concurrentCrawler.run();

    logger.debug('ConcurrentWebCrawler 실행 완료');
  } catch (error) {
    logger.error('ConcurrentWebCrawler 실행 중 오류 발생:', error);
  } finally {
    // 필요한 리소스 정리 작업이 있다면 여기에 추가
    process.exit(0);
  }
}

// 스크립트 실행
runConcurrentCrawler();