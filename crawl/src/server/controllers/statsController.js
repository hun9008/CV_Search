/**
 * 통계 컨트롤러
 * 통계 데이터 조회 관련 기능 처리
 */
const RecruitInfo = require('@models/recruitInfo');
const { VisitResult } = require('@models/visitResult');

const { mongoService } = require('@database/mongodb-service');
const { defaultLogger: logger } = require('@utils/logger');


/**
 * 방문 URL 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} URL 통계 데이터
 */
exports.getUrlStats = async (req, res) => {
  try {
    // Mongoose 모델 직접 사용
    await mongoService.connect();

    // 전체 VisitResult 문서 수 조회
    const totalVisits = await VisitResult.countDocuments({});

    // URL 분석 통계
    const urlStats = await VisitResult.aggregate([
      {
        $project: {
          total_sub_urls: { $size: { $ifNull: ["$suburl_list", []] } },
          analyzed_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $ifNull: ["$$url.isRecruit", false] }
              }
            }
          },
          recruit_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $eq: ["$$url.isRecruit", true] }
              }
            }
          },
          non_recruit_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $eq: ["$$url.isRecruit", false] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total_sub_urls: { $sum: "$total_sub_urls" },
          analyzed_urls: { $sum: "$analyzed_urls" },
          recruit_urls: { $sum: "$recruit_urls" },
          non_recruit_urls: { $sum: "$non_recruit_urls" }
        }
      }
    ]);

    // 날짜별 URL 처리 통계 (최근 10일)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const urlTimeline = await VisitResult.aggregate([
      {
      },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          total_sub_urls: { $size: { $ifNull: ["$suburl_list", []] } },
          recruit_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $eq: ["$$url.isRecruit", true] }
              }
            }
          },
          non_recruit_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $eq: ["$$url.isRecruit", false] }
              }
            }
          }
        }
      },
      {
        $group: {
          total_urls: { $sum: "$total_sub_urls" },
          recruit_urls: { $sum: "$recruit_urls" },
          non_recruit_urls: { $sum: "$non_recruit_urls" }
        }
      },

    ]);

    // 응답 데이터 준비
    let visitUrlStats = {
      total_visits: totalVisits,
      total_sub_urls: 0,
      analyzed_urls: 0,
      recruit_urls: 0,
      non_recruit_urls: 0,
      analysis_ratio: 0
    };


    if (urlStats.length > 0) {
      const stats = urlStats[0];
      visitUrlStats = {
        total_visits: totalVisits,
        total_sub_urls: stats.total_sub_urls,
        analyzed_urls: stats.analyzed_urls,
        recruit_urls: stats.recruit_urls,
        non_recruit_urls: stats.non_recruit_urls,
        analysis_ratio: stats.total_sub_urls > 0
          ? Math.round((stats.analyzed_urls / stats.total_sub_urls) * 100)
          : 0
      };

      console.log(visitUrlStats);
    }

    // 응답 반환
    res.status(200).json({
      success: true,
      data: {
        visitUrlStats,
        urlTimeline: urlTimeline.map(item => ({
          date: item._id,
          total_urls: item.total_urls,
          recruit_urls: item.recruit_urls,
          non_recruit_urls: item.non_recruit_urls
        }))
      }
    });

  } catch (error) {
    logger.error('URL 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'URL 통계 데이터를 조회하는 중 오류가 발생했습니다: ' + error.message
    });
  }
};

/**
 * 통계 요약 정보 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 통계 데이터 JSON
 */
