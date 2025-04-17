require('dotenv').config();
require('module-alias/register');

const { defaultLogger: logger } = require('@utils/logger');
const { mongoService } = require('@database/mongodb-service');
const mongoose = require('mongoose');
const { VisitResult, extractDomain } = require('@models/visitResult');
const RecruitInfo = require('@models/recruitInfo');

// Create a model for Claude-parsed recruitment info using the same schema
const RecruitInfoClaude = mongoose.model(
  'RecruitInfoClaude',
  RecruitInfo.schema,
  'recruitinfos_claude'
);

// 실행 타임스탬프를 측정하는 유틸리티 함수
function timeLog(func) {
  return async function(...args) {
    const startTime = new Date();
    logger.info(`${func.name} 시작: ${startTime.toISOString()}`);

    try {
      const result = await func.apply(this, args);
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      logger.info(`${func.name} 완료: ${endTime.toISOString()} (소요시간: ${duration}초)`);
      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      logger.error(`${func.name} 실패: ${endTime.toISOString()} (소요시간: ${duration}초)`, error);
      throw error;
    }
  };
}

// URL 기반으로 VisitResult에서 타이틀 정보 가져오기
async function getTitleFromVisitResult(url) {
  try {
    const domain = extractDomain(url);
    if (!domain) return null;

    const visitResult = await VisitResult.findOne({ domain });
    if (!visitResult || !visitResult.suburl_list || visitResult.suburl_list.length === 0) return null;

    // suburl_list에서 해당 URL 찾기
    const urlEntry = visitResult.suburl_list.find(item => item.url === url);
    if (!urlEntry) return null;

    return urlEntry.title || null;
  } catch (error) {
    logger.error(`URL에서 타이틀 가져오기 오류: ${url}`, error);
    return null;
  }
}

// Claude 채용공고 단일 항목의 타이틀 업데이트
async function updateSingleJobTitle(job) {
  try {
    if (!job || !job.url) return false;

    const title = await getTitleFromVisitResult(job.url);
    if (!title) {
      logger.warn(`타이틀 정보를 찾을 수 없음: ${job.url}`);
      return false;
    }

    // 타이틀이 이미 존재하고 동일하면 업데이트하지 않음
    if (job.title && job.title === title) return true;

    // 타이틀 업데이트
    await RecruitInfoClaude.updateOne(
      { _id: job._id },
      { $set: { title: title } }
    );

    logger.info(`타이틀 업데이트 완료: ${job._id} - ${title}`);
    return true;
  } catch (error) {
    logger.error(`타이틀 업데이트 오류: ${job._id}`, error);
    return false;
  }
}

// 모든 채용공고 타이틀 업데이트
const updateAllJobTitles = timeLog(async function updateAllJobTitles() {
  try {
    await mongoService.connect();

    // 타이틀이 없거나 'Untitled Position'인 채용공고 조회
    const query = {
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' },
        { title: 'Untitled Position' }
      ],
      url: { $exists: true, $ne: null } // URL이 있는 것만 대상
    };

    // 페이지네이션 설정
    const batchSize = 100;
    let processed = 0;
    let updated = 0;
    let page = 0;
    let hasMore = true;

    logger.info('타이틀 업데이트 시작');

    // 페이지네이션으로 대량 데이터 처리
    while (hasMore) {
      const jobs = await RecruitInfoClaude.find(query)
        .skip(page * batchSize)
        .limit(batchSize)
        .lean();

      if (!jobs || jobs.length === 0) {
        hasMore = false;
        break;
      }

      logger.info(`배치 ${page + 1}: ${jobs.length}개 처리 중...`);

      // 각 채용공고 처리
      for (const job of jobs) {
        const success = await updateSingleJobTitle(job);
        if (success) updated++;
        processed++;
      }

      logger.info(`배치 ${page + 1} 완료: ${jobs.length}개 중 ${updated}개 업데이트됨`);
      page++;
    }

    logger.info(`모든 작업 완료: 총 ${processed}개 중 ${updated}개 타이틀 업데이트됨`);
    return { processed, updated };
  } catch (error) {
    logger.error('타이틀 업데이트 중 오류 발생:', error);
    throw error;
  }
});

