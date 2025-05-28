const puppeteer = require('puppeteer');
const fs = require('fs');
const { extractAndProcessOnClicks } = require('@crawl/baseOnclick');
const { isUrlAllowed } = require('./urlManager');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * 페이지를 아래로 스크롤하는 함수
 * @param {Page} page Puppeteer 페이지 객체
 * @returns {Promise<number>} 스크롤 거리
 */
async function scrollToBottom(page) {
  return page.evaluate(async () => {
    const previousHeight = window.scrollY;
    window.scrollTo(0, document.body.scrollHeight);

    // 스크롤 변화가 있을 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    return document.body.scrollHeight;
  });
}

/**
 * 페이지를 무한 스크롤하는 함수
 * @param {Page} page Puppeteer 페이지 객체
 * @param {number} maxScrolls 최대 스크롤 수 (기본값: 20)
 * @returns {Promise<number>} 실행된 스크롤 수
 */
async function infiniteScroll(page, maxScrolls = 5) {
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
    previousHeight = currentHeight;
    currentHeight = await scrollToBottom(page);
    scrollCount++;
    logger.info(`스크롤 ${scrollCount}/${maxScrolls} 수행 중... (높이: ${previousHeight} → ${currentHeight})`);
  }
  return scrollCount;
}


/**
 * 웹페이지에서 스크립트를 추출하고 실행하는 함수
 * @param {string} url 분석할 URL
 * @param {string[] } allowedDomains 필터링할 도메인
 * @param {Browser} browser 기존 브라우저 인스턴스
 * @returns {Promise<Object>} 실행 결과 및 발견된 URL들
 */
