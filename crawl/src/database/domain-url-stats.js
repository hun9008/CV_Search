require('dotenv').config();
const { MongoDBService } = require('./mongodb-service');

/**
 * 도메인별 URL 통계를 출력하는 함수
 * @param {Object} options 정렬 옵션
 */
async function printDomainUrlStats(options = {}) {
  const db = new MongoDBService();
  try {
    // 모든 도메인의 URL 통계 가져오기
    console.log('도메인별 URL 통계 가져오는 중...');
    const domains = await db.getDomainsByUrlCount(options);

    if (domains.length === 0) {
      console.log('도메인이 없습니다.');
      return;
    }

    // 전체 통계 계산
    const totalStats = domains.reduce((acc, domain) => {
      acc.totalUrls += domain.stats.total;
      acc.visitedUrls += domain.stats.visited;
      acc.pendingUrls += domain.stats.pending;
      return acc;
    }, { totalUrls: 0, visitedUrls: 0, pendingUrls: 0 });

  } catch (error) {
    console.error('도메인 통계 출력 중 오류 발생:', error);
  } finally {
    // 연결 종료
    await db.disconnect();
  }
}

// 명령행 인수 처리
const args = process.argv.slice(2);
const options = {
  sortBy: args[0] || 'total',    // 정렬 기준 ('total', 'visited', 'pending')
  sortOrder: args[1] === 'asc' ? 1 : -1,  // 정렬 순서 ('asc' 또는 'desc')
  limit: parseInt(args[2]) || 0   // 결과 제한
};

// 스크립트 실행
printDomainUrlStats(options)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('실행 오류:', err);
    process.exit(1);
  });