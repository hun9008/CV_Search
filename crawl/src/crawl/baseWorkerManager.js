require('module-alias/register');
const puppeteer = require('puppeteer');
const {MongoDBService} = require('@database/mongodb-service');
const {extractAndExecuteScripts , extractAndExecuteScriptsPromise } = require('@crawl/baseWorker');
const { isUrlAllowed, extractDomain } = require('@crawl/urlManager');
const CONFIG = require('@config/config');
const { defaultLogger: logger } = require('@utils/logger');
const { VisitResult } = require('@models/visitResult');
db = new MongoDBService();

// 설정 초기화 (필요한 디렉토리 생성 등)
CONFIG.initialize();

// 결과 파일 경로 설정
const RESULTS_FILE = CONFIG.PATHS.RESULT_FILES.MAIN_RESULT;

/**
 * URL 탐색 관리자 클래스
 * 여러 URL을 큐에 넣고 순차적으로 탐색합니다.
 */
class BaseWorkerManager {
  /**
   * 생성자
   * @param {Object} options 옵션
   * @param {string} options.startUrl 시작 URL
   * @param {number} options.maxUrls 최대 방문 URL 수 (기본값: 100)
   * @param {number} options.delayBetweenRequests 요청 사이 지연 시간(ms) (기본값: 2000)
   * @param {boolean} options.headless 헤드리스 모드 사용 여부
   */
  constructor(options = {}) {
    this.startUrl = options.startUrl || CONFIG.DOMAINS.DEFAULT_URL;
    this.delayBetweenRequests = options.delayBetweenRequests || CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS;
    this.headless = options.headless !== undefined ? options.headless : CONFIG.BROWSER.HEADLESS;
    this.maxUrls = CONFIG.CRAWLER.MAX_URLS;
    this.strategy = CONFIG.CRAWLER.STRATEGY;
    this.currentUrl;
    if (this.strategy == "specific") {
      this.specificDomain = CONFIG.CRAWLER.BASE_DOMAIN;
    }

    // 실행 상태
    this.isRunning = false;
    // 브라우저 인스턴스
    this.browser = null;
  }

/**
 * 브라우저 초기화
 */
async initBrowser() {
  if (!this.browser) {
    logger.info(`BaseWorkerManager 초기화 완료.`);
    this.browser = await puppeteer.launch({
      headless: 'new',
      ignoreHTTPSErrors: true,
      defaultViewport: null,
      ignoreDefaultArgs: ['--enable-automation'],
      args: CONFIG.CRAWLER.LAUNCH_ARGS,
      defaultViewport: { width: 1920, height: 1080 },
      timeout: 10_000, // 10 seconds
      protocolTimeout: 20_000, // 20 seconds
    });

    // 브라우저 PID 저장
    this.browserPID = this.browser.process() ? this.browser.process().pid : null;
    if (this.browserPID) {
      logger.info(`브라우저 프로세스 ID: ${this.browserPID}`);
    }

    // 프로세스 종료 신호 처리
    const processExit = async () => {
      logger.info('프로세스 종료 감지, 브라우저 정리 중...');

      try {
        if (this.browser) {
          // 모든 페이지 닫기 시도
          const pages = await this.browser.pages();
          await Promise.all(pages.map(page => {
            try { return page.close(); }
            catch (e) { return Promise.resolve(); }
          }));

          // 브라우저 닫기
          await this.browser.close();
          logger.info('브라우저가 안전하게 종료되었습니다.');
        }
      } catch (err) {
        logger.error('브라우저 종료 중 오류:', err);
      } finally {
        // 추가: Google Chrome for Testing 프로세스 강제 종료
        this.killChromeProcesses();
      }

      process.exit(0);
    };


  }

  return this.browser;
}



