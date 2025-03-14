const { BaseWorkerManager } = require('@crawl/baseWorkerManager');

// 모킹 설정
jest.mock('@database/mongodb-service');
jest.mock('puppeteer');
jest.mock('@crawl/baseWorker');
jest.mock('@config/config');

describe('BaseWorkerManager - isUrlAllowed', () => {
  let manager;

  beforeEach(() => {
    manager = new BaseWorkerManager({
      startUrl: 'https://example.com',
      baseDomain: 'example.com',
    });

    // extractDomain 함수 모킹
    manager.extractDomain = jest.fn(url => {
      try {
        return new URL(url).hostname;
      } catch (error) {
        return 'invalid-domain';
      }
    });
  });

  test('허용된 도메인 확인', () => {
    const allowedDomains = ['example.com', 'test.com'];

    // 허용되어야 하는 URL들
    const allowedUrls = [
      'https://example.com',
      'https://www.example.com',
      'https://sub.test.com/path',
      'http://test.com/page?query=1',
    ];

    allowedUrls.forEach(url => {
      expect(manager.isUrlAllowed(url, allowedDomains)).toBe(true);
    });
  });

  test('허용되지 않은 도메인 확인', () => {
    const allowedDomains = ['example.com', 'test.com'];

    // 허용되지 않아야 하는 URL들
    const disallowedUrls = [
      'https://example.org',
      'https://test.org',
      'https://another-domain.com',
      'https://subdomain.another-domain.com',
    ];

    disallowedUrls.forEach(url => {
      expect(manager.isUrlAllowed(url, allowedDomains)).toBe(false);
    });
  });

  test('잘못된 URL 처리', () => {
    const allowedDomains = ['example.com'];

    // 잘못된 형식의 URL
    const invalidUrls = [
      'invalid-url',
      'example.com', // 프로토콜이 없어 유효하지 않음
      'ftp://example.com', // 지원되지 않는 프로토콜
    ];

    invalidUrls.forEach(url => {
      expect(manager.isUrlAllowed(url, allowedDomains)).toBe(false);
    });
  });
});