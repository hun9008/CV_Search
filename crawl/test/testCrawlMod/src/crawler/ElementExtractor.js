// src/crawler/ElementExtractor.js
class ElementExtractor {
  async extract(page) {
    // 페이지에서 모든 요소 추출
    const pageData = await page.evaluate(() => {
      // 현재 코드에서의 스크립트, 링크, onclick 추출 로직
    });

    // 인라인 스크립트만 필터링
    pageData.inlineScripts = pageData.scripts.filter(script =>
      script.content && !script.src
    );

    return pageData;
  }
}