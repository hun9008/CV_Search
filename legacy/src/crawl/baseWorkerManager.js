require('module-alias/register');
// const puppeteer = require('puppeteer');
const chromium = require('chrome-aws-lambda');
const mongoose = require('mongoose');
const {extractAndExecuteScripts , extractAndExecuteScriptsPromise } = require('@crawl/baseWorker');
const { isUrlAllowed, extractDomain ,isUrlAllowedWithRobots, parseRobotsTxt} = require('@crawl/urlManager');
const CONFIG = require('@config/config');
const { defaultLogger: logger } = require('@utils/logger');
const { VisitResult, SubUrl } = require('@models/visitResult');


const MONGODB_URI = process.env.MONGODB_ADMIN_URI;
logger.debug(MONGODB_URI);
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
    this.startUrl = options.startUrl || CONFIG.CRAWLER.START_URL;
    this.delayBetweenRequests = options.delayBetweenRequests || CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS;
    this.headless = options.headless !== undefined ? options.headless : CONFIG.BROWSER.HEADLESS;
    this.maxUrls =CONFIG.CRAWLER.MAX_URLS;
    this.strategy = options.strategy || CONFIG.CRAWLER.STRATEGY;
    this.currentUrl;
    if (this.strategy == "specific") {
      this.specificDomain = options.specificDomain || CONFIG.CRAWLER.BASE_DOMAIN;
    }

    // 실행 상태
    this.isRunning = false;
    // 브라우저 인스턴스
    this.browser = null;
    // 몽구스 연결 상태
    this.isConnected = false;
  }

  /**
   * MongoDB 연결
   */
  async connect() {
    if (this.isConnected) return;
    logger.debug("Try mongodb connect");
    try {
      const startTime = Date.now();
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName :'crwal_db',
      });
      this.isConnected = true;
      const runtime = Date.now() - startTime;
      logger.eventInfo('db_connect',{runtime});
    } catch (error) {
      logger.error('db_connect', error);
      throw error;
    }
  }

  /**
   * MongoDB 연결 종료
   */
  async disconnect() {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.eventInfo('DB연결 종료','DB연결 종료 성공');
    } catch (error) {
      logger.eventerror('DB연결 종료', error );
    }
  }
/**
 * 브라우저 초기화
 */
async initBrowser() {
  if (!this.browser) {
    logger.debug(`BaseWorkerManager 초기화 완료.`);
    this.browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      headless: 'new',
      ignoreHTTPSErrors: true,
      defaultViewport: null,
      ignoreDefaultArgs: ['--enable-automation'],
      args: CONFIG.BROWSER.LAUNCH_ARGS,
      defaultViewport: { width: 1920, height: 1080 },
      timeout: 10_000, // 10 seconds
      protocolTimeout: 20_000, // 20 seconds
    });

    // 브라우저 PID 저장
    this.browserPID = this.browser.process() ? this.browser.process().pid : null;
    if (this.browserPID) {
      logger.debug(`브라우저 프로세스 ID: ${this.browserPID}`);
    }

    // 프로세스 종료 신호 처리
    const processExit = async () => {
      logger.debug('프로세스 종료 감지, 브라우저 정리 중...');

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
          logger.debug('브라우저가 안전하게 종료되었습니다.');
        }
      } catch (err) {
        logger.debug('브라우저 종료 중 오류:', err);
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
   * 에러 발생 시 페이지 스크린샷을 저장하는 함수
   * @param {Page} page - Puppeteer 페이지 객체
   * @param {string} url - 스크린샷을 찍을 URL
   * @param {Object} visitResult - 방문 결과 객체 (스크린샷 경로를 저장할 객체)
   * @returns {Promise<string|null>} 저장된 스크린샷 경로 또는 실패 시 null
   */
  async saveErrorScreenshot(page, url) {
    if (!page) {
      logger.debug('페이지 객체가 없어 스크린샷을 저장할 수 없습니다.');
      return null;
    }

    try {
      // 스크린샷 저장 경로 생성
      const fs = require('fs').promises;
      const path = require('path');
      const screenshotsDir = path.join(CONFIG.PATHS.ERROR_SCREENSHOTS_DIR);

      // 디렉토리가 없으면 생성
      await fs.mkdir(screenshotsDir, { recursive: true });

      // 파일명에 사용할 수 있는 URL 문자열 생성 (잘못된 문자 제거)
      const sanitizedUrl = url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 100); // URL이 너무 길지 않도록 제한

      // 타임스탬프 추가
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const fileName = `${sanitizedUrl}_${timestamp}.png`;
      const filePath = path.join(screenshotsDir, fileName);

      // 스크린샷 저장
      await page.screenshot({
        path: filePath,
        fullPage: true // 전체 페이지 캡처
      });

      logger.debug(`에러 스크린샷 저장됨: ${filePath}`);


      return filePath;
    } catch (screenshotError) {
      logger.error('스크린샷 저장 중 오류:', screenshotError);
      return null;
    }
  }
  /**
   * 페이지의 내용을 추출
   * @param {Page} page Puppeteer 페이지 객체
   * @returns {Promise<Object>} 페이지 내용 객체
   */
  async extractPageContent(page) {
    const startTime = Date.now();

    const result = await page.evaluate(() => {
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

    const runtime = Date.now() - startTime;
    logger.eventInfo('extract_page_content', { runtime });

    return result;
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

  logger.debug(`링크 추출 중... 기준 URL: ${pageUrl}, 허용 도메인: ${allowedDomains.join(', ')}`);

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
        if (!relative || relative.startsWith('#') ||
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
        logger.debug(`URL 변환 실패: ${relative}`, e);
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
    logger.debug(`URL 필터링 실패: ${url}`, e);
      return false;
    }
  });
  return allowedLinks;
}

 /**
 * 다음에 방문할 URL 가져오기
 * @returns {Promise<{url: string, domain: string}|null>} 다음 URL 또는 없으면 null
 */
