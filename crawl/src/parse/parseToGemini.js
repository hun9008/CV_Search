require('module-alias/register');
require('dotenv');
const { VisitResult ,extractDomain } = require('@models/visitResult');
const RecruitInfo = require('@models/recruitInfo');
const { mongoService } = require('@database/mongodb-service');
const { GeminiService } = require('@parse/geminiService'); // Gemini API 서비스
const { defaultLogger: logger } = require('@utils/logger');

/**
 * 채용공고 파싱 및 필터링을 관리하는 클래스
 */
class ParseManager {
  /**
   * ParseManager 생성자
   * @param {Object} options - 옵션 객체
   * @param {number} options.batchSize - 한 번에 처리할 URL 수 (기본값: 10)
   * @param {number} options.maxRetries - 실패 시 재시도 횟수 (기본값: 3)
   * @param {number} options.delayBetweenRequests - 요청 간 지연 시간(ms) (기본값: 1000)
   */
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.maxRetries = options.maxRetries || 3;
    this.delayBetweenRequests = options.delayBetweenRequests || 1000;
    this.geminiService = new GeminiService();
    this.isRunning = false;
    this.stats = {
      processed: 0,
      isRecruit: 0,
      notRecruit: 0,
      failed: 0,
      saved: 0
    };
  }

  /**
   * MongoDB에 연결
   */
  async connect() {
    try {
      await mongoService.connect();
      logger.debug('MongoDB에 연결되었습니다.');
    } catch (error) {
      logger.error('MongoDB 연결 오류:', error);
      throw error;
    }
  }

  /**
   * 미분류된 URL을 추출
   * @param {number} limit - 추출할 URL 수
   * @returns {Promise<Array>} 미분류 URL 객체 배열
   */
  async fetchUnclassifiedUrls(limit = this.batchSize) {
    try {
      await this.connect();

      // 미분류(isRecruit가 null) URL 추출 집계 파이프라인
      const pipeline = [
        { $match: { 'suburl_list.visited': true, 'suburl_list.success': true } },
        { $unwind: '$suburl_list' },
        {
          $match: {
            'suburl_list.visited': true,
            'suburl_list.success': true,
            $or: [
              { 'suburl_list.isRecruit': null },
              { 'suburl_list.isRecruit': { $exists: false } }
            ]
          }
        },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            domain: 1,
            url: '$suburl_list.url',
            text: '$suburl_list.text',
            title: '$suburl_list.title',
            visitedAt: '$suburl_list.visitedAt'
          }
        }
      ];

      const urls = await VisitResult.aggregate(pipeline);
      logger.debug(`${urls.length}개의 미분류 URL 추출 완료`);
      return urls;
    } catch (error) {
      logger.error('미분류 URL 추출 오류:', error);
      throw error;
    }
  }

/**
 * URL이 채용공고인지 Gemini API로 판별
 * @param {Object} urlData - URL 데이터 객체
 * @returns {Promise<Object>} 판별 결과와 파싱된 데이터
 */
async requestUrlParse(urlData) {
  const startTime = Date.now();

  try {
    const { url, title, text } = urlData;

    // 분석할 콘텐츠 구성
    const content = `
    Title: ${title || ''}

    Content:
    ${text?.substring(0, 5000) || ''} // 텍스트가 너무 길면 잘라냄
    `;

    logger.debug(`URL 내용 분석 요청: ${url}`);
    const response = await this.geminiService.parseRecruitment(content);

    const runtime = Date.now() - startTime;
    logger.eventInfo('parse_url_content', {
      url: url,
      isRecruit: response?.success || false,
      contentLength: content.length,
      runtime: runtime
    });

    return response;
  } catch (error) {
    const runtime = Date.now() - startTime;
    logger.warn(`텍스트 업무 내용으로 변환 중 오류: ${error}`);
    logger.eventError('parse_url_content_error', {
      url: urlData?.url,
      error: error.message,
      runtime: runtime,
      stack: error.stack
    });

    throw error; // 오류를 상위로 전파하여 재시도 메커니즘이 작동하도록 함
  }
}



  /**
 * Gemini API 응답을 RecruitInfo 모델 형식으로 변환
 * @param {Object} geminiResponse - Gemini API의 응답 데이터
 * @param {Object} urlData - 원본 URL 데이터
 * @returns {Object} RecruitInfo -모델에 맞게 변환된 객체
 */
