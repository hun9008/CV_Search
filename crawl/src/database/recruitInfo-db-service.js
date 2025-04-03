const RecruitInfo = require('@models/recruitInfo');
const mongoose = require('mongoose');

/**
 * 채용 정보 데이터베이스 관리 서비스
 */
class RecruitInfoDbService {
  /**
   * 채용 정보 생성 또는 업데이트
   * @param {Object} jobData - 채용 정보 데이터
   * @returns {Promise<Object>} 생성/업데이트된 채용 정보
   */
  async createOrUpdate(jobData) {
    try {
      // URL이 필수 필드인지 확인
      if (!jobData.url) {
        throw new Error('URL은 필수 필드입니다');
      }

      // 같은 URL로 기존 문서 찾기
      const existingJob = await RecruitInfo.findByUrl(jobData.url);

      if (existingJob) {
        // 기존 문서 업데이트
        Object.assign(existingJob, jobData);
        await existingJob.save();
        console.log(`채용 정보 업데이트 완료: ${existingJob.url}`);
        return existingJob;
      } else {
        // 새 문서 생성
        const newJob = new RecruitInfo(jobData);
        await newJob.save();
        console.log(`새 채용 정보 생성 완료: ${newJob.url}`);
        return newJob;
      }
    } catch (error) {
      console.error('채용 정보 생성/업데이트 중 오류:', error);
      throw error;
    }
  }

