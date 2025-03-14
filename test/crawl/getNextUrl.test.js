const { BaseWorkerManager } = require('../../src/crawl/baseWorkerManager');

jest.mock('puppeteer');
jest.mock('../../src/crawl/baseWorker');
jest.mock('../../src/crawl/config');
jest.mock('../../src/database/mongodb-service');

describe('BaseWorkerManager - getNextUrl', () => {
  let manager;

  beforeEach(() => {
    // db 전역 객체 모킹
    global.db = {
      getDomains: jest.fn().mockResolvedValue([
        { domain: 'example.com', url: 'https://example.com' },
        { domain: 'test.com', url: 'https://test.com' },
        { domain: 'another.com', url: 'https://another.com' }
      ]),
      getUnvisitedUrls: jest.fn()
        .mockImplementation((domain, limit) => {
          if (domain === 'example.com') return Promise.resolve(['https://example.com/page1']);
          if (domain === 'test.com') return Promise.resolve(['https://test.com/page1']);
          return Promise.resolve([]);
        }),
    };

    manager = new BaseWorkerManager();
  });

  test('순차적 전략으로 다음 URL 가져오기', async () => {
    // 순차적 전략 설정
    manager.strategy = 'sequential';
    manager.currentDomainIndex = 0;

    const nextUrl = await manager.getNextUrl();

    // 도메인 목록을 가져왔는지 확인
    expect(global.db.getDomains).toHaveBeenCalled();

    // 방문하지 않은 URL을 가져왔는지 확인
    expect(global.db.getUnvisitedUrls).toHaveBeenCalledWith('example.com', 1);

    // 반환된 URL 정보 확인
    expect(nextUrl).toHaveProperty('url', 'https://example.com/page1');
    expect(nextUrl).toHaveProperty('domain', 'example.com');

    // 인덱스가 증가했는지 확인
    expect(manager.currentDomainIndex).toBe(1);
  });

  test('랜덤 전략으로 다음 URL 가져오기', async () => {
    // 랜덤 전략 설정
    manager.strategy = 'random';

    // Math.random 모킹하여 항상 첫 번째 도메인 선택
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0);

    const nextUrl = await manager.getNextUrl();

    // 방문하지 않은 URL을 가져왔는지 확인
    expect(global.db.getUnvisitedUrls).toHaveBeenCalled();

    // 반환된 URL 정보 확인
    expect(nextUrl).toHaveProperty('url');
    expect(nextUrl).toHaveProperty('domain');

    // Math.random 복원
    Math.random = originalRandom;
  });

  test('특정 도메인 전략으로 다음 URL 가져오기', async () => {
    // 특정 도메인 전략 설정
    manager.strategy = 'specific';
    manager.baseDomain = 'test.com';

    const nextUrl = await manager.getNextUrl();

    // 특정 도메인의 방문하지 않은 URL을 가져왔는지 확인
    expect(global.db.getUnvisitedUrls).toHaveBeenCalledWith('test.com', 1);

    // 반환된 URL 정보 확인
    expect(nextUrl).toHaveProperty('url', 'https://test.com/page1');
    expect(nextUrl).toHaveProperty('domain', 'test.com');
  });

  test('방문할 URL이 없는 경우', async () => {
    // 모든 도메인에 방문하지 않은 URL이 없도록 모킹
    global.db.getUnvisitedUrls = jest.fn().mockResolvedValue([]);

    // 순차적 전략으로 설정하되 중단을 위해 재귀 횟수 제한 설정
    manager.strategy = 'sequential';
    manager._recursionCount = manager.availableDomains?.length || 3;

    const nextUrl = await manager.getNextUrl();

    // null이 반환되어야 함
    expect(nextUrl).toBeNull();
  });
});