  /**
   * 페이지의 내용을 추출
   * @param {Page} page Puppeteer 페이지 객체
   * @returns {Promise<Object>} 페이지 내용 객체
   */
  async extractPageContent(page) {
    return page.evaluate(() => {
      // 페이지 내에서 텍스트 추출 함수 정의 (페이지 컨텍스트 내에서)

      function extractTextFromNode(node) {
        // 텍스트 노드인 경우
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent.trim();
        }

        // 특정 태그는 건너뛰기 (스크립트, 스타일, 코드, noscript 등)
        if (node.nodeName === 'SCRIPT' ||
            node.nodeName === 'STYLE' ||
            node.nodeName === 'CODE' ||
            node.nodeName === 'NOSCRIPT' ||
            node.nodeName === 'SVG') {
          return '';
        }

        // 노드가 보이지 않는 경우 건너뛰기
        try {
          const style = window.getComputedStyle(node);
          if (style && (style.display === 'none' || style.visibility === 'hidden')) {
            return '';
          }
        } catch (e) {
          // getComputedStyle은 요소 노드에서만 작동
        }

        // 자식 노드 처리
        let text = '';
        const childNodes = node.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          text += extractTextFromNode(childNodes[i]) + ' ';
        }

        return text.trim();
      }

      // 타이틀 추출
      const title = document.title || '';

      // 메타 태그 추출
      const meta = {};
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (name && content) {
          meta[name] = content;
        }
      });

      // 주요 텍스트 내용 추출 - 함수가 페이지 컨텍스트 내에 정의되어 있음
      const mainText = extractTextFromNode(document.body);

      // 긴 텍스트 정리 및 가독성 향상
      const cleanedText = mainText
        .replace(/\s+/g, ' ')      // 연속된 공백을 하나로
        .replace(/\n\s*\n/g, '\n') // 빈 줄 제거
        .trim()
        .substring(0, 100000);     // 텍스트 길이 제한

      return {
        title,
        meta,
        text: cleanedText
      };
    });
  }

  /**
 * 페이지에서 링크 추출 (상대 경로 포함)
 * @param {Page} page Puppeteer 페이지 객체
 * @param {Array<string>} allowedDomains 허용된 도메인 목록
 * @returns {Promise<Array<string>>} 추출된 URL 배열
 */
async extractLinks(page, allowedDomains) {
  // 현재 페이지 URL 가져오기
  const pageUrl = page.url();
  const baseUrl = new URL(pageUrl).origin;
  const currentPath = new URL(pageUrl).pathname;

  logger.info(`링크 추출 중... 기준 URL: ${pageUrl}, 허용 도메인: ${allowedDomains.join(', ')}`);

  // 페이지 내 모든 링크 추출 (절대 경로와 상대 경로 모두)
  const links = await page.evaluate((baseUrl, currentPath) => {
    // 상대 경로를 절대 경로로 변환하는 함수
     function resolveUrl(base, relative) {
      try {
        // 이미 절대 URL인 경우
        if (relative.startsWith('http://') || relative.startsWith('https://')) {
          return relative;
        }

        // 빈 링크, 자바스크립트 링크, 앵커 링크, 메일 링크 건너뛰기
        if (!relative || relative === '#' ||
          relative.startsWith('javascript:') ||
          relative.startsWith('mailto:') ||
          relative.startsWith('tel:')) {
          return null;
        }

        // 루트 경로인 경우
        if (relative.startsWith('/')) {
          return new URL(relative, base).href;
        }

        // 프로토콜 상대 URL인 경우
        if (relative.startsWith('//')) {
          return new URL(`https:${relative}`).href;
        }

        // 상대 경로인 경우
        // 현재 경로의 마지막 부분 제거 (파일명이나 마지막 디렉토리)
        const pathParts = currentPath.split('/');
        // 파일 확장자가 있거나 마지막 요소가 비어있지 않은 경우 마지막 부분 제거
        if (pathParts[pathParts.length - 1].includes('.') || pathParts[pathParts.length - 1] !== '') {
          pathParts.pop();
        }
        let basePath = pathParts.join('/');
        if (!basePath.endsWith('/')) {
          basePath += '/';
        }

        return new URL(basePath + relative, base).href;
      } catch (e) {
        logger.warn(`URL 변환 실패: ${relative}`, e);
        return null;
      }
    }

    // 모든 앵커 요소 찾기
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const extractedUrls = [];

    anchors.forEach(anchor => {
      const href = anchor.getAttribute('href');
      // href 속성이 있는지 확인
      if (href) {
        const resolvedUrl = resolveUrl(baseUrl, href);
        if (resolvedUrl) {
          extractedUrls.push(resolvedUrl);
        }
      }
    });

    return extractedUrls;
  }, baseUrl, currentPath);

  // 중복 제거
  const uniqueLinks = [...new Set(links.filter(Boolean))];

  // 허용된 도메인 필터링
  const allowedLinks = uniqueLinks.filter(url => {
    try {
      return isUrlAllowed(url, allowedDomains);
    } catch (e) {
    logger.warn(`URL 필터링 실패: ${url}`, e);
      return false;
    }
  });
  return allowedLinks;
}

  /**
 * 다음에 방문할 URL 가져오기
 * @param {string} [strategy='sequential'] 도메인 탐색 전략 ('specific', 'random', 'sequential')
 * @param {string} [specificDomain=null] 'specific' 전략일 때 사용할 특정 도메인
 * @returns {Promise<{url: string, domain: string}|null>} 다음 URL 또는 없으면 null
 */
