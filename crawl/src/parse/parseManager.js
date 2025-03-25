require('module-alias/register');
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
      logger.info('MongoDB에 연결되었습니다.');
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
            meta: '$suburl_list.meta',
            visitedAt: '$suburl_list.visitedAt'
          }
        }
      ];

      const urls = await VisitResult.aggregate(pipeline);
      logger.info(`${urls.length}개의 미분류 URL 추출 완료`);
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
    try {
      const { url, title, text, meta } = urlData;

      // 분석할 콘텐츠 구성
      const content = `
      Title: ${title || ''}
      Meta Description: ${meta?.description || ''}

      Content:
      ${text?.substring(0, 5000) || ''} // 텍스트가 너무 길면 잘라냄
      `;
      const response = await this.geminiService.parseRecruitment(content);
      return response;
    }
    catch(error) {
      logger.warn(`텍스트 업무 내용으로 변환 중 오류:${error}`)
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

 /**
 * SubUrl의 isRecruit 상태 업데이트
 * @param {string} url - 업데이트할 URL
 * @param {boolean} isRecruit - 채용공고 여부
 * @returns {Promise<boolean>} 성공 여부
 */
async updateSubUrlStatus(url, isRecruit) {
  try {


    let result;
    const domain =extractDomain(url);
    // 1. 도메인이 추출된 경우: 도메인으로 먼저 필터링
    if (domain) {
      logger.debug(`도메인으로 필터링: ${domain}, URL: ${url}`);

      // 1단계: 도메인으로 문서 찾기
      const visitResults = await VisitResult.find({ domain });

      // 결과가 없으면 실패
      if (!visitResults || visitResults.length === 0) {
        logger.warn(`도메인 ${domain}에 해당하는 문서를 찾을 수 없습니다`);
      } else{
        // 2단계: 각 문서에서 URL 찾아 업데이트
        let updated = false;
        let updatedDocId = null;
        let updatedSubUrlIndex = -1;

        for (const visitResult of visitResults) {
          // suburl_list 배열 내에서 URL 찾기
          const subUrlIndex = visitResult.suburl_list?.findIndex(item => item.url === url);

          // 해당 URL을 찾은 경우
          if (subUrlIndex !== -1 && subUrlIndex !== undefined) {
            logger.warn(`URL ${url}을 도메인 ${domain} 문서에서 찾았습니다`);

            // 해당 항목 업데이트
            visitResult.suburl_list[subUrlIndex].isRecruit = isRecruit;
            visitResult.suburl_list[subUrlIndex].updated_at = new Date();
            visitResult.markModified('suburl_list'); // 이 줄 추가
            this.connect();
            await visitResult.save();

            updatedDocId = visitResult._id;
            updatedSubUrlIndex = subUrlIndex;
            updated = true;
            // 업데이트 후 결과 확인
            // 데이터를 다시 가져와서 업데이트가 제대로 되었는지 확인
            const updatedVisitResult = await VisitResult.findById(updatedDocId);

            if (updatedVisitResult &&
                updatedVisitResult.suburl_list &&
                updatedVisitResult.suburl_list[updatedSubUrlIndex]) {

              const updatedItem = updatedVisitResult.suburl_list[updatedSubUrlIndex];
              const isUpdated = updatedItem.isRecruit === isRecruit;

              logger.info(`URL ${url} 업데이트 확인 결과: ${isUpdated ? '성공' : '실패'}`);
              logger.debug('업데이트된 항목:', {
                url: updatedItem.url,
                isRecruit: updatedItem.isRecruit,
                updated_at: updatedItem.updated_at
              });

              // 업데이트가 실제로 적용되지 않았다면 updated 플래그 수정
              if (!isUpdated) {
                updated = false;
              }
            } else {
              logger.warn(`URL ${url} 업데이트 후 데이터를 찾을 수 없습니다`);
              updated = false; // 데이터를 찾을 수 없으면 업데이트 실패로 처리
            }
            break;
          }
        }

        // 모든 문서를 확인했지만 URL을 찾지 못한 경우
        if (!updated) {
          logger.warn(`도메인 ${domain} 문서 내에서 URL ${url}을 찾을 수 없습니다`);
          // 여기서 필요에 따라 추가 처리 가능
          return false;
        } else {
          // URL을 성공적으로 업데이트한 경우
          result = { modifiedCount: 1 };
        }
      }
    }

    const success = result && result.modifiedCount > 0;
    logger.info(`URL ${url}의 isRecruit 상태를 ${isRecruit}로 업데이트 ${success ? '성공' : '실패'}`);
    return success;
  } catch (error) {
    logger.error(`URL 상태 업데이트 오류 (${url}):`, error);
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

      logger.info(`URL ${recruitData.url} 채용정보 저장 완료`);
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
    logger.info(`URL 분석 시작: ${urlData.url}`);
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
      logger.info(recruitInfoData);
      if (recruitInfoData) {
        logger.info(recruitInfoData);
        await this.saveRecruitInfo(recruitInfoData);
        this.stats.saved++;
      } else {
        logger.warn(`변환된 RecruitInfo 데이터가 없습니다: ${ urlData.url}`);
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
    logger.error(`URL 처리 오류 (${urlData.url}):`, error);
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
   * 일괄 처리 실행
   * @param {number} batchSize - 처리할 URL 수
   * @returns {Promise<Object>} 처리 결과 통계
   */
  async run(batchSize = this.batchSize) {
    if (this.isRunning) {
      logger.warn('이미 실행 중입니다.');
      return { success: false, message: '이미 실행 중입니다.' };
    }

    this.isRunning = true;
    this.stats = {
      processed: 0,
      isRecruit: 0,
      notRecruit: 0,
      failed: 0,
      saved: 0
    };

    try {
      logger.info(`ParseManager 실행 시작: 배치 크기 ${batchSize}`);

      // 1. 미분류 URL 추출
      const urls = await this.fetchUnclassifiedUrls(batchSize);

      if (urls.length === 0) {
        logger.info('처리할 미분류 URL이 없습니다.');
        this.isRunning = false;
        return {
          success: true,
          message: '처리할 미분류 URL이 없습니다.',
          stats: this.stats
        };
      }

      logger.info(`${urls.length}개 URL 처리 시작`);

      // 2. 각 URL 순차적으로 처리
      const results = [];
      for (const urlData of urls) {
        try {
          const result = await this.processUrl(urlData);
          results.push(result);

          // 요청 간 지연 시간
          await this.wait();
        } catch (error) {
          logger.error(`URL 처리 실패 (${urlData.url}):`, error);
          results.push({
            url: urlData.url,
            success: false,
            error: error.message
          });
        }
      }

      logger.info(`처리 완료: 총 ${this.stats.processed}개, 채용공고 ${this.stats.isRecruit}개, 비채용공고 ${this.stats.notRecruit}개, 실패 ${this.stats.failed}개`);

      return {
        success: true,
        message: `${urls.length}개 URL 처리 완료`,
        stats: this.stats,
        results
      };
    } catch (error) {
      logger.error('실행 오류:', error);
      return {
        success: false,
        message: `오류 발생: ${error.message}`,
        error: error.message
      };
    } finally {
      this.isRunning = false;
    }
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
      const batchSize = parseInt(args[0]) || 10000;
      const delay = parseInt(args[1]) || 1000;

      logger.info('===== 채용공고 파싱 시작 =====');
      logger.info(`배치 크기: ${batchSize}, 요청 간 지연: ${delay}ms`);

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

      // 결과 출력
      if (result.success) {
        logger.info('===== 채용공고 파싱 완료 =====');
        logger.info(`소요 시간: ${elapsedTime.toFixed(2)}초`);
        logger.info('처리 통계:');
        logger.info(`- 처리된 URL: ${result.stats.processed}개`);
        logger.info(`- 채용공고: ${result.stats.isRecruit}개`);
        logger.info(`- 비채용공고: ${result.stats.notRecruit}개`);
        logger.info(`- 실패: ${result.stats.failed}개`);
        logger.info(`- 저장됨: ${result.stats.saved}개`);
      } else {
        logger.error('===== 채용공고 파싱 실패 =====');
        logger.error(`오류: ${result.message}`);
      }

      process.exit(0);
    } catch (error) {
      logger.error('실행 오류:', error);
      process.exit(1);
    }
  })();
}

module.exports = ParseManager;