const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// baseWorker에서 extractAndExecuteScripts 함수 가져오기
const { extractAndExecuteScripts } = require('./baseWorker');



/**
 * URL에서 기본 도메인을 추출하는 함수
 * @param {string} urlString URL 문자열
 * @returns {string} 기본 도메인
 */
function extractBaseDomain(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    return parsedUrl.hostname;
  } catch (error) {
    console.error(`URL 파싱 오류: ${urlString}`, error);
    return null;
  }
}

/**
 * URL이 특정 도메인에 속하는지 확인하는 함수
 * @param {string} urlString 확인할 URL
 * @param {string} baseDomain 기본 도메인
 * @returns {boolean} 속하면 true, 아니면 false
 */
function isUrlFromDomain(urlString, baseUrl) {
  if (!urlString || !baseUrl) return false;

  try {
    // 단순히 URL 문자열에 기본 URL 문자열이 포함되어 있는지 확인
    return urlString.includes(baseUrl);
  } catch (error) {
    console.error('URL 확인 중 오류:', error);
    return false;
  }
}



/**
 * total_url.json 파일에서 URL을 읽어오는 함수
 * @param {string} defaultUrl 파일이 없거나 읽기 오류 시 사용할 기본 URL
 * @returns {Array<string>} URL 배열
 */