async getNextUrl() {
  // 클래스 멤버 변수로 도메인 인덱스 추적 (생성자에 추가 필요)
  if (!this.currentDomainIndex) {
    this.currentDomainIndex = 0;
  }

  // 허용된 도메인 목록 가져오기
  if (!this.availableDomains) {
    logger.info('사용 가능한 도메인 목록 가져오는 중...');
    this.availableDomains = await db.getDomains();
  }

  if (!this.availableDomains || this.availableDomains.length === 0) {
    return null;
  }

  // 도메인 선택 전략에 따라 처리
  let targetDomain;

  switch (this.strategy) {
    case 'specific':
      // 특정 도메인만 탐색
      if (!this.specificDomain) {
        logger.warn('specific 전략에 도메인이 지정되지 않았습니다. 기본 도메인을 사용합니다.');
        targetDomain = this.baseDomain;
      } else {
        targetDomain = specificDomain;
      }
      break;

    case 'random':
      // 랜덤 도메인 탐색
      const randomIndex = Math.floor(Math.random() * this.availableDomains.length);
      targetDomain = this.availableDomains[randomIndex].domain;
      logger.info(`랜덤 도메인 선택: ${targetDomain} (인덱스: ${randomIndex}/${this.availableDomains.length})`);
      break;

    case 'sequential':
    default:
      // 순차적 도메인 탐색
      targetDomain = this.availableDomains[this.currentDomainIndex].domain;
      logger.info(`순차적 도메인 선택: ${targetDomain} (인덱스: ${this.currentDomainIndex}/${this.availableDomains.length})`);

      // 다음 도메인으로 인덱스 이동
      this.currentDomainIndex = (this.currentDomainIndex + 1) % this.availableDomains.length;
      break;
  }

  // 선택된 도메인에서 방문하지 않은 URL 찾기
  try {
    const urls = await db.getUnvisitedUrls(targetDomain, 1);

    if (urls && urls.length > 0) {
      logger.info(`도메인 ${targetDomain}에서 방문할 URL을 찾았습니다: ${urls[0]}`);
      this._recursionCount = 0;
      return { url: urls[0], domain: targetDomain };
    } else {
      logger.warn(`도메인 ${targetDomain}에 방문하지 않은 URL이 없습니다.`);

      // 특정 도메인 전략일 때는 null 반환
      if (this.strategy === 'specific') {
        logger.warn('특정 도메인에 더 이상 방문할 URL이 없습니다.');
        return null;
      }

      // 다른 전략일 경우 재귀적으로 다시 시도
      // 무한 재귀를 방지하기 위해 호출 횟수를 제한
      if (!this._recursionCount) this._recursionCount = 0;
      this._recursionCount++;

      if (this._recursionCount > this.availableDomains.length) {
        logger.warn('모든 도메인에 방문할 URL이 없습니다.');
        this._recursionCount = 0;
        return null;
      }

      this.currentDomainIndex = (this.currentDomainIndex + 1) % this.availableDomains.length;
      return this.getNextUrl();
    }
  } catch (error) {
    logger.error(`도메인 ${targetDomain}에서 URL 가져오기 실패:`, error);

    // 오류 발생 시 다른 도메인 시도
    if (strategy !== 'specific') {
      logger.warn('다른 도메인에서 URL 가져오기 시도...');
      if (!this._errorCount) this._errorCount = 0;
      this._errorCount++;

      if (this._errorCount > 3) {
        logger.error('너무 많은 오류가 발생했습니다.');
        this._errorCount = 0;
        return null;
      }

      return null;
    }

    return null;
  }
}

  killChromeProcesses() {
    try {
      const { execSync } = require('child_process');

      logger.warn('남은 Chrome 프로세스 정리 중...');

      // OS별로 다른 명령어 실행
      if (process.platform === 'darwin') {
        // macOS
        execSync('pkill -f "Google Chrome for Testing"');
        logger.warn('Google Chrome for Testing 프로세스가 정리되었습니다.');

        // 일반 Chrome 프로세스도 확인 (필요한 경우)
        // execSync('pkill -f "Google Chrome Helper"');
      } else if (process.platform === 'linux') {
        // Linux
        execSync('pkill -f "chrome-for-testing"');
        execSync('pkill -f "chrome-test"');
      } else if (process.platform === 'win32') {
        // Windows
        execSync('taskkill /F /IM "chrome.exe" /FI "WINDOWTITLE eq *Chrome for Testing*"');
      }
    } catch (error) {
      // 이미 죽어있거나 다른 이유로 실패할 수 있음 - 무시
      logger.warn('Chrome 프로세스 종료 완료 또는 종료할 프로세스가 없음');
    }
  }

 /**
 * 단일 URL 방문 및 처리
 * @param {Object} urlInfo - 방문할 URL 정보
 * @param {string} urlInfo.url - 방문할 URL
 * @param {string} urlInfo.domain - 도메인
 * @returns {Promise<Object>} 방문 결과 객체
 */
