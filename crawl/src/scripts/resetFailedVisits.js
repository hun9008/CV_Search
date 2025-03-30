require('module-alias/register');
const { VisitResult } = require('@models/visitResult');
const { mongoService } = require('@database/mongodb-service');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * 특정 도메인에서 방문 실패한(success=false) URL의 방문 상태를 재설정합니다.
 * @param {string} domainName - 재설정할 도메인 이름 (예: 'example.com')
 * @returns {Promise<{success: boolean, count: number, message: string}>} 작업 결과
 */
async function resetFailedVisitsForDomain(domainName) {
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

    // 방문에 실패한 URL들을 찾아 방문 상태 초기화
    if (domainDoc.suburl_list && domainDoc.suburl_list.length > 0) {
      // 각 URL 항목을 순회하며 success=false인 항목의 visited를 false로 변경
      domainDoc.suburl_list.forEach(urlItem => {
        if (urlItem.visited === true && urlItem.success === false) {
          urlItem.visited = false;
          urlItem.visitedAt = null;
          // 에러 정보 초기화 (선택 사항)
          urlItem.errors = [];
          resetCount++;
        }
      });

      // 변경사항 저장
      domainDoc.updated_at = new Date();
      await domainDoc.save();

      logger.info(`도메인 '${domainName}'의 방문 실패한 ${resetCount}개 URL 방문 상태가 재설정되었습니다.`);

      return {
        success: true,
        count: resetCount,
        message: `도메인 '${domainName}'의 방문 실패한 ${resetCount}개 URL 방문 상태가 재설정되었습니다.`
      };
    } else {
      return {
        success: true,
        count: 0,
        message: `도메인 '${domainName}'에 재설정할 URL이 없습니다.`
      };
    }

  } catch (error) {
    logger.error(`도메인 '${domainName}'의 실패 URL 방문 상태 재설정 중 오류 발생:`, error);
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

/**
 * 특정 도메인에서 방문 실패한 URL의 상세 통계를 출력합니다.
 * @param {string} domainName - 분석할 도메인 이름
 * @returns {Promise<{success: boolean, stats: Object, message: string}>} 통계 정보
 */
async function getFailedVisitStats(domainName) {
  try {
    // MongoDB 연결
    await mongoService.connect();

    // 도메인 문서 찾기
    const domainDoc = await VisitResult.findOne({ domain: domainName });

    if (!domainDoc || !domainDoc.suburl_list) {
      return {
        success: false,
        stats: {},
        message: `도메인 '${domainName}'을 찾을 수 없거나 URL 목록이 없습니다.`
      };
    }

    // 통계 정보 초기화
    const stats = {
      totalUrls: domainDoc.suburl_list.length,
      visitedUrls: 0,
      successfulVisits: 0,
      failedVisits: 0,
      errorTypes: {}
    };

    // 통계 데이터 수집
    domainDoc.suburl_list.forEach(urlItem => {
      if (urlItem.visited) {
        stats.visitedUrls++;

        if (urlItem.success) {
          stats.successfulVisits++;
        } else {
          stats.failedVisits++;

          // 에러 유형별 카운트 (있는 경우)
          if (urlItem.errors && urlItem.errors.length > 0) {
            urlItem.errors.forEach(error => {
              const errorType = error.type || 'unknown';
              stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
            });
          }
        }
      }
    });

    return {
      success: true,
      stats,
      message: `도메인 '${domainName}'의 방문 통계 분석 완료`
    };
  } catch (error) {
    logger.error(`도메인 '${domainName}'의 방문 통계 분석 중 오류 발생:`, error);
    return {
      success: false,
      stats: {},
      message: `오류 발생: ${error.message}`
    };
  }
}

// 스크립트를 직접 실행할 경우 사용하는 코드
if (require.main === module) {
  // 명령줄 인수에서 도메인 이름과 옵션 가져오기
  const domainName = process.argv[2];
  const showStats = process.argv.includes('--stats');

  if (!domainName) {
    console.log('사용법: node resetFailedVisits.js <도메인명> [--stats]');
    console.log('  --stats: 재설정 전에 실패한 URL 통계 표시');
    process.exit(1);
  }

  // 통계 요청이 있으면 먼저 통계 표시
  const runScript = async () => {
    if (showStats) {
      const statsResult = await getFailedVisitStats(domainName);
      if (statsResult.success) {
        console.log('\n===== 방문 통계 =====');
        console.log(`총 URL 수: ${statsResult.stats.totalUrls}`);
        console.log(`방문한 URL 수: ${statsResult.stats.visitedUrls}`);
        console.log(`성공한 방문 수: ${statsResult.stats.successfulVisits}`);
        console.log(`실패한 방문 수: ${statsResult.stats.failedVisits}`);

        if (Object.keys(statsResult.stats.errorTypes).length > 0) {
          console.log('\n----- 에러 유형별 통계 -----');
          Object.entries(statsResult.stats.errorTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}개`);
          });
        }
        console.log('======================\n');
      } else {
        console.warn(statsResult.message);
      }
    }

    // 실패한 URL 재설정 실행
    const result = await resetFailedVisitsForDomain(domainName);
    console.log(result.message);

    // MongoDB 연결 종료
    await mongoService.disconnect();
    process.exit(result.success ? 0 : 1);
  };

  runScript().catch(err => {
    console.error('실행 중 오류 발생:', err);
    process.exit(1);
  });
}

module.exports = {
  resetFailedVisitsForDomain,
  getFailedVisitStats
};