const { defaultLogger: logger } = require('@utils/logger');

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
// 도메인의 robots.txt 파싱 및 적용
async function parseRobotsTxt(domain) {
  const robots = require('robots-parser');
  const fetch = require('node-fetch');
  const robotsUrl = `https://${domain}/robots.txt`;

  try {
    logger.info(`도메인 ${domain}의 robots.txt 파싱 중...`);

    // robots.txt 파일 내용 가져오기
    const response = await fetch(robotsUrl, { timeout: 5000 });

    if (!response.ok) {
      logger.warn(`도메인 ${domain}의 robots.txt를 가져올 수 없습니다. 상태 코드: ${response.status}`);
      return null;
    }

    const robotsTxt = await response.text();

    // robots.txt 파일 내용 파싱
    const robotsParser = robots(robotsUrl, robotsTxt);

    // Disallow 규칙 추출
    const disallowedPatterns = [];

    // robots.txt 파일에서 User-agent: * 섹션의 Disallow 규칙 찾기
    const lines = robotsTxt.split('\n');
    let currentUserAgent = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // User-agent 선언 확인
      if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
        const userAgent = trimmedLine.substring('user-agent:'.length).trim();
        currentUserAgent = userAgent;
      }
      // Disallow 규칙 확인 (현재 User-agent가 * 또는 크롤러 이름인 경우만)
      else if ((currentUserAgent === '*' || currentUserAgent === 'puppeteer') &&
               trimmedLine.toLowerCase().startsWith('disallow:')) {
        const path = trimmedLine.substring('disallow:'.length).trim();
        if (path && path !== '/') {
          disallowedPatterns.push(path);
        }
      }
    }

    logger.info(`도메인 ${domain}에서 ${disallowedPatterns.length}개의 Disallow 패턴 발견`);

    // 패턴 예시 로깅 (최대 5개)
    if (disallowedPatterns.length > 0) {
      const examplePatterns = disallowedPatterns.slice(0, 5);
      logger.info(`Disallow 패턴 예시: ${examplePatterns.join(', ')}${disallowedPatterns.length > 5 ? ' 외 ' + (disallowedPatterns.length - 5) + '개' : ''}`);
    }

    return {
      parser: robotsParser,
      disallowedPatterns
    };
  } catch (error) {
    logger.error(`도메인 ${domain}의 robots.txt 파싱 중 오류:`, error);
    return null;
  }
}

// isUrlAllowed 함수에서 robots.txt 규칙 적용 (urlManager.js 또는 적절한 위치에 추가)
/**
 * URL이 허용되는지 확인 (robots.txt 규칙 포함)
 * @param {string} url - 확인할 URL
 * @param {Array<string>} allowedDomains - 허용된 도메인 목록
 * @param {Object} robotsCache - 도메인별 robots.txt 캐시
 * @returns {boolean} 허용 여부
 */
async function isUrlAllowedWithRobots(url, allowedDomains = [], robotsCache = {}) {
  // 기존 isUrlAllowed 검사 수행
  if (!isUrlAllowed(url, allowedDomains)) {
    return false;
  }

  try {
    const domain = extractDomain(url);

    // robots.txt 규칙 가져오기 (캐시에 없으면 파싱)
    if (!robotsCache[domain]) {
      robotsCache[domain] = await parseRobotsTxt(domain);
    }

    const robotsData = robotsCache[domain];

    // robots.txt 파일이 없거나 파싱 실패한 경우 허용
    if (!robotsData || !robotsData.parser) {
      return true;
    }

    // robots.txt 규칙에 따라 URL 허용 여부 확인
    const isAllowed = robotsData.parser.isAllowed(url, 'puppeteer');

    if (!isAllowed) {
      logger.debug(`URL ${url}은 robots.txt에 의해 차단됨`);
    }

    return isAllowed;
  } catch (error) {
    logger.error(`URL ${url} 허용 여부 확인 중 오류:`, error);
    return true; // 오류 발생 시 기본적으로 허용
  }
}
module.exports ={isUrlAllowed ,extractDomain ,parseRobotsTxt ,isUrlAllowedWithRobots}
