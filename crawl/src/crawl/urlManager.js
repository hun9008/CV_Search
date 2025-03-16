
/**
 * 주어진 URL이 허용된 도메인에 속하는지 확인합니다.
 * @param {string} url - 확인할 URL
 * @param {string[]} allowedDomains - 허용된 도메인 목록
 * @returns {boolean} - URL이 허용되면 true, 그렇지 않으면 false
    */
   function isUrlAllowed(url, allowedDomains) {
      try {
        // URL이 유효한지 검증
        const parsedUrl = new URL(url);

        // 지원되는 프로토콜인지 확인 (http 또는 https만 허용)
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return false;
        }

        // 도메인 추출
        const domain = parsedUrl.host;
        // 허용된 도메인인지 확인
        return allowedDomains.some(allowedDomain =>
          domain === allowedDomain ||
          domain.endsWith(`.${allowedDomain}`)
        );
      } catch (error) {
        // URL 파싱에 실패하면 (잘못된 URL 형식) false 반환
        return false;
      }

   }

     /**
   * URL에서 도메인 추출
   * @param {string} url URL
   * @returns {string} 도메인
   */
    function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      logger.error(`URL에서 도메인 추출 중 오류: ${url}`, error);
      return null;
    }
  }


module.exports ={isUrlAllowed ,extractDomain}
