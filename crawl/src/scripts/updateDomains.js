/**
 * 모든 VisitResult 문서의 도메인 필드를 suburl_list 내 URL을 기준으로 업데이트하는 스크립트
 */
require('module-alias/register');
const { VisitResult, extractDomain } = require('@models/visitResult');
const mongoose = require('mongoose');
const { mongoService } = require('@database/mongodb-service');
const { defaultLogger: logger } = require('@utils/logger');

// 업데이트 진행 상황 추적을 위한 변수
let processedDocuments = 0;
let updatedDocuments = 0;
let processedSubUrls = 0;
let updatedSubUrls = 0;
let skippedDocuments = 0;
let errorDocuments = 0;

/**
 * VisitResult 문서의 도메인 필드를 업데이트하는 함수
 * suburl_list 내 URL을 기준으로 도메인을 추출하고 저장합니다.
 */
async function updateVisitResultDomains() {
  try {
    logger.info('VisitResult 문서의 도메인 업데이트 시작...');

    // 총 문서 수 파악
    const totalDocuments = await VisitResult.countDocuments();
    logger.info(`총 ${totalDocuments}개의 VisitResult 문서가 있습니다.`);

    // 모든 문서를 배치 처리 (메모리 효율성을 위해)
    const batchSize = 100; // 한 번에 처리할 문서 수
    let processed = 0;

    // 페이지네이션으로 모든 문서 처리
    while (processed < totalDocuments) {
      const visitResults = await VisitResult.find({})
        .skip(processed)
        .limit(batchSize);

      if (visitResults.length === 0) break;

      // 각 문서 처리
      for (const visitResult of visitResults) {
        try {
          processedDocuments++;
          let documentUpdated = false;

          // suburl_list 배열의 각 항목 처리 및 문서 도메인 결정
          if (visitResult.suburl_list && visitResult.suburl_list.length > 0) {
            // 도메인별 URL 카운트를 위한 객체
            const domainCounts = {};
            let subUrlsUpdated = false;

            // 1단계: 모든 subUrl의 도메인 추출 및 카운트
            for (const subUrl of visitResult.suburl_list) {
              processedSubUrls++;

              if (subUrl.url) {
                const extractedDomain = extractDomain(subUrl.url);

                if (extractedDomain) {
                  // 도메인 카운트 증가
                  if (!domainCounts[extractedDomain]) {
                    domainCounts[extractedDomain] = 0;
                  }
                  domainCounts[extractedDomain]++;

                  // subUrl 항목의 도메인 필드 업데이트
                  if (subUrl.domain !== extractedDomain) {
                    subUrl.domain = extractedDomain;
                    updatedSubUrls++;
                    subUrlsUpdated = true;
                  }
                }
              }
            }

            // 2단계: 가장 많이 등장한 도메인을 문서의 도메인으로 설정
            if (Object.keys(domainCounts).length > 0) {
              let mostFrequentDomain = null;
              let highestCount = 0;

              for (const [domain, count] of Object.entries(domainCounts)) {
                if (count > highestCount) {
                  highestCount = count;
                  mostFrequentDomain = domain;
                }
              }

              // 문서의 도메인 업데이트
              if (mostFrequentDomain && visitResult.domain !== mostFrequentDomain) {
                logger.debug(`문서 ID ${visitResult._id}의 도메인 업데이트: ${visitResult.domain || '없음'} -> ${mostFrequentDomain}`);
                visitResult.domain = mostFrequentDomain;
                documentUpdated = true;
              }
            }

            // suburl_list가 수정됐음을 표시
            if (subUrlsUpdated) {
              visitResult.markModified('suburl_list');
              documentUpdated = true;
            }
          }

          // 변경 사항이 있는 경우만 저장
          if (documentUpdated) {
            visitResult.updated_at = new Date();
            await visitResult.save();
            updatedDocuments++;
            logger.debug(`문서 ID ${visitResult._id} 업데이트 완료`);
          } else {
            skippedDocuments++;
          }
        } catch (docError) {
          errorDocuments++;
          logger.error(`문서 ID ${visitResult._id} 처리 중 오류:`, docError);
        }

        // 진행 상황 로깅 (100개마다)
        if (processedDocuments % 100 === 0) {
          logger.info(`진행 상황: ${processedDocuments}/${totalDocuments} 문서 처리 (${Math.round(processedDocuments/totalDocuments*100)}%)`);
          logProgress();
        }
      }

      processed += visitResults.length;
    }

    logger.info('VisitResult 문서의 도메인 업데이트 완료!');
    logProgress();

  } catch (error) {
    logger.error('도메인 업데이트 처리 중 오류 발생:', error);
  }
}

/**
 * 진행 상황 로깅
 */
function logProgress() {
  logger.info(`
처리 통계:
- 처리된 문서: ${processedDocuments}
- 업데이트된 문서: ${updatedDocuments}
- 처리된 SubUrl 항목: ${processedSubUrls}
- 업데이트된 SubUrl 항목: ${updatedSubUrls}
- 건너뛴 문서 (변경 없음): ${skippedDocuments}
- 오류 발생 문서: ${errorDocuments}
  `);
}

/**
 * 메인 함수
 */
async function main() {
  try {
    logger.info('도메인 업데이트 작업 시작...');

    // 데이터베이스 연결
    await mongoService.connect();
    logger.info('MongoDB에 연결되었습니다.');

    // VisitResult 문서 업데이트
    await updateVisitResultDomains();

    logger.info('모든 도메인 업데이트 작업이 완료되었습니다!');
  } catch (error) {
    logger.error('도메인 업데이트 작업 중 오류 발생:', error);
  } finally {
    // 데이터베이스 연결 종료
    await mongoose.connection.close();
    logger.info('MongoDB 연결을 종료했습니다.');
  }
}

// 스크립트 실행
main().catch(err => {
  logger.error('스크립트 실행 중 처리되지 않은 오류:', err);
  process.exit(1);
});