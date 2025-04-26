require('dotenv').config();
require('module-alias/register');

const { defaultLogger: logger } = require('@utils/logger');
const { mysqlService } = require('../database/mysql-service');
const { mongoService } = require('@database/mongodb-service');
const mongoose = require('mongoose');
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

async function processJobData(jobData) {
  // 필수 필드가 있는지 확인
  if (!jobData.title || !jobData.company_name) {
    logger.warn('불완전한 데이터 건너뜀:', { id: jobData._id || 'unknown' });
    return false;
  }

  try {
    // 데이터 포맷 정리
    const formattedData = {
      title: jobData.title,
      company_name: jobData.company_name,
      description: jobData.description || '',
      url: jobData.url || null,
      job_type: jobData.job_type || null,
      experience: jobData.experience || null,
      department: jobData.department || null,
      requirements: jobData.requirements || null,
      preferred_qualifications: jobData.preferred_qualifications || null,
      ideal_candidate: jobData.ideal_candidate || null,
      raw_jobs_text: jobData.raw_text || '', // MongoDB의 raw_text를 MySQL의 raw_jobs_text로 매핑
      posted_at: jobData.posted_at ? new Date(jobData.posted_at) : null,
      end_date: jobData.end_date ? new Date(jobData.end_date) : null,
      created_at: new Date(),
      updated_at: new Date()
    };

    // URL을 키로 사용하여 데이터 업서트
    const result = await mysqlService.upsertJobByUrl(formattedData);
    return result;
  } catch (error) {
    logger.error('데이터 처리 중 오류:', error);
    return false;
  }
}

// MongoDB에서 완전한 데이터만 로드하는 함수
const loadCompleteJobsFromMongoDB = timeLog(async function loadCompleteJobsFromMongoDB() {
  try {
    // MongoDB 연결
    await mongoService.connect();

    // 완전한 데이터 필터링 조건
    const completeDataFilter = {
      company_name: { $exists: true, $ne: null, $nin: ['Unknown Company', '알 수 없음', '명시되지 않음'] },
      description: { $exists: true, $ne: null, $ne: 'No description available.' },
      job_type: { $exists: true, $ne: null, $ne: '' },
      experience: { $exists: true, $ne: null, $ne: '' }
    };

    // 완전한 데이터만 조회
    const completeJobs = await RecruitInfoClaude.find(completeDataFilter).lean();

    logger.info(`MongoDB에서 ${completeJobs.length}개의 완전한 채용공고 데이터를 가져왔습니다.`);
    return completeJobs;
  } catch (error) {
    logger.error('MongoDB에서 데이터 로드 중 오류:', error);
    return [];
  }
});

// MongoDB에서 IT 관련 채용공고만 로드하는 함수
const loadItJobsFromMongoDB = timeLog(async function loadItJobsFromMongoDB() {
  try {
    // MongoDB 연결
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
      ]
    };

    // IT 관련 채용공고만 조회
    const itJobs = await RecruitInfoClaude.find(itJobsFilter).lean();

    logger.info(`MongoDB에서 ${itJobs.length}개의 IT 관련 채용공고 데이터를 가져왔습니다.`);
    return itJobs;
  } catch (error) {
    logger.error('MongoDB에서 IT 관련 데이터 로드 중 오류:', error);
    return [];
  }
});

// MongoDB에서 모든 채용공고 로드하는 함수
const loadAllJobsFromMongoDB = timeLog(async function loadAllJobsFromMongoDB() {
  try {
    // MongoDB 연결
    await mongoService.connect();

    // 모든 채용공고 조회 (타임아웃 방지를 위해 제한)
    const allJobs = await RecruitInfoClaude.find({}).limit(1000).lean();

    logger.info(`MongoDB에서 ${allJobs.length}개의 채용공고 데이터를 가져왔습니다.`);
    return allJobs;
  } catch (error) {
    logger.error('MongoDB에서 모든 데이터 로드 중 오류:', error);
    return [];
  }
});

// MongoDB 데이터를 MySQL에 저장하는 함수
const processMongoDB = timeLog(async function processMongoDB(jobs) {
  let successCount = 0;
  let failCount = 0;

  logger.info(`총 ${jobs.length}개의 채용공고 처리 시작`);

  for (const job of jobs) {
    const success = await processJobData(job);
    if (success) successCount++;
    else failCount++;
  }

  logger.info(`처리 완료: 성공 ${successCount}, 실패 ${failCount}`);
  return { successCount, failCount };
});

// 메인 실행 함수
const main = timeLog(async function main() {
  try {
    logger.info('MySQL 데이터 업데이트 시작');

    // 명령줄 인수로 모드 결정
    const mode = process.argv[2] || 'complete';
    let jobs = [];

    switch (mode) {
      case 'all':
        logger.info('모든 채용공고 데이터를 MongoDB에서 가져옵니다.');
        jobs = await loadAllJobsFromMongoDB();
        break;
      case 'it':
        logger.info('IT 관련 채용공고 데이터를 MongoDB에서 가져옵니다.');
        jobs = await loadItJobsFromMongoDB();
        break;
      case 'complete':
      default:
        logger.info('완전한 채용공고 데이터를 MongoDB에서 가져옵니다.');
        jobs = await loadCompleteJobsFromMongoDB();
        break;
    }

    // 데이터 처리 및 MySQL 저장
    await processMongoDB(jobs);

    logger.info('MySQL 데이터 업데이트 완료');
    process.exit(0);
  } catch (error) {
    logger.error('프로그램 실행 중 오류:', error);
    process.exit(1);
  }
});

// MySQL 서비스 확인
if (!mysqlService.upsertJobByUrl || typeof mysqlService.upsertJobByUrl !== 'function') {
  logger.error('MySQL 서비스가 올바르게 구성되지 않았습니다. upsertJobByUrl 함수가 없습니다.');
  process.exit(1);
}

// 스크립트 실행
main();