async getNextUrl() {
  const startTime = Date.now();
  let result = null;

  try {
    // MongoDB가 연결되어 있는지 확인
    if (!this.isConnected) {
      await this.connect();
    }

    // 도메인 목록 초기화
    if (!this.availableDomains) {
      await this.initAvailableDomains();
    }

    // 인덱스 초기화
    if (!this.currentDomainIndex) {
      this.currentDomainIndex = 0;
    }

    // robots.txt 캐시 초기화
    if (!this.robotsCache) {
      this.robotsCache = {};
    }

    // 도메인 선택
    const targetDomain = this.selectTargetDomain();

    // robots.txt 파싱 (없는 경우에만)
    if (!this.robotsCache[targetDomain]) {
      this.robotsCache[targetDomain] = await parseRobotsTxt(targetDomain);
    }

    // 도메인에서 URL 가져오기
    result = await this.getUrlForDomain(targetDomain);

    const runtime = Date.now() - startTime;
    logger.eventInfo('get_next_url', {
      url: result ? result.url : 'none',
      domain: targetDomain,
      runtime
    });

    return result;
  } catch (error) {
    const runtime = Date.now() - startTime;
    logger.error(`URL 가져오기 중 오류:`, error);
    logger.eventInfo('get_next_url', {
      url: 'error',
      error: error.message,
      runtime
    });
    return null;
  }
}

/**
 * 도메인 목록 초기화
 * @private
 */
async initAvailableDomains() {
  try {
    const findStartTime = Date.now();
    // 데이터베이스에서 모든 도메인 문서 가져오기
    const domains = await VisitResult.find({}, { domain: 1, _id: 0 }).lean();
    const findRuntime = Date.now() - findStartTime;
    logger.eventInfo('find_domain', { runtime: findRuntime });

    if (domains && domains.length > 0) {
      // 중복 없는 도메인 목록 생성
      this.availableDomains = domains.map(doc => ({ domain: doc.domain }));
      logger.debug(`${this.availableDomains.length}개의 도메인을 불러왔습니다.`);

      // 도메인 목록 로깅 (최대 5개)
      if (this.availableDomains.length > 0) {
        const domainSample = this.availableDomains.slice(0, 5).map(d => d.domain);
        logger.debug(`도메인 샘플: ${domainSample.join(', ')}${this.availableDomains.length > 5 ? ` 외 ${this.availableDomains.length - 5}개` : ''}`);
      }
    } else {
      // 도메인이 없는 경우 시작 URL 도메인으로 초기화
      const startDomain = extractDomain(this.startUrl);
      this.availableDomains = [{ domain: startDomain }];
      logger.debug(`도메인이 없어 시작 도메인 ${startDomain}으로 초기화합니다.`);
    }
  } catch (error) {
    logger.debug('도메인 목록 로드 중 오류:', error);
    // 오류 시 기본 시작 URL의 도메인 사용
    const startDomain = extractDomain(this.startUrl);
    this.availableDomains = [{ domain: startDomain }];
    logger.debug(`오류로 인해 시작 도메인 ${startDomain}으로 초기화합니다.`);
  }
}

