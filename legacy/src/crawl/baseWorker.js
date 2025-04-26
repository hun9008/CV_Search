const puppeteer = require('puppeteer');
const fs = require('fs');
const { extractAndProcessOnClicks } = require('@crawl/baseOnclick');
const { defaultLogger: logger } = require('@utils/logger');
const { isUrlAllowed, extractDomain } = require('@crawl/urlManager');
const CONFIG = require('@config/config');
const { executablePath } = require('puppeteer');

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
    logger.debug(`스크롤 ${scrollCount}/${maxScrolls} 수행 중... (높이: ${previousHeight} → ${currentHeight})`);
  }
  return scrollCount;
}


/**
 * 자바스크립트를 추출하고 실행하여 URL 추출
 * @param {string} url - 대상 URL
 * @param {Array<string>} allowedDomains - 허용된 도메인 목록
 * @param {Browser} browser - 브라우저 인스턴스
 * @returns {Promise<Array<string>>} 추출된 URL 목록
 */
async function extractAndExecuteScripts(url, allowedDomains = [], browser) {
  const startTime = Date.now();
  logger.debug(`URL ${url}에서 자바스크립트 이벤트 핸들러 추출 중...`);

  try {
    // 새 페이지 열기
    const page = await browser.newPage();

    // JavaScript 대화 상자 무시
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });

    // 페이지 로드
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.BROWSER.TIMEOUT.PAGE_LOAD
    });

    // onClick 이벤트 핸들러 추출 및 실행
    const processStartTime = Date.now();
    const extractedUrls = await processOnclick(page, url, allowedDomains);
    const processRuntime = Date.now() - processStartTime;
    logger.eventInfo('process_onclick', { url, runtime: processRuntime });

    // 추출된 URL 및 페이지 정리
    await page.close();

    const runtime = Date.now() - startTime;
    logger.debug(`자바스크립트 처리 완료. 추출된 URL: ${extractedUrls.length}개`);

    return extractedUrls;
  } catch (error) {
    logger.error(`자바스크립트 처리 중 오류:`, error);
    const runtime = Date.now() - startTime;
    return [];
  }
}

/**
 * onClick 이벤트 핸들러를 처리하여 URL 추출
 * @param {Page} page - Puppeteer 페이지 객체
 * @param {string} baseUrl - 기준 URL
 * @param {Array<string>} allowedDomains - 허용된 도메인 목록
 * @returns {Promise<Array<string>>} 추출된 URL 목록
 */
async function processOnclick(page, baseUrl, allowedDomains = []) {
  const startTime = Date.now();

  try {
    // 페이지 내의 모든 클릭 가능한 요소에서 URL 추출
    const extractedUrls = await page.evaluate((baseUrl) => {
      const results = [];
      // 클릭 이벤트를 가질 수 있는 모든 요소 수집
      const clickableElements = Array.from(document.querySelectorAll(
        'a[onclick], button, input[type="button"], input[type="submit"], [role="button"], [onclick]'
      ));

      // 현재 문서의 URL 객체
      const currentUrl = new URL(baseUrl);
      const baseOrigin = currentUrl.origin;

      // 각 요소에 클릭 이벤트 발생시키기
      clickableElements.forEach(element => {
        try {
          // 안전하게 클릭 이벤트 발생
          // 직접적인 onclick 속성 분석
          const onclickAttr = element.getAttribute('onclick');
          if (onclickAttr) {
            // href 또는 location.href 패턴 찾기
            const hrefMatches = onclickAttr.match(/(?:href|location\.href|window\.location)\s*=\s*['"]([^'"]+)['"]/i);
            if (hrefMatches && hrefMatches[1]) {
              let url = hrefMatches[1];

              // 상대 URL 처리
              if (url.startsWith('/')) {
                url = `${baseOrigin}${url}`;
              } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                const urlObj = new URL(url, baseUrl);
                url = urlObj.href;
              }

              results.push(url);
            }
          }

          // 기본 속성에서 URL 추출 시도
          if (element.hasAttribute('href')) {
            const href = element.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
              let url;
              try {
                url = new URL(href, baseUrl).href;
                results.push(url);
              } catch (e) {
                // URL 생성 오류 - 잘못된 형식일 수 있음
              }
            }
          }
        } catch (elementError) {
          // 요소별 오류 처리 - 조용히 넘어감
        }
      });

      return Array.from(new Set(results)); // 중복 제거
    }, baseUrl);

    // 중복 제거 및 허용된 도메인만 필터링
    const uniqueUrls = [...new Set(extractedUrls)];
    const filteredUrls = uniqueUrls.filter(url => {
      try {
        return isUrlAllowed(url, allowedDomains);
      } catch (e) {
        return false;
      }
    });

    const runtime = Date.now() - startTime;
    logger.debug(`onClick 이벤트 처리 완료. ${filteredUrls.length}개 URL 추출됨.`);

    return filteredUrls;
  } catch (error) {
    logger.error(`onClick 이벤트 처리 중 오류:`, error);
    return [];
  }
}

// Promise 형식의 확장 함수
function extractAndExecuteScriptsPromise(url, allowedDomains = []) {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug(`독립 프로세스에서 URL ${url} 처리 중...`);

      // Puppeteer 브라우저 초기화
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        executablePath: await executablePath(),
        headless: 'new',
        args: CONFIG.BROWSER.LAUNCH_ARGS
      });

      try {
        // extractAndExecuteScripts 함수 사용
        const urls = await extractAndExecuteScripts(url, allowedDomains, browser);
        resolve(urls);
      } catch (error) {
        reject(error);
      } finally {
        await browser.close();
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 모듈로 내보내기
module.exports = {
  scrollToBottom,
  infiniteScroll,
  extractAndExecuteScripts,
  extractAndExecuteScriptsPromise,
  processOnclick
};