convertToRecruitInfoSchema(geminiResponse, urlData) {
  try {
    logger.debug('채용공고 데이터 변환 시작', { url: urlData.url });

    if (!geminiResponse.success) {
      logger.warn('채용공고가 아닌 데이터에 대한 변환 시도', { url: urlData.url });
      return null;
    }

    // 기본 날짜 설정 (현재 날짜 및 30일 후)
    const currentDate = new Date();
    const defaultEndDate = new Date();
    defaultEndDate.setDate(currentDate.getDate() + 30);

    // 날짜 파싱 함수
    const parseDate = (dateStr) => {
      if (!dateStr) return null;

      try {
        // YYYY-MM-DD 형식 파싱
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return new Date(dateStr);
        }

        // 날짜 문자열에서 날짜 추출 시도
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }

        // 한국어 날짜 형식 처리 (예: 2023년 5월 10일)
        const koreanDateMatch = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (koreanDateMatch) {
          return new Date(
            parseInt(koreanDateMatch[1]),
            parseInt(koreanDateMatch[2]) - 1,
            parseInt(koreanDateMatch[3])
          );
        }

        return null;
      } catch (error) {
        logger.warn(`날짜 파싱 오류: ${dateStr}`, error);
        return null;
      }
    };

    // 게시 기간에서 시작일과 종료일 추출
    let startDate = null;
    let endDate = null;

    if (geminiResponse.posted_period) {
      // 게시 기간이 범위 형식인 경우 (예: 2023-01-01 ~ 2023-02-01)
      const periodMatch = geminiResponse.posted_period.match(/(.+?)\s*[~\-]\s*(.+)/);
      if (periodMatch) {
        startDate = parseDate(periodMatch[1].trim());
        endDate = parseDate(periodMatch[2].trim());
      } else {
        // 단일 날짜만 있는 경우, 종료일로 처리
        endDate = parseDate(geminiResponse.posted_period.trim());
      }
    }

    // Gemini 응답에서 직접 날짜 필드가 있는 경우 이를 우선 사용
    if (geminiResponse.start_date) {
      startDate = parseDate(geminiResponse.start_date);
    }

    if (geminiResponse.end_date) {
      endDate = parseDate(geminiResponse.end_date);
    }

    // 날짜가 유효하지 않은 경우 기본값 사용
    if (!startDate) startDate = currentDate;
    if (!endDate) endDate = defaultEndDate;

    // 원본 데이터 추출
    const { domain, url, title, text, meta, visitedAt } = urlData;

    // RecruitInfo 모델에 맞는 객체 생성
    const recruitInfo = {
      domain,
      url,
      title: title || '',
      company_name: geminiResponse.company_name || '알 수 없음',
      department: geminiResponse.department || '',
      experience: geminiResponse.experience || '',
      description: geminiResponse.description || '',
      job_type: geminiResponse.job_type || '',
      start_date: startDate,
      end_date: endDate,
      expires_at: endDate, // expires_at은 end_date와 동일하게 설정
      requirements: geminiResponse.requirements || '',
      preferred_qualifications: geminiResponse.preferred_qualifications || '',
      ideal_candidate: geminiResponse.ideal_candidate || '',
      raw_text: text || '',
      meta: meta || {},
      status: 'active', // 기본 상태
      original_parsed_data: geminiResponse, // 원본 파싱 결과 저장
      visited_at: visitedAt || currentDate,
      created_at: currentDate,
      updated_at: currentDate
    };

    logger.debug('채용공고 데이터 변환 완료', {
      url,
      company: recruitInfo.company_name,
      start_date: recruitInfo.start_date,
      end_date: recruitInfo.end_date
    });

    return recruitInfo;
  } catch (error) {
    logger.error(`RecruitInfo 변환 오류 (${urlData.url}):`, error);
    // 최소한의 기본 정보를 포함한 객체 반환
    return {
      url: urlData.url,
      title: urlData.title || '',
      raw_text: urlData.text || '',
      created_at: new Date(),
      updated_at: new Date(),
      error_message: error.message
    };
  }
}

  async updateSubUrlStatus(url, isRecruit) {
   const startTime = Date.now();

  try {
    const domain = extractDomain(url);

    if (!domain) {
      logger.warn(`도메인을 추출할 수 없습니다: ${url}`);
      return false;
    }

    // 원자적 업데이트 사용 - findOneAndUpdate로 직접 업데이트
    const result = await VisitResult.findOneAndUpdate(
      { domain, 'suburl_list.url': url },
      {
        $set: {
          'suburl_list.$.isRecruit': isRecruit,
          'suburl_list.$.updated_at': new Date()
        }
      },
      { new: true }
    );
    const runtime = Date.now() - startTime;
    const success = !!result;
    logger.debug(`URL ${url}의 isRecruit 상태를 ${isRecruit}로 업데이트 ${success ? '성공' : '실패'}`);

    logger.eventInfo('update_url_status', {
      url,
      domain,
      isRecruit,
      success,
      runtime,
      reason: success ? null : 'document_not_found'
    });
    return success;

  } catch (error) {
    logger.eventError('update_url_status', {
      url,
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}
  /**
   * 채용공고 정보를 RecruitInfo 컬렉션에 저장
   * @param {Object} recruitData - 채용공고 데이터
   * @returns {Promise<Object>} 저장된 문서
   */
  async saveRecruitInfo(recruitData) {
    try {
      // upsert 옵션으로 저장 (있으면 업데이트, 없으면 생성)
      const result = await RecruitInfo.findOneAndUpdate(
        { url: recruitData.url },
        recruitData,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      logger.debug(`URL ${recruitData.url} 채용정보 저장 완료`);
      return result;
    } catch (error) {
      logger.error(`채용정보 저장 오류 (${recruitData.url}):`, error);
      throw error;
    }
  }

  /**
 * 단일 URL 처리 (분류 및 저장)
 * @param {Object} urlData - URL 데이터
 * @returns {Promise<Object>} 처리 결과
 */
async processUrl(urlData) {
  try {
    this.stats.processed++;

    // 1. Gemini API로 URL 분석
    logger.debug(`URL 분석 시작: ${urlData.url}`);
    const response = await this.requestUrlParse(urlData);

    if (!response) {
      throw new Error('URL 분석 결과가 없습니다');
    }

    // 2. SubUrl 상태 업데이트
    const isRecruit = response.success === true;
    await this.updateSubUrlStatus(urlData.url ,isRecruit);

    if (isRecruit) {
      this.stats.isRecruit++;

      // 3. RecruitInfo 모델 형식으로 변환
      const recruitInfoData = this.convertToRecruitInfoSchema(response, urlData);
      logger.debug(recruitInfoData);
      if (recruitInfoData) {
        logger.debug(recruitInfoData);
        await this.saveRecruitInfo(recruitInfoData);
        this.stats.saved++;
      } else {
        logger.debug(`변환된 RecruitInfo 데이터가 없습니다: ${ urlData.url}`);
      }

      return {
        url : urlData.url,
        success: true,
        isRecruit: true,
        message: '채용공고로 분류되어 저장되었습니다.'
      };
    } else {
      this.stats.notRecruit++;
      return {
        url : urlData.url,
        success: true,
        isRecruit: false,
        message: '채용공고가 아닌 것으로 분류되었습니다.',
        reason: response.reason || '이유가 제공되지 않았습니다'
      };
    }
  } catch (error) {
    this.stats.failed++;
    logger.eventError(`process_url`, { error: error.message });
    return {
      url: urlData.url,
      success: false,
      error: error.message
    };
  }
}

  /**
   * 대기 함수 (요청 간 지연 시간)
   * @param {number} ms - 대기 시간(ms)
   * @returns {Promise<void>}
   */
  async wait(ms = this.delayBetweenRequests) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
/**
 * 일괄 처리 실행 - 병렬 처리 및 성능 개선
 * @param {number} batchSize - 처리할 URL 수
 * @param {number} concurrency - 동시 처리할 URL 수 (기본값: 5)
 * @returns {Promise<Object>} 처리 결과 통계
 */
async run(batchSize = this.batchSize, concurrency = 5) {
  const startTime = Date.now();

  if (this.isRunning) {
    logger.debug('이미 실행 중입니다.');
    return { success: false, message: '이미 실행 중입니다.' };
  }

  this.isRunning = true;
  this.isCancelled = false;
  this.stats = {
    processed: 0,
    isRecruit: 0,
    notRecruit: 0,
    failed: 0,
    retried: 0,
    saved: 0,
    startTime: startTime,
    endTime: null,
    runtime: 0
  };

  try {
    logger.debug(`ParseManager 실행 시작: 배치 크기 ${batchSize}, 동시성 ${concurrency}`);
    logger.eventInfo('parse_manager_start', { batchSize, concurrency });

    // 1. 미분류 URL 추출
    const fetchStartTime = Date.now();
    const urls = await this.fetchUnclassifiedUrls(batchSize);
    const fetchRuntime = Date.now() - fetchStartTime;

    logger.eventInfo('fetch_unclassified_urls', {
      count: urls.length,
      runtime: fetchRuntime
    });

    if (urls.length === 0) {
      logger.debug('처리할 미분류 URL이 없습니다.');
      this.isRunning = false;

      const totalRuntime = Date.now() - startTime;
      logger.eventInfo('parse_manager_complete', {
        urls: 0,
        runtime: totalRuntime,
        message: '처리할 URL 없음'
      });

      return {
        success: true,
        message: '처리할 미분류 URL이 없습니다.',
        stats: this.stats
      };
    }

    logger.debug(`${urls.length}개 URL 처리 시작`);

    // 2. URL 처리를 위한 작업 대기열 생성
    const urlQueue = [...urls];
    const results = [];
    const pendingPromises = new Set();
    const processedUrls = new Set();


    // 3. 동시 처리를 위한 함수 (재귀 제거)
    const processNextUrl = async () => {
      if (this.isCancelled) return null;

      const urlData = urlQueue.shift();
      if (!urlData) return null;

      // URL이 이미 처리된 경우 건너뛰기
      if (processedUrls.has(urlData.url)) {
        return {
          url: urlData.url,
          success: false,
          skipped: true,
          message: "중복 URL 건너뛰기"
        };
      }

      // 처리 시작 전 URL 기록
      processedUrls.add(urlData.url);

      // 반복문을 사용한 재시도 구현
      let retryCount = 0;

      while (retryCount <= this.maxRetries) {
        if (this.isCancelled) {
          return {
            url: urlData.url,
            success: false,
            cancelled: true,
            message: "작업이 취소되었습니다"
          };
        }

        try {
          const urlStartTime = Date.now();

          // 재시도 시 로그
          if (retryCount > 0) {
            logger.debug(`URL 재시도 중 (${retryCount}/${this.maxRetries}): ${urlData.url}`);
          }

          // URL 처리 실행
          const result = await this.processUrl(urlData);
          const urlRuntime = Date.now() - urlStartTime;

          // 결과에 메타데이터 추가
          result.runtime = urlRuntime;
          result.retries = retryCount;

          // 성공 로그
          logger.eventInfo('process_url_complete', {
            url: urlData.url,
            isRecruit: result.isRecruit,
            success: result.success,
            runtime: urlRuntime,
            retries: retryCount
          });



          // 성공한 결과 저장 및 반환
          results.push(result);
          return result;

        } catch (error) {
          // 재시도 가능한지 확인
          if (retryCount < this.maxRetries && !this.isCancelled) {
            retryCount++;
            this.stats.retried++;

            // 재시도 간격 계산 (지수 백오프 + 상한 적용)
            const baseDelay = this.delayBetweenRequests;
            const maxDelay = 30000; // 최대 30초
            const retryDelay = Math.min(
              baseDelay * Math.pow(2, retryCount - 1) + Math.random() * 1000,
              maxDelay
            );

            logger.debug(`URL 처리 실패, ${retryDelay}ms 후 재시도 예정 (${retryCount}/${this.maxRetries}): ${urlData.url}`);
            await this.wait(retryDelay);
            continue; // 재시도 실행
          }

          // 최대 재시도 횟수 초과 시 실패 처리
          logger.error(`URL 처리 실패 (최대 재시도 횟수 초과): ${urlData.url}`, error);
          logger.eventInfo('process_url_error', {
            url: urlData.url,
            error: error.message,
            retries: retryCount
          });

          const failedResult = {
            url: urlData.url,
            success: false,
            error: error.message,
            retries: retryCount
          };

          // 실패한 결과 저장
          results.push(failedResult);
          this.stats.failed++;



          return failedResult;
        }
      }

      return null;
    };

    // 4. 병렬 처리 실행
    while (urlQueue.length > 0 && !this.isCancelled) {
      // 진행 중인 작업이 동시성 제한보다 적으면 새 작업 추가
      while (pendingPromises.size < concurrency && urlQueue.length > 0) {
        const promise = processNextUrl().then(result => {
          pendingPromises.delete(promise);
          return result;
        });

        pendingPromises.add(promise);

        // 서버 부하 방지를 위한 짧은 대기
        await this.wait(50);
      }

      // 작업 하나가 완료될 때까지 대기
      if (pendingPromises.size > 0) {
        await Promise.race([...pendingPromises]);
      }
    }

    // 5. 남은 작업 완료 대기
    if (pendingPromises.size > 0) {
      logger.debug(`남은 ${pendingPromises.size}개 작업 완료 대기 중...`);
      await Promise.all([...pendingPromises]);
    }



    // 최종 통계 계산
    this.stats.endTime = Date.now();
    this.stats.runtime = this.stats.endTime - this.stats.startTime;

    // 처리하지 못한 URL 확인
    const unprocessedUrls = urls
      .filter(urlData => !processedUrls.has(urlData.url))
      .map(urlData => urlData.url);

    // 최종 결과 로깅
    logger.debug(`처리 완료: 총 ${this.stats.processed}개, 채용공고 ${this.stats.isRecruit}개, 비채용공고 ${this.stats.notRecruit}개, 실패 ${this.stats.failed}개, 재시도 ${this.stats.retried}개`);
    logger.eventInfo('parse_manager_complete', {
      urls: urls.length,
      processed: processedUrls.size,
      unprocessed: unprocessedUrls.length,
      runtime: this.stats.runtime,
      avg_speed: (processedUrls.size / (this.stats.runtime / 1000)).toFixed(2) + " URLs/sec",
      stats: { ...this.stats }
    });

    if (unprocessedUrls.length > 0) {
      logger.debug(`처리되지 않은 URL: ${unprocessedUrls.length}개`);
    }

    return {
      success: true,
      message: `${urls.length}개 URL 처리 완료 (${this.stats.runtime}ms)`,
      stats: this.stats,
      results,
      unprocessedUrls: unprocessedUrls.length > 0 ? unprocessedUrls : undefined
    };
  } catch (error) {
    const failRuntime = Date.now() - startTime;
    logger.error('실행 오류:', error);
    logger.eventError('parse_manager_error', {
      error: error.message,
      runtime: failRuntime,
      stack: error.stack
    });

    return {
      success: false,
      message: `오류 발생: ${error.message}`,
      error: error.message,
      runtime: failRuntime
    };
  } finally {
    this.isRunning = false;
  }
}

    /**
     * 실행 중인 배치 작업 취소
     */
    cancel() {
      if (!this.isRunning) {
        return false;
      }

      logger.debug('배치 처리 작업 취소 중...');
      this.isCancelled = true;
      logger.eventInfo('parse_manager_cancel', { stats: { ...this.stats } });
      return true;
    }
  /**
   * 현재 상태 정보 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      config: {
        batchSize: this.batchSize,
        maxRetries: this.maxRetries,
        delayBetweenRequests: this.delayBetweenRequests
      }
    };
  }

}

if (require.main === module) {
  (async () => {
    try {
      // dotenv 설정 (환경 변수 로드)
      try {
        require('dotenv').config();
      } catch (error) {
        logger.warn('dotenv를 불러올 수 없습니다. 환경 변수가 이미 설정되어 있다고 가정합니다.');
      }

      // 커맨드 라인 인수 파싱
      const args = process.argv.slice(2);
      const batchSize = parseInt(args[0]) || process.env.BATCH_SIZE;
      const delay = parseInt(args[1]) || 1000;

      // ParseManager 인스턴스 생성
      const parseManager = new ParseManager({
        batchSize,
        delayBetweenRequests: delay
      });

      // 시작 시간 기록
      const startTime = Date.now();

      // 배치 처리 실행
      const result = await parseManager.run(batchSize);

      // 종료 시간 및 소요 시간 계산
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000;



      process.exit(0);
    } catch (error) {
      logger.error('실행 오류:', error);
      process.exit(1);
    }
  })();
}

module.exports = ParseManager;