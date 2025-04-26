const { WorkerPool } = require('@crawl/worker-task');
const baseWorker = require('@crawl/baseWorker');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * 페이지에서 onclick 속성을 가진 요소들을 찾아 이벤트를 실행
 * @param {Object} options 옵션 객체
 * @param {Browser} options.browser Puppeteer 브라우저 인스턴스
 * @param {string} options.url 현재 URL
 * @param {Array<Object>} options.onclickElements 클릭 이벤트를 가진 요소 목록
 * @param {boolean} options.headless 헤드리스 모드 사용 여부
 * @param {number} options.maxConcurrency 최대 동시 실행 작업 수
 * @param {number} options.timeout 각 작업의 제한 시간 (ms)
 * @returns {Promise<Object>} 실행 결과 및 발견된 URL들
 */
async function processOnClickEvents(options) {
  const {
    browser,
    url,
    onclickElements = [],
    headless = true,
    maxConcurrency = 3,
    timeout = 5000
  } = options;

  // 결과 객체 초기화
  const result = {
    totalElements: onclickElements.length,
    processed: 0,
    successful: 0,
    failed: 0,
    discoveredUrls: new Set(),
    results: []
  };


  // onclick 요소가 없으면 바로 반환
  if (!onclickElements || onclickElements.length === 0) {
   logger.debug("유효한 onclick 이벤트가 없습니다.");
    return result;
  }

  try {
    // 병렬 처리를 위한 작업 풀 생성
    const workerPool = new WorkerPool(maxConcurrency);
    const starTime = Date.now();
    // 각 onclick 항목을 작업으로 변환
    const tasks = onclickElements.map((item, idx) => ({
      id: idx + 1,
      currentUrl: url,
      onclickItem: item,
      index: idx + 1,
      total: onclickElements.length,
      headless: headless,
      timeout: timeout,
      urlDetectionTimeout: Math.floor(timeout * 0.5), // 감지 타임아웃은 실행 타임아웃의 절반으로 설정
      browser: browser // 브라우저 인스턴스 재사용 (worker-task에서 이를 지원해야 함)
    }));


    // 모든 작업 병렬 실행
    const onclickResults = await workerPool.processTasks(tasks);

    // 결과 처리
    onclickResults.forEach(onclickResult => {
      // 결과를 배열에 추가
      result.results.push(onclickResult);
      result.processed++;

      // 성공/실패 카운트
      if (onclickResult.success) {
        result.successful++;

        // URL 변경이 감지된 경우
        if (onclickResult.urlChanged && onclickResult.detectedUrl) {
          const detectedUrl = onclickResult.detectedUrl;
          if (detectedUrl && typeof detectedUrl === 'string' && detectedUrl.startsWith('http')) {
            result.discoveredUrls.add(detectedUrl);
           logger.debug(`[OnClick ${onclickResult.index}] 새 URL 발견: ${detectedUrl}`);
          }
        }
      } else {
        result.failed++;
      }
    });

   logger.debug(`=== onclick 이벤트 처리 완료 ===`);
   logger.debug(`- 처리된 이벤트: ${result.processed}/${result.totalElements}개`);
   logger.debug(`- 성공: ${result.successful}개`);
   logger.debug(`- 실패: ${result.failed}개`);
  logger.debug(`- 발견된 URL: ${result.discoveredUrls.size}개`);
   const runtime = Date.now() - starTime;
   logger.eventInfo('execute_onclick', {runtime});

    return result;
  } catch (error) {
    logger.debug('onclick 실행 오류:', error);
    result.error = error.toString();
    return result;
  }
}

/**
 * 페이지에서 onclick 요소를 추출하고 처리
 * @param {Object} options 옵션 객체
 * @param {Browser} options.browser Puppeteer 브라우저 인스턴스
 * @param {string} options.url 대상 URL
 * @param {boolean} options.headless 헤드리스 모드 여부
 * @param {number} options.maxConcurrency 최대 동시 실행 작업 수
 * @param {number} options.timeout 제한 시간 (ms)
 * @returns {Promise<Object>} 실행 결과 및 발견된 URL들
 */
async function extractAndProcessOnClicks(options) {
  const {
    browser,
    page,
    url,
    headless = true,
    maxConcurrency = 3,
    timeout = 5000
  } = options;


  try {

    // 페이지 설정
    page.on('dialog', async dialog => {
     logger.debug(`[OnClick 모듈] 대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    const startTime = Date.now();

    // onclick 요소 추출
    const onclickElements = await page.evaluate(() => {
      // onclick 속성을 가진 모든 요소 수집
      const elements = Array.from(document.querySelectorAll('[onclick]'));
      return elements.map(element => {
        return {
          tagName: element.tagName,
          id: element.id || null,
          className: element.className || null,
          onclick: element.getAttribute('onclick'),
          text: (element.textContent || '').trim().substring(0, 100) // 텍스트 길이 제한
        };
      });
    });

    const runtime = Date.now() - startTime;


   logger.eventInfo('extract_onclick', { runtime });


   logger.debug(`[OnClick 모듈] ${onclickElements.length}개의 onclick 요소를 발견했습니다.`);

    // 발견한 onclick 요소들 처리
    if (onclickElements.length > 0) {
      const result = await processOnClickEvents({
        browser,
        url: url,
        onclickElements,
        headless,
        maxConcurrency,
        timeout
      });

      return {
        success: true,
        url: url,
        currentUrl: url,
        discoveredUrls: Array.from(result.discoveredUrls),
        totalElements: result.totalElements,
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        results: result.results
      };
    } else {
      return {
        success: true,
        url: url,
        currentUrl: url,
        discoveredUrls: [],
        message: 'onclick 요소가 없습니다.'
      };
    }
  } catch (error) {
    logger.debug('onclick 실행 오류:', error);
    return {
      success: false,
      url: url,
      error: error.toString(),
      discoveredUrls: []
    };
  }
}

module.exports = {
  processOnClickEvents,
  extractAndProcessOnClicks
};