  /**
   * 다수의 채용 정보 일괄 생성/업데이트
   * @param {Array<Object>} jobsData - 채용 정보 데이터 배열
   * @returns {Promise<Object>} 처리 결과 (성공 및 실패 개수)
   */
  async bulkCreateOrUpdate(jobsData) {
    if (!Array.isArray(jobsData) || jobsData.length === 0) {
      throw new Error('유효한 채용 정보 배열이 필요합니다');
    }

    const results = {
      total: jobsData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // 각 항목을 개별적으로 처리하여 일부 오류가 전체 처리를 중단하지 않도록 함
    for (const jobData of jobsData) {
      try {
        await this.createOrUpdate(jobData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          url: jobData.url || 'unknown',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 채용 정보 조회
   * @param {string} url - 조회할 채용 정보의 URL
   * @returns {Promise<Object>} 채용 정보
   */
  async getByUrl(url) {
    try {
      const job = await RecruitInfo.findByUrl(url);
      if (!job) {
        throw new Error(`URL이 ${url}인 채용 정보를 찾을 수 없습니다`);
      }
      return job;
    } catch (error) {
      console.error(`채용 정보 조회 중 오류 (URL: ${url}):`, error);
      throw error;
    }
  }

  /**
   * 모든 채용 정보 목록 조회
   * @param {Object} options - 페이지 옵션 (limit, page, sort)
   * @returns {Promise<Object>} 채용 정보 목록 및 페이지네이션 정보
   */
  async getAll(options = {}) {
    try {
      const { limit = 10, page = 1, sort = { posted_at: -1 } } = options;
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        RecruitInfo.find()
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        RecruitInfo.countDocuments()
      ]);

      return {
        results: jobs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('채용 정보 목록 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 검색 조건으로 채용 정보 조회
   * @param {Object} query - 검색 조건
   * @param {Object} options - 페이지 옵션 (limit, page, sort)
   * @returns {Promise<Object>} 채용 정보 목록 및 페이지네이션 정보
   */
  async search(query, options = {}) {
    try {
      // 키워드 검색
      if (query.keywords) {
        return this.searchByKeywords(query.keywords, options);
      }

      // 일반 필드 검색
      const { limit = 10, page = 1, sort = { posted_at: -1 } } = options;
      const skip = (page - 1) * limit;

      // 쿼리 객체 구성
      const searchQuery = {};

      if (query.company_name) {
        searchQuery.company_name = { $regex: query.company_name, $options: 'i' };
      }

      if (query.department) {
        searchQuery.department = { $regex: query.department, $options: 'i' };
      }

      if (query.experience) {
        searchQuery.experience = { $regex: query.experience, $options: 'i' };
      }

      if (query.job_type) {
        searchQuery.job_type = { $regex: query.job_type, $options: 'i' };
      }

      // 날짜 범위 검색
      if (query.start_after) {
        searchQuery.start_date = { $gte: new Date(query.start_after) };
      }

      if (query.end_before) {
        searchQuery.end_date = { $lte: new Date(query.end_before) };
      }

      // 성공/실패 필터링
      if (query.success !== undefined) {
        searchQuery.success = query.success === 'true' || query.success === true;
      }

      const [jobs, total] = await Promise.all([
        RecruitInfo.find(searchQuery)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        RecruitInfo.countDocuments(searchQuery)
      ]);

      return {
        results: jobs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('채용 정보 검색 중 오류:', error);
      throw error;
    }
  }

  /**
   * 키워드로 채용 정보 검색
   * @param {string|Array} keywords - 검색 키워드
   * @param {Object} options - 페이지 옵션 (limit, page, sort)
   * @returns {Promise<Object>} 채용 정보 목록 및 페이지네이션 정보
   */
  async searchByKeywords(keywords, options = {}) {
    try {
      const { limit = 10, page = 1 } = options;

      // 키워드를 배열로 처리
      const keywordsArray = Array.isArray(keywords)
        ? keywords
        : keywords.split(',').map(k => k.trim());

      // 채용 정보 모델의 스태틱 메서드 사용
      const jobs = await RecruitInfo.searchByKeywords(keywordsArray, {
        limit,
        page,
        sort: options.sort
      });

      // 검색 결과 총 개수 가져오기
      const searchText = keywordsArray.join(' ');
      const total = await RecruitInfo.countDocuments({
        $text: { $search: searchText }
      });

      return {
        results: jobs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('키워드 검색 중 오류:', error);
      throw error;
    }
  }

  /**
   * 채용 정보 삭제
   * @param {string} url - 삭제할 채용 정보의 URL
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteByUrl(url) {
    try {
      const result = await RecruitInfo.findOneAndDelete({ url });

      if (!result) {
        throw new Error(`URL이 ${url}인 채용 정보를 찾을 수 없습니다`);
      }

      return { success: true, message: `URL이 ${url}인 채용 정보가 삭제되었습니다` };
    } catch (error) {
      console.error(`채용 정보 삭제 중 오류 (URL: ${url}):`, error);
      throw error;
    }
  }

  /**
   * 다수의 채용 정보 일괄 삭제
   * @param {Array<string>} urls - 삭제할 채용 정보 URL 배열
   * @returns {Promise<Object>} 삭제 결과
   */
  async bulkDelete(urls) {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('유효한 URL 배열이 필요합니다');
    }

    try {
      const result = await RecruitInfo.deleteMany({ url: { $in: urls } });

      return {
        success: true,
        deleted: result.deletedCount,
        total: urls.length
      };
    } catch (error) {
      console.error('채용 정보 일괄 삭제 중 오류:', error);
      throw error;
    }
  }

  /**
   * 만료된 채용 정보 삭제
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteExpired() {
    try {
      const now = new Date();
      const result = await RecruitInfo.deleteMany({
        expires_at: { $lt: now }
      });

      return {
        success: true,
        deleted: result.deletedCount,
        message: `${result.deletedCount}개의 만료된 채용 정보가 삭제되었습니다`
      };
    } catch (error) {
      console.error('만료된 채용 정보 삭제 중 오류:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 통계 조회
   * @returns {Promise<Object>} 통계 정보
   */
  async getStats() {
    try {
      const now = new Date();

      // 동시에 여러 통계를 가져오기 위해 Promise.all 사용
      const [
        totalCount,
        successCount,
        failedCount,
        expiredCount,
        expiringCount,
        companyStats
      ] = await Promise.all([
        // 전체 채용 정보 수
        RecruitInfo.countDocuments(),

        // 성공적으로 파싱된 채용 정보 수
        RecruitInfo.countDocuments({ success: true }),

        // 파싱 실패한 채용 정보 수
        RecruitInfo.countDocuments({ success: false }),

        // 만료된 채용 정보 수
        RecruitInfo.countDocuments({ expires_at: { $lt: now } }),

        // 7일 내에 만료되는 채용 정보 수
        RecruitInfo.countDocuments({
          expires_at: {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }),

        // 회사별 채용 정보 수 통계
        RecruitInfo.aggregate([
          { $group: { _id: "$company_name", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      // 최근 추가된 채용 정보
      const recentJobs = await RecruitInfo.find()
        .sort({ posted_at: -1 })
        .limit(5)
        .select('company_name department experience job_type posted_at');

      return {
        total: totalCount,
        parsing: {
          success: successCount,
          failed: failedCount,
          successRate: totalCount > 0 ? (successCount / totalCount * 100).toFixed(2) + '%' : '0%'
        },
        expiration: {
          expired: expiredCount,
          expiringSoon: expiringCount
        },
        topCompanies: companyStats.map(item => ({
          company: item._id,
          count: item.count
        })),
        recentJobs
      };
    } catch (error) {
      console.error('통계 정보 조회 중 오류:', error);
      throw error;
    }
  }
}

module.exports = new RecruitInfoDbService();