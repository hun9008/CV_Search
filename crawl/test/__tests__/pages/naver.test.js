const puppeteer = require('puppeteer');
const { BaseWorkerManager } = require('@crawl/baseWorkerManager');
const { extractAndExecuteScripts } = require('@crawl/baseWorker');
const { SubUrl } = require('@models/visitResult');
const { defaultLogger: logger } = require('@src/utils/logger');

// 테스트 타임아웃 설정 (필요에 따라 조정)
jest.setTimeout(60000);

describe('네이버 채용 페이지 크롤링 테스트', () => {
  let browser;
  let manager;
  let page;

  beforeAll(async () => {
    // 테스트용 브라우저 및 매니저 초기화
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    manager = new BaseWorkerManager({
      browser,
      headless: 'new',
      startUrl: 'https://recruit.navercorp.com/rcrt/list.do',
      delayBetweenRequests: 1000, // 테스트에서는 딜레이 줄임
      maxUrls: 1
    });
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  beforeEach(async () => {
    // 각 테스트마다 새 페이지 생성
    page = await browser.newPage();

    // 자바스크립트 대화상자 자동 처리
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
  });

  afterEach(async () => {
    if (page) await page.close();
  });

  test('기본 페이지 정보 추출 테스트', async () => {
    // 페이지 로드
    await page.goto('https://recruit.navercorp.com/rcrt/list.do', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 페이지 내용 추출
    const pageContent = await manager.extractPageContent(page);

    // 검증
    expect(pageContent).toBeDefined();
    expect(pageContent.title).toBeDefined();
    expect(pageContent.title.toLowerCase()).toContain('naver');
    expect(pageContent.text).toBeDefined();
    expect(pageContent.text.length).toBeGreaterThan(100); // 충분한 텍스트가 있어야 함

    // 주요 키워드 확인
    expect(pageContent.text.toLowerCase()).toContain('채용');

    // 결과 로깅
    logger.info(`제목: ${pageContent.title}`);
    logger.info(`텍스트 길이: ${pageContent.text.length}자`);
    logger.info(`텍스트 샘플: ${pageContent.text.substring(0, 200)}...`);
  });

  test('링크 추출 테스트', async () => {
    // 페이지 로드
    await page.goto('https://recruit.navercorp.com/rcrt/list.do', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // href 링크 추출
    const links = await manager.extractLinks(page, ['navercorp.com']);

    // 검증
    expect(links).toBeDefined();
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);

    // 모든 링크가 navercorp.com 도메인인지 확인
    links.forEach(link => {
      expect(link).toContain('navercorp.com');
    });

    // 결과 로깅
    logger.info(`추출된 링크 수: ${links.length}`);
    logger.info(`링크 샘플: ${links.slice(0, 5).join('\n')}`);
  });

  test('onclick 스크립트 추출 테스트', async () => {
    // extractAndExecuteScripts 함수를 직접 테스트
    const url = 'https://recruit.navercorp.com/rcrt/list.do';
    const domain = ['navercorp.com'];

    const onclickUrls = await extractAndExecuteScripts(url, domain, browser);

    // 검증
    expect(onclickUrls).toBeDefined();
    expect(Array.isArray(onclickUrls)).toBe(true);

    // onclick URL이 발견되어야 함
    expect(onclickUrls.length).toBeGreaterThan(0);

    // 결과 로깅
    logger.info(`추출된 onclick URL 수: ${onclickUrls.length}`);
    if (onclickUrls.length > 0) {
      logger.info(`onclick URL 샘플: ${onclickUrls.slice(0, 5).join('\n')}`);
    }
  });

  test('전체 방문 프로세스 테스트', async () => {
    // 샘플 URL 정보 생성
    const urlInfo = {
      url: 'https://recruit.navercorp.com/rcrt/list.do',
      domain: 'navercorp.com'
    };

    // visitUrl 메서드 호출
    const result = await manager.visitUrl(urlInfo);

    // 결과가 SubUrl 인스턴스인지 확인
    expect(result).toBeInstanceOf(SubUrl);

    // 기본 필드 검증
    expect(result.url).toBe(urlInfo.url);
    expect(result.domain).toBe(urlInfo.domain);
    expect(result.visited).toBe(true);
    expect(result.success).toBe(true);

    // 내용 검증
    expect(result.title).toBeDefined();
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(100);

    // 링크 추출 검증
    expect(result.herfUrls).toBeDefined();
    expect(Array.isArray(result.herfUrls)).toBe(true);
    expect(result.herfUrls.length).toBeGreaterThan(0);

    // onclick URL 추출 검증
    expect(result.onclickUrls).toBeDefined();
    expect(Array.isArray(result.onclickUrls)).toBe(true);
    expect(result.onclickUrls.length).toBeGreaterThan(0);

    // 병합된 URL 검증
    expect(result.crawledUrls).toBeDefined();
    expect(Array.isArray(result.crawledUrls)).toBe(true);
    expect(result.crawledUrls.length).toBeGreaterThanOrEqual(
      result.herfUrls.length + result.onclickUrls.length -
      // 중복 URL이 있을 수 있으므로 배열 길이 합계와 정확히 같지 않을 수 있음
      Math.min(result.herfUrls.length, result.onclickUrls.length)
    );

    // 결과 로깅
    logger.info(`방문 결과 성공 여부: ${result.success}`);
    logger.info(`제목: ${result.title}`);
    logger.info(`텍스트 길이: ${result.text.length}자`);
    logger.info(`추출된 href URL 수: ${result.herfUrls.length}`);
    logger.info(`추출된 onclick URL 수: ${result.onclickUrls.length}`);
    logger.info(`총 추출된 URL 수: ${result.crawledUrls.length}`);

    // onclick URL 샘플 출력
    if (result.onclickUrls.length > 0) {
      logger.info(`onclick URL 샘플:`);
      result.onclickUrls.slice(0, 3).forEach((url, i) => {
        logger.info(`${i+1}. ${url}`);
      });
    }
  });
});