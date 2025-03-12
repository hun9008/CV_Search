const puppeteer = require('puppeteer');
const fs = require('fs');
const { extractAndProcessOnClicks } = require('./baseOnclick');
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
async function infiniteScroll(page, maxScrolls = 20) {
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrollCount = 0;

  while (scrollCount < maxScrolls && previousHeight !== currentHeight) {
    previousHeight = currentHeight;
    currentHeight = await scrollToBottom(page);
    scrollCount++;

    console.log(`스크롤 ${scrollCount}/${maxScrolls} 수행 중... (높이: ${previousHeight} → ${currentHeight})`);

  }

  return scrollCount;
}


/**
 * 웹페이지에서 스크립트를 추출하고 실행하는 함수
 * @param {string} url 분석할 URL
 * @param {Browser} browser 기존 브라우저 인스턴스
 * @returns {Promise<Object>} 실행 결과 및 발견된 URL들
 */
async function extractAndExecuteScripts(url, browser = null) {
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
  let ownBrowser = false;
  let usedBrowser = browser;

  try {
    // 브라우저가 제공되지 않았으면 새로 생성
    if (!usedBrowser) {
      usedBrowser = await puppeteer.launch({
        headless: true,
        args: [
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });
      ownBrowser = true; // 나중에 닫아줘야 함을 표시
    }

    // 메인 페이지 열기
    const page = await usedBrowser.newPage();

    // 자바스크립트 대화상자(alert, confirm, prompt) 처리
    page.on('dialog', async dialog => {
      console.log(`대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    console.log(`페이지 로드 시작: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log(`페이지 로드 완료: ${url}`);

    // 현재 URL 저장 (리다이렉트 가능성)
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    if (currentUrl !== url) {
      allUrls.add(currentUrl);
    }

    // 페이지 스크롤
    console.log('페이지 스크롤 시작...');
    await infiniteScroll(page, 5); // 스크롤 5번만 수행
    console.log('페이지 스크롤 완료');

    console.log("=== onclick 스크립트 처리 중... ===");

    // 온클릭 모듈에 브라우저 인스턴스 전달
    const onclickResult = await extractAndProcessOnClicks({
      browser,
      url: currentUrl,
      headless: true,
      maxConcurrency: 10, // 동시에 최대 3개 작업 실행
      timeout: 5000      // 각 작업 5초 제한
    });

    // 처리 결과 출력
    if (onclickResult.success) {
      console.log(`온클릭 처리 완료: ${onclickResult.processed || 0}개 중 ${onclickResult.successful || 0}개 성공`);

      // 발견된 URL 추가
      if (onclickResult.discoveredUrls && onclickResult.discoveredUrls.length > 0) {
        onclickResult.discoveredUrls.forEach(url => {
          if (url && url.startsWith('http')) {
            allUrls.add(url);
          }
        });
        console.log(`온클릭에서 ${onclickResult.discoveredUrls.length}개의 새 URL 발견`);
      }


    } else {
      console.error('온클릭 처리 실패:', onclickResult.error);
    }

    console.log(`총 ${allUrls.size}개의 URL이 발견되었습니다.`);

    // 페이지 닫기
    await page.close();

    return Array.from(allUrls);

  } catch (error) {
    console.error('스크립트 추출/실행 중 오류:', error);
    result.error = error.toString();

    return Array.from(allUrls);
  } finally {
    // 직접 생성한 브라우저만 닫음
    if (ownBrowser && usedBrowser) {
      try {
        await usedBrowser.close();
        console.log('브라우저가 성공적으로 종료되었습니다.');
      } catch (closeError) {
        console.error('브라우저 종료 중 오류:', closeError);
      }
    }
  }
}

// 모듈로 내보내기
module.exports = {
  scrollToBottom,
  infiniteScroll,
  extractAndExecuteScripts
};