async visitUrl(urlInfo) {
  const { url, domain } = urlInfo;
  logger.info(`=== URL 방문 시작: ${url} ===`);
  const visitResult = new VisitResult({
    url,
    domain
  });

  try {
    // 브라우저가 초기화되어 있는지 확인
    const browser = await this.initBrowser();

    // 새 페이지 열기
    const page = await browser.newPage();

    // 자바스크립트 대화상자 처리
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });

    // 페이지 로드
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.BROWSER.TIMEOUT.PAGE_LOAD
    });

    // 현재 URL 가져오기 (리다이렉트 가능성)
     visitResult.finalUrl = page.url();
    // 최종 URL의 도메인 확인
    visitResult.finalDomain = extractDomain( visitResult.finalUrl);

    try {
        // 페이지 내용 추출
        visitResult.pageContent = await this.extractPageContent(page);
    } catch (error) {
     logger.error('Error extracting page content:', error.message);
      visitResult.errors.push({
        type: 'content_extraction',
        message: error.message,
        stack: error.stack
    });
    }

    try {
        // 기본 링크 추출 (a 태그)
        visitResult.herfUrls = await this.extractLinks(page, [domain]);
    } catch (error) {
       logger.error('Error extracting links:', error.message);
        visitResult.errors.push({
        type: 'link_extraction',
        message: error.message,
        stack: error.stack
    });
    }

    try {
        // extractAndExecuteScripts 함수를 사용하여 자바스크립트 실행 및 추가 URL 추출
        visitResult.onclickUrls = await extractAndExecuteScripts(visitResult.finalUrl, [domain], this.browser);
    } catch (error) {
       logger.error('Error extracting and executing scripts:', error.message);
        visitResult.errors.push({
        type: 'script_extraction',
        message: error.message,
        stack: error.stack,
        url: visitResult.finalUrl
    });
    }
    visitResult.success = true;
    // 모든 발견된 URL 병합
     visitResult.crawledUrls = Array.from(new Set([
      ...visitResult.herfUrls,
      ...visitResult.onclickUrls
    ]));
    // URL 정보를 도메인별로 그룹화
    visitResult.logSummary(logger);
    return visitResult;
  } catch (error) {
     logger.error(`URL ${url} 방문 중 오류:`, error);
    // 오류 정보를 결과 객체에 추가
    visitResult.error = error.toString();
    // 결과 로깅
    visitResult.logSummary(logger);

    return visitResult;
  }
  finally {
    try {
      if (this.browser) {
        const pages = await this.browser.pages();
        if (pages.length > 0) {
          logger.info(`방문 후 ${pages.length}개의 미닫힘 페이지 발견, 정리 중...`);
          await Promise.all(pages.map(page => {
            try {
              return page.close();
            } catch (e) {
              logger.info('페이지 닫기 실패:', e.message);
              return Promise.resolve();
            }
          }));
          logger.info('모든 페이지가 정리되었습니다.');
        }
      }
    } catch (pageCloseError) {
      logger.error('페이지 정리 중 오류:', pageCloseError);
    }

  }
}

