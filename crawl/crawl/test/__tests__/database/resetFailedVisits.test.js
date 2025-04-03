require('module-alias/register');
const { MongoDBService } = require('@database/mongodb-service');
const { TEST_DATABASE } = require('@config/config');

// 테스트 도메인 접두사 및 테스트 도메인 정의
const TEST_PREFIX = 'test-reset-' + Date.now();
const TEST_DOMAINS = [
  `${TEST_PREFIX}-domain1.com`,
  `${TEST_PREFIX}-domain2.com`
];

// 테스트 환경 설정
let db;
let domainStats = {};

// 테스트가 실행될지 여부 결정 (환경 변수를 통해 제어 가능)
const runIntegrationTests = true;
const testSuite = runIntegrationTests ? describe : describe.skip;

testSuite('resetFailedVisitedStatus 함수 테스트', () => {
  // 모든 테스트 시작 전 실행
  beforeAll(async () => {
    // MongoDB 서비스 초기화
    db = new MongoDBService();
    db.setUri(TEST_DATABASE.MONGODB_ADMIN_URI);
    db.setDbName('test');

    // 데이터베이스 연결
    await db.connect();
    console.log('MongoDB 연결 성공');

    // 테스트 데이터 설정
    await setupTestData();
  }, 30000); // 타임아웃 30초

  // 모든 테스트 완료 후 실행
  afterAll(async () => {
    // 테스트 데이터 정리
    await cleanupTestData();

    // 데이터베이스 연결 종료
    await db.disconnect();
    console.log('MongoDB 연결 종료');
  });

  // 초기 상태 확인 테스트
  test('초기 테스트 데이터 상태 확인', async () => {
    // 각 도메인의 상태 출력 및 검증
    for (const domain of TEST_DOMAINS) {
      const stats = await db.getDomainStats(domain);
      const domainData = await db.db.collection('domains').findOne({ domain });

      domainStats[domain] = {
        before: { ...stats }
      };

      // 검증
      expect(stats.total).toBe(7); // 총 7개 URL
      expect(stats.visited).toBe(5); // 5개 방문됨 (성공 2개, 실패 3개)
      expect(stats.pending).toBe(2); // 2개 대기 중

      // URL 상태 검증
      const successUrls = domainData.suburl_list.filter(url => url.visited && url.success);
      const failedUrls = domainData.suburl_list.filter(url => url.visited && !url.success);
      const pendingUrls = domainData.suburl_list.filter(url => !url.visited);

      expect(successUrls.length).toBe(2);
      expect(failedUrls.length).toBe(3);
      expect(pendingUrls.length).toBe(2);
    }
  });

  // 모든 도메인에 대한 실패한 URL 초기화 테스트
  test('모든 도메인에서 실패한 URL 초기화', async () => {
    // 실패한 URL 초기화 실행
    const result = await db.resetFailedVisitedStatus();

    // 결과 검증
    expect(result.totalDomains).toBe(2);
    expect(result.totalUrls).toBe(14); // 각 도메인 7개 * 2
    expect(result.updatedUrls).toBe(6); // 각 도메인 실패 URL 3개 * 2

    // 각 도메인의 상태 다시 확인
    for (const domain of TEST_DOMAINS) {
      const stats = await db.getDomainStats(domain);
      const domainData = await db.db.collection('domains').findOne({ domain });

      domainStats[domain].after = { ...stats };

      // 검증
      expect(stats.total).toBe(7); // 총 URL 수 변화 없음
      expect(stats.visited).toBe(2); // 방문된 URL = 성공한 URL만 (2개)
      expect(stats.pending).toBe(5); // 대기 중 URL = 원래 대기 중 (2개) + 초기화된 실패 URL (3개)

      // URL 상태 검증
      const successUrls = domainData.suburl_list.filter(url => url.visited && url.success);
      const failedUrls = domainData.suburl_list.filter(url => url.visited && !url.success);
      const pendingUrls = domainData.suburl_list.filter(url => !url.visited);

      expect(successUrls.length).toBe(2); // 성공한 URL은 그대로
      expect(failedUrls.length).toBe(0); // 실패한 URL은 모두 초기화되어 0개
      expect(pendingUrls.length).toBe(5); // 대기 중 URL = 원래 대기 중 (2개) + 초기화된 실패 URL (3개)
    }
  });

  // 특정 도메인에 대한 실패한 URL 초기화 테스트
  test('특정 도메인에서만 실패한 URL 초기화', async () => {
    // 먼저 테스트 데이터 재설정
    await cleanupTestData();
    await setupTestData();

    // 특정 도메인만 초기화
    const specificDomain = TEST_DOMAINS[0];
    const result = await db.resetFailedVisitedStatus(specificDomain);

    // 결과 검증
    expect(result.totalDomains).toBe(1);
    expect(result.totalUrls).toBe(7);
    expect(result.updatedUrls).toBe(3); // 첫 번째 도메인의 실패 URL 3개

    // 첫 번째 도메인 (초기화된) 상태 확인
    const stats1 = await db.getDomainStats(specificDomain);
    const domainData1 = await db.db.collection('domains').findOne({ domain: specificDomain });

    expect(stats1.total).toBe(7);
    expect(stats1.visited).toBe(2); // 성공한 URL만 방문 상태
    expect(stats1.pending).toBe(5); // 원래 대기 중 2개 + 초기화된 실패 URL 3개

    // 두 번째 도메인 (변경 안됨) 상태 확인
    const stats2 = await db.getDomainStats(TEST_DOMAINS[1]);
    const domainData2 = await db.db.collection('domains').findOne({ domain: TEST_DOMAINS[1] });

    expect(stats2.total).toBe(7);
    expect(stats2.visited).toBe(5); // 변경 없음 (성공 2개 + 실패 3개)
    expect(stats2.pending).toBe(2); // 변경 없음

    // 두 번째 도메인의 실패 URL은 여전히 실패 상태로 유지
    const failedUrls = domainData2.suburl_list.filter(url => url.visited && !url.success);
    expect(failedUrls.length).toBe(3);
  });
});

