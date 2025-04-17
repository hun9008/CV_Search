const { defaultLogger: logger } = require('@utils/logger');
const RobotsParser = require('robots-parser');
// node-fetch v2를 사용하는 경우: const fetch = require('node-fetch');
// Node.js 18+ 에서는 내장 fetch 사용 가능, 또는 node-fetch v3 (ESM) 사용 시 import 방식 사용
// 예시에서는 Node.js 18+ 내장 fetch 또는 전역 fetch가 있다고 가정합니다.
// 만약 node-fetch v2 (CommonJS)를 사용한다면 위에 주석 처리된 라인을 활성화하세요.

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
      logger.debug(`Unsupported protocol: ${parsedUrl.protocol} in URL: ${url}`);
      return false;
    }

    // 도메인 추출
    const domain = parsedUrl.hostname; // host 대신 hostname 사용 (포트 번호 제외)
    // 허용된 도메인인지 확인
    return allowedDomains.some(allowedDomain =>
      domain === allowedDomain ||
      domain.endsWith(`.${allowedDomain}`)
    );
  } catch (error) {
    // URL 파싱에 실패하면 (잘못된 URL 형식) false 반환
    logger.debug(`Invalid URL format: ${url}`, error);
    return false;
  }
}

/**
 * URL에서 도메인 추출
 * @param {string} url URL
 * @returns {string | null} 도메인 또는 null
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname; // host 대신 hostname 사용 (포트 번호 제외)
  } catch (error) {
    logger.debug(`URL에서 도메인 추출 중 오류: ${url}`, error);
    return null;
  }
}

/**
 * robots.txt 파일을 가져와서 파싱하고 규칙 객체 반환
 * @param {string} domain 도메인 이름
 * @returns {Promise<Object>} 파싱 결과 객체 { domain, url, parser, success, error? }
 */
async function parseRobotsTxt(domain) {
  const startTime = Date.now();
  // robots.txt는 http/https 모두 가능하나, 일반적으로 https 우선 시도
  const protocols = ['https', 'http'];
  let robotsUrl = '';
  let response = null;
  let robotsContent = '';
  let success = false;
  let fetchError = null;

  for (const protocol of protocols) {
    robotsUrl = `${protocol}://${domain}/robots.txt`;
    try {
      logger.debug(`Trying to fetch robots.txt from: ${robotsUrl}`);
      response = await fetch(robotsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'YourBotName/1.0 (+http://yourwebsite.com/botinfo)' // 적절한 User-Agent 설정 권장
        },
        // 필요에 따라 timeout 설정
        // signal: AbortSignal.timeout(10000) // 예: 10초 타임아웃 (Node.js 16+)
      });

      if (response.ok) {
        robotsContent = await response.text();
        success = true;
        logger.debug(`${domain}의 robots.txt 가져오기 성공 (${robotsUrl})`);
        break; // 성공 시 루프 종료
      } else if (response.status === 404) {
        logger.debug(`${domain}의 robots.txt 찾을 수 없음 (404) (${robotsUrl}). 모든 경로 허용으로 간주.`);
        // robots.txt가 없으면 모든 경로 허용이 일반적 규칙
        robotsContent = ''; // 빈 내용 전달
        success = true; // 파일을 못 찾은 것도 '파싱 관점'에서는 처리 가능한 상태
        fetchError = new Error(`File not found (404)`); // 에러 정보 기록
        break; // 404 확인 후 종료 (http 재시도 불필요)
      } else {
        logger.debug(`${domain}의 robots.txt 가져오기 실패 (${robotsUrl}): Status ${response.status}`);
        fetchError = new Error(`Failed to fetch robots.txt: Status ${response.status}`);
        // 다른 프로토콜로 재시도하기 위해 루프 계속
      }
    } catch (error) {
      logger.debug(`${domain}의 robots.txt 가져오기 중 네트워크 오류 (${robotsUrl}):`, error.message);
      fetchError = error;
      // 다른 프로토콜로 재시도하기 위해 루프 계속
    }
  }


  let parser = null;

  try {
    // fetch 성공 여부와 관계없이 parser 인스턴스 생성 시도
    // fetch 실패 시 robotsContent는 '' (빈 문자열) 이므로, 기본적으로 모든 것을 허용하는 파서 생성
    parser = RobotsParser(robotsUrl || `https://${domain}/robots.txt`, robotsContent); // URL과 내용을 전달
    const runtime = Date.now() - startTime;
    if (success) {
      logger.debug(`${domain}의 robots.txt 파싱 완료`);
      logger.eventInfo('parse_robot_txt', { domain, runtime });
       // fetch가 성공했으므로 파싱 결과 반환
       return {
         domain,
         url: robotsUrl,
         parser,
         success: true,
         runtime,
       };
    } else {
      // fetch 실패 시 (네트워크 오류 또는 404 외 다른 상태 코드)
      logger.eventError('parse_robot_txt', { domain, robotsUrl: robotsUrl || `https://${domain}/robots.txt`, runtime, error: fetchError?.message || 'Unknown fetch error' });
      return {
        domain,
        url: robotsUrl || `https://${domain}/robots.txt`, // 시도했던 마지막 URL 또는 기본 URL
        parser, // 빈 내용으로 생성된 기본 파서 (모든 것 허용)
        success: false, // 가져오기/파싱 과정에서 문제가 있었음을 명시
        error: fetchError?.message || 'Unknown fetch error',
        runtime,
      };
    }
  } catch (parseError) {
    // RobotsParser 생성자 자체에서 오류가 발생한 경우 (매우 드묾)
    logger.debug(`robots.txt 파싱 중 예외 발생 (${domain}):`, parseError);
    logger.eventError('parse_robot_txt', { domain, error: parseError.message, runtime });
    return {
      domain,
      success: false,
      error: `Parser instantiation error: ${parseError.message}`,
      runtime,
      parser: null, // 파서 생성 실패
    };
  }
}