function loadUrlsFromFile(defaultUrl) {
  try {
    // 파일 존재 여부 확인
    if (!fs.existsSync('total_url.json')) {
      console.log('total_url.json 파일이 존재하지 않습니다. 기본 URL을 사용합니다.');
      return [defaultUrl];
    }

    // 파일 읽기
    const data = fs.readFileSync('total_url.json', 'utf8');
    const urlData = JSON.parse(data);

    // urls 배열 확인
    if (!urlData || !Array.isArray(urlData.urls) || urlData.urls.length === 0) {
      console.log('total_url.json에 유효한 URL이 없습니다. 기본 URL을 사용합니다.');
      return [defaultUrl];
    }

    // 유효한 URL만 필터링
    const validUrls = urlData.urls.filter(url =>
      url && typeof url === 'string' && url.startsWith('http')
    );

    if (validUrls.length === 0) {
      console.log('total_url.json에 유효한 URL이 없습니다. 기본 URL을 사용합니다.');
      return [defaultUrl];
    }

    console.log(`total_url.json에서 ${validUrls.length}개의 유효한 URL을 로드했습니다.`);
    return validUrls;
  } catch (error) {
    console.error('total_url.json 파일 읽기 오류:', error);
    console.log('기본 URL을 사용합니다.');
    return [defaultUrl];
  }
}

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
   * @param {string} options.resultFile 결과 저장 파일 경로 (기본값: 'result.json')
   * @param {number} options.delayBetweenRequests 요청 사이 지연 시간(ms) (기본값: 2000)
   */
  constructor(options = {}) {
    this.startUrl = options.startUrl || 'https://recruit.navercorp.com/rcrt/list.do';
    this.maxUrls = options.maxUrls || 100;
    this.resultFile = options.resultFile || 'result.json';
    this.delayBetweenRequests = options.delayBetweenRequests || 500;
    this.baseDomain = 'https://recruit.navercorp.com';

    // URL 로드
    const initialUrls = options.loadFromFile !== false ?
      loadUrlsFromFile(this.startUrl) : [this.startUrl];

    // 첫 번째 URL을 기본 URL로 설정
    this.startUrl = initialUrls[0];

    // 기본 도메인 추출
    // this.baseDomain = extractBaseDomain(this.startUrl);
    // console.log(`기본 도메인: ${this.baseDomain} (${this.startUrl} 기준)`);

    // 방문할 URL 큐 (전체 URL 리스트로 초기화)
    this.urlQueue = [...initialUrls];

    // 방문한 URL 집합
    this.visitedUrls = new Set();

    // 결과 저장 배열
    this.results = [];

    // 초기 결과 파일 로드 (있는 경우)
    this.loadResults();

    // 실행 상태
    this.isRunning = false;

    console.log(`BaseWorkerManager 초기화 완료. 시작 URL: ${this.startUrl}, 최대 방문 URL: ${this.maxUrls}`);
  }

  /**
   * 기존 결과 파일이 있으면 로드
   */
  loadResults() {
    try {
      if (fs.existsSync(this.resultFile)) {
        const data = fs.readFileSync(this.resultFile, 'utf8');
        this.results = JSON.parse(data);

        // 이미 방문한 URL을 visitedUrls에 추가
        this.results.forEach(result => {
          if (result.url) {
            this.visitedUrls.add(result.url);
          }
        });

        console.log(`기존 결과 파일에서 ${this.results.length}개 항목과 ${this.visitedUrls.size}개 방문 URL 로드됨`);
      }
    } catch (error) {
      console.error('결과 파일 로드 중 오류:', error);
      this.results = [];
    }
  }

  /**
   * 결과를 JSON 파일에 저장
   */
  saveResults() {
    try {
      fs.writeFileSync(this.resultFile, JSON.stringify(this.results, null, 2));
      console.log(`결과가 ${this.resultFile}에 저장되었습니다. 총 ${this.results.length}개 항목`);
    } catch (error) {
      console.error('결과 저장 중 오류:', error);
    }
  }

  /**
   * URL을 큐에 추가 (이미 방문한 URL은 추가하지 않음)
   * @param {string|Array<string>} urls 추가할 URL 또는 URL 배열
   */
  addUrlToQueue(urls) {
    if (!urls) return 0;

    const urlArray = Array.isArray(urls) ? urls : [urls];
    let addedCount = 0;

    urlArray.forEach(url => {
      // 유효한 URL이며 아직 방문하지 않았고 큐에 없는 경우에만 추가
      if (url && typeof url === 'string' && url.startsWith('http') &&
          !this.visitedUrls.has(url) && !this.urlQueue.includes(url)) {
        this.urlQueue.push(url);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      console.log(`${addedCount}개의 새 URL이 큐에 추가됨. 현재 큐 크기: ${this.urlQueue.length}`);
    }

    return addedCount;
  }

  /**
   * 페이지의 내용을 추출
   * @param {Page} page Puppeteer 페이지 객체
   * @returns {Promise<Object>} 페이지 내용 객체
   */
  async extractPageContent(page) {
    const used = process.memoryUsage();
    return page.evaluate(() => {


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

      // 주요 텍스트 내용 추출
      const mainText = extractTextFromNode(document.body);
      return {
        title,
        meta,
        mainText
      };
    });
  }

  /**
   * 단일 URL 방문 및 처리
   * @param {string} url 방문할 URL
   */
  async visitUrl(url) {
    console.log(`=== URL 방문 시작: ${url} ===`);

    try {
      // URL이 이미 방문된 경우
      if (this.visitedUrls.has(url)) {
        console.log(`URL ${url}는 이미 방문했습니다. 건너뜁니다.`);
        return;
      }

      if (!isUrlFromDomain(url, this.baseDomain)) {
        console.log(`URL ${url}은(는) 기본 도메인(${this.baseDomain})에 속하지 않습니다. 건너뜁니다.`);
        return;
      }
      // URL을 방문했다고 표시
      this.visitedUrls.add(url);

      // 페이지 내용 추출을 위한 간단한 브라우저 세션
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      // 페이지 로드
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // 현재 URL 가져오기 (리다이렉트 가능성)
      const finalUrl = page.url();

      // 페이지 내용 추출
      const pageContent = await this.extractPageContent(page);

      // 페이지 정보 저장
      const pageInfo = {
        url: finalUrl,
        originalUrl: url !== finalUrl ? url : undefined,
        title: pageContent.title,
        meta: pageContent.meta,
        text: pageContent.mainText,
        visitedAt: new Date().toISOString()
      };

      // 결과 배열에 추가
      this.results.push(pageInfo);

      // 현재 결과 저장
      this.saveResults();

      // 브라우저 닫기
      await browser.close();

      // baseWorker 실행하여 스크립트/onclick 분석 및 새 URL 발견
      console.log(`${url} 페이지에 대해 스크립트/onclick 분석 실행...`);
      const workerResults = await extractAndExecuteScripts(url);

      if (workerResults && !workerResults.error) {
        // total_url.json 파일에서 발견된 URL 읽기
        try {
          const urlData = JSON.parse(fs.readFileSync('total_url.json', 'utf8'));
          if (urlData && Array.isArray(urlData.urls)) {
            console.log(`${urlData.urls.length}개의 URL을 total_url.json에서 발견했습니다.`);
            this.addUrlToQueue(urlData.urls);
          }
        } catch (error) {
          console.error('total_url.json 파일 읽기 오류:', error);
        }
      } else {
        console.log('스크립트/onclick 분석 중 오류 발생:', workerResults?.error || '알 수 없는 오류');
      }

      console.log(`=== URL 방문 완료: ${url} ===`);
    } catch (error) {
      console.error(`URL ${url} 방문 중 오류:`, error);

      // 오류 정보도 결과에 기록
      this.results.push({
        url: url,
        error: error.toString(),
        visitedAt: new Date().toISOString()
      });

      // 오류가 있어도 결과 저장
      this.saveResults();
    }
  }

  /**
   * 큐에 있는 모든 URL을 방문
   */
  async processQueue() {
    if (this.isRunning) {
      console.log('이미 실행 중입니다.');
      return;
    }

    this.isRunning = true;
    console.log('URL 큐 처리 시작...');

    try {
      // 최대 URL 수에 도달하거나 큐가 빌 때까지 계속 처리
      while (this.urlQueue.length > 0 && this.visitedUrls.size < this.maxUrls) {
        const url = this.urlQueue.shift();
        await this.visitUrl(url);

        // 요청 사이에 지연 추가
        if (this.urlQueue.length > 0) {
          console.log(`다음 URL 처리 전 ${this.delayBetweenRequests}ms 대기...`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
        }
      }

      console.log(`큐 처리 완료. 총 ${this.visitedUrls.size}개 URL 방문, 남은 큐 크기: ${this.urlQueue.length}`);

      if (this.visitedUrls.size >= this.maxUrls) {
        console.log(`최대 URL 수(${this.maxUrls})에 도달했습니다.`);
      }
    } catch (error) {
      console.error('큐 처리 중 오류:', error);
    } finally {
      this.isRunning = false;
    }
  }


  /**
   * total_url.json 파일 업데이트
   * 현재 큐에 있는 URL과 이미 방문한 URL을 포함
   */
  updateTotalUrls() {
    try {
      // 모든 URL 수집 (방문한 URL + 큐에 있는 URL)
      const allUrls = new Set([...this.visitedUrls, ...this.urlQueue]);

      const urlData = {
        baseUrl: this.startUrl,
        totalUrls: allUrls.size,
        visitedUrls: this.visitedUrls.size,
        queuedUrls: this.urlQueue.length,
        urls: Array.from(allUrls).sort()
      };

      fs.writeFileSync('total_url.json', JSON.stringify(urlData, null, 2));
      console.log(`total_url.json 파일이 업데이트되었습니다. (총 ${allUrls.size}개 URL)`);
    } catch (error) {
      console.error('total_url.json 파일 업데이트 중 오류:', error);
    }
  }
  /**
   * 관리자 실행
   */
  async run() {
    console.log('BaseWorkerManager 실행...');
    await this.processQueue();
    console.log('BaseWorkerManager 실행 완료');
  }
}

// 명령줄 인수에서 시작 URL 가져오기
const startUrl = process.argv[2] || 'https://recruit.navercorp.com/rcrt/list.do';

// 관리자 인스턴스 생성
const manager = new BaseWorkerManager({
  startUrl: startUrl,
  maxUrls: 200,  // 최대 50개 URL만 방문
  delayBetweenRequests: 1000  // 요청 사이 3초 대기
});

// 관리자 실행
manager.run().then(() => {
  manager.saveResults();
  manager.updateTotalUrls();

  console.log('===== 크롤링 요약 =====');
  console.log(`- 방문한 URL: ${manager.visitedUrls.size}개`);
  console.log(`- 남은 큐 크기: ${manager.urlQueue.length}개`);
  console.log(`- 결과 항목 수: ${manager.results.length}개`);
  console.log('모든 작업이 완료되었습니다.');
  process.exit(0);
}).catch(error => {
  console.error('실행 중 오류가 발생했습니다:', error);
  process.exit(1);
});