/**
 * 전략에 따라 타겟 도메인 선택
 * @private
 */
selectTargetDomain() {
  let targetDomain;

  switch (this.strategy) {
    case 'specific':
      // 특정 도메인만 탐색
      targetDomain = this.specificDomain || this.baseDomain || extractDomain(this.startUrl);
      break;

    case 'random':
      // 랜덤 도메인 탐색
      const randomIndex = Math.floor(Math.random() * this.availableDomains.length);
      targetDomain = this.availableDomains[randomIndex].domain;
      logger.debug(`랜덤 도메인 선택: ${targetDomain} (인덱스: ${randomIndex}/${this.availableDomains.length})`);
      break;

    case 'sequential':
    default:
      // 순차적 도메인 탐색
      targetDomain = this.availableDomains[this.currentDomainIndex].domain;
      logger.debug(`순차적 도메인 선택: ${targetDomain} (인덱스: ${this.currentDomainIndex}/${this.availableDomains.length})`);

      // 다음 도메인으로 인덱스 이동
      this.currentDomainIndex = (this.currentDomainIndex + 1) % this.availableDomains.length;
      break;
  }

  return targetDomain;
}

/**
 * 특정 도메인에서 URL 가져오기
 * @private
 */
async getUrlForDomain(targetDomain) {
  try {
    // 도메인 문서 가져오기
    const findStartTime = Date.now();
    const domainDoc = await VisitResult.findOne({ domain: targetDomain });
    const findRuntime = Date.now() - findStartTime;
    logger.eventInfo('find_domain_document', { domain: targetDomain, runtime: findRuntime });

    // 도메인 문서나 URL 목록이 없는 경우 처리
    if (!domainDoc || !domainDoc.suburl_list) {
      return null;
    }

    // 방문하지 않은 URL 필터링
    const filterStartTime = Date.now();
    const allowedUnvisitedUrls = await this.filterAllowedUrls(domainDoc.suburl_list, targetDomain);
    const filterRuntime = Date.now() - filterStartTime;
    logger.eventInfo('filter_urls', {
      domain: targetDomain,
      total: domainDoc.suburl_list.length,
      filtered: allowedUnvisitedUrls.length,
      runtime: filterRuntime
    });

    // 방문할 URL이 있는 경우
    if (allowedUnvisitedUrls.length > 0) {
      const unvisitedUrl = allowedUnvisitedUrls[0];
      logger.debug(`도메인 ${targetDomain}에서 방문할 URL을 찾았습니다: ${unvisitedUrl.url}`);
      this._recursionCount = 0;
      return { url: unvisitedUrl.url, domain: targetDomain };
    }
    // 방문할 URL이 없는 경우
    else {
      logger.debug(`도메인 ${targetDomain}에 방문 가능한 URL이 없습니다.`);
      return null;
    }
  } catch (error) {
    logger.error(`도메인 ${targetDomain}에서 URL 가져오기 실패:`, error);
    return null;
  }
}


/**
 * URL 목록에서 방문 가능한 URL 필터링
 * @private
 */
async filterAllowedUrls(urls, targetDomain) {
  const results = [];
  const batchSize = 10; // 병렬 처리 배치 크기

  // 방문하지 않은 URL만 선별
  const unvisitedUrls = urls.filter(item => !item.visited);
  logger.debug(`도메인 ${targetDomain}에서 방문하지 않은 URL ${unvisitedUrls.length}개 발견`);

  // 빈 URL 리스트인 경우 조기 반환
  if (unvisitedUrls.length === 0) {
    return results;
  }

  // 효율성을 위해 배치 처리
  for (let i = 0; i < unvisitedUrls.length; i += batchSize) {
    const batch = unvisitedUrls.slice(i, i + batchSize);
    const batchPromises = batch.map(item =>
      isUrlAllowedWithRobots(item.url, [targetDomain], this.robotsCache)
        .then(isAllowed => isAllowed ? item : null)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(item => item !== null));

    // 충분한 URL을 찾으면 조기 반환 (최적화)
    if (results.length >= 5) {
      logger.debug(`허용된 URL을 충분히 찾았습니다. 나머지 URL 필터링 생략.`);
      break;
    }
  }

  return results;
}

/**
 * 다음 도메인 시도 (재귀 제한)
 * @private
 */
