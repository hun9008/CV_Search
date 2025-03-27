const puppeteer = require('puppeteer');

/**
 * 기업 채용 사이트 URL을 생성하는 제너레이터 함수
 * @returns {AsyncGenerator<string>} URL 생성기
 */
async function* getUrlSeed() {
  // 브라우저 실행
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security'
    ]
  });

  try {
    // 메인 페이지 열기
    const page = await browser.newPage();

    // 브라우저 감지 우회 설정
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 각 페이지 반복
    for (let i = 1; i < 30; i++) {
      console.log(`페이지 ${i}/29 처리 중...`);

      // JobKorea 페이지 열기
      await page.goto(
        `https://www.jobkorea.co.kr/recruit/joblist?menucode=cotype1&cotype=1,2,3#anchorGICnt_${i}`,
        { waitUntil: 'networkidle2', timeout: 30000 }
      );

      // 페이지가 완전히 로드될 때까지 잠시 대기 (waitForTimeout 대신 setTimeout 사용)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 지원하기 버튼 찾기
      try {
        await page.waitForSelector('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc', { timeout: 10000 });
      } catch (error) {
        console.log('버튼을 찾는 동안 시간 초과');
        continue; // 버튼을 찾지 못하면 다음 페이지로
      }

      // 타겟 버튼 찾기
      const buttonSelectors = await page.$$('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc');
      console.log(`${buttonSelectors.length}개의 지원 버튼 발견`);

      // 각 버튼에 대한 URL 추출
      for (let j = 0; j < buttonSelectors.length; j++) {
        try {
          // 버튼에 연결된 URL 가져오기 시도
          const url = await page.evaluate((index) => {
            const buttons = document.querySelectorAll('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc');
            const button = buttons[index];

            // 버튼의 부모 요소에서 URL 정보 찾기 시도
            const parentLink = button.closest('a');
            if (parentLink && parentLink.href) {
              return parentLink.href;
            }

            // 버튼의 data-url 속성 확인
            if (button.dataset.url) {
              return button.dataset.url;
            }

            // 버튼 주변에서 URL을 찾기 위해 부모 노드 탐색
            const card = button.closest('.list-post');
            if (card) {
              const anchors = card.querySelectorAll('a');
              for (const a of anchors) {
                if (a.href && a.href.includes('/Recruit/')) {
                  return a.href;
                }
              }
            }

            return null;
          }, j);

          if (url) {
            console.log(`발견된 URL (DOM에서 추출): ${url}`);
            yield url;
            continue;
          }

          // DOM에서 URL을 추출하지 못했다면 새 페이지 만들기 시도
          console.log(`${j+1}번째 버튼 클릭 시도...`);

          // 새 창이 열리는 것 감지를 위한 Promise 설정
          const pagePromise = new Promise((resolve) => {
            let resolved = false;

            // 한 번만 실행되는 이벤트 핸들러
            const targetHandler = async (target) => {
              if (resolved) return;
              resolved = true;

              try {
                const newPage = await target.page();
                resolve(newPage);
              } catch (err) {
                console.log('새 페이지 가져오기 실패:', err.message);
                resolve(null);
              }
            };

            // 이벤트 핸들러 등록
            browser.once('targetcreated', targetHandler);

            // 타임아웃 설정
            setTimeout(() => {
              if (resolved) return;
              resolved = true;
              console.log('새 페이지 생성 타임아웃');
              resolve(null);
            }, 5000);
          });

          // 버튼 클릭
          try {
            await buttonSelectors[j].click();
            await new Promise(resolve => setTimeout(resolve, 1000)); // 클릭 후 대기
          } catch (clickErr) {
            console.log('기본 클릭 방법 실패, evaluate로 시도:', clickErr.message);
            await page.evaluate((index) => {
              const buttons = document.querySelectorAll('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc');
              buttons[index].click();
            }, j);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 클릭 후 대기
          }

          // 새 탭이 열릴 때까지 대기
          const newPage = await pagePromise;

          // newPage가 null인 경우 처리
          if (!newPage) {
            console.log('새 페이지가 생성되지 않았습니다. 다음 버튼으로 진행합니다.');
            continue;
          }

          try {
            await newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
          } catch (navError) {
            console.log('새 페이지 로딩 대기 시간 초과');
          }

          // URL 확인 및 반환
          const currentUrl = newPage.url();
          if (currentUrl && currentUrl !== 'about:blank') {
            console.log(`발견된 URL (새 페이지): ${currentUrl}`);
            yield currentUrl;
          } else {
            console.log('유효하지 않은 URL 건너뜀');
          }

          // 새 탭 닫기
          await newPage.close().catch(err => console.log('탭 닫기 실패:', err.message));
        } catch (error) {
          console.error(`버튼 ${j+1}번 클릭 중 오류:`, error);
          continue; // 오류 발생 시 다음 버튼으로 진행
        }
      }

      // 다음 페이지로 넘어가기 전에 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('URL 수집 중 오류 발생:', error);
  } finally {
    // 브라우저 종료
    await browser.close();
  }
}

module.exports = getUrlSeed;