'use strict';

require('module-alias/register');
const chromium = require('chrome-aws-lambda');
const { BaseWorkerManager } = require('@crawl/baseWorkerManager');
const { defaultLogger: logger } = require('@utils/logger');
const { mongoService } = require('@database/mongodb-service');
const CONFIG = require('@config/config');

/**
 * 크롤링 작업 실행 함수
 * @param {Object} event - Lambda 이벤트 객체
 * @param {Object} context - Lambda 컨텍스트 객체
 * @returns {Promise<Object>} 작업 결과
 */
async function runCrawler(event, context) {
  let browser = null;
  let manager = null;
  let connectionEstablished = false;

  try {
    logger.info('Lambda 함수 시작');
    logger.info('이벤트 데이터:', JSON.stringify(event, null, 2));

    // 남은 실행 시간 확인
    const remainingTime = context.getRemainingTimeInMillis();
    logger.info(`남은 실행 시간: ${remainingTime}ms`);

    // 최대 URL 수 계산 (Lambda 타임아웃 고려)
    const maxTime = process.env.MAX_EXECUTION_TIME || 840000; // 기본 14분 (Lambda 최대 15분)
    const timePerUrl = process.env.TIME_PER_URL || 10000; // URL당 평균 10초
    const calculatedMaxUrls = Math.floor(Math.min(remainingTime - 60000, maxTime) / timePerUrl);

    // 설정된 최대 URL 수와 계산된 값 중 작은 값 사용
    const maxUrls = Math.min(
      calculatedMaxUrls,
      CONFIG.CRAWLER.MAX_URLS || 500,
      event.maxUrls || Number.MAX_SAFE_INTEGER
    );

    logger.info(`설정된 최대 URL 수: ${maxUrls}`);

    // MongoDB 연결
    await mongoService.connect();
    connectionEstablished = true;
    logger.info('MongoDB 연결 성공');

    // 브라우저 실행 옵션
    const executablePath = await chromium.executablePath;

    // 브라우저 인스턴스 생성
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    logger.info('Puppeteer 브라우저 인스턴스 생성 완료');

    // 이벤트에서 설정 가져오기
    const options = {
      browser,
      headless: true,
      delayBetweenRequests: event.delayBetweenRequests || CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS,
      maxUrls,
      startUrl: event.startUrl,
      strategy: event.strategy || 'bfs',
      specificDomain: event.specificDomain,
      maxConcurrency: event.maxConcurrency || 2, // Lambda에서는 병렬 작업 제한
      timeoutPerPage: event.timeoutPerPage || 30000,
      restartBrowser: false, // Lambda에서는 브라우저 재시작 비활성화
      lambdaMode: true // Lambda 환경 표시
    };

    // 필수 파라미터 검증
    if (!options.startUrl) {
      throw new Error('시작 URL(startUrl)이 제공되지 않았습니다.');
    }

    logger.info('크롤러 설정:', options);

    // BaseWorkerManager 인스턴스 생성
    manager = new BaseWorkerManager(options);

    // AWS Lambda 제한 시간 고려하여 타임아웃 설정
    const timeoutId = setTimeout(() => {
      logger.warn(`최대 실행 시간(${maxTime}ms)에 도달하여 작업을 중단합니다.`);
      manager.stop(); // 작업 중단 메서드 (BaseWorkerManager에 구현 필요)
    }, maxTime);

    // 크롤링 실행
    const result = await manager.run();

    // 타임아웃 취소
    clearTimeout(timeoutId);

    // 결과 요약
    const summary = {
      startUrl: options.startUrl,
      domain: options.specificDomain,
      strategy: options.strategy,
      urlsProcessed: result?.urlsProcessed || 0,
      urlsDiscovered: result?.urlsDiscovered || 0,
      success: true,
      executionTimeMs: context.getRemainingTimeInMillis() ?
                       remainingTime - context.getRemainingTimeInMillis() :
                       'unknown'
    };

    logger.info('크롤링 완료, 결과 요약:', summary);
    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    logger.error('크롤링 작업 중 오류 발생:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `오류 발생: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  } finally {
    // 리소스 정리
    try {
      if (manager) {
        // 관리자 종료 로직 (구현 필요)
        logger.info('BaseWorkerManager 종료 중...');
        // manager.cleanup(); // 이 메서드가 구현되어 있다면 호출
      }

      if (browser) {
        logger.info('브라우저 인스턴스 종료 중...');
        await browser.close();
      }

      if (connectionEstablished) {
        logger.info('MongoDB 연결 종료 중...');
        await mongoService.disconnect();
      }
    } catch (cleanupError) {
      logger.error('리소스 정리 중 오류:', cleanupError);
    }

    logger.info('Lambda 함수 종료');
  }
}

/**
 * Lambda 핸들러 함수
 */
exports.handler = async (event, context) => {
  // 콜드 스타트 감지
  const isColdStart = !global.lambdaWarmUp;
  global.lambdaWarmUp = true;

  if (isColdStart) {
    logger.info('Lambda 콜드 스타트 감지');
  }

  // "ping" 이벤트는 웜업 요청으로 처리
  if (event.ping) {
    logger.info('웜업 요청 수신');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Lambda 함수가 준비되었습니다.' })
    };
  }

  return runCrawler(event, context);
};

// 로컬 실행을 위한 코드
if (require.main === module) {
  // 로컬 실행 환경에서 테스트를 위한 설정
  const testEvent = {
    startUrl: process.argv[2] || 'https://example.com',
    specificDomain: process.argv[3] || 'example.com',
    strategy: process.argv[4] || 'specific',
    maxUrls: parseInt(process.argv[5] || '50', 10),
    delayBetweenRequests: 1000
  };

  logger.info('로컬 환경에서 실행 중...');
  logger.info('테스트 이벤트:', testEvent);

  // 가상의 Lambda 컨텍스트 생성
  const mockContext = {
    getRemainingTimeInMillis: () => 900000, // 15분
    functionName: 'localRun',
    functionVersion: 'local',
    invokedFunctionArn: 'local:function',
    memoryLimitInMB: '2048',
    awsRequestId: 'local-' + Date.now(),
    logGroupName: '/local/crawler',
    logStreamName: `local/${Date.now()}`
  };

  // Lambda 핸들러 함수 실행
  exports.handler(testEvent, mockContext)
    .then(result => {
      logger.info('실행 결과:', result);
      process.exit(0);
    })
    .catch(error => {
      logger.error('실행 중 오류 발생:', error);
      process.exit(1);
    });
}

