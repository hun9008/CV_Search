const mongoose = require('mongoose');
const RecruitInfo = require('@models/recruitInfo');
const { defaultLogger: logger } = require('@utils/logger');
const { mongoService } = require('@database/mongodb-service');

// Create a model for Claude-parsed recruitment info using the same schema
const RecruitInfoClaude = mongoose.model(
  'RecruitInfoClaude',
  RecruitInfo.schema,
  'recruitinfos_claude'
);

/**
 * Claude로 파싱된 채용 정보 검색 및 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobs = async (req, res) => {
  try {
    await mongoService.connect();
    const {
      keywords = '',
      jobType = '',
      experience = '',
      search = '',
      sortBy = 'updated_at',
      limit = 50,
      page = 1
    } = req.query;

    // 유효한 숫자로 변환
    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    // 검색 쿼리 구성
    const searchQuery = {};

    // 키워드 검색 처리
    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);

      if (keywordArray.length > 0) {
        // 키워드 검색을 위한 $or 쿼리 구성
        const keywordQueries = keywordArray.map(keyword => {
          const regex = new RegExp(keyword, 'i');
          return {
            $or: [
              { company_name: regex },
              { department: regex },
              { job_type: regex },
              { experience: regex },
              { description: regex },
              { requirements: regex },
              { preferred_qualifications: regex },
              { ideal_candidate: regex }
            ]
          };
        });

        searchQuery.$and = keywordQueries;
      }
    }

    // 직무 유형 필터
    if (jobType) {
      searchQuery.job_type = { $regex: jobType, $options: 'i' };
    }

    // 경력 수준 필터
    if (experience) {
      searchQuery.experience = { $regex: experience, $options: 'i' };
    }

    // 텍스트 검색 (제목, 회사명, 설명 등)
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 정렬 기준 설정
    let sortOptions = {};
    if (sortBy === 'company_name' || sortBy === 'job_type') {
      sortOptions[sortBy] = 1; // 텍스트 필드는 오름차순
    } else {
      sortOptions[sortBy] = -1; // 날짜 필드는 내림차순
    }

    // 총 결과 수 카운트 쿼리 실행
    const total = await RecruitInfoClaude.countDocuments(searchQuery);

    // 검색 쿼리 실행 (페이지네이션 적용)
    const jobs = await RecruitInfoClaude.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // 응답 전송
    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      jobs
    });

  } catch (error) {
    logger.error('Claude 채용정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Claude 채용정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * ID로 특정 Claude 채용정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobById = async (req, res) => {
  try {
    await mongoService.connect();
    const { id } = req.params;

    const job = await RecruitInfoClaude.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: '해당 ID의 Claude 채용정보를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      job
    });

  } catch (error) {
    logger.error('Claude 채용정보 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Claude 채용정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * Claude 채용정보 필터 옵션 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobFilters = async (req, res) => {
  try {
    await mongoService.connect();

    // 중복 제거된 직무 유형 목록
    const jobTypes = await RecruitInfoClaude.distinct('job_type');

    // 중복 제거된 경력 요구사항 목록
    const experienceLevels = await RecruitInfoClaude.distinct('experience');

    res.status(200).json({
      success: true,
      jobTypes: jobTypes.filter(type => type && type.trim()),
      experienceLevels: experienceLevels.filter(level => level && level.trim())
    });

  } catch (error) {
    logger.error('Claude 채용정보 필터 옵션 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Claude 채용정보 필터 옵션을 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * Claude 채용정보 통계 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobStats = async (req, res) => {
  try {
    await mongoService.connect();

    // 총 채용공고 수
    const totalJobs = await RecruitInfoClaude.countDocuments({});

    // 직무 유형별 통계 (상위 10개)
    const jobTypeStats = await RecruitInfoClaude.aggregate([
      {
        $group: {
          _id: "$job_type",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // 경력 수준별 통계
    const experienceStats = await RecruitInfoClaude.aggregate([
      {
        $group: {
          _id: "$experience",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // 도메인별 통계 (상위 10개)
    const domainStats = await RecruitInfoClaude.aggregate([
      {
        $group: {
          _id: "$domain",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // 날짜별 통계 (최근 10일)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const dateStats = await RecruitInfoClaude.aggregate([
      {
        $match: {
          created_at: { $gte: tenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        jobTypeStats: jobTypeStats.map(item => ({
          type: item._id || 'Not specified',
          count: item.count
        })),
        experienceStats: experienceStats.map(item => ({
          level: item._id || 'Not specified',
          count: item.count
        })),
        domainStats: domainStats.map(item => ({
          domain: item._id || 'Unknown',
          count: item.count
        })),
        dateStats: dateStats.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });

  } catch (error) {
    logger.error('Claude 채용정보 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Claude 채용정보 통계를 조회하는 중 오류가 발생했습니다.'
    });
  }
};


/**
 * 완전한 데이터가 있는 Claude 채용정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getCompleteClaudeJobs = async (req, res) => {
  try {
    await mongoService.connect();
    const {
      sortBy = 'updated_at',
      limit = 50,
      page = 1
    } = req.query;

    // 유효한 숫자로 변환
    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    // 완전한 데이터를 가진 채용공고를 찾기 위한 쿼리
    const completeDataQuery = {
      // 회사명이 있고 Unknown/알 수 없음/명시되지 않음이 아님
      company_name: {
        $exists: true,
        $ne: null,
        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '']
      },

      // 직무 유형이 있고 비어있지 않음
      job_type: {
        $exists: true,
        $ne: null,
        $ne: ''
      },
      // 경력이 있고 비어있지 않음
      experience: {
        $exists: true,
        $ne: null,
        $ne: ''
      },
      // 설명이 있고 No description이 아님
      description: {
        $exists: true,
        $ne: null,
        $ne: 'No description available.',
        $ne: ''
      }
    };

    // 정렬 기준 설정
    let sortOptions = {};
    if (sortBy === 'company_name' || sortBy === 'job_type') {
      sortOptions[sortBy] = 1; // 텍스트 필드는 오름차순
    } else {
      sortOptions[sortBy] = -1; // 날짜 필드는 내림차순
    }

    // 총 결과 수 카운트 쿼리 실행
    const total = await RecruitInfoClaude.countDocuments(completeDataQuery);

    // 완전한 데이터 통계 - 모든 문서 중 완전한 데이터의 비율
    const totalAll = await RecruitInfoClaude.countDocuments({});
    const completeRatio = totalAll > 0 ? (total / totalAll * 100).toFixed(2) : 0;

    // 검색 쿼리 실행 (페이지네이션 적용)
    const jobs = await RecruitInfoClaude.find(completeDataQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // 응답 전송
    res.status(200).json({
      success: true,
      total,
      totalAll,
      completeRatio,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      jobs
    });

  } catch (error) {
    logger.error('완전한 Claude 채용정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '완전한 Claude 채용정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 데이터 완성도 통계 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getCompletionStats = async (req, res) => {
  try {
    await mongoService.connect();

    // 총 문서 수
    const totalDocs = await RecruitInfoClaude.countDocuments({});

    // 각 필드별 완성도 통계
    const fieldStats = [
      { field: 'company_name', display: '회사명' },
      { field: 'job_type', display: '직무타입' },
      { field: 'experience', display: '경력' },
      { field: 'description', display: '설명' },
      { field: 'requirements', display: '요구사항' },
      { field: 'preferred_qualifications', display: '우대사항' }
    ];

    // 각 필드별 통계 수집
    const stats = await Promise.all(fieldStats.map(async (item) => {
      // 해당 필드가 존재하고 비어있지 않은 문서 수
      const filledCount = await RecruitInfoClaude.countDocuments({
        [item.field]: { $exists: true, $ne: null, $ne: '' }
      });

      // 알 수 없음 값을 가진 문서 수
      const unknownValues = ['Unknown', '알 수 없음', '명시되지 않음'];
      const unknownCount = await RecruitInfoClaude.countDocuments({
        [item.field]: { $in: unknownValues }
      });

      return {
        field: item.field,
        display: item.display,
        filled: filledCount,
        unknown: unknownCount,
        empty: totalDocs - filledCount,
        filledPercentage: ((filledCount / totalDocs) * 100).toFixed(2),
        unknownPercentage: ((unknownCount / totalDocs) * 100).toFixed(2),
        emptyPercentage: (((totalDocs - filledCount) / totalDocs) * 100).toFixed(2)
      };
    }));

    // 완전한 데이터를 가진 문서 수 (모든 필수 필드가 채워진 문서)
    const completeDataCount = await RecruitInfoClaude.countDocuments({
      company_name: {
        $exists: true, $ne: null, $ne: '',
        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음']
      },
      title: { $exists: true, $ne: null, $ne: '' },
      job_type: { $exists: true, $ne: null, $ne: '' },
      experience: { $exists: true, $ne: null, $ne: '' },
      description: {
        $exists: true, $ne: null, $ne: '',
        $ne: 'No description available.'
      }
    });

    // 응답 전송
    res.status(200).json({
      success: true,
      totalDocuments: totalDocs,
      completeDocuments: completeDataCount,
      completePercentage: ((completeDataCount / totalDocs) * 100).toFixed(2),
      fieldStats: stats
    });

  } catch (error) {
    logger.error('Claude 채용정보 완성도 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '채용정보 완성도 통계를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

module.exports = exports;