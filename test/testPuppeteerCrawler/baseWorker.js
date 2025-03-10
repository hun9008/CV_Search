const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractAndExecuteScripts(url) {
  const browser = await puppeteer.launch({ headless: "new" });
  let result = null;

  try {
    // 메인 페이지 열기
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`페이지 로드 완료: ${url}`);

    // 현재 URL 저장
    const currentUrl = page.url();

    // 스크립트와 링크 추출
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

      return { scripts, links };
    });

    console.log(`${pageData.scripts.length}개의 스크립트와 ${pageData.links.length}개의 링크를 찾았습니다.`);

    // Worker를 사용하여 스크립트 실행 및 URL 변경 감지
    const scriptResults = [];

    // 인라인 스크립트만 선택 (src가 null인 스크립트)
    const inlineScripts = pageData.scripts.filter(script => script.content && !script.src);

    for (let i = 0; i < inlineScripts.length; i++) {
      const script = inlineScripts[i];

      console.log(`Worker에서 스크립트 ${i+1}/${inlineScripts.length} 실행 중...`);

      try {
        // 새 페이지를 만들어 Worker 컨텍스트 생성
        const workerPage = await browser.newPage();
        await workerPage.goto(url,{ waitUntil: 'networkidle2' });

        // Worker에서 스크립트 실행 및 URL 변경 감지
        const scriptResult = await workerPage.evaluate(async (scriptContent) => {
          // 스크립트 실행을 위한 Worker 생성
          return new Promise(resolve => {
            try {
              // Worker 코드 생성
              const workerCode = `
                self.addEventListener('message', function(e) {
                  try {
                    // URL 변경 감지를 위한 기존 함수 백업
                    const originalAssign = self.location.assign;
                    const originalReplace = self.location.replace;
                    const originalHref = Object.getOwnPropertyDescriptor(self.location, 'href');

                    // URL 변경 추적 변수
                    let detectedUrl = null;

                    // location 함수 오버라이드
                    self.location.assign = function(url) {
                      detectedUrl = url;
                      // 실제 함수는 호출하지 않음 (페이지 변경 방지)
                    };

                    self.location.replace = function(url) {
                      detectedUrl = url;
                      // 실제 함수는 호출하지 않음 (페이지 변경 방지)
                    };

                    // location.href 속성 재정의
                    Object.defineProperty(self.location, 'href', {
                      set: function(url) {
                        detectedUrl = url;
                        // 실제 설정은 하지 않음 (페이지 변경 방지)
                        return url;
                      },
                      get: function() {
                        return originalHref.get.call(self.location);
                      }
                    });

                    // window.open 오버라이드
                    self.open = function(url) {
                      detectedUrl = url;
                      // 실제로 창은 열지 않음
                      return { closed: true };
                    };

                    // 스크립트 실행
                    eval(e.data.script);

                    // 결과 반환
                    self.postMessage({
                      detectedUrl: detectedUrl
                    });
                  } catch (error) {
                    self.postMessage({
                      error: error.toString()
                    });
                  }
                });
              `;

              // Worker Blob 생성
              const blob = new Blob([workerCode], { type: 'application/javascript' });
              const workerUrl = URL.createObjectURL(blob);
              const worker = new Worker(workerUrl);

              // Worker에 메시지 수신 리스너 설정
              worker.addEventListener('message', function(e) {
                URL.revokeObjectURL(workerUrl);
                worker.terminate();
                resolve(e.data);
              });

              // Worker에 스크립트 전송
              worker.postMessage({ script: scriptContent });

            } catch (error) {
              resolve({ error: error.toString() });
            }
          });
        }, script.content);

        scriptResult.originalScript = script.content.substring(0, 150) + (script.content.length > 150 ? '...' : '');
        scriptResults.push(scriptResult);

        // Worker 페이지 닫기
        await workerPage.close();

      } catch (error) {
        console.error(`스크립트 실행 중 오류:`, error);
        scriptResults.push({
          error: error.toString(),
          originalScript: script.content.substring(0, 150) + (script.content.length > 150 ? '...' : '')
        });
      }
    }

    // 결과 객체 구성
    result = {
      originalUrl: url,
      finalUrl: currentUrl,
      scripts: pageData.scripts.length,
      links: pageData.links,
      scriptExecutionResults: scriptResults,
    };

    // 스크립트 실행 결과 필터링 (URL 변경이 감지된 것만)
    const urlChanges = scriptResults.filter(r => r.detectedUrl);

    if (urlChanges.length > 0) {
      console.log(`${urlChanges.length}개의 스크립트에서 URL 변경이 감지되었습니다:`);
      urlChanges.forEach((result, index) => {
        console.log(`${index + 1}. 감지된 URL: ${result.detectedUrl}`);
        console.log(`   스크립트: ${result.originalScript}`);
      });
    } else {
      console.log('URL 변경을 시도하는 스크립트가 발견되지 않았습니다.');
    }

    // 결과를 파일로 저장
    fs.writeFileSync('script_execution_results.json', JSON.stringify(result, null, 2));
    console.log('결과가 script_execution_results.json 파일에 저장되었습니다.');

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    // 브라우저 종료
    await browser.close();
    console.log('브라우저 종료됨');
  }

  return result;
}

// 사용 예:
const targetUrl = 'https://recruit.snowcorp.com/rcrt/list.do'; // 분석할 웹사이트 URL

extractAndExecuteScripts(targetUrl).then(result => {
  if (result) {
    console.log('작업 완료!');
  } else {
    console.log('작업이 실패했습니다.');
  }
});