/**
 * 발견된 URL들을 도메인별로 그룹화
 * @param {Array<string>} urls - URL 목록
 * @returns {Object} 도메인별 URL 객체 목록
 */
groupUrlsByDomain(urls) {
  const domainGroups = {};

  urls.forEach(url => {
    try {
      if (isUrlAllowed(url)) {
        const urlDomain = extractDomain(url);
        if (!domainGroups[urlDomain]) {
          domainGroups[urlDomain] = [];
        }
        domainGroups[urlDomain].push({
          url: url,
          visited: false
        });
      }
    } catch (e) {
      logger.warn(`URL 그룹화 실패: ${url}`, e);
    }
  });

  return domainGroups;
}

/**
 * 방문 결과를 데이터베이스에 저장
 * @param {Object} visitResult - visitUrl 함수의 반환 결과
 * @returns {Promise<boolean>} 성공 여부
 */
async saveVisitResult(visitResult) {
  try {
    const domain = visitResult.domain;

    // 추가 전 도메인의 하위 URL 개수 확인
    const beforeStats = await db.getDomainStats(domain);
    logger.info(`도메인 ${domain}의 현재 URL 개수: ${beforeStats.total}개 (방문: ${beforeStats.visited}개, 대기: ${beforeStats.pending}개)`);

    // 추가할 URL 수 로깅
    const urlsToAdd = visitResult.crawledUrls || [];
    logger.info(`도메인 ${domain}에 추가할 새 URL: ${urlsToAdd.length}개`);

    // 각 도메인 그룹별로 URL 추가
    const addResult = await db.bulkAddSubUrls(domain, urlsToAdd);

    // 방문 결과 저장
    await db.addVisitedResult(visitResult);

    // 추가 후 도메인의 하위 URL 개수 확인
    const afterStats = await db.getDomainStats(domain);

    // 실제로 추가된 URL 수 계산
    const actuallyAdded = afterStats.total - beforeStats.total;

    // 테이블 형식으로 통계 출력
    const statsTable = {
      '도메인': domain,
      '총 URL 수': {
        '이전': beforeStats.total,
        '이후': afterStats.total,
        '증가': actuallyAdded
      },
      '방문한 URL 수': {
        '이전': beforeStats.visited,
        '이후': afterStats.visited,
        '증가': afterStats.visited - beforeStats.visited
      },
      '대기 중인 URL 수': {
        '이전': beforeStats.pending,
        '이후': afterStats.pending,
        '증가': afterStats.pending - beforeStats.pending
      },
      '추가 시도한 URL 수': urlsToAdd.length,
      '실제 추가된 URL 수': actuallyAdded
    };

    // 콘솔에 테이블 형식으로 출력
    console.table(statsTable);

    // 추가 정보 로그
    logger.info(`URL 처리 완료: ${visitResult.url}`);
    logger.info(`성공 여부: ${visitResult.success ? '성공' : '실패'}`);

    if (urlsToAdd.length > 0 && actuallyAdded === 0) {
      logger.info('모든 URL이 이미 데이터베이스에 존재합니다.');
    }

    return true;
  } catch (error) {
    logger.error(`방문 결과 저장 중 오류:`, error);
    return false;
  }
}
  /**
   * 큐에 있는 모든 URL을 방문
   */
  async processQueue() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // MongoDB 연결 확인
      await db.connect();

      // 브라우저 초기화


      // 방문 URL 카운터
      let visitCount = 0;

      // URL을 하나씩 가져와 처리
      let nextUrlInfo;
      while (visitCount < this.maxUrls &&(nextUrlInfo = await this.getNextUrl())) {
        try {
          visitCount++;
           await this.initBrowser();
          logger.info(`URL ${visitCount}/${this.maxUrls} 처리 중...`);
          this.currentUrl = nextUrlInfo;
                // URL 방문 및 처리
          const visitResult = await this.visitUrl(nextUrlInfo);

          // 결과를 데이터베이스에 저장
          await this.saveVisitResult(visitResult);


          // 전체 통계 출력
          let totalStats = { total: 0, visited: 0, pending: 0 };
          const stats = await db.getDomainStats(nextUrlInfo.domain);
          totalStats.total += stats.total;
          totalStats.visited += stats.visited;
          totalStats.pending += stats.pending;

          // 요청 사이 지연 추가
          if (totalStats.pending > 0 && visitCount < this.maxUrls) {
            logger.info(`다음 URL 처리 전 ${this.delayBetweenRequests}ms 대기...`);
            await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
          }
        }
        catch(error) {
            logger.error(`총 ${visitCount}개 URL 방문  중 ${error}`);
        } finally {
            await this.closeBrowser();
        }
      }

      logger.info(`큐 처리 완료. 총 ${visitCount}개 URL 방문`);
    } catch (error) {
      logger.error('큐 처리 중 오류:', error);
    } finally {
        await this.closeBrowser();
    }
    return;
  }

  /**
   * 브라우저 종료
   */
