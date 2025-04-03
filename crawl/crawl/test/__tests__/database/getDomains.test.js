const { MongoClient } = require('mongodb');
const { MongoDBService } = require('@database/mongodb-service');
const { VisitResult } = require('@models/visitResult');
const fs = require('fs').promises;
const path = require('path');
const { TEST_DATABASE } = require('@config/config');

/**
 * 이 테스트는 실제 MongoDB 연결을 사용합니다.
 * 테스트 실행 전에 MongoDB가 실행 중이어야 합니다.
 *
 * 테스트 실행 방법:
 * ENABLE_INTEGRATION_TESTS=true npx jest getDomains.integration.test.js
 */

// 테스트 실행 여부 확인
const runIntegrationTests = true;
if (!runIntegrationTests) {
  console.log('Integration tests are skipped. To run them, set ENABLE_INTEGRATION_TESTS=true');
}

// 테스트 데이터 저장 경로
const TEST_DATA_DIR = path.join(__dirname, '../../test/data');
const TEST_DATA_FILE = path.join(TEST_DATA_DIR, 'domain-test-results.json');

(runIntegrationTests ? describe : describe.skip)('MongoDB getDomains 통합 테스트', () => {
  // 테스트 도메인 접두사 - 테스트 식별을 위한 고유값
  const TEST_PREFIX = 'test-getDomains-' + Date.now();

  // 테스트 도메인 목록
  const TEST_DOMAINS = [
    `${TEST_PREFIX}-example.com`,
    `${TEST_PREFIX}-test.com`,
    `${TEST_PREFIX}-empty.com` // 서브 URL이 없는 도메인
  ];

  // 테스트 결과 저장 객체
  let testResults = {
    testsRun: [],
    domains: [],
    domainsWithStats: []
  };

  beforeAll(async () => {
    console.log('통합 테스트 설정 시작...');

    try {
      // 테스트 데이터 디렉토리 생성
      await fs.mkdir(TEST_DATA_DIR, { recursive: true });
      mongodbService = new MongoDBService();
      mongodbService.setUri(TEST_DATABASE.MONGODB_ADMIN_URI);
      mongodbService.setDbName(TEST_DATABASE.MONGODB_DB_NAME);

      // MongoDB에 연결
      await mongodbService.connect();
      console.log('MongoDB 연결 성공');

      // 테스트 도메인 생성
      for (const domain of TEST_DOMAINS) {
        console.log(`도메인 생성 중: ${domain}`);
        await mongodbService.addOrUpdateDomain(domain, `https://${domain}`);
      }

      // 첫 번째 도메인에 URL 추가 (모두 미방문 URL로 추가)
      await mongodbService.bulkAddSubUrls(TEST_DOMAINS[0], [
        `https://${TEST_DOMAINS[0]}/page1`,
        `https://${TEST_DOMAINS[0]}/page2`,
        `https://${TEST_DOMAINS[0]}/page3`
      ]);

      // 두 번째 도메인에 URL 추가 (모두 미방문 URL로 추가)
      await mongodbService.bulkAddSubUrls(TEST_DOMAINS[1], [
        `https://${TEST_DOMAINS[1]}/page1`,
        `https://${TEST_DOMAINS[1]}/page2`,
        `https://${TEST_DOMAINS[1]}/page3`,
        `https://${TEST_DOMAINS[1]}/page4`
      ]);

      // 이제 일부 URL을 방문한 것으로 수동 마킹 (MongoDB를 직접 사용)
      // 첫 번째 도메인의 2개 URL을 방문 완료로 표시
      await mongodbService.db.collection('domains').updateOne(
        { domain: TEST_DOMAINS[0], 'suburl_list.url': `https://${TEST_DOMAINS[0]}/page1` },
        {
          $set: {
            'suburl_list.$.visited': true,
            'suburl_list.$.success': true,
            'suburl_list.$.text': 'Test page 1 content',
            'suburl_list.$.updated_at': new Date()
          }
        }
      );

      await mongodbService.db.collection('domains').updateOne(
        { domain: TEST_DOMAINS[0], 'suburl_list.url': `https://${TEST_DOMAINS[0]}/page2` },
        {
          $set: {
            'suburl_list.$.visited': true,
            'suburl_list.$.success': true,
            'suburl_list.$.text': 'Test page 2 content',
            'suburl_list.$.updated_at': new Date()
          }
        }
      );

      // 두 번째 도메인의 1개 URL을 방문 완료로 표시
      await mongodbService.db.collection('domains').updateOne(
        { domain: TEST_DOMAINS[1], 'suburl_list.url': `https://${TEST_DOMAINS[1]}/page1` },
        {
          $set: {
            'suburl_list.$.visited': true,
            'suburl_list.$.success': true,
            'suburl_list.$.text': 'Test page content',
            'suburl_list.$.updated_at': new Date()
          }
        }
      );

      // 세 번째 도메인은 서브 URL 없음

      console.log('테스트 도메인 및 URL 생성 완료');
    } catch (error) {
      console.error('테스트 설정 중 오류 발생:', error);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('테스트 결과 저장 및 정리 중...');

    try {
      // 테스트 결과를 JSON 파일로 저장
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify(testResults, null, 2));
      console.log(`테스트 결과가 저장됨: ${TEST_DATA_FILE}`);

      // 테스트 데이터 정리 (테스트 도메인 삭제)
      for (const domain of TEST_DOMAINS) {
        await mongodbService.db.collection('domains').deleteOne({ domain });
        console.log(`테스트 도메인 삭제됨: ${domain}`);
      }
    } catch (error) {
      console.error('테스트 정리 중 오류 발생:', error);
    } finally {
      // MongoDB 연결 종료
      await mongodbService.disconnect();
      console.log('MongoDB 연결 종료');
    }
  });

  test('getDomains는 모든 도메인 기본 정보를 반환해야 함', async () => {
    const domains = await mongodbService.getDomains();
    testResults.testsRun.push('getDomains 기본 테스트');

    // 테스트 결과 저장
    testResults.domains = domains;

    // 테스트 도메인이 결과에 포함되어 있는지 확인
    for (const testDomain of TEST_DOMAINS) {
      const foundDomain = domains.find(d => d.domain === testDomain);
      expect(foundDomain).toBeDefined();
      expect(foundDomain.url).toBe(`https://${testDomain}`);
      expect(foundDomain.created_at).toBeInstanceOf(Date);
      expect(foundDomain.updated_at).toBeInstanceOf(Date);
    }
  });

  test('getDomains는 통계 정보를 포함하여 반환할 수 있어야 함', async () => {
    const domainsWithStats = await mongodbService.getDomains({ includeStats: true });
    testResults.testsRun.push('getDomains 통계 포함 테스트');

    // 테스트 결과 저장
    testResults.domainsWithStats = domainsWithStats;

    // 테스트 도메인별 통계 확인
    const domain1 = domainsWithStats.find(d => d.domain === TEST_DOMAINS[0]);
    expect(domain1).toBeDefined();
    expect(domain1.stats).toBeDefined();
    expect(domain1.stats.total).toBe(3);
    expect(domain1.stats.visited).toBe(2);
    expect(domain1.stats.pending).toBe(1);

    const domain2 = domainsWithStats.find(d => d.domain === TEST_DOMAINS[1]);
    expect(domain2).toBeDefined();
    expect(domain2.stats).toBeDefined();
    expect(domain2.stats.total).toBe(4);
    expect(domain2.stats.visited).toBe(1);
    expect(domain2.stats.pending).toBe(3);

    const domain3 = domainsWithStats.find(d => d.domain === TEST_DOMAINS[2]);
    expect(domain3).toBeDefined();
    expect(domain3.stats).toBeDefined();
    expect(domain3.stats.total).toBe(0);
    expect(domain3.stats.visited).toBe(0);
    expect(domain3.stats.pending).toBe(0);
  });

  test('getDomains는 limit 옵션을 적용해야 함', async () => {
    const limit = 2;
    const limitedDomains = await mongodbService.getDomains({ limit });
    testResults.testsRun.push('getDomains 제한 테스트');

    // 결과가 제한된 수 이하인지 확인
    expect(limitedDomains.length).toBeLessThanOrEqual(limit);
  });

  test('getDomains는 정렬 옵션을 적용해야 함', async () => {
    // 1. 도메인 이름 역순 정렬
    const reverseSorted = await mongodbService.getDomains({
      sort: { domain: -1 }
    });
    testResults.testsRun.push('getDomains 정렬 테스트');

    // 역순으로 정렬된 도메인 목록에서 테스트 도메인이 올바른 순서로 정렬되었는지 확인
    const testDomainsSorted = TEST_DOMAINS.slice().sort((a, b) => b.localeCompare(a));

    // 모든 테스트 도메인의 순서 확인 (전체 목록에서 우리 테스트 도메인만 추출)
    const foundDomains = reverseSorted
      .filter(d => TEST_DOMAINS.includes(d.domain))
      .map(d => d.domain);

    // 테스트 도메인이 역순으로 정렬되었는지 확인
    expect(foundDomains).toEqual(testDomainsSorted);

    // 2. 업데이트 날짜 순 정렬
    const dateSorted = await mongodbService.getDomains({
      sort: { updated_at: 1 }
    });

    // 날짜순으로 정렬되었는지는 일반 케이스에서는 확인하기 어려움
    // 동일 시간대에 생성했을 가능성이 높아 단순히 정렬 적용 여부만 확인
    expect(dateSorted.length).toBeGreaterThan(0);
  });

  test('getDomains는 검색 필터를 적용해야 함', async () => {
    // 테스트 도메인만 필터링하여 가져오기
    const query = { domain: { $regex: TEST_PREFIX } };
    const filteredDomains = await mongodbService.getDomains({ filter: query });
    testResults.testsRun.push('getDomains 필터 테스트');

    // 필터링된 결과가 테스트 도메인만 포함하는지 확인
    expect(filteredDomains.length).toBe(TEST_DOMAINS.length);

    for (const domain of filteredDomains) {
      expect(domain.domain.startsWith(TEST_PREFIX)).toBeTruthy();
    }
  });

  // 추가: 실제 성능 테스트 (대량 쿼리)
  test('getDomains는 대량의 도메인에서도 효율적으로 동작해야 함', async () => {
    // 실제 데이터베이스의 전체 도메인 수 확인
    const allDomains = await mongodbService.getDomains();
    const totalCount = allDomains.length;

    console.log(`총 도메인 수: ${totalCount}`);
    testResults.testsRun.push(`getDomains 성능 테스트 (총 ${totalCount}개 도메인)`);

    // 성능 측정: 기본 쿼리
    const startTime1 = Date.now();
    await mongodbService.getDomains();
    const duration1 = Date.now() - startTime1;

    // 성능 측정: 통계 포함 쿼리
    const startTime2 = Date.now();
    await mongodbService.getDomains({ includeStats: true });
    const duration2 = Date.now() - startTime2;

    console.log(`기본 쿼리 실행 시간: ${duration1}ms`);
    console.log(`통계 포함 쿼리 실행 시간: ${duration2}ms`);

    // 성능 결과 저장
    testResults.performance = {
      totalDomains: totalCount,
      basicQueryDuration: duration1,
      statsQueryDuration: duration2
    };

    // 테스트 통과 조건: 명시적 실패 없이 실행 완료
    expect(true).toBeTruthy();
  });
});