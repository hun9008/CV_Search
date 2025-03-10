class PageExtractor {
  constructor(page) {
    this.page = page;
  }

  async extract() {
    // 페이지에서 스크립트, 링크, onclick 요소 추출
    const pageData = await this.page.evaluate(() => {
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

    // 인라인 스크립트만 선택 (src가 null인 스크립트)
    const inlineScripts = pageData.scripts.filter(script => script.content && !script.src);

    // 결과 객체에 인라인 스크립트 추가
    pageData.inlineScripts = inlineScripts;

    return pageData;
  }
}

module.exports = { PageExtractor };