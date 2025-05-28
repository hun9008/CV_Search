require('module-alias/register');
const { VisitResult } = require('@models/visitResult');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

// BaseWorkerManager 모듈 불러오기
const { BaseWorkerManager } = require('@crawl/baseWorkerManager');

describe('saveVisitResult 함수 테스트', () => {
  let mongoServer;
  let mongoClient;
  let db;
  let domainsCollection;
  let manager;
  const TEST_DOMAIN = 'test-save.com';

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

    // MongoDBService 모의 객체 생성 및 설정
    const mockMongoDBService = {
      // addVisitedResult 구현
      addVisitedResult: async (visitResult) => {
        try {
          const { domain, url } = visitResult;
          const now = new Date();

          // 도메인 문서 찾기
          const domainDoc = await domainsCollection.findOne({ domain });

          // 도메인이 없으면 생성
          if (!domainDoc) {
            await domainsCollection.insertOne({
              domain,
              url: `http://${domain}`,
              created_at: now,
              updated_at: now,
              suburl_list: [{
                url,
                visited: true,
                success: visitResult.success || false,
                title: visitResult.pageContent?.title || '',
                text: visitResult.pageContent?.text || '',
                created_at: now,
                updated_at: now
              }]
            });
            return { success: true, operation: 'insert_domain' };
          }

          // URL이 이미 존재하는지 확인
          const urlExists = await domainsCollection.findOne({
            domain,
            'suburl_list.url': url
          });

          if (urlExists) {
            // 기존 URL 업데이트
            await domainsCollection.updateOne(
              { domain, 'suburl_list.url': url },
              {
                $set: {
                  'suburl_list.$.visited': true,
                  'suburl_list.$.success': visitResult.success || false,
                  'suburl_list.$.title': visitResult.pageContent?.title || '',
                  'suburl_list.$.text': visitResult.pageContent?.text || '',
                  'suburl_list.$.updated_at': now
                }
              }
            );
            return { success: true, operation: 'update' };
          } else {
            // 새 URL 추가
            await domainsCollection.updateOne(
              { domain },
              {
                $push: {
                  suburl_list: {
                    url,
                    visited: true,
                    success: visitResult.success || false,
                    title: visitResult.pageContent?.title || '',
                    text: visitResult.pageContent?.text || '',
                    created_at: now,
                    updated_at: now
                  }
                }
              }
            );
            return { success: true, operation: 'insert_url' };
          }
        } catch (error) {
          console.error('addVisitedResult 실패:', error);
          return { success: false, error: error.message };
        }
      },

      // bulkAddSubUrls 구현
      bulkAddSubUrls: async (domain, urls) => {
        try {
          if (!urls || urls.length === 0) return 0;

          const now = new Date();

          // 도메인 문서 찾기
          let domainDoc = await domainsCollection.findOne({ domain });

          // 도메인이 없으면 생성
          if (!domainDoc) {
            await domainsCollection.insertOne({
              domain,
              url: `http://${domain}`,
              created_at: now,
              updated_at: now,
              suburl_list: []
            });
            domainDoc = { suburl_list: [] };
          }

          // 기존 URL 목록 추출
          const existingUrls = new Set();
          domainDoc.suburl_list.forEach(item => {
            if (item.url) existingUrls.add(item.url);
          });

          // 새 URL만 필터링
          const newUrls = urls
            .filter(item => {
              const url = typeof item === 'string' ? item : item.url;
              return url && !existingUrls.has(url) && url.startsWith('http');
            })
            .map(item => {
              const url = typeof item === 'string' ? item : item.url;
              return {
                url,
                visited: false,
                created_at: now,
                updated_at: now
              };
            });

          if (newUrls.length === 0) return 0;

          // URL 일괄 추가
          await domainsCollection.updateOne(
            { domain },
            {
              $push: { suburl_list: { $each: newUrls } }
            }
          );

          return newUrls.length;
        } catch (error) {
          console.error('bulkAddSubUrls 실패:', error);
          return 0;
        }
      }
    };

    // 전역 db 객체로 설정 (BaseWorkerManager에서 사용)
    global.db = mockMongoDBService;

    // BaseWorkerManager 인스턴스 생성
    manager = new BaseWorkerManager();

    // 로거 모킹 (선택사항)
    global.logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
  });

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }

    delete global.db;
    delete global.logger;
  });

  beforeEach(async () => {
    // 각 테스트 전에 컬렉션 초기화
    await domainsCollection.deleteMany({});
  });

  test('방문 결과 저장 - 새 도메인과 URL', async () => {
    // 방문 결과 객체 생성
    const visitResult = new VisitResult({
      url: 'https://test-save.com/page1',
      domain: TEST_DOMAIN,
      success: true,
      pageContent: {
        title: '테스트 페이지',
        text: '테스트 콘텐츠'
      },
      crawledUrls: [
        'https://test-save.com/page2',
        'https://test-save.com/page3'
      ],
      urlsByDomain: {
        'test-save.com': [
          { url: 'https://test-save.com/page2' },
          { url: 'https://test-save.com/page3' }
        ]
      }
    });

    // 함수 실행
    const result = await manager.saveVisitResult(visitResult);

    // 검증
    expect(result).toBe(true);

    // 데이터베이스에서 저장된 데이터 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeDefined();
    expect(domainDoc.suburl_list).toHaveLength(3); // 방문한 URL 1개 + 추가 URL 2개

    // 방문한 URL이 올바르게 저장되었는지 확인
    const visitedUrl = domainDoc.suburl_list.find(item => item.url === 'https://test-save.com/page1');
    expect(visitedUrl).toBeDefined();
    expect(visitedUrl.visited).toBe(true);
    expect(visitedUrl.success).toBe(true);
    expect(visitedUrl.title).toBe('테스트 페이지');

    // 크롤링된 URL이 올바르게 저장되었는지 확인
    const crawledUrls = domainDoc.suburl_list.filter(item =>
      item.url === 'https://test-save.com/page2' || item.url === 'https://test-save.com/page3'
    );
    expect(crawledUrls).toHaveLength(2);
    crawledUrls.forEach(url => {
      expect(url.visited).toBe(false);
    });
  });

  test('방문 결과 저장 - urlsByDomain이 없는 경우', async () => {
    // urlsByDomain이 없는 방문 결과
    const visitResult = new VisitResult({
      url: 'https://test-save.com/page1',
      domain: TEST_DOMAIN,
      success: true,
      pageContent: {
        title: '테스트 페이지',
        text: '테스트 콘텐츠'
      },
      crawledUrls: [
        'https://test-save.com/page2',
        'https://test-save.com/page3'
      ]
      // urlsByDomain 없음
    });

    // 함수 실행
    const result = await manager.saveVisitResult(visitResult);

    // 검증
    expect(result).toBe(true);

    // 데이터베이스에서 저장된 데이터 확인
    const domainDoc = await domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(domainDoc).toBeDefined();
    expect(domainDoc.suburl_list.length).toBeGreaterThanOrEqual(1); // 최소 방문한 URL 1개

    // 방문한 URL이 올바르게 저장되었는지 확인
    const visitedUrl = domainDoc.suburl_list.find(item => item.url === 'https://test-save.com/page1');
    expect(visitedUrl).toBeDefined();
    expect(visitedUrl.visited).toBe(true);
  });



  test('방문 결과 저장 - 오류 처리', async () => {
    // bulkAddSubUrls에 실패하는 모의 구현
    global.db.bulkAddSubUrls = jest.fn().mockRejectedValueOnce(new Error('벌크 추가 실패'));

    // 방문 결과 객체
    const visitResult = new VisitResult({
      url: 'https://test-save.com/page1',
      domain: TEST_DOMAIN,
      urlsByDomain: {
        'test-save.com': [{ url: 'https://test-save.com/page2' }]
      }
    });

    // 함수 실행
    const result = await manager.saveVisitResult(visitResult);

    // 검증
    expect(result).toBe(false); // 오류로 인해 실패해야 함


    // 원래 구현으로 복원
    global.db.bulkAddSubUrls = jest.fn().mockResolvedValue(0);
  });
});