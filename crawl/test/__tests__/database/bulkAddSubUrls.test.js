const { MongoDBService } = require('@database/mongodb-service');

// 모킹 설정
jest.mock('mongodb');
jest.mock('@config/config', () => ({
  DATABASE: {
    MONGODB_URI: 'mongodb://localhost:27017',
    MONGODB_DB_NAME: 'test'
  }
}));
jest.mock('@database/init-mongodb', () => ({
  startMongoDBService: jest.fn().mockResolvedValue(true),
  checkMongoDBStatus: jest.fn().mockResolvedValue(true)
}));

describe('MongoDBService - bulkAddSubUrls', () => {
  let mongoService;
  let mockCollection;
  let mockDb;
  let mockClient;

  beforeEach(() => {
    // 목 객체 초기화
    mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 })
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    mockClient = {
      db: jest.fn().mockReturnValue(mockDb),
      connect: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true)
    };

    // MongoClient 모킹
    const { MongoClient } = require('mongodb');
    MongoClient.mockImplementation(() => mockClient);

    // 서비스 인스턴스 생성
    mongoService = new MongoDBService();
    mongoService.client = mockClient;
    mongoService.db = mockDb;
    mongoService.domainsCollection = mockCollection;

    // connect 메소드 모킹 (이미 연결된 것으로 가정)
    mongoService.connect = jest.fn().mockResolvedValue();
    mongoService.addOrUpdateDomain = jest.fn().mockResolvedValue(true);
  });

  test('빈 배열이 전달되면 0을 반환해야 함', async () => {
    const result = await mongoService.bulkAddSubUrls('example.com', []);
    expect(result).toBe(0);
    expect(mockCollection.findOne).not.toHaveBeenCalled();
    expect(mockCollection.updateOne).not.toHaveBeenCalled();
  });

  test('도메인이 존재하지 않으면 도메인을 생성해야 함', async () => {
    // 도메인이 없는 경우 시뮬레이션
    mockCollection.findOne.mockResolvedValueOnce(null);

    const subUrls = [
      { url: 'https://example.com/page1', visited: false },
      { url: 'https://example.com/page2', visited: false }
    ];

    await mongoService.bulkAddSubUrls('example.com', subUrls);

    // addOrUpdateDomain 호출 확인
    expect(mongoService.addOrUpdateDomain).toHaveBeenCalledWith(
      'example.com',
      'http://example.com'
    );

    // updateOne 호출 확인
    expect(mockCollection.updateOne).toHaveBeenCalled();
  });

  test('도메인이 존재하고 새 URL이 있는 경우 URL 추가', async () => {
    // 도메인이 있고 기존 URL이 있는 경우 시뮬레이션
    mockCollection.findOne.mockResolvedValueOnce({
      domain: 'example.com',
      suburl_list: [
        { url: 'https://example.com/existing' }
      ]
    });

    const subUrls = [
      { url: 'https://example.com/existing', visited: false }, // 기존 URL
      { url: 'https://example.com/new1', visited: false },     // 새 URL
      { url: 'https://example.com/new2', visited: true }       // 새 URL (방문됨)
    ];

    const result = await mongoService.bulkAddSubUrls('example.com', subUrls);

    // updateOne 호출 확인 (새 URL 2개만 추가)
    expect(mockCollection.updateOne).toHaveBeenCalled();
    const updateArgs = mockCollection.updateOne.mock.calls[0];

    // 첫 번째 인자: 필터
    expect(updateArgs[0]).toEqual({ domain: 'example.com' });

    // 두 번째 인자: 업데이트 연산
    const updateOp = updateArgs[1];
    expect(updateOp).toHaveProperty('$push');
    expect(updateOp).toHaveProperty('$set');

    // $push 연산 내에 새 URL만 포함되어 있는지 확인
    const pushedUrls = updateOp.$push.suburl_list.$each;
    expect(pushedUrls.length).toBe(2);
    expect(pushedUrls[0].url).toBe('https://example.com/new1');
    expect(pushedUrls[1].url).toBe('https://example.com/new2');

    // 결과 값 확인
    expect(result).toBe(2);
  });

  test('URL이 http로 시작하지 않으면 필터링되어야 함', async () => {
    // 도메인이 있는 경우 시뮬레이션
    mockCollection.findOne.mockResolvedValueOnce({
      domain: 'example.com',
      suburl_list: []
    });

    const subUrls = [
      { url: 'https://example.com/valid', visited: false },
      { url: 'not-valid-url', visited: false },              // 유효하지 않은 URL
      { url: 'ftp://example.com/ftp', visited: false }        // http로 시작하지 않음
    ];

    const result = await mongoService.bulkAddSubUrls('example.com', subUrls);

    // updateOne 호출 확인 (유효한 URL 1개만 추가)
    expect(mockCollection.updateOne).toHaveBeenCalled();
    const updateArgs = mockCollection.updateOne.mock.calls[0];
    const pushedUrls = updateArgs[1].$push.suburl_list.$each;
    expect(pushedUrls.length).toBe(1);
    expect(pushedUrls[0].url).toBe('https://example.com/valid');

    // 결과 값 확인
    expect(result).toBe(1);
  });

  test('모든 URL이 이미 존재하는 경우 URL 추가하지 않음', async () => {
    // 도메인이 있고 모든 URL이 이미 존재하는 경우 시뮬레이션
    mockCollection.findOne.mockResolvedValueOnce({
      domain: 'example.com',
      suburl_list: [
        { url: 'https://example.com/page1' },
        { url: 'https://example.com/page2' }
      ]
    });

    const subUrls = [
      { url: 'https://example.com/page1', visited: true },
      { url: 'https://example.com/page2', visited: false }
    ];

    const result = await mongoService.bulkAddSubUrls('example.com', subUrls);

    // updateOne이 호출되지 않아야 함 (새 URL이 없음)
    expect(mockCollection.updateOne).not.toHaveBeenCalled();

    // 결과 값 확인
    expect(result).toBe(0);
  });

  test('업데이트 중 오류가 발생하면 예외가 발생해야 함', async () => {
    // 업데이트 중 오류 시뮬레이션
    mockCollection.updateOne.mockRejectedValueOnce(new Error('Database error'));

    // 도메인이 있는 경우 시뮬레이션
    mockCollection.findOne.mockResolvedValueOnce({
      domain: 'example.com',
      suburl_list: []
    });

    const subUrls = [
      { url: 'https://example.com/page1', visited: false }
    ];

    // 예외 발생 확인
    await expect(mongoService.bulkAddSubUrls('example.com', subUrls))
      .rejects
      .toThrow('Database error');
  });

  test('timestamp 필드가 올바르게 설정되어야 함', async () => {
    // 도메인이 있는 경우 시뮬레이션
    mockCollection.findOne.mockResolvedValueOnce({
      domain: 'example.com',
      suburl_list: []
    });

    // 테스트 시작 시간
    const beforeTest = new Date();

    const subUrls = [
      { url: 'https://example.com/page1', visited: false }
    ];

    await mongoService.bulkAddSubUrls('example.com', subUrls);

    // updateOne 호출 확인
    expect(mockCollection.updateOne).toHaveBeenCalled();
    const updateArgs = mockCollection.updateOne.mock.calls[0];
    const pushedUrl = updateArgs[1].$push.suburl_list.$each[0];

    // timestamp 필드 확인
    expect(pushedUrl.created_at).toBeInstanceOf(Date);
    expect(pushedUrl.updated_at).toBeInstanceOf(Date);

    // timestamp가 현재 시간과 가까운지 확인
    const afterTest = new Date();
    expect(pushedUrl.created_at >= beforeTest).toBe(true);
    expect(pushedUrl.created_at <= afterTest).toBe(true);
    expect(pushedUrl.updated_at >= beforeTest).toBe(true);
    expect(pushedUrl.updated_at <= afterTest).toBe(true);

    // updated_at이 도메인 레벨에서도 설정되었는지 확인
    expect(updateArgs[1].$set.updated_at).toBeInstanceOf(Date);
    expect(updateArgs[1].$set.updated_at >= beforeTest).toBe(true);
    expect(updateArgs[1].$set.updated_at <= afterTest).toBe(true);
  });
});