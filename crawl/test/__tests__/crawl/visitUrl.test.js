const { BaseWorkerManager } = require('@crawl/baseWorkerManager');
const { MongoDBService } = require('@database/mongodb-service');
const { infiniteScroll, extractAndExecuteScripts } = require('@crawl/baseWorker');

// 모킹 설정
jest.mock('@database/mongodb-service');
jest.mock('puppeteer');
jest.mock('@crawl/baseWorker');
jest.mock('@config/config');

describe('BaseWorkerManager - visitUrl', () => {
  let manager;
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    // db 전역 객체 모킹
    global.db = {
      markUrlVisited: jest.fn().mockResolvedValue(),
      bulkAddSubUrls: jest.fn().mockResolvedValue(),
      getDomainStats: jest.fn().mockResolvedValue({
        total: 10,
        visited: 5,
        pending: 5
      })
    };

    // 모의 페이지 객체
    mockPage = {
      goto: jest.fn().mockResolvedValue(),
      url: jest.fn().mockReturnValue('https://example.com/test-page'),
      on: jest.fn(),
      evaluate: jest.fn().mockResolvedValue({
        title: '테스트 페이지',
        meta: { description: '테스트 설명' },
        text: '테스트 내용'
      }),
      close: jest.fn().mockResolvedValue()
    };

    // 모의 브라우저 객체
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue()
    };

    // BaseWorkerManager 인스턴스 생성
    manager = new BaseWorkerManager();
    manager.browser = mockBrowser;

    // 필요한 메서드 모킹
    manager.initBrowser = jest.fn().mockResolvedValue(mockBrowser);
    manager.extractDomain = jest.fn().mockReturnValue('example.com');
    manager.extractPageContent = jest.fn().mockResolvedValue({
      title: '테스트 페이지',
      meta: { description: '테스트 설명' },
      text: '테스트 내용'
    });
    manager.extractLinks = jest.fn().mockResolvedValue([
      'https://example.com/page1',
      'https://example.com/page2'
    ]);
    manager.isUrlAllowed = jest.fn().mockReturnValue(true);
    manager.groupUrlsByDomain = jest.fn().mockReturnValue({
      'example.com': [
        { url: 'https://example.com/page1', visited: false },
        { url: 'https://example.com/page2', visited: false }
      ]
    });

    // 외부 모듈 모킹
    infiniteScroll.mockResolvedValue();
    extractAndExecuteScripts.mockResolvedValue({
      success: true,
      discoveredUrls: ['https://example.com/page3']
    });
  });

  test('URL 방문 및 처리 성공', async () => {
    const urlInfo = {
      url: 'https://example.com/test-page',
      domain: 'example.com'
    };

    // visitUrl 함수 호출
    const result = await manager.visitUrl(urlInfo);

    // 브라우저 초기화 확인
    expect(manager.initBrowser).toHaveBeenCalled();

    // 새 페이지 생성 확인
    expect(mockBrowser.newPage).toHaveBeenCalled();

    // 페이지 이동 확인
    expect(mockPage.goto).toHaveBeenCalledWith(urlInfo.url, expect.any(Object));

    // 무한 스크롤 확인
    expect(infiniteScroll).toHaveBeenCalled();

    // 콘텐츠 추출 확인
    expect(manager.extractPageContent).toHaveBeenCalled();

    // 링크 추출 확인
    expect(manager.extractLinks).toHaveBeenCalled();

    // 스크립트 실행 및 URL 추출 확인
    expect(extractAndExecuteScripts).toHaveBeenCalled();

    // 페이지 닫기 확인
    expect(mockPage.close).toHaveBeenCalled();

    // 결과 객체가 올바른지 확인
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('url', urlInfo.url);
    expect(result).toHaveProperty('domain', urlInfo.domain);
    expect(result).toHaveProperty('finalUrl');
    expect(result).toHaveProperty('finalDomain');
    expect(result).toHaveProperty('pageContent');
    expect(result).toHaveProperty('crawledUrls');
    expect(result).toHaveProperty('urlsByDomain');
    expect(result).toHaveProperty('visitedAt');

    // URL 그룹화 확인
    expect(result.crawledUrls.length).toBeGreaterThan(0);
    expect(Object.keys(result.urlsByDomain).length).toBeGreaterThan(0);
  });

  test('URL 방문 중 오류 처리', async () => {
    const urlInfo = {
      url: 'https://example.com/error-page',
      domain: 'example.com'
    };

    // 오류 시뮬레이션
    mockPage.goto.mockRejectedValue(new Error('페이지 로딩 실패'));

    // visitUrl 함수 호출
    const result = await manager.visitUrl(urlInfo);

    // 결과 객체가 오류 정보를 포함하는지 확인
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('url', urlInfo.url);
    expect(result).toHaveProperty('domain', urlInfo.domain);
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('visitedAt');
    expect(result.error).toContain('페이지 로딩 실패');
  });

  test('persistVisitResult - 성공 케이스', async () => {
    const visitResult = {
      success: true,
      url: 'https://example.com/test-page',
      finalUrl: 'https://example.com/test-page-redirected',
      domain: 'example.com',
      finalDomain: 'example.com',
      pageContent: {
        title: '테스트 페이지',
        meta: { description: '테스트 설명' },
        text: '테스트 내용'
      },
      crawledUrls: [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3'
      ],
      urlsByDomain: {
        'example.com': [
          { url: 'https://example.com/page1', visited: false },
          { url: 'https://example.com/page2', visited: false }
        ]
      },
      visitedAt: new Date().toISOString()
    };

    // persistVisitResult 함수 호출
    const success = await manager.persistVisitResult(visitResult);

    // 결과 확인
    expect(success).toBe(true);

    // URL 저장 확인
    expect(global.db.bulkAddSubUrls).toHaveBeenCalledWith(
      'example.com',
      expect.any(Array)
    );

    // URL 방문 완료 표시 확인 (원본 URL)
    expect(global.db.markUrlVisited).toHaveBeenCalledWith(
      visitResult.domain,
      visitResult.url,
      visitResult.pageContent.text
    );

    // URL 방문 완료 표시 확인 (리다이렉트된 URL)
    expect(global.db.markUrlVisited).toHaveBeenCalledWith(
      visitResult.finalDomain,
      visitResult.finalUrl,
      visitResult.pageContent.text
    );

    // 도메인 통계 확인
    expect(global.db.getDomainStats).toHaveBeenCalledWith(visitResult.domain);
  });

  test('persistVisitResult - 실패 케이스', async () => {
    const visitResult = {
      success: false,
      url: 'https://example.com/error-page',
      domain: 'example.com',
      error: '페이지 로딩 실패',
      visitedAt: new Date().toISOString()
    };

    // results 배열 초기화
    manager.results = [];

    // persistVisitResult 함수 호출
    const success = await manager.persistVisitResult(visitResult);

    // 결과 확인
    expect(success).toBe(false);

    // 오류가 있어도 URL을 방문 완료로 표시
    expect(global.db.markUrlVisited).toHaveBeenCalledWith(
      visitResult.domain,
      visitResult.url,
      expect.stringContaining('오류')
    );

    // 결과 배열에 오류 정보가 추가되었는지 확인
    expect(manager.results.length).toBe(1);
    expect(manager.results[0]).toHaveProperty('error');
    expect(manager.results[0].error).toBe(visitResult.error);
  });

  test('전체 워크플로우 테스트 (visitUrl + persistVisitResult)', async () => {
    const urlInfo = {
      url: 'https://example.com/workflow-test',
      domain: 'example.com'
    };

    // visitUrl 함수 호출
    const visitResult = await manager.visitUrl(urlInfo);
    expect(visitResult.success).toBe(true);

    // persistVisitResult 함수 호출
    const persistSuccess = await manager.persistVisitResult(visitResult);
    expect(persistSuccess).toBe(true);

    // URL이 처리되었는지 확인
    expect(global.db.markUrlVisited).toHaveBeenCalledWith(
      urlInfo.domain,
      urlInfo.url,
      expect.any(String)
    );

    // 발견된 URL이 저장되었는지 확인
    expect(global.db.bulkAddSubUrls).toHaveBeenCalled();
  });
});