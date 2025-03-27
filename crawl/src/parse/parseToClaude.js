require('module-alias/register');
const mongoose = require('mongoose');
const { VisitResult, extractDomain } = require('@models/visitResult');
const RecruitInfo = require('@models/recruitInfo');
const { ClaudeService } = require('@parse/claudeService'); // Changed to ClaudeService
const { defaultLogger: logger } = require('@utils/logger');

// Create a new model using the RecruitInfo schema but with a different collection
const RecruitInfoClaude = mongoose.model(
  'RecruitInfoClaude',
  RecruitInfo.schema,
  'recruitinfos_claude'
);

/**
 * 방문한 URL 중 채용 공고(isRecruit=true)인 항목을 파싱하여
 * recruitinfos_claude 컬렉션에 저장
 */
class ClaudeParser {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.delayBetweenRequests = options.delayBetweenRequests || 1000;
    this.claudeService = new ClaudeService(); // Use ClaudeService instead of GeminiService
    this.isRunning = false;
    this.stats = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * MongoDB에 연결
   */
  async connect() {
    try {
      // 이미 연결되어 있는지 확인
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_ADMIN_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          dbName: 'crwal_db'
        });
      }
      logger.info('MongoDB에 연결되었습니다.');
    } catch (error) {
      logger.error('MongoDB 연결 오류:', error);
      throw error;
    }
  }

  /**
   * isRecruit=true인 URL 가져오기
   */
  async fetchRecruitUrls(limit = this.batchSize) {
    try {
      await this.connect();

      // isRecruit=true인 URL 추출 집계 파이프라인
      const pipeline = [
        { $match: { 'suburl_list.visited': true, 'suburl_list.success': true, 'suburl_list.isRecruit': true } },
        { $unwind: '$suburl_list' },
        {
          $match: {
            'suburl_list.visited': true,
            'suburl_list.success': true,
            'suburl_list.isRecruit': true
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
      logger.info(`${urls.length}개의 채용공고 URL 추출 완료`);
      return urls;
    } catch (error) {
      logger.error('채용공고 URL 추출 오류:', error);
      throw error;
    }
  }

  /**
   * URL이 채용공고인지 Claude API로 파싱
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

      // Claude API로 분석 요청 (GeminiService에서 ClaudeService로 변경)
      const response = await this.claudeService.parseRecruitment(content);
      return response;
    } catch (error) {
      logger.warn(`텍스트 분석 중 오류: ${error}`);
      throw error;
    }
  }

  /**
   * Claude API 응답을 RecruitInfo 모델 형식으로 변환
   */
  convertToRecruitInfoSchema(claudeResponse, urlData) {
    try {
      logger.debug('채용공고 데이터 변환 시작', { url: urlData.url });

      if (!claudeResponse.success) {
        logger.warn('파싱 실패', { url: urlData.url });
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

      if (claudeResponse.posted_period) {
        // 게시 기간이 범위 형식인 경우 (예: 2023-01-01 ~ 2023-02-01)
        const periodMatch = claudeResponse.posted_period.match(/(.+?)\s*[~\-]\s*(.+)/);
        if (periodMatch) {
          startDate = parseDate(periodMatch[1].trim());
          endDate = parseDate(periodMatch[2].trim());
        } else {
          // 단일 날짜만 있는 경우, 종료일로 처리
          endDate = parseDate(claudeResponse.posted_period.trim());
        }
      }

      // Claude 응답에서 직접 날짜 필드가 있는 경우 이를 우선 사용
      if (claudeResponse.start_date) {
        startDate = parseDate(claudeResponse.start_date);
      }

      if (claudeResponse.end_date) {
        endDate = parseDate(claudeResponse.end_date);
      }

      // 날짜가 유효하지 않은 경우 기본값 사용
      if (!startDate) startDate = currentDate;
      if (!endDate) endDate = defaultEndDate;

      // 원본 데이터 추출
      const { domain, url, title, text, meta, visitedAt } = urlData;

      // RecruitInfo 모델에 맞는 객체 생성
      return {
        domain,
        url,
        title: title || '',
        company_name: claudeResponse.company_name || '알 수 없음',
        department: claudeResponse.department || '',
        experience: claudeResponse.experience || '',
        description: claudeResponse.description || '',
        job_type: claudeResponse.job_type || '',
        start_date: startDate,
        end_date: endDate,
        expires_at: endDate,
        requirements: claudeResponse.requirements || '',
        preferred_qualifications: claudeResponse.preferred_qualifications || '',
        ideal_candidate: claudeResponse.ideal_candidate || '',
        raw_text: text || '',
        meta: meta || {},
        status: 'active',
        success: true,
        original_parsed_data: claudeResponse,
        visited_at: visitedAt || currentDate,
        created_at: currentDate,
        updated_at: currentDate,
        posted_at: startDate || currentDate,
        parser: 'claude' // 추가: 어떤 파서를 사용했는지 표시
      };
    } catch (error) {
      logger.error(`RecruitInfo 변환 오류 (${urlData.url}):`, error);
      return {
        url: urlData.url,
        title: urlData.title || '',
        company_name: '파싱 실패',
        raw_text: urlData.text || '',
        created_at: new Date(),
        updated_at: new Date(),
        success: false,
        reason: error.message,
        parser: 'claude'
      };
    }
  }

  /**
   * 채용공고 정보를 RecruitInfoClaude 컬렉션에 저장
   */
  async saveRecruitInfo(recruitData) {
    try {
      const result = await RecruitInfoClaude.findOneAndUpdate(
        { url: recruitData.url },
        recruitData,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      logger.info(`URL ${recruitData.url} 채용정보 저장 완료 (recruitinfos_claude 컬렉션)`);
      return result;
    } catch (error) {
      logger.error(`채용정보 저장 오류 (${recruitData.url}):`, error);
      throw error;
    }
  }

  /**
   * 단일 URL 처리 (파싱 및 저장)
   */
  async processUrl(urlData) {
    try {
      this.stats.processed++;

      // 이미 처리된 URL인지 확인
      const existing = await RecruitInfoClaude.findOne({ url: urlData.url });
      if (existing) {
        logger.info(`URL ${urlData.url}은 이미 처리되었습니다. 건너뜁니다.`);
        this.stats.skipped++;
        return {
          url: urlData.url,
          success: true,
          skipped: true,
          message: '이미 처리된 URL'
        };
      }

      // 1. Claude API로 URL 분석
      logger.info(`URL 분석 시작: ${urlData.url}`);
      const response = await this.requestUrlParse(urlData);

      if (!response) {
        throw new Error('URL 분석 결과가 없습니다');
      }

      // 2. RecruitInfo 모델 형식으로 변환
      const recruitInfoData = this.convertToRecruitInfoSchema(response, urlData);

      if (recruitInfoData) {
        // 3. RecruitInfoClaude 컬렉션에 저장
        await this.saveRecruitInfo(recruitInfoData);
        this.stats.success++;

        return {
          url: urlData.url,
          success: true,
          message: 'recruitinfos_claude 컬렉션에 저장되었습니다.'
        };
      } else {
        this.stats.failed++;
        logger.warn(`변환된 RecruitInfo 데이터가 없습니다: ${urlData.url}`);
        return {
          url: urlData.url,
          success: false,
          message: '데이터 변환 실패'
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
   */
  async wait(ms = this.delayBetweenRequests) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 일괄 처리 실행
   */
  async run(batchSize = this.batchSize) {
    if (this.isRunning) {
      logger.warn('이미 실행 중입니다.');
      return { success: false, message: '이미 실행 중입니다.' };
    }

    this.isRunning = true;
    this.stats = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };

    try {
      // API 키 및 클라이언트 상태 확인
      const apiStatus = this.claudeService.getStatus();
      if (!apiStatus.hasValidKey || !apiStatus.clientInitialized) {
        throw new Error('Claude API 키가 설정되지 않았거나 클라이언트 초기화에 실패했습니다.');
      }

      logger.info(`ClaudeParser 실행 시작: 배치 크기 ${batchSize}, 모델: ${apiStatus.model}`);

      // 1. isRecruit=true인 URL 추출
      const urls = await this.fetchRecruitUrls(batchSize);

      if (urls.length === 0) {
        logger.info('처리할 채용공고 URL이 없습니다.');
        this.isRunning = false;
        return {
          success: true,
          message: '처리할 채용공고 URL이 없습니다.',
          stats: this.stats
        };
      }

      logger.info(`${urls.length}개 채용공고 URL 처리 시작`);

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

      logger.info(`처리 완료: 총 ${this.stats.processed}개, 성공 ${this.stats.success}개, 실패 ${this.stats.failed}개, 건너뜀 ${this.stats.skipped}개`);

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
}

// 스크립트 실행
if (require.main === module) {
  (async () => {
    try {
      // dotenv 설정 (환경 변수 로드)
      try {
        require('dotenv').config();
      } catch (error) {
        logger.warn('dotenv를 불러올 수 없습니다. 환경 변수가 이미 설정되어 있다고 가정합니다.');
      }

      // Claude API 키 확인
      if (!process.env.CLAUDE_API_KEY) {
        logger.error('CLAUDE_API_KEY 환경 변수가 설정되지 않았습니다.');
        process.exit(1);
      }

      // 커맨드 라인 인수 파싱
      const args = process.argv.slice(2);
      const batchSize = parseInt(args[0]) || 100;
      const delay = parseInt(args[1]) || 1000;

      logger.info('===== 채용공고 Claude 컬렉션 저장 시작 =====');
      logger.info(`배치 크기: ${batchSize}, 요청 간 지연: ${delay}ms`);

      // ClaudeParser 인스턴스 생성
      const claudeParser = new ClaudeParser({
        batchSize,
        delayBetweenRequests: delay
      });

      // 시작 시간 기록
      const startTime = Date.now();

      // 배치 처리 실행
      const result = await claudeParser.run(batchSize);

      // 종료 시간 및 소요 시간 계산
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000;

      // 결과 출력
      if (result.success) {
        logger.info('===== 채용공고 Claude 컬렉션 저장 완료 =====');
        logger.info(`소요 시간: ${elapsedTime.toFixed(2)}초`);
        logger.info('처리 통계:');
        logger.info(`- 총 처리: ${result.stats.processed}개`);
        logger.info(`- 성공: ${result.stats.success}개`);
        logger.info(`- 실패: ${result.stats.failed}개`);
        logger.info(`- 건너뜀: ${result.stats.skipped}개`);
      } else {
        logger.error('===== 채용공고 Claude 컬렉션 저장 실패 =====');
        logger.error(`오류: ${result.message}`);
      }

      process.exit(0);
    } catch (error) {
      logger.error('실행 오류:', error);
      process.exit(1);
    }
  })();
}

module.exports = ClaudeParser;