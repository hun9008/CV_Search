require('module-alias/register');
const { MongoDBService } = require('@database/mongodb-service');

// 즉시 실행 비동기 함수 사용
(async function() {
  try {
    console.log('모든 도메인의 URL 방문 상태 초기화를 시작합니다...');
    const db = new MongoDBService();

    // 이제 여기서 await 사용 가능
    const result = await db.resetAllVisitedStatus();

    console.log('초기화 완료!');
    console.log(`총 ${result.totalDomains}개 도메인, ${result.totalUrls}개 URL 중 ${result.updatedUrls}개 초기화됨`);

    // 작업 완료 후 연결 닫기
    await db.disconnect();

    process.exit(0); // 정상 종료
  } catch (error) {
    console.error('초기화 중 오류 발생:', error);
    process.exit(1); // 오류 종료
  }
})();