
const puppeteer = require('puppeteer');
const fs = require('fs');
const { OnClickWorker, WorkerPool } = require('./worker-task'); // WorkerPool 클래스 가져오기

async function scrollToBottom(page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

async function infiniteScroll(page, maxScrolls = 20) {
  let previousHeight = 0;
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
    scrollCount++;

    // 이전 높이 저장
    previousHeight = await page.evaluate('document.body.scrollHeight');

    // 맨 아래로 스크롤
    await scrollToBottom(page);
    await new Promise(resolve => setTimeout(resolve, 300));
    // 현재 높이 확인
    const currentHeight = await page.evaluate('document.body.scrollHeight');
    console.log(`스크롤 ${scrollCount}/${maxScrolls} 수행 중... (높이: ${previousHeight} → ${currentHeight})`);
  }

  return scrollCount;
}

/**
 * total_url.json 파일을 업데이트하는 함수
 * 기존 파일이 있으면 그 내용을 유지하고 새 URL을 추가합니다
 * @param {string} baseUrl 기본 URL
 * @param {Set<string>} newUrls 새로 발견된 URL 집합
 * @returns {Promise<number>} 최종 저장된 URL 수
 */
async function updateTotalUrlsJson(baseUrl, newUrls) {
  // 기존 URL 데이터 로드
  let urlData = {
    baseUrl: baseUrl,
    totalUrls: 0,
    urls: []
  };

  try {
    // 파일이 존재하는지 확인
    if (fs.existsSync('total_url.json')) {
      const fileContent = fs.readFileSync('total_url.json', 'utf8');
      const existingData = JSON.parse(fileContent);

      // 기존 데이터가 유효한 형식인지 확인
      if (existingData && Array.isArray(existingData.urls)) {
        console.log(`기존 total_url.json 파일에서 ${existingData.urls.length}개의 URL을 로드했습니다.`);
        urlData = existingData;
      }
    }
  } catch (error) {
    console.error('total_url.json 파일 읽기 오류:', error);
    console.log('새 파일을 생성합니다.');
  }

  // 새 URL 필터링 및 추가
  const urlArray = Array.from(newUrls).filter(url => url && typeof url === 'string' && url.startsWith('http'));

  // 중복 없이 URL 병합
  const allUrlsSet = new Set([...urlData.urls, ...urlArray]);
  const mergedUrls = Array.from(allUrlsSet).sort();

  // 업데이트된 데이터 생성
  const updatedData = {
    baseUrl: baseUrl,
    totalUrls: mergedUrls.length,
    urls: mergedUrls
  };

  // 파일에 저장
  fs.writeFileSync('total_url.json', JSON.stringify(updatedData, null, 2));

  const newUrlsCount = mergedUrls.length - urlData.urls.length;
  console.log(`total_url.json 파일이 업데이트되었습니다.`);
  console.log(`- 기존 URL: ${urlData.urls.length}개`);
  console.log(`- 새로 추가된 URL: ${newUrlsCount}개`);
  console.log(`- 총 URL: ${mergedUrls.length}개`);

  return mergedUrls.length;
}
async function extractAndExecuteScripts(url) {
  // headless 모드를 비활성화하여 브라우저를 볼 수 있도록 설정
  const browser = await puppeteer.launch({
    headless: true,
    urls: []
     // 브라우저 UI를 표시
  });
  let result = [];
  // 모든 URL을 저장할 집합 (중복 제거)
  const allUrls = new Set();


  // 초기 URL 추가
  allUrls.add(url);

  try {
    // 메인 페이지 열기
    const page = await browser.newPage();

    // 자바스크립트 대화상자(alert, confirm, prompt) 처리
    page.on('dialog', async dialog => {
      console.log(`대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss(); // 대화상자 닫기
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log(`페이지 로드 완료: ${url}`);

    // 현재 URL 저장
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);

    // 현재 URL이 초기 URL과 다르다면 추가
    if (currentUrl !== url) {
      allUrls.add(currentUrl);
    }

    // 스크립트와 링크 추출
    await infiniteScroll(page);

    const pageData = await page.evaluate(() => {
      // 모든 스크립트 태그 수집
      const scriptElements = Array.from(document.querySelectorAll('script'));
      const scripts = scriptElements.map(script => {
        return {
          type: script.type || 'text/javascript',
          src: script.src || null,
          content: script.src ? null : script.innerHTML
        };
      });

      // 모든 링크 URL 수집
      const linkElements = Array.from(document.querySelectorAll('a[href]'));
      const links = linkElements.map(link => {
        return {
          href: link.href,
          text: link.textContent.trim() || '[No Text]',
          id: link.id || null,
          className: link.className || null,
          onclick: link.getAttribute('onclick') || null
        };
      });

      // onclick 속성을 가진 모든 요소 수집
      const onclickElements = Array.from(document.querySelectorAll('[onclick]'));
      const onclicks = onclickElements.map(element => {
        return {
          tagName: element.tagName,
          id: element.id || null,
          className: element.className || null,
          onclick: element.getAttribute('onclick'),
          text: element.textContent.trim() || '[No Text]'
        };
      });

      return { scripts, links, onclicks };
    });

    console.log(`${pageData.scripts.length}개의 스크립트, ${pageData.links.length}개의 링크, ${pageData.onclicks.length}개의 onclick 요소를 찾았습니다.`);

    // 페이지 내 모든 링크 URL 수집
    pageData.links.forEach(link => {
      if (link.href && link.href.startsWith('http')) {
        allUrls.add(link.href);
      }
    });

    // 스크립트 소스 URL 수집
    pageData.scripts.forEach(script => {
      if (script.src && script.src.startsWith('http')) {
        allUrls.add(script.src);
      }
    });

    // 인라인 스크립트만 선택 (src가 null인 스크립트)
    const inlineScripts = pageData.scripts.filter(script => script.content && !script.src);

    // 1. 인라인 스크립트 처리
    console.log("=== 인라인 스크립트 처리 중... ===");
    for (let i = 0; i < inlineScripts.length; i++) {
      const script = inlineScripts[i];
      console.log(`인라인 스크립트 ${i + 1}/${inlineScripts.length} 실행 중...`);

      try {
        // 새 페이지를 만들어 스크립트 실행 컨텍스트 생성
        const scriptPage = await browser.newPage();

        // 자바스크립트 대화상자 처리
        scriptPage.on('dialog', async dialog => {
          console.log(`스크립트 ${i + 1} 대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
          await dialog.dismiss();
        });

        // 각 탭에 번호를 표시하기 위해 제목 변경
        await scriptPage.evaluate((index) => {
          document.title = `스크립트 실행 ${index}`;
        }, i + 1);

        await scriptPage.goto(currentUrl, { waitUntil: 'networkidle2' });

        // 콘솔 로그를 가로채서 출력
        scriptPage.on('console', msg => console.log(`스크립트 ${i + 1} 콘솔:`, msg.text()));

        // 실행 전 URL 기록
        const beforeUrl = await scriptPage.url();

        // 페이지 내에서 스크립트 실행 및 URL 변경 감지
        const scriptResult = await scriptPage.evaluate(async (scriptContent) => {
          return new Promise(resolve => {
            // 3초 타임아웃 설정
            const timeoutId = setTimeout(() => {
              resolve({
                success: true,
                detectedUrl: null,
                urlChanged: false,
                message: '실행 완료 (타임아웃)'
              });
            }, 3000);

            try {
              // URL 변경 감지를 위한 기존 함수 백업
              const originalAssign = window.location.assign;
              const originalReplace = window.location.replace;
              const originalOpen = window.open;

              // alert, confirm, prompt 함수 오버라이드
              window.alert = function (message) {
                console.log('alert 호출됨:', message);
                return undefined;
              };

              window.confirm = function (message) {
                console.log('confirm 호출됨:', message);
                return true; // 항상 확인 버튼 클릭으로 처리
              };

              window.prompt = function (message, defaultValue) {
                console.log('prompt 호출됨:', message);
                return defaultValue || ''; // 기본값이나 빈 문자열 반환
              };

              // 감지된 URL 저장 변수
              let detectedUrl = null;
              let urlChanged = false;

              // location 함수 오버라이드
              window.location.assign = function (url) {
                console.log('location.assign 호출됨:', url);
                detectedUrl = url;
                urlChanged = true;
                clearTimeout(timeoutId);
                resolve({
                  success: true,
                  detectedUrl: url,
                  urlChanged: true,
                  message: 'location.assign 호출됨'
                });
                return originalAssign.call(window.location, url);
              };

              window.location.replace = function (url) {
                console.log('location.replace 호출됨:', url);
                detectedUrl = url;
                urlChanged = true;
                clearTimeout(timeoutId);
                resolve({
                  success: true,
                  detectedUrl: url,
                  urlChanged: true,
                  message: 'location.replace 호출됨'
                });
                return originalReplace.call(window.location, url);
              };

              // location.href 속성 재정의
              try {
                Object.defineProperty(window.location, 'href', {
                  set: function (url) {
                    console.log('location.href 설정됨:', url);
                    detectedUrl = url;
                    urlChanged = true;
                    clearTimeout(timeoutId);
                    resolve({
                      success: true,
                      detectedUrl: url,
                      urlChanged: true,
                      message: 'location.href 설정됨'
                    });
                    return url;
                  },
                  get: function () {
                    return window.location.toString();
                  }
                });
              } catch (e) {
                console.log('location.href 속성 재정의 실패:', e);
              }

              // window.open 오버라이드
              window.open = function (url) {
                console.log('window.open 호출됨:', url);
                detectedUrl = url;
                urlChanged = true;
                clearTimeout(timeoutId);
                resolve({
                  success: true,
                  detectedUrl: url,
                  urlChanged: true,
                  message: 'window.open 호출됨'
                });
                return originalOpen ? originalOpen.call(window, url) : null;
              };

              // 스크립트 실행
              console.log('스크립트 실행 시작');
              eval(scriptContent);
              console.log('스크립트 실행 완료');

              // URL이 변경되지 않았다면 바로 결과 반환
              if (!urlChanged) {
                clearTimeout(timeoutId);
                resolve({
                  success: true,
                  detectedUrl: null,
                  urlChanged: false,
                  message: '실행 완료 (URL 변경 없음)'
                });
              }

            } catch (error) {
              clearTimeout(timeoutId);
              console.error('스크립트 실행 오류:', error);
              resolve({
                success: false,
                error: error.toString(),
                message: '스크립트 실행 중 오류 발생'
              });
            }
          });
        }, script.content);

        // 실행 후 URL 확인
        const afterUrl = await scriptPage.url();
        console.log('afterUrl', afterUrl);

        // URL이 변경되었으나 감지되지 않았다면 결과 업데이트
        if (afterUrl !== beforeUrl) {
          scriptResult.urlChanged = true;
          scriptResult.detectedUrl = afterUrl;
          scriptResult.message = 'URL 변경 감지됨 (페이지 이동 확인)';

          // 감지된 URL을 전체 URL 목록에 추가
          if (afterUrl.startsWith('http')) {
            allUrls.add(afterUrl);
          }
        }

        // 감지된 URL이 있으면 전체 URL 목록에 추가
        if (scriptResult.detectedUrl && scriptResult.detectedUrl.startsWith('http')) {
          allUrls.add(scriptResult.detectedUrl);
        }

        // 결과 저장
        scriptResult.originalScript = script.content.substring(0, 150) + (script.content.length > 150 ? '...' : '');
        scriptResult.sourceType = 'inline-script';
        scriptResult.index = i + 1;
        result.push(scriptResult);

        console.log(`스크립트 ${i + 1} 실행 결과:`, scriptResult);

        // 이 페이지는 일단 열어두고 다음 스크립트로 진행
        // await scriptPage.close();

      } catch (error) {
        console.error(`인라인 스크립트 실행 중 오류:`, error);
        result.push({
          sourceType: 'inline-script',
          index: i + 1,
          success: false,
          error: error.toString(),
          message: '실행 중 예외 발생'
        });
      }
    }

    // 2. onclick 스크립트 처리
    console.log("=== onclick 스크립트 처리 중... ===");

    // onclick 항목 필터링
    const filteredOnclicks = pageData.onclicks.filter(item => item.onclick);

    if (filteredOnclicks.length === 0) {
      console.log("유효한 onclick 이벤트가 없습니다.");
    } else {
      console.log(`${filteredOnclicks.length}개의 유효한 onclick 이벤트를 처리합니다.`);
    }
        // 병렬 처리를 위한 작업 풀 생성 (최대 5개 동시 실행)
        const workerPool = new WorkerPool(5);

        // 각 onclick 항목을 작업으로 변환
        const tasks = filteredOnclicks.map((item, idx) => ({
          id: idx + 1,
          currentUrl: currentUrl,
          onclickItem: item,
          index: idx + 1,
          total: filteredOnclicks.length,
          headless: true,  // UI 표시 여부
          timeout: 3000,   // onclick 실행 타임아웃
          urlDetectionTimeout: 3000  // URL 변경 감지 타임아웃
        }));

        console.log(`${tasks.length}개의 onclick 작업을 병렬로 처리합니다...`);

        // 모든 작업 병렬 실행
        const onclickResults = await workerPool.processTasks(tasks);

        // 결과 처리
        onclickResults.forEach(onclickResult => {
          // 감지된 URL을 전체 URL 목록에 추가
          if (onclickResult.urlChanged && onclickResult.detectedUrl &&
            onclickResult.detectedUrl.startsWith('http')) {
            allUrls.add(onclickResult.detectedUrl);
          }

          // 결과를 배열에 추가
          result.push(onclickResult);
        });

        console.log(`${onclickResults.length}개의 onclick 이벤트 처리가 완료되었습니다.`);

        // URL 변경이 감지된 항목 수 카운트
        const urlChanges = onclickResults.filter(r => r.urlChanged && r.detectedUrl);
        console.log(`URL 변경이 감지된 항목: ${urlChanges.length}개`);
        // 결과를 파일에 저장
        fs.writeFileSync('script_execution_results.json', JSON.stringify(result, null, 2));
        console.log(`실행 결과를 script_execution_results.json 파일에 저장했습니다.`);

        await updateTotalUrlsJson(url, allUrls);

        return result;

      } catch (error) {
        console.error('전체 프로세스 오류:', error);
        return { error: error.toString() };
      } finally {
        // 브라우저 종료 전에 사용자에게 알림
        console.log('모든 작업이 완료되었습니다. 브라우저를 검토한 후 아무 키나 눌러 종료하세요...');
        // 브라우저는 수동으로 종료할 수 있도록 열어둠
      }

    }


// 함수 실행 예시
const targetUrl = process.argv[2] || 'https://recruit.navercorp.com/rcrt/list.do';
console.log(`대상 URL: ${targetUrl}`);

extractAndExecuteScripts(targetUrl).then(results => {
  console.log('모든 스크립트 실행이 완료되었습니다.');
  console.log(`총 ${results.length}개의 스크립트/onclick 이벤트 처리 결과가 있습니다.`);

  // URL 변경이 감지된 항목만 필터링
  const urlChanges = results.filter(r => r.urlChanged && r.detectedUrl);
  console.log(`URL 변경이 감지된 항목: ${urlChanges.length}개`);

  if (urlChanges.length > 0) {
    console.log('감지된 URL 목록:');
    urlChanges.forEach(item => {
      console.log(`- [${item.sourceType} #${item.index}] ${item.detectedUrl}`);
    });
  }
});

module.exports = { extractAndExecuteScripts };