/**
 * URL이 허용되는지 확인 (robots.txt 규칙 포함)
 * @param {string} url - 확인할 URL
 * @param {Array<string>} allowedDomains - 허용된 도메인 목록
 * @param {Object} robotsCache - 도메인별 robots.txt 캐시
 * @returns {Promise<boolean>} 허용 여부
 */
async function isUrlAllowedWithRobots(url, allowedDomains = [], robotsCache = {}) {
  // 1. 기본 도메인 및 프로토콜 검사
  if (!isUrlAllowed(url, allowedDomains)) {
    logger.debug(`URL ${url} is not in allowed domains or has unsupported protocol.`);
    return false;
  }

  try {
    const domain = extractDomain(url);
    if (!domain) {
      logger.debug(`Could not extract domain from URL: ${url}`);
      return false; // 도메인 추출 실패 시 진행 불가
    }

    // 2. robots.txt 규칙 가져오기 (캐시에 없으면 파싱)
    if (!(domain in robotsCache)) {
       logger.debug(`Robots.txt for domain ${domain} not in cache. Parsing...`);
       robotsCache[domain] = await parseRobotsTxt(domain);
       // 캐싱 결과 로깅 (옵션)
       // logger.debug(`Caching result for ${domain}: success=${robotsCache[domain].success}`);
    } else {
       // logger.debug(`Using cached robots.txt for domain ${domain}`);
    }

    const robotsData = robotsCache[domain];

    // 3. robots.txt 파싱 결과 확인 및 규칙 적용
    // 파서 객체가 없거나 (파싱 중 심각한 오류 발생) 파싱에 실패(success:false)했지만 안전하게 진행하고 싶다면 허용 (선택적)
    // 또는 파싱 실패 시 무조건 차단할 수도 있음. 현재 코드는 파싱 실패 시 기본 파서(모든 것 허용)를 사용함.
    if (!robotsData || !robotsData.parser) {
      logger.debug(`No valid robots data or parser available for domain ${domain}. Allowing URL ${url} by default.`);
      return true; // robots.txt 정보가 없거나 파서 생성 실패 시 기본적으로 허용
    }

    // robots.txt 규칙에 따라 URL 허용 여부 확인 (User-Agent 지정 필수)
    const userAgent = 'puppeteer'; // 또는 사용하는 실제 User-Agent
    const isAllowed = robotsData.parser.isAllowed(url, userAgent);

    if (!isAllowed) {
      logger.debug(`URL ${url} is disallowed by robots.txt for domain ${domain} (User-Agent: ${userAgent})`);
    } else {
      // logger.debug(`URL ${url} is allowed by robots.txt for domain ${domain} (User-Agent: ${userAgent})`);
    }

    return isAllowed;

  } catch (error) {
    // URL 파싱 오류 등 예상치 못한 오류 처리
    logger.error(`Error checking if URL ${url} is allowed with robots:`, error);
    return true; // 오류 발생 시 안전하게 기본적으로 허용 (또는 false로 변경 가능)
  }
}

module.exports = { isUrlAllowed, extractDomain, parseRobotsTxt, isUrlAllowedWithRobots };