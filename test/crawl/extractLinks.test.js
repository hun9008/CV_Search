const { BaseWorkerManager } = require('../../src/crawl/baseWorkerManager');

// 모킹 설정
jest.mock('../../src/database/mongodb-service');
jest.mock('puppeteer');
jest.mock('../../src/crawl/baseWorker');
jest.mock('../../src/crawl/config');

describe('BaseWorkerManager - extractLinks', () => {
  let manager;
  let mockPage;

  beforeEach(() => {
    manager = new BaseWorkerManager();
    // 모의 페이지 객체
    mockPage = {
      url: jest.fn().mockReturnValue('https://example.com/page'),
      evaluate: jest.fn().mockImplementation((fn, baseUrl, currentPath) => {
        // 테스트 URL 목록 반환
        return [
          'https://example.com/page1',
          'https://example.com/page2',
          'https://test.com/page1',
          'https://other-domain.com/page',
          'https://subdomain.example.com/page',
          null, // 잘못된 URL 처리 테스트
        ].filter(Boolean); // null 값 제거
      }),
    };
  });

  test('페이지에서 링크 추출', async () => {
    const allowedDomains = ['example.com', 'test.com'];
    const result = await manager.extractLinks(mockPage, allowedDomains);

    // 페이지의 URL이 호출되었는지 확인
    expect(mockPage.url).toHaveBeenCalled();

    // evaluate 함수가 호출되었는지 확인
    expect(mockPage.evaluate).toHaveBeenCalled();

    // 허용된 URL만 결과에 포함되어야 함
    expect(result).toContain('https://example.com/page1');
    expect(result).toContain('https://example.com/page2');
    expect(result).toContain('https://test.com/page1');
    expect(result).toContain('https://subdomain.example.com/page');
    expect(result).not.toContain('https://other-domain.com/page');
  });

  test('도메인 필터링', async () => {
    // example.com 도메인만 허용
    const allowedDomains = ['example.com'];
    const result = await manager.extractLinks(mockPage, allowedDomains);

    // example.com 도메인의 URL만 포함되어야 함
    expect(result.every(url => url.includes('example.com'))).toBe(true);
    expect(result.some(url => url.includes('test.com'))).toBe(false);
    expect(result.some(url => url.includes('other-domain.com'))).toBe(false);
  });
});