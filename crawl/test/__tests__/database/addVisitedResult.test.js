require('module-alias/register');
const { MongoDBService } = require('@database/mongodb-service');
const { VisitResult } = require('@models/visitResult');
const { defaultLogger: logger } = require('@utils/logger');

// 테스트 도메인 및 URL
const TEST_DOMAIN = 'test-domain.com';
const TEST_URL = 'https://test-domain.com/test-page';

describe('addVisitedResult 함수 테스트', () => {
  let db;

  beforeAll(async () => {
    // 테스트용 MongoDB 서비스 인스턴스 생성
    db = new MongoDBService();
    await db.connect();
    // 테스트를 위해 기존 테스트 도메인 삭제
    try {
      await db.domainsCollection.deleteOne({ domain: TEST_DOMAIN });
    } catch (err) {
      console.warn('테스트 도메인 초기화 실패:', err.message);
    }
  });

  afterAll(async () => {
    // 테스트가 끝난 후 연결 종료
    if (db) {
      try {
        // 테스트 데이터 정리
        await db.domainsCollection.deleteOne({ domain: TEST_DOMAIN });
        await db.disconnect();
      } catch (err) {
        console.error('테스트 정리 실패:', err.message);
      }
    }
  });

  test('새 도메인과 URL 추가', async () => {
    // 방문 결과 객체 생성
    const visitResult = new VisitResult({
      url: TEST_URL,
      domain: TEST_DOMAIN,
      success: true,
      pageContent: {
        title: '테스트 페이지',
        text: '테스트 콘텐츠',
        meta: { description: '테스트 설명' }
      },
      finalUrl: TEST_URL,
      finalDomain: TEST_DOMAIN,
      visitedAt: new Date().toISOString()
    });

    // addVisitedResult 함수 호출
    const result = await db.addVisitedResult(visitResult);

    // 결과 검증
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.operation).toBe('insert_domain');

    // 데이터베이스에서 저장된 도메인 확인
    const savedDomain = await db.domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(savedDomain).toBeDefined();
    expect(savedDomain.domain).toBe(TEST_DOMAIN);
    expect(savedDomain.suburl_list).toHaveLength(1);
    expect(savedDomain.suburl_list[0].url).toBe(TEST_URL);
    expect(savedDomain.suburl_list[0].title).toBe('테스트 페이지');
  });

  test('기존 URL 업데이트', async () => {
    // 업데이트된 방문 결과 객체 생성
    const updatedVisitResult = new VisitResult({
      url: TEST_URL,
      domain: TEST_DOMAIN,
      success: true,
      pageContent: {
        title: '업데이트된 테스트 페이지',
        text: '업데이트된 콘텐츠',
        meta: { description: '업데이트된 설명' }
      },
      finalUrl: TEST_URL,
      finalDomain: TEST_DOMAIN,
      visitedAt: new Date().toISOString(),
      crawledUrls: ['https://test-domain.com/page1', 'https://test-domain.com/page2']
    });

    // addVisitedResult 함수 호출
    const result = await db.addVisitedResult(updatedVisitResult);

    // 결과 검증
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.operation).toBe('update');

    // 데이터베이스에서 업데이트된 도메인 확인
    const savedDomain = await db.domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(savedDomain).toBeDefined();
    expect(savedDomain.suburl_list).toHaveLength(1);
    expect(savedDomain.suburl_list[0].title).toBe('업데이트된 테스트 페이지');
    expect(savedDomain.suburl_list[0].text).toBe('업데이트된 콘텐츠');

    // 크롤링 통계 확인
    expect(savedDomain.suburl_list[0].crawlStats).toBeDefined();
    expect(savedDomain.suburl_list[0].crawlStats.total).toBe(2);
  });

  test('새로운 URL 추가', async () => {
    const NEW_URL = 'https://test-domain.com/another-page';

    // 새 URL에 대한 방문 결과 객체 생성
    const newUrlVisitResult = new VisitResult({
      url: NEW_URL,
      domain: TEST_DOMAIN,
      success: true,
      pageContent: {
        title: '다른 테스트 페이지',
        text: '다른 콘텐츠',
        meta: { description: '다른 설명' }
      },
      finalUrl: NEW_URL,
      finalDomain: TEST_DOMAIN,
      visitedAt: new Date().toISOString()
    });

    // addVisitedResult 함수 호출
    const result = await db.addVisitedResult(newUrlVisitResult);

    // 결과 검증
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.operation).toBe('insert_url');

    // 데이터베이스에서 저장된 도메인 확인
    const savedDomain = await db.domainsCollection.findOne({ domain: TEST_DOMAIN });
    expect(savedDomain).toBeDefined();
    expect(savedDomain.suburl_list).toHaveLength(2);

    // 새 URL 확인
    const newUrlEntry = savedDomain.suburl_list.find(item => item.url === NEW_URL);
    expect(newUrlEntry).toBeDefined();
    expect(newUrlEntry.title).toBe('다른 테스트 페이지');
  });

  test('잘못된 입력 처리', async () => {
    // 빈 visitResult 객체
    const emptyResult = await db.addVisitedResult({});
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.message).toContain('도메인과 URL은 필수입니다');

    // URL만 있는 객체
    const urlOnlyResult = await db.addVisitedResult({ url: 'https://example.com' });
    expect(urlOnlyResult.success).toBe(false);

    // 도메인만 있는 객체
    const domainOnlyResult = await db.addVisitedResult({ domain: 'example.com' });
    expect(domainOnlyResult.success).toBe(false);
  });
});