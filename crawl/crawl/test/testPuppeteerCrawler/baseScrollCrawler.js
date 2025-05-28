const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractAndExecuteScripts(url) {
  // headless 모드를 비활성화하여 브라우저를 볼 수 있도록 설정
  const browser = await puppeteer.launch({
    headless: false,  // 브라우저 UI를 표시
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

    // 페이지 로드 타임아웃 및 대기시간 늘리기
    console.log(`${url} 로드 중...`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 120000  // 2분으로 늘림
    });
    console.log(`기본 페이지 로드 완료, 추가 대기 시작...`);

    // 추가 로딩 시간을 위해 대기 (느린 사이트 대응)
    await page.waitForTimeout(5000);

    console.log(`페이지 로드 완료: ${url}`);

    // 현재 URL 저장
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);

    // 현재 URL이 초기 URL과 다르다면 추가
    if (currentUrl !== url) {
      allUrls.add(currentUrl);
    }

    // 스크롤하면서 요소 수집 함수
    async function scrollAndCollectElements() {
      console.log("=== 스크롤하며 요소 수집 시작 ===");

      // 수집된 모든 요소를 저장
      const collectedElements = {
        scripts: [],
        links: [],
        onclicks: []
      };

      // 스크롤 이전의 높이를 저장
      let lastHeight = await page.evaluate('document.body.scrollHeight');

      // 스크롤 시작
      let scrollCount = 0;
      const maxScrolls = 15; // 최대 스크롤 횟수

      while (scrollCount < maxScrolls) {
        scrollCount++;
        console.log(`스크롤 ${scrollCount}/${maxScrolls} 수행 중...`);

        // 페이지를 스크롤하여 새로운 콘텐츠 로드
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

        // 콘텐츠가 로드될 때까지 대기
        await page.waitForTimeout(2000);

        // 현재 높이 확인
        const newHeight = await page.evaluate('document.body.scrollHeight');

        // 현재 화면에 표시된 요소들 수집
        const newElements = await page.evaluate(() => {
          // 모든 스크립트 태그 수집
          const scriptElements = Array.from(document.querySelectorAll('script'));
          const scripts = scriptElements.map(script => {
            return {
              type: script.type || 'text/javascript',
              src: script.src || null,
              content: script.src ? null : script.innerHTML,
              hash: script.src || (script.innerHTML ? script.innerHTML.substring(0, 50) : null) // 중복 체크용
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
              onclick: link.getAttribute('onclick') || null,
              hash: link.href // 중복 체크용
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
              text: element.textContent.trim() || '[No Text]',
              hash: element.onclick + ":" + (element.id || "") // 중복 체크용
            };
          });

          return { scripts, links, onclicks };
        });

        // 중복 제거하면서 새로운 요소 추가
        const addedScripts = addUniqueElements(collectedElements.scripts, newElements.scripts, 'hash');
        const addedLinks = addUniqueElements(collectedElements.links, newElements.links, 'hash');
        const addedOnclicks = addUniqueElements(collectedElements.onclicks, newElements.onclicks, 'hash');

        console.log(`스크롤 ${scrollCount}에서 발견: 새 스크립트 ${addedScripts}개, 새 링크 ${addedLinks}개, 새 onclick ${addedOnclicks}개`);

        // 높이가 변하지 않았으면 스크롤 종료 (더 이상 새 콘텐츠 없음)
        if (newHeight === lastHeight) {
          console.log(`더 이상 새로운 콘텐츠가 로드되지 않습니다. 스크롤 완료.`);
          break;
        }

        lastHeight = newHeight;
      }

      console.log(`=== 스크롤 완료: 총 ${collectedElements.scripts.length}개의 스크립트, ${collectedElements.links.length}개의 링크, ${collectedElements.onclicks.length}개의 onclick 요소 수집됨 ===`);

      // 중복 체크용 해시 속성 제거
      collectedElements.scripts.forEach(item => delete item.hash);
      collectedElements.links.forEach(item => delete item.hash);
      collectedElements.onclicks.forEach(item => delete item.hash);

      return collectedElements;
    }

    // 요소 목록에 중복 없이 새 요소를 추가하는 헬퍼 함수
    function addUniqueElements(targetArray, newElements, hashProperty) {
      const existingHashes = new Set(targetArray.map(item => item[hashProperty]));
      let added = 0;

      newElements.forEach(item => {
        if (!existingHashes.has(item[hashProperty])) {
          targetArray.push(item);
          existingHashes.add(item[hashProperty]);
          added++;
        }
      });

      return added;
    }

    // 스크롤하면서 요소 수집 실행
    const pageData = await scrollAndCollectElements();

    console.log(`수집 완료: ${pageData.scripts.length}개의 스크립트, ${pageData.links.length}개의 링크, ${pageData.onclicks.length}개의 onclick 요소를 찾았습니다.`);

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

    // 스크롤 결과를 별도 파일에 저장 (선택사항)
    fs.writeFileSync('scroll_collected_elements.json', JSON.stringify({
      stats: {
        scripts: pageData.scripts.length,
        links: pageData.links.length,
        onclicks: pageData.onclicks.length
      },
      scripts: pageData.scripts.map(s => ({
        type: s.type,
        src: s.src,
        contentLength: s.content ? s.content.length : 0
      })),
      links: pageData.links,
      onclicks: pageData.onclicks
    }, null, 2));
    console.log('스크롤하며 수집한 요소들을 scroll_collected_elements.json 파일에 저장했습니다.');

    // 인라인 스크립트만 선택 (src가 null인 스크립트)
    const inlineScripts = pageData.scripts.filter(script => script.content && !script.src);

    // 1. 인라인 스크립트 처리
    console.log("=== 인라인 스크립트 처리 중... ===");
    for (let i = 0; i < inlineScripts.length; i++) {
      const script = inlineScripts[i];
      console.log(`인라인 스크립트 ${i+1}/${inlineScripts.length} 실행 중...`);

      try {
        // 새 페이지를 만들어 스크립트 실행 컨텍스트 생성
        const scriptPage = await browser.newPage();

        // 자바스크립트 대화상자 처리
        scriptPage.on('dialog', async dialog => {
          console.log(`스크립트 ${i+1} 대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
          await dialog.dismiss();
        });

        // 각 탭에 번호를 표시하기 위해 제목 변경
        await scriptPage.evaluate((index) => {
          document.title = `스크립트 실행 ${index}`;
        }, i+1);

        // 페이지 로드 타임아웃 증가 및 로딩 후 추가 대기
        await scriptPage.goto(currentUrl, {
          waitUntil: 'networkidle2',
          timeout: 60000 // 60초로 설정
        });

        // 페이지가 완전히 로드될 때까지 추가 대기
        await scriptPage.waitForTimeout(3000);

        // 콘솔 로그를 가로채서 출력
        scriptPage.on('console', msg => console.log(`스크립트 ${i+1} 콘솔:`, msg.text()));

        // 실행 전 URL 기록
        const beforeUrl = await scriptPage.url();

        // 페이지 내에서 스크립트 실행 및 URL 변경 감지
        const scriptResult = await scriptPage.evaluate(async (scriptContent) => {
          return new Promise(resolve => {
            // 5초 타임아웃으로 늘림 (더 많은 실행 시간 허용)
            const timeoutId = setTimeout(() => {
              resolve({
                success: true,
                detectedUrl: null,
                urlChanged: false,
                message: '실행 완료 (타임아웃)'
              });
            }, 5000);

            try {
              // URL 변경 감지를 위한 기존 함수 백업
              const originalAssign = window.location.assign;
              const originalReplace = window.location.replace;
              const originalOpen = window.open;

              // alert, confirm, prompt 함수 오버라이드
              window.alert = function(message) {
                console.log('alert 호출됨:', message);
                return undefined;
              };

              window.confirm = function(message) {
                console.log('confirm 호출됨:', message);
                return true; // 항상 확인 버튼 클릭으로 처리
              };

              window.prompt = function(message, defaultValue) {
                console.log('prompt 호출됨:', message);
                return defaultValue || ''; // 기본값이나 빈 문자열 반환
              };

              // 감지된 URL 저장 변수
              let detectedUrl = null;
              let urlChanged = false;

              // location 함수 오버라이드
              window.location.assign = function(url) {
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

              window.location.replace = function(url) {
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
                  set: function(url) {
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
                  get: function() {
                    return window.location.toString();
                  }
                });
              } catch (e) {
                console.log('location.href 속성 재정의 실패:', e);
              }

              // window.open 오버라이드
              window.open = function(url) {
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

        // URL 변경 감지를 위해 더 오래 대기 (5초)
        await scriptPage.waitForTimeout(5000);

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

        console.log(`스크립트 ${i+1} 실행 결과:`, scriptResult);

        // 이 페이지는 닫고 메모리를 절약
        await scriptPage.close();

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
    for (let i = 0; i < pageData.onclicks.length; i++) {
      const onclickItem = pageData.onclicks[i];

      if (!onclickItem.onclick) continue;

      console.log(`onclick 스크립트 ${i+1}/${pageData.onclicks.length} 실행 중...`);

      try {
        // 새 페이지를 만들어 onclick 실행 컨텍스트 생성
        const onclickPage = await browser.newPage();

        // 자바스크립트 대화상자 처리
        onclickPage.on('dialog', async dialog => {
          console.log(`onclick ${i+1} 대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
          await dialog.dismiss();
        });

        // 각 탭에 번호를 표시하기 위해 제목 변경
        await onclickPage.evaluate((index) => {
          document.title = `onclick 실행 ${index}`;
        }, i+1);

        // 페이지 로드 타임아웃 증가 및 로딩 후 추가 대기
        await onclickPage.goto(currentUrl, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        // 페이지가 완전히 로드될 때까지 추가 대기
        await onclickPage.waitForTimeout(3000);

        // 콘솔 로그를 가로채서 출력
        onclickPage.on('console', msg => console.log(`onclick ${i+1} 콘솔:`, msg.text()));

        // 실행 전 URL 기록
        const beforeUrl = await onclickPage.url();

        // onclick 함수 실행 및 URL 변경 감지 - 단순화된 버전
        const onclickResult = await onclickPage.evaluate(async (onclickCode, elementInfo) => {
          return new Promise(resolve => {
            // 5초 타임아웃 설정으로 늘림
            const timeoutId = setTimeout(() => {
              resolve({
                success: true,
                message: '실행 완료 (타임아웃)'
              });
            }, 5000);

            try {
              // 대화상자 함수 오버라이드
              window.alert = function(message) {
                console.log('alert 호출됨:', message);
                return undefined;
              };

              window.confirm = function(message) {
                console.log('confirm 호출됨:', message);
                return true; // 항상 확인 버튼 클릭으로 처리
              };

              window.prompt = function(message, defaultValue) {
                console.log('prompt 호출됨:', message);
                return defaultValue || ''; // 기본값이나 빈 문자열 반환
              };

              // 실행될 onclick 코드에 대한 정보 출력
              console.log(`${elementInfo.tagName} 요소의 onclick 실행: ${onclickCode}`);

              // onclick 코드 실행 (단순 eval만 사용)
              eval(onclickCode);
              console.log('onclick 실행 완료');

              // 타임아웃 제거 및 결과 반환
              clearTimeout(timeoutId);
              resolve({
                success: true,
                message: '실행 완료'
              });
            } catch (error) {
              clearTimeout(timeoutId);
              console.error('onclick 실행 오류:', error);
              resolve({
                success: false,
                error: error.toString(),
                message: 'onclick 실행 중 오류 발생'
              });
            }
          });
        }, onclickItem.onclick, {
          tagName: onclickItem.tagName,
          id: onclickItem.id,
          className: onclickItem.className,
          text: onclickItem.text
        });

        // 실행 후 URL 확인하여 변경 감지를 위한 긴 대기
        await onclickPage.waitForTimeout(5000);

        const afterUrl = await onclickPage.url();
        console.log('afterUrl : ', afterUrl);

        // URL 변경 여부 확인 및 결과 업데이트
        if (afterUrl !== beforeUrl) {
          onclickResult.urlChanged = true;
          onclickResult.detectedUrl = afterUrl;
          onclickResult.message = 'URL 변경 감지됨 (페이지 이동 확인)';

          // 감지된 URL을 전체 URL 목록에 추가
          if (afterUrl.startsWith('http')) {
            allUrls.add(afterUrl);
          }
        } else {
          onclickResult.urlChanged = false;
          onclickResult.detectedUrl = null;
        }

        // 결과 저장
        onclickResult.originalScript = onclickItem.onclick;
        onclickResult.sourceType = 'onclick';
        onclickResult.index = i + 1;
        onclickResult.elementInfo = {
          tagName: onclickItem.tagName,
          id: onclickItem.id,
          className: onclickItem.className,
          text: onclickItem.text
        };

        await onclickPage.close();
        result.push(onclickResult);
        console.log(`onclick ${i+1} 실행 결과:`, onclickResult);

      } catch (error) {
        console.error(`onclick 실행 중 오류:`, error);
        result.push({
          sourceType: 'onclick',
          index: i + 1,
          success: false,
          error: error.toString(),
          elementInfo: {
            tagName: onclickItem.tagName,
            id: onclickItem.id,
            className: onclickItem.className,
            text: onclickItem.text
          },
          message: '실행 중 예외 발생'
        });
      }
    }

    // 결과를 파일에 저장
    fs.writeFileSync('script_execution_results.json', JSON.stringify(result, null, 2));
    console.log(`실행 결과를 script_execution_results.json 파일에 저장했습니다.`);

    // 모든 URL을 저장한 total_url.json 파일 생성
    const urlArray = Array.from(allUrls).filter(url => url && typeof url === 'string' && url.startsWith('http'));
    const urlData = {
      baseUrl: url,
      totalUrls: urlArray.length,
      urls: urlArray.sort()
    };

    fs.writeFileSync('total_url.json', JSON.stringify(urlData, null, 2));
    console.log(`총 ${urlArray.length}개의 URL을 total_url.json 파일에 저장했습니다.`);

    return result;

  } catch (error) {
    console.error('전체 프로세스 오류:', error);
    return { error: error.toString() };
  } finally {
    // 브라우저 종료
    await browser.close();
    console.log('브라우저가 종료되었습니다.');
  }
}

// 함수 실행 예시
const targetUrl = process.argv[2] || 'https://recruit.navercorp.com/rcrt/list.do';
console.log(`대상 URL: ${targetUrl}`);

extractAndExecuteScripts(targetUrl).then(results => {
  console.log('모든 스크립트 실행이 완료되었습니다.');
  console.log(`총 ${results.length}개의 스크립트/onclick 이벤트 처리 결과가 있습니다.`);
  if (results.error) {
      console.error('오류가 발생했습니다:', results.error);
      return;
    }

  // 결과가 배열인지 확인
  if (!Array.isArray(results)) {
    console.error('결과가 배열 형식이 아닙니다:', results);
    return;
  }
  // URL 변경이 감지된 항목만 필터링
  const urlChanges = results.filter(r => r.urlChanged && r.detectedUrl);
  console.log(`URL 변경이 감지된 항목: ${urlChanges.length}개`);

  if (urlChanges.length > 0) {
    console.log('감지된 URL 목록:');
    urlChanges.forEach(item => {
      console.log(`- [${item.sourceType} #${item.index}] ${item.detectedUrl}`);
    });
  }
}).catch(error => {
  console.error('실행 중 오류가 발생했습니다:', error);
});