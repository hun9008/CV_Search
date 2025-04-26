const RecruitInfo = require('@models/recruitInfo');
const { defaultLogger: logger } = require('@utils/logger');
const { mongoService } = require('@database/mongodb-service');

/**
 * 채용 정보 검색 및 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getJobs = async (req, res) => {
  try {
    await mongoService.connect();
    const {
      keywords = '',
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

    // 총 결과 수 카운트 쿼리 실행
    const total = await RecruitInfo.countDocuments(searchQuery);

    // 검색 쿼리 실행 (페이지네이션 적용)
    const jobs = await RecruitInfo.find(searchQuery)
      .sort({ created_at: -1 }) // 최신순으로 정렬
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
    logger.error('채용정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '채용정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * ID로 특정 채용정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getJobById = async (req, res) => {
  try {
      await mongoService.connect();
    const { id } = req.params;

    const job = await RecruitInfo.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: '해당 ID의 채용정보를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      job
    });

  } catch (error) {
    logger.error('채용정보 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '채용정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
};