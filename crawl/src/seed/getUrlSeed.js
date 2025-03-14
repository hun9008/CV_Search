const puppeteer = require('puppeteer');

/**
 * 기업 채용 사이트 URL을 생성하는 제너레이터 함수
 * @returns {AsyncGenerator<string>} URL 생성기
 */
async function* getUrlSeed() {
  // 브라우저 실행
  const browser = await puppeteer.launch({
    headless: true, // UI 확인을 위해 headless 모드 비활성화
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 메인 페이지 열기
    const page = await browser.newPage();

    // 각 페이지 반복 (1~29)
    for (let i = 1; i < 30; i++) {
      console.log(`페이지 ${i}/29 처리 중...`);

      // JobKorea 페이지 열기
      await page.goto(
        `https://www.jobkorea.co.kr/recruit/joblist?menucode=cotype1&cotype=1,2,3#anchorGICnt_${i}`,
        { waitUntil: 'networkidle2', timeout: 30000 }
      );

      // 지원하기 버튼 찾기 (XPath 사용)
      const buttons = await page.$x("//button[contains(@class, 'tplBtn tplBtn_1 tplBtnBlue devApplyEtc')]");
      console.log(`${buttons.length}개의 지원 버튼 발견`);

      // 각 버튼 클릭
      for (const button of buttons) {
        // 현재 창 핸들 저장
        const pages = await browser.pages();
        const originalPage = page;
        const originalPageTarget = originalPage.target();

        // 새 창이 열리는 것 감지를 위한 리스너 설정
        const pagePromise = new Promise(resolve =>
          browser.once('targetcreated', target => resolve(target.page()))
        );

        // 버튼 클릭
        await button.click();

        // 새 탭이 열릴 때까지 대기
        const newPage = await pagePromise;
        await newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 })
          .catch(() => console.log('새 페이지 로딩 대기 시간 초과'));

        // URL 확인 및 반환
        const currentUrl = newPage.url();
        if (currentUrl && currentUrl !== 'about:blank') {
          console.log(`발견된 URL: ${currentUrl}`);
          yield currentUrl;
        } else {
          console.log('유효하지 않은 URL 건너뜀');
        }

        // 새 탭 닫기
        await newPage.close();
      }

      // 다음 페이지로 넘어가기 전에 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('URL 수집 중 오류 발생:', error);
  } finally {
    // 브라우저 종료
    await browser.close();
  }
}

module.exports = getUrlSeed;