async closeBrowser() {
  if (this.browser) {
    logger.info('브라우저 정리 중...');
    try {
      // 모든 페이지 닫기 시도
      const pages = await this.browser.pages();
      await Promise.all(pages.map(page => {
        try { return page.close(); }
        catch (e) { return Promise.resolve(); }
      }));

      // 브라우저 닫기
      await this.browser.close();
      this.browser = null;
      logger.info('브라우저가 정상적으로 종료되었습니다.');
    } catch (err) {
      logger.error('브라우저 종료 중 오류:', err);
    } finally {
      // Google Chrome for Testing 프로세스 강제 종료
      this.killChromeProcesses();
    }
  }
}

  /**
   * 관리자 실행
   */
  async run() {
    logger.info(`BaseWorkerManager 실행`);
    try {
      await this.processQueue();
    } finally {
      await this.closeBrowser();
      // MongoDB 연결 종료
      await db.disconnect();
    }
    logger.info('BaseWorkerManager 실행 완료');
  }
}


// 이 파일이 직접 실행될 때만 아래 코드 실행
if (require.main === module) {
  // 관리자 인스턴스 생성
  const manager = new BaseWorkerManager({
    delayBetweenRequests: CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS,
    headless: CONFIG.BROWSER.HEADLESS,
    maxUrls: CONFIG.CRAWLER.MAX_URLS
  });

  // 관리자 실행
  manager.run().then(async () => {
    logger.info('===== 크롤링 요약 =====');

    // 전체 통계 계산
    let totalStats = { total: 0, visited: 0, pending: 0 };
    for (const domain of manager.availableDomains) {
      const stats = await db.getDomainStats(domain);
      totalStats.total += stats.total;
      totalStats.visited += stats.visited;
      totalStats.pending += stats.pending;
    }

    logger.info(`- 총 URL: ${totalStats.total}개`);
    logger.info(`- 방문한 URL: ${totalStats.visited}개`);
    logger.info(`- 남은 방문 예정 URL: ${totalStats.pending}개`);
    logger.info(`- 저장된 결과 항목 수: ${manager.results.length}개`);
    logger.info('모든 작업이 완료되었습니다.');
  }).catch(error => {
    logger.error(`실행 중 오류가 발생했습니다: ${error}`);
  });
}
module.exports = { BaseWorkerManager };