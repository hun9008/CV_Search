require('module-alias/register');
const getUrlSeed = require('./getUrlSeed');
const mongoose = require('mongoose');
const { VisitResult,  SubUrl ,extractDomain } = require('../models/visitResult');
const config = require('@config/config');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * seed URL을 수집하여 MongoDB의 VisitResult 모델에 저장
 */
async function saveSeedsToMongoDB() {
  let totalDomainsAdded = 0;
  let totalUrlsAdded = 0;

  try {
    logger.info('URL seed 생성 시작...');

    // URL 수집을 위한 객체 초기화
    const domainMap = new Map();
    let urlCount = 0;

    // 제너레이터 함수에서 URL 수집
    for await (const url of getUrlSeed()) {
      urlCount++;
      logger.info("URL에서 도메인 추출");
      // URL에서 도메인 추출
      const domain = extractDomain(url);
      logger.info(`도메인 : ${domain}`);
      if (!domain) continue;

      logger.info('MongoDB에 연결 중...');
        await mongoose.connect(process.env.MONGODB_ADMIN_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          dbName: 'crwal_db',
        });

      try {
        // 도메인이 이미 존재하는지 확인
      const existingDomain = await VisitResult.findOne({ domain: domain });

      if (existingDomain) {
        logger.info(`도메인 ${domain}: 이미 존재하는 도메인 건너뜀`);
      } else {
        // 새 도메인 추가
        const newDomain = new VisitResult({
          domain: domain,
          url: url,
          suburl_list: [new SubUrl({ url:url })],
          created_at: new Date(),
          updated_at: new Date()
        });

        await newDomain.save();

        logger.info(`도메인 ${domain} URL 추가됨 (새 도메인)`);
      }
    } catch (error) {
      logger.error(`도메인 ${domain} 처리 중 오류: ${error.message}`);
      logger.error(error.stack);
    }


    // 최종 통계 출력
    logger.info(`URL seed 처리 완료: ${totalDomainsAdded}개의 새 도메인, ${totalUrlsAdded}개의 URL 추가됨`);

    }

  } catch (error) {
    logger.error(`URL seed 생성 및 MongoDB 저장 중 오류: ${error.message}`);
    logger.error(error.stack);
  } finally {
    // MongoDB 연결 종료
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  saveSeedsToMongoDB().catch(error => {
    logger.error(`실행 중 예상치 못한 오류: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  });
}

module.exports = {
  saveSeedsToMongoDB
};