// 테스트 데이터 설정 함수
async function setupTestData() {
  console.log('\n테스트 데이터 설정 중...');

  for (const domain of TEST_DOMAINS) {
    // 도메인 생성
    await db.addOrUpdateDomain(domain, `https://${domain}`);

    // URL 추가
    const urls = [
      // 성공한 URL (visited=true, success=true)
      `https://${domain}/page1`,
      `https://${domain}/page2`,
      // 실패한 URL (visited=true, success=false)
      `https://${domain}/failed1`,
      `https://${domain}/failed2`,
      `https://${domain}/failed3`,
      // 미방문 URL (visited=false)
      `https://${domain}/pending1`,
      `https://${domain}/pending2`
    ];

    // URL 추가
    await db.bulkAddSubUrls(domain, urls);

    // 성공한 URL 상태 설정
    for (let i = 0; i < 2; i++) {
      await db.db.collection('domains').updateOne(
        { domain, 'suburl_list.url': urls[i] },
        {
          $set: {
            'suburl_list.$.visited': true,
            'suburl_list.$.success': true,
            'suburl_list.$.text': 'Test content',
            'suburl_list.$.updated_at': new Date()
          }
        }
      );
    }

    // 실패한 URL 상태 설정
    for (let i = 2; i < 5; i++) {
      await db.db.collection('domains').updateOne(
        { domain, 'suburl_list.url': urls[i] },
        {
          $set: {
            'suburl_list.$.visited': true,
            'suburl_list.$.success': false,
            'suburl_list.$.error': 'Test error',
            'suburl_list.$.updated_at': new Date()
          }
        }
      );
    }
  }

  console.log('테스트 데이터 설정 완료');
}

// 테스트 데이터 정리 함수
async function cleanupTestData() {
  console.log('\n테스트 데이터 정리 중...');

  for (const domain of TEST_DOMAINS) {
    await db.db.collection('domains').deleteOne({ domain });
  }

  console.log('테스트 데이터 정리 완료');
}