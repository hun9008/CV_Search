import { Request, Response } from 'express';
import { RecruitInfoModel } from '../../models/recruitinfoModel';
import { VisitResultModel } from '../../models/visitResult';
import { defaultLogger as logger } from '../../utils/logger';
import { PipelineStage } from 'mongoose';

/**
 * URL 통계 응답 인터페이스
 */
interface UrlStatsResponse {
  success: boolean;
  data: {
    visitUrlStats: {
      total_visits: number;
      total_sub_urls: number;
      analyzed_urls: number;
      recruit_urls: number;
      non_recruit_urls: number;
      analysis_ratio: number;
    };
    urlTimeline: Array<{
      date: string;
      total_urls: number;
      recruit_urls: number;
      non_recruit_urls: number;
    }>;
  };
  error?: string;
}

/**
 * 일반 통계 응답 인터페이스
 */
interface StatsResponse {
  success: boolean;
  data: {
    recruitmentStats: {
      total: number;
    };
    jobTypeStats: {
      total: number;
      types: Record<string, number>;
    };
    experienceStats: {
      total: number;
      types: Record<string, number>;
    };
    timelineStats: Array<{
      date: string;
      count: number;
    }>;
    visitUrlStats: {
      total_visits: number;
      total_sub_urls: number;
      analyzed_urls: number;
      recruit_urls: number;
      non_recruit_urls: number;
      analysis_ratio: number;
    };
  };
  error?: string;
}

/**
 * 직무 유형 통계 응답 인터페이스
 */
interface JobTypeStatsResponse {
  success: boolean;
  data: Array<{
    type: string;
    count: number;
  }>;
  error?: string;
}

/**
 * 경력 요구사항 통계 응답 인터페이스
 */
interface ExperienceStatsResponse {
  success: boolean;
  data: Array<{
    experience: string;
    count: number;
  }>;
  error?: string;
}

/**
 * 도메인별 통계 응답 인터페이스
 */
interface DomainStatsResponse {
  success: boolean;
  data: Array<{
    domain: string;
    count: number;
  }>;
  error?: string;
}

/**
 * 방문 URL 통계 조회
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 * @returns URL 통계 데이터
 */
const getUrlStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Mongoose 모델 직접 사용

    // 전체 VisitResult 문서 수 조회
    const totalVisits = await VisitResultModel.countDocuments({});

    // URL 분석 통계
    const urlStats = await VisitResultModel.aggregate<{
      total_sub_urls: number;
      analyzed_urls: number;
      recruit_urls: number;
      non_recruit_urls: number;
    }>([
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
    ] as PipelineStage[]);

    // 날짜별 URL 처리 통계 (최근 10일)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const urlTimeline = await VisitResultModel.aggregate<{
      _id: string;
      total_urls: number;
      recruit_urls: number;
      non_recruit_urls: number;
    }>([
      {
        $match: {
          created_at: { $gte: tenDaysAgo }
        }
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
          _id: "$date",
          total_urls: { $sum: "$total_sub_urls" },
          recruit_urls: { $sum: "$recruit_urls" },
          non_recruit_urls: { $sum: "$non_recruit_urls" }
        }
      }
    ] as PipelineStage[]);

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
    } as UrlStatsResponse);

  } catch (error) {
    logger.error('URL 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: `URL 통계 데이터를 조회하는 중 오류가 발생했습니다: ${(error as Error).message}`
    });
  }
};

/**
 * 통계 요약 정보 조회
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 * @returns 통계 데이터 JSON
 */
const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 총 채용공고 수 (Mongoose 모델 직접 사용)

    const totalRecruitments = await RecruitInfoModel.countDocuments({});

    // 채용 공고 직무 유형별 통계
    const jobTypes = await RecruitInfoModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $group: {
          _id: "$job_type",
          count: { $sum: 1 }
        }
      }
    ] as PipelineStage[]);

    // 직무 유형 데이터 가공
    const jobTypeMap: Record<string, number> = {};
    jobTypes.forEach(type => {
      const typeName = type._id || 'Not specified';
      jobTypeMap[typeName] = type.count;
    });

    // 날짜별 채용공고 통계 (최근 10일)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const timelineData = await RecruitInfoModel.aggregate<{
      _id: string;
      count: number;
    }>([
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
    ] as PipelineStage[]);

    // 경력 수준별 채용공고 수
    const experienceStats = await RecruitInfoModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $group: {
          _id: "$experience",
          count: { $sum: 1 }
        }
      }
    ] as PipelineStage[]);

    // 경력 수준 데이터 가공
    const experienceMap: Record<string, number> = {};
    experienceStats.forEach(exp => {
      const expName = exp._id || 'Not specified';
      experienceMap[expName] = exp.count;
    });

    // URL 통계 - Mongoose 모델 사용
    const urlStats = await VisitResultModel.aggregate<{
      _id: null;
      total_visits: number;
      total_sub_urls: number;
      analyzed_urls: number;
      recruit_urls: number;
      non_recruit_urls: number;
    }>([
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
    ] as PipelineStage[]);

    // URL 통계 데이터 준비
    let visitUrlStats = {
      total_visits: await VisitResultModel.countDocuments({}),
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
    } as StatsResponse);

  } catch (error) {
    logger.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: `통계 데이터를 조회하는 중 오류가 발생했습니다: ${(error as Error).message}`
    });
  }
};

/**
 * 직무 유형 통계 조회
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 * @returns 직무 유형 통계 데이터
 */
const getJobTypeStats = async (req: Request, res: Response): Promise<void> => {
  try {

    const jobTypesData = await RecruitInfoModel.aggregate([
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
    } as JobTypeStatsResponse);
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
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 * @returns 경력 요구사항 통계 데이터
 */
const getExperienceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 경력 요구사항별 집계

    const experienceData = await RecruitInfoModel.aggregate([
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
    } as ExperienceStatsResponse);
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
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 * @returns 도메인별 채용공고 통계 데이터
 */
const getDomainStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 도메인별 채용공고 수 집계 (상위 10개)

    const domainData = await RecruitInfoModel.aggregate([
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
    } as DomainStatsResponse);
  } catch (error) {
    logger.error('도메인별 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '도메인별 통계를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

export default {
  getUrlStats,
  getStats,
  getJobTypeStats,
  getExperienceStats,
  getDomainStats
};