async function extractAndExecuteScripts(url,allowedDomains ,browser = null) {
  // 결과 객체
  const result = {
    url,
    scripts: {
      extracted: 0,
      executed: 0,
      successful: 0,
      failed: 0
    },
    onclicks: {
      extracted: 0,
      executed: 0,
      successful: 0,
      failed: 0
    },
    newUrls: 0,
    error: null
  };

  // 발견된 모든 URL을 저장할 집합 (중복 제거)
  const allUrls = new Set();
  allUrls.add(url);

  // 브라우저 생성 여부 확인
  let usedBrowser = browser;
  const page = await usedBrowser.newPage();
  try {
    // 자바스크립트 대화상자(alert, confirm, prompt) 처리
    page.on('dialog', async dialog => {
      logger.info(`대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    logger.info(`페이지 로드 시작: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    logger.info(`페이지 로드 완료: ${url}`);

    // 현재 URL 저장 (리다이렉트 가능성)
    const currentUrl = page.url();
    logger.info(`현재 URL: ${currentUrl}`);
    if (currentUrl !== url) {
      allUrls.add(currentUrl);
    }


    logger.info("=== onclick 스크립트 처리 중... ===");

    // 온클릭 모듈에 브라우저 인스턴스 전달
    const onclickResult = await extractAndProcessOnClicks({
      browser,
      url: currentUrl,
      page:page,
      headless: true,
      maxConcurrency: 10, // 동시에 최대 3개 작업 실행
      timeout: 5000      // 각 작업 5초 제한
    });

    // 처리 결과 출력
      logger.info(`온클릭 처리 완료: ${onclickResult.processed || 0}개 중 ${onclickResult.successful || 0}개 성공`);
      // 발견된 URL 추가
      if (onclickResult.discoveredUrls && onclickResult.discoveredUrls.length > 0) {
        onclickResult.discoveredUrls.forEach(url => {
          if (url && url.startsWith('http') && isUrlAllowed(url,allowedDomains)) {
            allUrls.add(url);
          }
        });
    }
    return Array.from(allUrls);

  } catch (error) {
    logger.error(` on click 처리 중 에러 발생 ${error}`);
    return Array.from(allUrls);

  } finally {
    await page.close();
  }
}


async function extractAndExecuteScriptsPromise(url, allowedDomains, browser = null) {
  // 발견된 모든 URL을 저장할 집합 (중복 제거)
  const allUrls = new Set();
  allUrls.add(url);

  const page = await browser.newPage();

  try {
    // 자바스크립트 대화상자 처리
    page.on('dialog', async dialog => {
      logger.info(`대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // 페이지 로드
    logger.info(`페이지 로드 시작: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    logger.info(`페이지 로드 완료: ${url}`);

    // 현재 URL 저장 (리다이렉트 가능성)
    const currentUrl = page.url();
    if (currentUrl !== url) {
      allUrls.add(currentUrl);
    }

    // 1. onClick 이벤트가 있는 모든 요소 찾기
    const onClickElements = await page.$$('[onclick]');
    logger.info(`${onClickElements.length}개의 onClick 요소 발견`);

    // 2. 각 요소의 onClick 이벤트를 병렬로 처리
    if (onClickElements.length > 0) {
      // 병렬 처리를 위한 Promise 배열
      const clickPromises = onClickElements.slice(0, 10).map(async (element, index) => {
        try {
          // 새 페이지 열기 (각 클릭을 독립적으로 처리)
          const clickPage = await browser.newPage();

          // 원본 페이지와 동일한 URL 로드
          await clickPage.goto(currentUrl, { waitUntil: 'networkidle2' });

          // 같은 위치의 요소 찾기 (새로운 페이지에서)
          const selector = await page.evaluate(el => {
            // 요소의 고유 선택자 생성
            // 함수를 직접 정의하여 전달
            function generateUniqueSelector(element) {
              if (element.id) {
                return `#${element.id}`;
              }

              // 요소의 태그 이름, 클래스 이름, 인덱스 등을 사용하여 선택자 생성
              let selector = element.tagName.toLowerCase();

              // 클래스 추가
              if (element.className && typeof element.className === 'string') {
                const classes = element.className.trim().split(/\s+/);
                if (classes.length > 0 && classes[0] !== '') {
                  selector += `.${classes.join('.')}`;
                }
              }

              // 속성 추가
              if (element.hasAttribute('onclick')) {
                selector += '[onclick]';
              }

              // 요소의 부모 노드에서의 순서 추가
              if (element.parentNode) {
                const siblings = Array.from(element.parentNode.children);
                const sameTagSiblings = siblings.filter(el => el.tagName === element.tagName);
                if (sameTagSiblings.length > 1) {
                  const index = sameTagSiblings.indexOf(element) + 1;
                  selector += `:nth-of-type(${index})`;
                }
              }

              return selector;
            }

            return generateUniqueSelector(el);
          }, element);

          // 해당 요소 클릭
          await clickPage.waitForSelector(selector, { timeout: 5000 });
          await clickPage.click(selector);

          // 클릭 후 잠시 대기 (네비게이션이나 AJAX 요청 대기)
          await clickPage.waitForTimeout(1000);

          // 클릭 후 URL 변경 확인
          const newUrl = clickPage.url();
          if (newUrl !== currentUrl && isUrlAllowed(newUrl, allowedDomains)) {
            allUrls.add(newUrl);
          }

          // 페이지에서 다른 모든 링크 추출
          const pageLinks = await clickPage.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href]'))
              .map(a => a.href)
              .filter(href => href.startsWith('http'));
          });

          // 허용된 도메인의 URL만 추가
          pageLinks.forEach(link => {
            if (isUrlAllowed(link, allowedDomains)) {
              allUrls.add(link);
            }
          });

          // 페이지 닫기
          await clickPage.close();
          return { success: true, url: newUrl };
        } catch (error) {
          logger.error(`요소 ${index} 클릭 처리 중 오류: ${error.message}`);
          return { success: false, error: error.message };
        }
      });

      // 모든 클릭 이벤트를 병렬로 처리
      const clickResults = await Promise.all(clickPromises);

      // 결과 요약
      const successful = clickResults.filter(r => r.success).length;
      logger.info(`onClick 처리 완료: ${clickPromises.length}개 중 ${successful}개 성공`);
    }

    return Array.from(allUrls);
  } catch (error) {
    logger.error(`onClick 처리 중 오류 발생: ${error.message}`);
    return Array.from(allUrls);
  } finally {
    await page.close();
  }
}

// 모듈로 내보내기
module.exports = {
  scrollToBottom,
  infiniteScroll,
  extractAndExecuteScripts,
  extractAndExecuteScriptsPromise
};