exports.getStats = async (req, res) => {
  try {
    // 총 채용공고 수 (Mongoose 모델 직접 사용)
    await mongoService.connect();

    const totalRecruitments = await RecruitInfo.countDocuments({});

    // 채용 공고 직무 유형별 통계
    const jobTypes = await RecruitInfo.aggregate([
      {
        $group: {
          _id: "$job_type",
          count: { $sum: 1 }
        }
      }
    ]);

    // 직무 유형 데이터 가공
    const jobTypeMap = {};
    jobTypes.forEach(type => {
      const typeName = type._id || 'Not specified';
      jobTypeMap[typeName] = type.count;
    });

    // 날짜별 채용공고 통계 (최근 10일)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const timelineData = await RecruitInfo.aggregate([
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

    // 경력 수준별 채용공고 수
    const experienceStats = await RecruitInfo.aggregate([
      {
        $group: {
          _id: "$experience",
          count: { $sum: 1 }
        }
      }
    ]);

    // 경력 수준 데이터 가공
    const experienceMap = {};
    experienceStats.forEach(exp => {
      const expName = exp._id || 'Not specified';
      experienceMap[expName] = exp.count;
    });

    // URL 통계 - Mongoose 모델 사용
    const urlStats = await VisitResult.aggregate([
      {
        $project: {
          total_sub_urls: { $size: { $ifNull: ["$suburl_list", []] } },
          analyzed_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $ifNull: ["$$url.isRecruit", 0] }
              }
            }
          },
          recruit_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $eq: ["$$url.isRecruit", true] }
              }
            }
          },
          non_recruit_urls: {
            $size: {
              $filter: {
                input: { $ifNull: ["$suburl_list", []] },
                as: "url",
                cond: { $eq: ["$$url.isRecruit", false] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total_visits: { $sum: 1 },
          total_sub_urls: { $sum: "$total_sub_urls" },
          analyzed_urls: { $sum: "$analyzed_urls" },
          recruit_urls: { $sum: "$recruit_urls" },
          non_recruit_urls: { $sum: "$non_recruit_urls" }
        }
      }
    ]);

    // URL 통계 데이터 준비
    let visitUrlStats = {
      total_visits: await VisitResult.countDocuments({}),
      total_sub_urls: 0,
      analyzed_urls: 0,
      recruit_urls: 0,
      non_recruit_urls: 0,
      analysis_ratio: 0
    };

    if (urlStats.length > 0) {
      const stats = urlStats[0];
      visitUrlStats = {
        total_visits: stats.total_visits,
        total_sub_urls: stats.total_sub_urls,
        analyzed_urls: stats.analyzed_urls,
        recruit_urls: stats.recruit_urls,
        non_recruit_urls: stats.non_recruit_urls,
        analysis_ratio: stats.total_sub_urls > 0
          ? Math.round((stats.analyzed_urls / stats.total_sub_urls) * 100)
          : 0
      };
    }

    // 응답 데이터에 URL 통계 추가
    const statsData = {
      recruitmentStats: {
        total: totalRecruitments
      },
      jobTypeStats: {
        total: totalRecruitments,
        types: jobTypeMap
      },
      experienceStats: {
        total: totalRecruitments,
        types: experienceMap
      },
      timelineStats: timelineData.map(item => ({
        date: item._id,
        count: item.count
      })),
      // URL 통계 추가
      visitUrlStats: visitUrlStats
    };

    // 응답 반환
    res.status(200).json({
      success: true,
      data: statsData
    });

  } catch (error) {
    logger.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 데이터를 조회하는 중 오류가 발생했습니다: ' + error.message
    });
  }
};
/**
 * 직무 유형 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 직무 유형 통계 데이터
 */
exports.getJobTypeStats = async (req, res) => {
  try {
    // 직무 유형별 집계 (상위 10개)
    await mongoService.connect();

    const jobTypesData = await RecruitInfo.aggregate([
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

    // 결과 가공
    const jobTypeStats = jobTypesData.map(item => ({
      type: item._id || 'Not specified',
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: jobTypeStats
    });
  } catch (error) {
    logger.error('직무 유형 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '직무 유형 통계를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 경력 요구사항 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 경력 요구사항 통계 데이터
 */
exports.getExperienceStats = async (req, res) => {
  try {
    // 경력 요구사항별 집계
    const experienceData = await RecruitInfo.aggregate([
      {
        $group: {
          _id: "$experience",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // 결과 가공
    const experienceStats = experienceData.map(item => ({
      experience: item._id || 'Not specified',
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: experienceStats
    });
  } catch (error) {
    logger.error('경력 요구사항 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '경력 요구사항 통계를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 도메인별 채용공고 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 도메인별 채용공고 통계 데이터
 */
exports.getDomainStats = async (req, res) => {
  try {
    // 도메인별 채용공고 수 집계 (상위 10개)
    await mongoService.connect();

    const domainData = await RecruitInfo.aggregate([
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

    // 결과 가공
    const domainStats = domainData.map(item => ({
      domain: item._id || 'Unknown',
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: domainStats
    });
  } catch (error) {
    logger.error('도메인별 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '도메인별 통계를 조회하는 중 오류가 발생했습니다.'
    });
  }
};