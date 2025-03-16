require('module-alias/register');
const { MongoDBService } = require('@database/mongodb-service');
const { VisitResult } = require('@models/visitResult');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

describe('bulkAddSubUrls 함수 테스트', () => {
  let mongoServer;
  let mongoClient;
  let dbService;
  let domainsCollection;
  const TEST_DOMAIN = 'example-domain.com';

  beforeAll(async () => {
    // 인메모리 MongoDB 서버 시작
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // MongoDB 클라이언트 연결
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();

    // 테스트 컬렉션 설정
    const testDb = mongoClient.db('test-db');
    domainsCollection = testDb.collection('domains');

    // MongoDBService 인스턴스 생성 및 설정
    dbService = new MongoDBService();
    dbService.setUri(mongoUri);
    dbService.setDbName('test-db');

    // domainsCollection 직접 설정 (연결 로직 우회)
    dbService.domainsCollection = domainsCollection;
    dbService.client = mongoClient;
    dbService.db = testDb;
  });

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // 각 테스트 전에 컬렉션 초기화
    await domainsCollection.deleteMany({});
  });

  test('문자열 배열 형태의 URL 추가', async () => {
    // 문자열 URL 배열
    const urls = [
      'https://example-domain.com/page1',
      'https://example-domain.com/page2',
      'https://example-domain.com/page3'
    ];

    // 함수 실행
    const result = await dbService.bulkAddSubUrls(TEST_DOMAIN, urls);

    // 검증
    expect(result).toBe(3); // 3개의 URL이 추가되어야 함

    // 데이터베이스에서 저장된 도메인 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeDefined();
    expect(domainDoc.suburl_list).toHaveLength(3);

    // 각 URL이 올바르게 저장되었는지 확인
    urls.forEach(url => {
      const found = domainDoc.suburl_list.find(item => item.url === url);
      expect(found).toBeDefined();
      expect(found.visited).toBe(false);
      expect(found.success).toBe(false);
    });
  });

  test('객체 배열 형태의 URL 추가', async () => {
    // 객체 URL 배열
    const urls = [
      { url: 'https://example-domain.com/page1' },
      { url: 'https://example-domain.com/page2', visited: true }, // visited 값은 무시되어야 함
      { url: 'https://example-domain.com/page3', text: '테스트 페이지' }
    ];

    // 함수 실행
    const result = await dbService.bulkAddSubUrls(TEST_DOMAIN, urls);

    // 검증
    expect(result).toBe(3);

    // 데이터베이스에서 저장된 도메인 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeDefined();
    expect(domainDoc.suburl_list).toHaveLength(3);

    // 모든 URL의 visited 값이 false인지 확인 (입력값에 관계없이)
    domainDoc.suburl_list.forEach(item => {
      expect(item.visited).toBe(false);
    });

    // 각 URL이 올바르게 저장되었는지 확인
    urls.forEach(urlObj => {
      const found = domainDoc.suburl_list.find(item => item.url === urlObj.url);
      expect(found).toBeDefined();
    });
  });

  test('혼합 형태의 URL 추가', async () => {
    // 문자열과 객체가 혼합된 배열
    const urls = [
      'https://example-domain.com/page1',
      { url: 'https://example-domain.com/page2' },
      { url: 'https://example-domain.com/page3', visited: true } // visited 값은 무시되어야 함
    ];

    // 함수 실행
    const result = await dbService.bulkAddSubUrls(TEST_DOMAIN, urls);

    // 검증
    expect(result).toBe(3);

    // 데이터베이스에서 저장된 도메인 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeDefined();
    expect(domainDoc.suburl_list).toHaveLength(3);

    // 각 URL이 올바르게 저장되었는지 확인
    expect(domainDoc.suburl_list.some(item => item.url === 'https://example-domain.com/page1')).toBe(true);
    expect(domainDoc.suburl_list.some(item => item.url === 'https://example-domain.com/page2')).toBe(true);
    expect(domainDoc.suburl_list.some(item => item.url === 'https://example-domain.com/page3')).toBe(true);
  });

  test('잘못된 URL 필터링', async () => {
    // 유효하지 않은 URL도 포함된 배열
    const urls = [
      'https://example-domain.com/valid1',
      'invalid-url', // http로 시작하지 않음
      { url: 'https://example-domain.com/valid2' },
      { name: 'no-url-field' }, // url 필드 없음
      null, // null 값
      { url: '' } // 빈 URL
    ];

    // 함수 실행
    const result = await dbService.bulkAddSubUrls(TEST_DOMAIN, urls);

    // 검증 - 유효한 URL 2개만 추가되어야 함
    expect(result).toBe(2);

    // 데이터베이스에서 저장된 도메인 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeDefined();
    expect(domainDoc.suburl_list).toHaveLength(2);

    // 유효한 URL만 저장되었는지 확인
    expect(domainDoc.suburl_list.some(item => item.url === 'https://example-domain.com/valid1')).toBe(true);
    expect(domainDoc.suburl_list.some(item => item.url === 'https://example-domain.com/valid2')).toBe(true);
  });

  test('중복 URL 필터링', async () => {
    // 먼저 일부 URL을 추가
    await domainsCollection.insertOne({
      domain: TEST_DOMAIN,
      url: `http://${TEST_DOMAIN}`,
      created_at: new Date(),
      updated_at: new Date(),
      suburl_list: [
        {
          url: 'https://example-domain.com/existing1',
          visited: false,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          url: 'https://example-domain.com/existing2',
          visited: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    });

    // 중복된 URL과 새 URL을 포함한 배열
    const urls = [
      'https://example-domain.com/existing1', // 이미 존재함
      'https://example-domain.com/existing2', // 이미 존재함
      'https://example-domain.com/new1',
      'https://example-domain.com/new2'
    ];

    // 함수 실행
    const result = await dbService.bulkAddSubUrls(TEST_DOMAIN, urls);

    // 검증 - 새 URL 2개만 추가되어야 함
    expect(result).toBe(2);

    // 데이터베이스에서 저장된 도메인 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeDefined();
    expect(domainDoc.suburl_list).toHaveLength(4); // 기존 2개 + 새로 추가된 2개

    // 새 URL이 추가되었는지 확인
    expect(domainDoc.suburl_list.some(item => item.url === 'https://example-domain.com/new1')).toBe(true);
    expect(domainDoc.suburl_list.some(item => item.url === 'https://example-domain.com/new2')).toBe(true);
  });

  test('VisitResult 객체 변환 확인', async () => {
    // 함수 실행
    const result = await dbService.bulkAddSubUrls(TEST_DOMAIN, ['https://example-domain.com/page1']);

    // 검증
    expect(result).toBe(1);

    // 데이터베이스에서 저장된 도메인 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    const savedUrl = domainDoc.suburl_list[0];

    // VisitResult에서 변환된 필드들이 있는지 확인
    expect(savedUrl.visited).toBe(false);
    expect(savedUrl.success).toBe(false);
    expect(savedUrl.crawlStats).toBeDefined();
    expect(savedUrl.crawlStats.total).toBe(0);
    expect(savedUrl.created_at).toBeDefined();
    expect(savedUrl.updated_at).toBeDefined();
  });

  test('빈 URL 배열 처리', async () => {
    // 빈 배열로 함수 실행
    const result = await dbService.bulkAddSubUrls(TEST_DOMAIN, []);

    // 검증
    expect(result).toBe(0);

    // 도메인이 생성되었는지 확인 (빈 배열이므로 도메인만 생성됨)
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeFalsy(); // 빈 배열이면 도메인 생성되지 않음
  });
});