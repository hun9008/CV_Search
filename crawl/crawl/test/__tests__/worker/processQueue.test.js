const { BaseWorkerManager } = require('@crawl/baseWorkerManager');

// 모킹 설정
jest.mock('@database/mongodb-service');
jest.mock('puppeteer');
jest.mock('@crawl/baseWorker');
jest.mock('@config/config');

describe('BaseWorkerManager - processQueue', () => {
  let manager;

  beforeEach(() => {
    // db 전역 객체 모킹
    global.db = {
      connect: jest.fn().mockResolvedValue(),
      disconnect: jest.fn().mockResolvedValue(),
      getDomainStats: jest.fn().mockResolvedValue({
        total: 10,
        visited: 5,
        pending: 5
      })
    };

    // BaseWorkerManager 인스턴스 생성
    manager = new BaseWorkerManager();
    manager.maxUrls = 3;
    manager.delayBetweenRequests = 100;

    // 필요한 메서드 모킹
    manager.initBrowser = jest.fn().mockResolvedValue({});
    manager.getNextUrl = jest.fn()
      .mockResolvedValueOnce({ url: 'https://example.com/page1', domain: 'example.com' })
      .mockResolvedValueOnce({ url: 'https://example.com/page2', domain: 'example.com' })
      .mockResolvedValueOnce(null); // 3번째는 null 반환하여 루프 종료

    manager.visitUrl = jest.fn().mockResolvedValue();
  });

  test('큐 처리 - 정상 시나리오', async () => {
    await manager.processQueue();

    // MongoDB 연결 확인
    expect(global.db.connect).toHaveBeenCalled();

    // 브라우저 초기화 확인
    expect(manager.initBrowser).toHaveBeenCalled();

    // getNextUrl 호출 횟수 확인
    expect(manager.getNextUrl).toHaveBeenCalledTimes(3);

    // visitUrl 호출 확인
    expect(manager.visitUrl).toHaveBeenCalledTimes(2);
    expect(manager.visitUrl).toHaveBeenNthCalledWith(1, 'https://example.com/page1', 'example.com');
    expect(manager.visitUrl).toHaveBeenNthCalledWith(2, 'https://example.com/page2', 'example.com');

    // 실행 상태 확인
    expect(manager.isRunning).toBe(false);
  });

  test('이미 실행 중일 때 중복 실행 방지', async () => {
    manager.isRunning = true;

    await manager.processQueue();

    // isRunning이 true일 때 getNextUrl이 호출되지 않아야 함
    expect(manager.getNextUrl).not.toHaveBeenCalled();
    expect(manager.visitUrl).not.toHaveBeenCalled();
  });

  test('오류 처리 - getNextUrl 실패', async () => {
    // 오류 시뮬레이션
    manager.getNextUrl = jest.fn().mockRejectedValue(new Error('테스트 오류'));

    await manager.processQueue();

    // 오류가 발생해도 isRunning이 false로 변경되어야 함
    expect(manager.isRunning).toBe(false);
    expect(manager.visitUrl).not.toHaveBeenCalled();
  });

  test('오류 처리 - visitUrl 실패', async () => {
    // visitUrl 실패 시뮬레이션
    manager.visitUrl = jest.fn().mockRejectedValue(new Error('방문 오류'));

    await manager.processQueue();

    // 오류가 발생해도 isRunning이 false로 변경되어야 함
    expect(manager.isRunning).toBe(false);
    // 실패에도 불구하고 루프가 계속 진행되어야 함
    expect(manager.getNextUrl).toHaveBeenCalledTimes(3);
    expect(manager.visitUrl).toHaveBeenCalledTimes(2);
  });

  test('최대 URL 제한 준수', async () => {
    // getNextUrl이 항상 유효한 결과를 반환하도록 설정
    manager.getNextUrl = jest.fn().mockResolvedValue({
      url: 'https://example.com/page',
      domain: 'example.com'
    });

    await manager.processQueue();

    // maxUrls(3)만큼만 visitUrl이 호출되어야 함
    expect(manager.visitUrl).toHaveBeenCalledTimes(3);
    // getNextUrl은 maxUrls 횟수만큼만 호출되어야 함 (마지막 종료 조건 확인 제외)
    expect(manager.getNextUrl).toHaveBeenCalledTimes(3);
  });

 test('지연 시간 적용', async () => {
  // setTimeout 모킹
  jest.useFakeTimers();

  // visitUrl이 실행된 후 비동기 작업이 완료되도록 Promise.resolve 사용
  manager.visitUrl = jest.fn().mockImplementation(() => {
    return Promise.resolve();
  });

  // processQueue가 두 번의 URL 방문 후 null을 받아 종료되도록 설정
  manager.getNextUrl = jest.fn()
    .mockResolvedValueOnce({ url: 'https://example.com/page1', domain: 'example.com' })
    .mockResolvedValueOnce({ url: 'https://example.com/page2', domain: 'example.com' })
    .mockResolvedValueOnce({ url: 'https://example.com/page2', domain: 'example.com' })
    .mockResolvedValueOnce(null); // 3번째는 null 반환하여 루프 종료
   manager.maxUrls = 4;
  // processQueue 실행 (비동기)
  const processPromise = manager.processQueue();
  manager.delayBetweenRequests=2000;

  // 첫 번째 URL 처리 (getNextUrl 호출 및 visitUrl 실행)
  await jest.advanceTimersByTimeAsync(manager.delayBetweenRequests);
  expect(manager.visitUrl).toHaveBeenCalledTimes(2);

  // 지연 시간 진행
  await jest.advanceTimersByTimeAsync(manager.delayBetweenRequests);
  expect(manager.visitUrl).toHaveBeenCalledTimes(3);

  // 세 번째 호출에서 getNextUrl이 null을 반환하고 종료하도록 모든 타이머 실행
  await jest.runAllTimersAsync();

  // 작업 완료 대기
  await processPromise;

  // 실제 타이머 복원
  jest.useRealTimers();
});

  test('결과가 없을 때 바로 종료', async () => {
    // getNextUrl이 첫 호출에서 null 반환
    manager.getNextUrl = jest.fn().mockResolvedValue(null);

    await manager.processQueue();

    // getNextUrl은 한 번만 호출되어야 함
    expect(manager.getNextUrl).toHaveBeenCalledTimes(1);
    // visitUrl은 호출되지 않아야 함
    expect(manager.visitUrl).not.toHaveBeenCalled();
    // 실행 상태는 false로 변경되어야 함
    expect(manager.isRunning).toBe(false);
  });
});