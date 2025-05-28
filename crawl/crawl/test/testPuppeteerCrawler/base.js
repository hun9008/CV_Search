const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractScriptsAndUrls(url) {
  const browser = await puppeteer.launch({ headless: "new" });
  let result = null;

  try {
    // 메인 페이지 열기
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`페이지 로드 완료: ${url}`);

    // 페이지의 현재 URL 가져오기 (리다이렉트가 있을 수 있으므로)
    const currentUrl = page.url();

    // 모든 스크립트 태그와 URL 추출
    const scriptData = await page.evaluate(() => {
      // 모든 스크립트 태그 수집
      const scriptElements = Array.from(document.querySelectorAll('script'));

      // 인라인 스크립트와 외부 스크립트 분류
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
          text: link.textContent.trim() || '[No Text]'
        };
      });

      return {
        scripts,
        links
      };
    });

    // 결과 객체 구성
    result = {
      originalUrl: url,
      finalUrl: currentUrl,
      scripts: scriptData.scripts,
      links: scriptData.links
    };

    // 결과를 파일로 저장
    fs.writeFileSync('page_data.json', JSON.stringify(result, null, 2));
    console.log('결과가 page_data.json 파일에 저장되었습니다.');

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

extractScriptsAndUrls(targetUrl).then(result => {
  if (result) {
    console.log('작업 완료!');
    console.log(`스크립트 ${result.scripts.length}개, 링크 ${result.links.length}개 추출 완료`);
  } else {
    console.log('작업이 실패했습니다.');
  }
});