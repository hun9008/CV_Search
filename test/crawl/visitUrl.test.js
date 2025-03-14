const { BaseWorkerManager } = require('../../src/crawl/baseWorkerManager');
const { MongoDBService } = require('../../src/database/mongodb-service');
const { infiniteScroll, extractAndExecuteScripts } = require('../../src/crawl/baseWorker');

// 모킹 설정
jest.mock('../../src/database/mongodb-service');
jest.mock('puppeteer');
jest.mock('../../src/crawl/baseWorker');
jest.mock('../../src/crawl/config');

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

    // 외부 모듈 모킹
    infiniteScroll.mockResolvedValue();
    extractAndExecuteScripts.mockResolvedValue({
      success: true,
      discoveredUrls: ['https://example.com/page3']
    });
  });

  test('URL 방문 및 처리', async () => {
    const url = 'https://example.com/test-page';
    const domain = 'example.com';

    await manager.visitUrl(url, domain);

    // 브라우저 초기화 확인
    expect(manager.initBrowser).toHaveBeenCalled();

    // 새 페이지 생성 확인
    expect(mockBrowser.newPage).toHaveBeenCalled();

    // 페이지 이동 확인
    expect(mockPage.goto).toHaveBeenCalledWith(url, expect.any(Object));

    // 무한 스크롤 확인
    expect(infiniteScroll).toHaveBeenCalled();

    // 콘텐츠 추출 확인
    expect(manager.extractPageContent).toHaveBeenCalled();

    // 링크 추출 확인
    expect(manager.extractLinks).toHaveBeenCalled();

    // 스크립트 실행 및 URL 추출 확인
    expect(extractAndExecuteScripts).toHaveBeenCalled();

    // URL 방문 완료 표시 확인
    expect(global.db.markUrlVisited).toHaveBeenCalledWith(
      domain,
      url,
      expect.any(String)
    );

    // 결과 배열에 추가 확인
    expect(manager.results.length).toBe(1);
    expect(manager.results[0]).toHaveProperty('url');
    expect(manager.results[0]).toHaveProperty('domain');
    expect(manager.results[0]).toHaveProperty('title');
    expect(manager.results[0]).toHaveProperty('text');

    // 페이지 닫기 확인
    expect(mockPage.close).toHaveBeenCalled();
  });

  test('URL 방문 중 오류 처리', async () => {
    const url = 'https://example.com/error-page';
    const domain = 'example.com';

    // 오류 시뮬레이션
    mockPage.goto.mockRejectedValue(new Error('페이지 로딩 실패'));

    await manager.visitUrl(url, domain);

    // 오류가 있어도 URL을 방문 완료로 표시
    expect(global.db.markUrlVisited).toHaveBeenCalledWith(
      domain,
      url,
      expect.stringContaining('오류')
    );

    // 결과 배열에 오류 정보가 추가되었는지 확인
    expect(manager.results.length).toBe(1);
    expect(manager.results[0]).toHaveProperty('error');
  });
});