async tryNextDomain() {
  if (!this._recursionCount) this._recursionCount = 0;
  this._recursionCount++;

  if (this._recursionCount > this.availableDomains.length) {
    logger.debug('모든 도메인에 방문할 URL이 없습니다.');
    this._recursionCount = 0;
    return null;
  }

  logger.debug(`다른 도메인 시도 중... (${this._recursionCount}/${this.availableDomains.length})`);
  return this.getNextUrl();
}

/**
 * 도메인 에러 처리 (에러 제한)
 * @private
 */
async handleDomainError() {
  logger.debug('다른 도메인에서 URL 가져오기 시도...');

  if (!this._errorCount) this._errorCount = 0;
  this._errorCount++;

  if (this._errorCount > 3) {
    logger.debug('너무 많은 오류가 발생했습니다.');
    this._errorCount = 0;
    return null;
  }

  return this.getNextUrl();
}

  killChromeProcesses() {
    try {
      const { execSync } = require('child_process');

      logger.debug('남은 Chrome 프로세스 정리 중...');

      // OS별로 다른 명령어 실행
      if (process.platform === 'darwin') {
        // macOS
        execSync('pkill -f "Google Chrome for Testing"');
        logger.debug('Google Chrome for Testing 프로세스가 정리되었습니다.');

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
      logger.debug('Chrome 프로세스 종료 완료 또는 종료할 프로세스가 없음');
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
  logger.debug(`=== URL 방문 시작: ${url} ===`);
  const startTime = Date.now();

  let subUrlResult = new SubUrl({
    url: url,
    domain: domain,
    visited: true,
    visitedAt: new Date(),
  });

  let page;
  try {
    // 브라우저가 초기화되어 있는지 확인
    const browser = await this.initBrowser();

    // 새 페이지 열기
    page = await browser.newPage();

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
    subUrlResult.finalUrl = page.url();
    // 최종 URL의 도메인 확인
    subUrlResult.finalDomain = extractDomain(subUrlResult.finalUrl);

    try {
      // 페이지 내용 추출
      subUrlResult.pageContent = await this.extractPageContent(page);
      subUrlResult.title = subUrlResult.pageContent.title;
      subUrlResult.text = subUrlResult.pageContent.text;
    } catch (error) {
      logger.error('Error extracting page content:', error.message);
      subUrlResult.errors.push({
        type: 'content_extraction',
        message: error.message,
        stack: error.stack
      });
    }

    try {
      // 기본 링크 추출 (a 태그)
      const extractStartTime = Date.now();
      subUrlResult.herfUrls = await this.extractLinks(page, [domain]);
      const extractRuntime = Date.now() - extractStartTime;
      logger.eventInfo('extract_herf', { url, runtime: extractRuntime });
    } catch (error) {
      logger.error('Error extracting links:', error.message);
      subUrlResult.errors.push({
        type: 'link_extraction',
        message: error.message,
        stack: error.stack
      });
    }

    try {
      // extractAndExecuteScripts 함수를 사용하여 자바스크립트 실행 및 추가 URL 추출
      const extractOnclickStartTime = Date.now();
      subUrlResult.onclickUrls = await extractAndExecuteScripts(subUrlResult.finalUrl, [domain], this.browser);
      const extractOnclickRuntime = Date.now() - extractOnclickStartTime;
      logger.eventInfo('extract_onclick', { url, runtime: extractOnclickRuntime });
    } catch (error) {
      logger.error('Error extracting and executing scripts:', error.message);
      subUrlResult.errors.push({
        type: 'script_extraction',
        message: error.message,
        stack: error.stack,
        url: subUrlResult.finalUrl
      });
    }

    subUrlResult.success = true;
    // 모든 발견된 URL 병합
    subUrlResult.crawledUrls = Array.from(new Set([
      ...subUrlResult.herfUrls,
      ...subUrlResult.onclickUrls
    ]));

    // robots.txt 규칙에 따라 차단된 URL 필터링
    if (this.robotsCache && this.robotsCache[domain] && this.robotsCache[domain].parser) {
      const robotsParser = this.robotsCache[domain].parser;
      const filteredUrls = [];
      const blockedUrls = [];

      // 각 URL이 robots.txt에 의해 허용되는지 확인
      for (const url of subUrlResult.crawledUrls) {
        try {
          const isAllowed = robotsParser.isAllowed(url, 'puppeteer');
          if (isAllowed) {
            filteredUrls.push(url);
          } else {
            blockedUrls.push(url);
          }
        } catch (error) {
          logger.warn(`robots.txt 규칙 적용 중 오류 (${url}):`, error.message);
          // 오류 발생 시 URL 포함 (보수적 접근)
          filteredUrls.push(url);
        }
      }

      // 필터링 결과 로깅
      if (blockedUrls.length > 0) {
        logger.debug(`robots.txt에 의해 차단된 URL ${blockedUrls.length}개 제외됨`);
        if (blockedUrls.length <= 5) {
          logger.debug(`차단된 URL: ${blockedUrls.join(', ')}`);
        } else {
          logger.debug(`차단된 URL 샘플: ${blockedUrls.slice(0, 5).join(', ')} 외 ${blockedUrls.length - 5}개`);
        }
      }

      // 필터링된 URL로 업데이트
      subUrlResult.crawledUrls = filteredUrls;

      // 통계 정보에 robots.txt 필터링 정보 추가
      subUrlResult.crawlStats.blocked_by_robots = blockedUrls.length;
      subUrlResult.crawlStats.allowed_after_robots = filteredUrls.length;
    }

    // 통계 정보 업데이트
    subUrlResult.crawlStats = {
      ...subUrlResult.crawlStats,
      total: subUrlResult.crawledUrls.length,
      href: subUrlResult.herfUrls.length,
      onclick: subUrlResult.onclickUrls.length
    };

    const runtime = Date.now() - startTime;
    logger.eventInfo('visit_url', { runtime });

    return subUrlResult;
  } catch (error) {
    // 오류 정보를 결과 객체에 추가
    subUrlResult.success = false;
    subUrlResult.error = error.toString();
    subUrlResult.errors.push(error.toString());

    const runtime = Date.now() - startTime;
    logger.eventError('visit_url', { runtime, error: error.message });

    // 클래스 메서드로 호출
    await this.saveErrorScreenshot(page, url);

    return subUrlResult;
  }
  finally {
    try {
      if (this.browser) {
        const pages = await this.browser.pages();
        if (pages.length > 0) {
          logger.debug(`방문 후 ${pages.length}개의 미닫힘 페이지 발견, 정리 중...`);
          await Promise.all(pages.map(page => {
            try {
              return page.close();
            } catch (e) {
              logger.debug('페이지 닫기 실패:', e.message);
              return Promise.resolve();
            }
          }));
          logger.debug('모든 페이지가 정리되었습니다.');
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
      logger.debug(`URL 그룹화 실패: ${url}`, e);
    }
  });

  return domainGroups;
}

/**
 * 방문 결과를 데이터베이스에 저장하고 발견된 URL 처리
 * @param {Object|SubUrl} subUrlResult - visitUrl 함수의 반환 결과
 * @returns {Promise<boolean>} 성공 여부
 */
async saveVisitResult(subUrlResult) {
  const startTime = Date.now();

  try {
    if (!this.isConnected) {
      await this.connect();
    }

    const domain = subUrlResult.domain;
    const url = subUrlResult.url;

    logger.debug(`도메인 ${domain}의 URL ${url} 방문 결과 저장 중...`);

    // 도메인 문서 찾기 (없으면 생성)
    let domainDoc = await VisitResult.findOne({ domain });

    if (!domainDoc) {
      domainDoc = new VisitResult({
        domain,
        suburl_list: [],
      });
      logger.debug(`도메인 ${domain}에 대한 새 문서 생성`);
    }

    // suburl_list 배열이 없으면 초기화
    if (!domainDoc.suburl_list) {
      domainDoc.suburl_list = [];
    }

    // 해당 URL 찾기
    let existingUrlIndex = domainDoc.suburl_list.findIndex(item => item.url === url);

    if (existingUrlIndex >= 0) {
      domainDoc.suburl_list[existingUrlIndex] = subUrlResult.toObject();
      logger.debug(`기존 URL ${url} 정보 업데이트 (SubUrl 모델 사용)`);
    } else {
      domainDoc.suburl_list.push(subUrlResult.toObject());
      logger.debug(`새 URL ${url} 정보 추가 (SubUrl 모델 사용)`);
    }

    // 방금 저장한 URL 항목에 대한 요약 정보 표시
    const savedUrlEntry = domainDoc.suburl_list.find(item => item.url === url);
    if (savedUrlEntry) {
      // SubUrl 모델의 인스턴스 생성하여 logSummary 호출
      const subUrl = new SubUrl(savedUrlEntry);
      // subUrl.logSummary(logger);
    }

    logger.debug(`도메인 ${domain} 문서 저장 완료`);

    // 발견된 URL을 데이터베이스에 추가
    const urlsToAdd = subUrlResult.crawledUrls || [];
    // 각 URL 처리
    for (const newUrl of urlsToAdd) {
      try {
        // suburl_list 배열에 이미 URL이 있는지 확인
        const urlExists = domainDoc.suburl_list.some(item => item.url === newUrl);
        if (!urlExists) {
          // 새 URL을 suburl_list에 추가 - SubUrl 모델 사용
          const newSubUrl = new SubUrl({
            url: newUrl,
            domain: domain,
            visited: false,
            discoveredAt: new Date(),
            created_at: new Date()
          });
          logger.debug(`추가 url ${newUrl} 추가 완료`);
          // toObject()로 변환하여 추가
          domainDoc.suburl_list.push(newSubUrl.toObject());
        }
      } catch (urlError) {
        logger.error(`URL 추가 중 오류 (${newUrl}):`, urlError);
      }
    }

    // 도메인 문서 저장
    domainDoc.updated_at = new Date();
    await domainDoc.save();

    const runtime = Date.now() - startTime;
    logger.eventInfo('save_visit_result', { runtime });

    return true;
  } catch (error) {
    logger.error(`방문 결과 저장 중 오류:`, error);

    const runtime = Date.now() - startTime;
    logger.eventInfo('save_visit_result', { runtime, error: error.message });

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
      // MongoDB 연결
      await this.connect();

      // 방문 URL 카운터
      let visitCount = 0;

      // URL을 하나씩 가져와 처리

      while (visitCount < this.maxUrls) {
        try {
          let nextUrlInfo = await this.getNextUrl()
          if (!nextUrlInfo) {
            continue;
          }
          visitCount++;
          await this.initBrowser();
          logger.debug(`URL ${visitCount}/${this.maxUrls} 처리 중...`);
          this.currentUrl = nextUrlInfo;

          // URL 방문 및 처리
          const visitResult = await this.visitUrl(nextUrlInfo);

          // 결과를 데이터베이스에 저장
          await this.saveVisitResult(visitResult);

          // 요청 사이 지연 추가
          if (visitCount < this.maxUrls) {
            logger.debug(`다음 URL 처리 전 ${this.delayBetweenRequests}ms 대기...`);
            await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
          }
        } catch (error) {
          logger.eventError(`URL 처리 중 오류:`, {error: error.message  });
        } finally {
          await this.closeBrowser();
        }
      }

      logger.debug(`큐 처리 완료. 총 ${visitCount}개 URL 방문`);
    } catch (error) {
      logger.error('큐 처리 중 오류:', error);
    } finally {
      await this.closeBrowser();
      this.isRunning = false;
    }
    return;
  }
  /**
   * 브라우저 종료
   */
async closeBrowser() {
  if (this.browser) {
    logger.debug('브라우저 정리 중...');
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
      logger.debug('브라우저가 정상적으로 종료되었습니다.');
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
   */async run() {
    logger.debug(`BaseWorkerManager 실행`);
    try {
      await this.processQueue();
    } finally {
      await this.closeBrowser();

    }
    logger.debug('BaseWorkerManager 실행 완료');
  }
}


// 이 파일이 직접 실행될 때만 아래 코드 실행
if (require.main === module) {
  // 관리자 인스턴스 생성
  const manager = new BaseWorkerManager({
    delayBetweenRequests: CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS,
    headless: CONFIG.BROWSER.HEADLESS,
    maxUrls: CONFIG.CRAWLER.MAX_URLS,
    strategy: process.argv[2],
    specificDomain : process.argv[3],
    startUrl : process.argv[4],
  });

  // 관리자 실행
  manager.run().then(async () => {
    logger.debug('===== 크롤링 요약 =====');

    // 전체 통계 계산 (Mongoose 모델 사용)
    const totalUrls = await VisitResult.countDocuments();
    const visitedUrls = await VisitResult.countDocuments({ visited: true });
    const pendingUrls = await VisitResult.countDocuments({ visited: false });

    logger.debug(`- 총 URL: ${totalUrls}개`);
    logger.debug(`- 방문한 URL: ${visitedUrls}개`);
    logger.debug(`- 남은 방문 예정 URL: ${pendingUrls}개`);
    logger.debug('모든 작업이 완료되었습니다.');
    // MongoDB 연결 종료
  }).catch(error => {
    logger.error(`실행 중 오류가 발생했습니다: ${error}`);
  });
}

module.exports = { BaseWorkerManager };