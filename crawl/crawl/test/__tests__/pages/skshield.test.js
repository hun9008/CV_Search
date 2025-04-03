
const puppeteer = require('puppeteer');
const { BaseWorkerManager } = require('@crawl/baseWorkerManager');
const { infiniteScroll, extractAndExecuteScripts } = require('@crawl/baseWorker');

describe('삼성 커리어 채용 페이지 크롤링 테스트', () => {
  let manager;
  let page;
  const targetUrl = 'https://www.skshieldusapply.com';
  const allowedDomains = ['skshieldusapply.com'];

  // 테스트 실행 시간 늘리기 (웹 크롤링은 시간이 소요될 수 있음)
  jest.setTimeout(60000);

  beforeAll(async () => {
    // 브라우저 시작
    // 새 페이지 생성
    manager = new BaseWorkerManager();
    await manager.initBrowser();
    manager.maxUrl = 1;
  });
  beforeEach(async () => {
    // 각 테스트 전에 새 페이지 생성
    page = await manager.browser.newPage();
  });

  afterEach(async () => {
    // 각 테스트 후에 페이지 닫기
    if (page) {
      await page.close().catch(err => console.warn('페이지 닫기 오류:', err));
      page = null;
    }
  });
  afterAll(async () => {
    // 테스트 후 브라우저 종료
    await manager.browser.close();
  });

  test('페이지 접속 및 기본 정보 확인', async () => {
    // 페이지 로드
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // 페이지 제목 확인
    const title = await page.title();
    console.log(`페이지 제목: ${title}`);
    expect(title).toContain('SK쉴더스 채용');

    // 현재 URL 확인
    const currentUrl = page.url();
    expect(currentUrl).toContain(allowedDomains[0]);
  });



  test('visitUrl 함수 테스트', async () => {
    // visitUrl 함수 호출
    const visitResult = await manager.visitUrl({
      url: targetUrl,
      domain: allowedDomains[0]
    });

    // 방문 성공 여부 확인
    expect(visitResult.success).toBe(true);

    // 방문 결과에 새 URL이 포함되어 있는지 확인 (최소 1개 이상)
    expect(visitResult.crawledUrls.length).toBeGreaterThanOrEqual(1);

    console.log(`발견된 URL 개수: ${visitResult.crawledUrls.length}`);

    // 발견된 URL 중 일부 출력 (디버깅용)
    if (visitResult.crawledUrls.length > 0) {
      console.log('발견된 URL 샘플:');
      visitResult.crawledUrls.slice(0, 5).forEach(url => console.log(` - ${url}`));
    }
  });

  test('extractLinks 함수 테스트', async () => {
    // 페이지 로드
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // 링크 추출
    const links = await manager.extractLinks(page, allowedDomains);

    // 추출된 링크가 있는지 확인
    expect(links.length).toBeGreaterThan(0);
    console.log(`추출된 링크 수: ${links.length}`);

    // 모든 링크가 허용된 도메인에 속하는지 확인
    const allLinksValid = links.every(link => {
      return link.includes(allowedDomains[0]);
    });
    expect(allLinksValid).toBe(true);

    // 추출된 링크 중 일부 출력
    console.log('추출된 링크 샘플:');
    links.slice(0, 5).forEach(link => {
      console.log(` - ${link}`);
    });
  });

  test('extractAndExecuteScripts 함수 테스트', async () => {
    // 스크립트 추출 및 실행
    const discoveredUrls = await extractAndExecuteScripts(targetUrl, allowedDomains,manager.browser);

    // 발견된 URL이 있는지 확인
    expect(discoveredUrls).toBeDefined();
    expect(Array.isArray(discoveredUrls)).toBe(true);
    expect(discoveredUrls.length).toBeGreaterThan(0);

    console.log(`extractAndExecuteScripts 결과 - 발견된 URL 개수: ${discoveredUrls.length}`);

    // URL에 문제가 없는지 확인
    discoveredUrls.forEach(url => {
      expect(typeof url).toBe('string');
      // URL 형식이 올바른지 확인 (에러 없이 생성됨)
      expect(() => new URL(url)).not.toThrow();
    });

    const allLinksValid = discoveredUrls.every(link => {
      return link.includes(allowedDomains[0]);
    });
    expect(allLinksValid).toBe(true);

    // 발견된 URL 중 일부 출력
    console.log('extractAndExecuteScripts 결과 URL 샘플:');
    discoveredUrls.slice(0, 5).forEach(url => {
      console.log(` - ${url}`);
    });
  });

});
