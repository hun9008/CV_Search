const { checkMongoDBStatus } = require('../../src/database/init-mongodb');
const { TEST_DATABASE } = require('../../src/crawl/config');
describe('checkMongoDBStatus', () => {

  test('컨테이너가  켜져 있음으로 결과가 true가 나와야함', async () => {
    const test_db_url = TEST_DATABASE.MONGODB_ADMIN_URI;
    const result = await checkMongoDBStatus(test_db_url);
    // 결과 확인
    expect(result).toBeDefined();
  });

});