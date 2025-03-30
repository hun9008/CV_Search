require('module-alias/register');
const { VisitResult } = require('@models/visitResult');
const { mongoService } = require('@database/mongodb-service');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * 특정 도메인의 모든 URL의 visited 상태를 false로 재설정합니다.
 * @param {string} domainName - 재설정할 도메인 이름 (예: 'example.com')
 * @returns {Promise<{success: boolean, count: number, message: string}>} 작업 결과
 */
async function resetVisitedStatusForDomain(domainName) {
  try {
    // MongoDB 연결
    await mongoService.connect();

    // 도메인 문서 찾기
    const domainDoc = await VisitResult.findOne({ domain: domainName });

    if (!domainDoc) {
      return {
        success: false,
        count: 0,
        message: `도메인 '${domainName}'을 찾을 수 없습니다.`
      };
    }

    let resetCount = 0;

    // 모든 URL의 visited 상태를 false로 설정
    if (domainDoc.suburl_list && domainDoc.suburl_list.length > 0) {
      // 각 URL 항목을 순회하며 visited를 false로 변경
      domainDoc.suburl_list.forEach(urlItem => {
        if (urlItem.visited === true) {
          urlItem.visited = false;
          // 방문 시간 정보도 필요하다면 재설정
          urlItem.visitedAt = null;
          resetCount++;
        }
      });

      // 변경사항 저장
      domainDoc.updated_at = new Date();
      await domainDoc.save();

      logger.info(`도메인 '${domainName}'의 ${resetCount}개 URL 방문 상태가 재설정되었습니다.`);

      return {
        success: true,
        count: resetCount,
        message: `도메인 '${domainName}'의 ${resetCount}개 URL 방문 상태가 재설정되었습니다.`
      };
    } else {
      return {
        success: true,
        count: 0,
        message: `도메인 '${domainName}'에 재설정할 URL이 없습니다.`
      };
    }

  } catch (error) {
    logger.error(`도메인 '${domainName}'의 방문 상태 재설정 중 오류 발생:`, error);
    return {
      success: false,
      count: 0,
      message: `오류 발생: ${error.message}`
    };
  } finally {
    // 연결 종료는 선택적으로 수행 (다른 작업이 있을 수 있음)
    // await mongoService.disconnect();
  }
}

// 스크립트를 직접 실행할 경우 사용하는 코드
if (require.main === module) {
  // 명령줄 인수에서 도메인 이름 가져오기
  const domainName = process.argv[2];

  if (!domainName) {
    console.error('사용법: node resetVisitedStatus.js <도메인명>');
    process.exit(1);
  }

  // 실행
  resetVisitedStatusForDomain(domainName)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('실행 중 오류 발생:', err);
      process.exit(1);
    });
}

module.exports = { resetVisitedStatusForDomain };