const { BaseWorkerManager } = require('../../src/crawl/baseWorkerManager');

// BaseWorkerManager를 직접 import할 수 없으므로 모킹
jest.mock('../../src/database/mongodb-service', () => {
  return {
    MongoDBService: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn().mockResolvedValue(),
        disconnect: jest.fn().mockResolvedValue(),
        getDomains: jest.fn().mockResolvedValue([]),
        getUnvisitedUrls: jest.fn().mockResolvedValue([]),
        markUrlVisited: jest.fn().mockResolvedValue(),
        bulkAddSubUrls: jest.fn().mockResolvedValue(),
        getDomainStats: jest.fn().mockResolvedValue({ total: 0, visited: 0, pending: 0 }),
      };
    })
  };
});

// 필요한 다른 모듈 모킹
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    close: jest.fn().mockResolvedValue(),
    newPage: jest.fn().mockResolvedValue({
      goto: jest.fn().mockResolvedValue(),
      evaluate: jest.fn().mockResolvedValue({}),
      on: jest.fn(),
      url: jest.fn().mockReturnValue('https://example.com'),
      close: jest.fn().mockResolvedValue(),
    }),
  }),
}));

jest.mock('../../src/crawl/baseWorker', () => ({
  infiniteScroll: jest.fn().mockResolvedValue(),
  extractAndExecuteScripts: jest.fn().mockResolvedValue({
    success: true,
    discoveredUrls: [],
  }),
}));

jest.mock('../../src/crawl/config', () => ({
  initialize: jest.fn(),
  PATHS: {
    RESULT_FILES: {
      MAIN_RESULT: 'test-results.json',
    },
  },
  DOMAINS: {
    ALLOWED: ['example.com', 'test.com'],
    DEFAULT_URL: 'https://example.com',
  },
  CRAWLER: {
    DELAY_BETWEEN_REQUESTS: 1000,
    MAX_URLS: 10,
    MAX_SCROLLS: 3,
    STRATEGY: 'sequential',
  },
  BROWSER: {
    HEADLESS: true,
    LAUNCH_ARGS: ['--no-sandbox'],
    TIMEOUT: {
      PAGE_LOAD: 30000,
    },
  },
}));

describe('BaseWorkerManager - extractDomain', () => {
  let manager;

  beforeEach(() => {
    manager = new BaseWorkerManager({
      startUrl: 'https://example.com',
      baseDomain: 'example.com',
    });
  });

  test('URL에서 도메인 추출' ,async  () => {
    const urls = [
      'https://example.com',
      'http://example.com/path',
      'https://subdomain.example.com/path?query=1',
      'https://www.example.co.uk/path',
      'https://test.com:8080/path',
    ];

    const expectedDomains = [
      'example.com',
      'example.com',
      'subdomain.example.com',
      'www.example.co.uk',
      'test.com',
    ];

    urls.forEach((url, index) => {
      const domain = manager.extractDomain(url);
      expect(domain).toBe(expectedDomains[index]);
    });
  });

  test('잘못된 URL 형식 처리', () => {
    const invalidUrls = [
      'invalid-url',
      'ftp://example.com',
      '//example.com',
      'example.com',
    ];

    // 모든 잘못된 URL에 대해 함수가 오류를 던지지 않고 기본값을 반환하는지 확인
    invalidUrls.forEach(url => {
      expect(() => manager.extractDomain(url)).not.toThrow();
    });
  });
});