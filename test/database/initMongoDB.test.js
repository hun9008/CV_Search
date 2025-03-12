const { MongoClient } = require('mongodb');
const { initMongoDB } = require('../../src/database/init-mongodb');
const { TEST_DATABASE } = require('../../src/crawl/config');

describe('initMongoDB', () => {
  let client;

  // 각 테스트 후에 연결 종료
  afterEach(async () => {
    if (client) {
      await client.close();
      client = null;
    }
  });

  test('MongoDB를 초기화하면 domains 컬렉션이 생성되어야 함', async () => {
    // 테스트에 사용할 MongoDB 연결 정보
    const test_db_url = TEST_DATABASE.MONGODB_ADMIN_URI;
    const test_db_name = TEST_DATABASE.MONGODB_DB_NAME;

    try {
      // MongoDB 초기화 실행
      console.log('MongoDB 초기화 시작...');
      await initMongoDB(test_db_url, test_db_name);
      console.log('MongoDB 초기화 완료');

      // MongoDB에 직접 연결하여 컬렉션 확인
      console.log('MongoDB에 연결하여 컬렉션 확인 중...');
      client = new MongoClient(test_db_url);
      await client.connect();

      // 컬렉션 목록 조회
      const db = client.db(test_db_name);
      const collections = await db.listCollections().toArray();

      // 컬렉션 이름 배열로 변환
      const collectionNames = collections.map(collection => collection.name);
      console.log('발견된 컬렉션:', collectionNames);

      // domains 컬렉션이 존재하는지 확인
      expect(collectionNames).toContain('domains');

      // 추가: domains 컬렉션에 인덱스가 생성되었는지 확인
      if (collectionNames.includes('domains')) {
        const indexes = await db.collection('domains').indexes();
        console.log('domains 컬렉션 인덱스:', indexes);

        // domain 필드에 대한 인덱스가 존재하는지 확인
        const hasDomainIndex = indexes.some(index =>
          index.key && (index.key.domain === 1 || index.key.domain === -1)
        );

        expect(hasDomainIndex).toBe(true);
      }

    } catch (error) {
      console.error('테스트 중 오류 발생:', error);
      throw error;
    }
  }, 30000); // 타임아웃 30초로 설정

  test('domains 컬렉션에 도메인을 추가한 후 조회할 수 있어야 함', async () => {
    // 테스트에 사용할 MongoDB 연결 정보
    const test_db_url = TEST_DATABASE.MONGODB_ADMIN_URI;
    const test_db_name = TEST_DATABASE.MONGODB_DB_NAME;
    const testDomain = `test-domain-${Date.now()}.com`;

    try {
      // MongoDB에 직접 연결
      client = new MongoClient(test_db_url);
      await client.connect();
      const db = client.db(test_db_name);

      // 테스트 도메인 데이터 생성
      const domainData = {
        domain: testDomain,
        url: `https://${testDomain}`,
        created_at: new Date(),
        updated_at: new Date(),
        suburl_list: []
      };

      // domains 컬렉션에 테스트 데이터 삽입
      console.log(`테스트 도메인 추가 중: ${testDomain}`);
      await db.collection('domains').insertOne(domainData);

      // 도메인 조회
      const result = await db.collection('domains').findOne({ domain: testDomain });

      // 결과 확인
      expect(result).not.toBeNull();
      expect(result.domain).toBe(testDomain);
      expect(result.url).toBe(`https://${testDomain}`);

      // 테스트 후 테스트 데이터 정리
      console.log(`테스트 도메인 삭제 중: ${testDomain}`);
      await db.collection('domains').deleteOne({ domain: testDomain });

    } catch (error) {
      console.error('테스트 중 오류 발생:', error);
      throw error;
    }
  }, 15000); // 타임아웃 15초로 설정

  test('domains 컬렉션의 도메인에 suburl을 추가할 수 있어야 함', async () => {
    // 테스트에 사용할 MongoDB 연결 정보
    const test_db_url = TEST_DATABASE.MONGODB_ADMIN_URI;
    const test_db_name = TEST_DATABASE.MONGODB_DB_NAME;
    const testDomain = `test-domain-${Date.now()}.com`;

    try {
      // MongoDB에 직접 연결
      client = new MongoClient(test_db_url);
      await client.connect();
      const db = client.db(test_db_name);

      // 테스트 도메인 데이터 생성
      const domainData = {
        domain: testDomain,
        url: `https://${testDomain}`,
        created_at: new Date(),
        updated_at: new Date(),
        suburl_list: []
      };

      // domains 컬렉션에 테스트 데이터 삽입
      console.log(`테스트 도메인 추가 중: ${testDomain}`);
      await db.collection('domains').insertOne(domainData);

      // suburl 추가
      const suburl = {
        url: `https://${testDomain}/test-page`,
        visited: false,
        text: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log(`suburl 추가 중: ${suburl.url}`);
      await db.collection('domains').updateOne(
        { domain: testDomain },
        { $push: { suburl_list: suburl } }
      );

      // 도메인 조회
      const result = await db.collection('domains').findOne({ domain: testDomain });

      // 결과 확인
      expect(result).not.toBeNull();
      expect(result.suburl_list.length).toBe(1);
      expect(result.suburl_list[0].url).toBe(`https://${testDomain}/test-page`);
      expect(result.suburl_list[0].visited).toBe(false);

      // 테스트 후 테스트 데이터 정리
      console.log(`테스트 도메인 삭제 중: ${testDomain}`);
      await db.collection('domains').deleteOne({ domain: testDomain });

    } catch (error) {
      console.error('테스트 중 오류 발생:', error);
      throw error;
    }
  }, 15000); // 타임아웃 15초로 설정
});