// 수동으로 선택한 채용공고 타이틀 업데이트
const updateSelectedJobTitles = timeLog(async function updateSelectedJobTitles(filter = {}) {
  try {
    await mongoService.connect();

    // 필터에 URL이 있는지 확인
    const query = {
      ...filter,
      url: { $exists: true, $ne: null } // URL이 있는 것만 대상
    };

    const jobs = await RecruitInfoClaude.find(query).lean();
    logger.info(`선택된 채용공고: ${jobs.length}개`);

    let updated = 0;

    for (const job of jobs) {
      const success = await updateSingleJobTitle(job);
      if (success) updated++;
    }

    logger.info(`선택된 채용공고 타이틀 업데이트 완료: ${jobs.length}개 중 ${updated}개 업데이트됨`);
    return { total: jobs.length, updated };
  } catch (error) {
    logger.error('선택된 채용공고 타이틀 업데이트 중 오류 발생:', error);
    throw error;
  }
});

// 완전한 데이터를 가진 채용공고 타이틀 업데이트
const updateCompleteJobTitles = timeLog(async function updateCompleteJobTitles() {
  try {
    await mongoService.connect();

    // 완전한 데이터 필터
    const completeDataFilter = {
      company_name: { $exists: true, $ne: null, $nin: ['Unknown Company', '알 수 없음', '명시되지 않음'] },
      description: { $exists: true, $ne: null, $ne: 'No description available.' },
      job_type: { $exists: true, $ne: null, $ne: '' },
      experience: { $exists: true, $ne: null, $ne: '' },
      url: { $exists: true, $ne: null } // URL이 있는 것만 대상
    };

    return await updateSelectedJobTitles(completeDataFilter);
  } catch (error) {
    logger.error('완전한 데이터 채용공고 타이틀 업데이트 중 오류 발생:', error);
    throw error;
  }
});

// IT 관련 채용공고 타이틀 업데이트
const updateItJobTitles = timeLog(async function updateItJobTitles() {
  try {
    await mongoService.connect();

    // IT 관련 직무 키워드 정의
    const itKeywords = [
      'IT', '개발자', '프로그래머', '소프트웨어', '엔지니어', '데이터', '클라우드',
      '웹', '모바일', '앱', 'AI', '인공지능', '머신러닝', '딥러닝', '블록체인',
      'DevOps', '프론트엔드', '백엔드', '풀스택', 'Java', 'Python', 'JavaScript',
      'React', 'Angular', 'Vue', 'Node.js', '.NET', 'C#', 'C++', 'Swift', 'Kotlin',
      '데이터베이스', 'SQL', 'NoSQL', '시스템', '네트워크', '보안', 'QA', '테스트',
      '서버', 'UX', 'UI', '인프라', 'SaaS', 'PaaS', 'IaaS', 'R&D', '연구개발'
    ];

    // IT 관련 정규표현식 생성
    const itRegex = new RegExp(itKeywords.join('|'), 'i');

    // IT 관련 채용공고 필터링
    const itJobsFilter = {
      $or: [
        { title: { $regex: itRegex } },
        { description: { $regex: itRegex } },
        { job_type: { $regex: itRegex } },
        { department: { $regex: itRegex } },
        { requirements: { $regex: itRegex } }
      ],
      url: { $exists: true, $ne: null }
    };

    return await updateSelectedJobTitles(itJobsFilter);
  } catch (error) {
    logger.error('IT 관련 채용공고 타이틀 업데이트 중 오류 발생:', error);
    throw error;
  }
});

// 메인 함수
const main = timeLog(async function main() {
  try {
    logger.info('채용공고 타이틀 업데이트 시작');

    // 명령줄 인수 처리
    const mode = process.argv[2] || 'all';

    switch (mode) {
      case 'complete':
        logger.info('완전한 데이터 채용공고 타이틀 업데이트');
        await updateCompleteJobTitles();
        break;

      case 'it':
        logger.info('IT 관련 채용공고 타이틀 업데이트');
        await updateItJobTitles();
        break;

      case 'all':
      default:
        logger.info('모든 채용공고 타이틀 업데이트');
        await updateAllJobTitles();
        break;
    }

    logger.info('채용공고 타이틀 업데이트 완료');
    process.exit(0);
  } catch (error) {
    logger.error('채용공고 타이틀 업데이트 중 오류 발생:', error);
    process.exit(1);
  }
});

// 스크립트 실행
main();