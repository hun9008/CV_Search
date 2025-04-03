const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * Gemini API 서비스
 */
class GeminiService {
  /**
   * GeminiService 인스턴스 생성
   * @param {Object} options - 옵션
   * @param {string} options.apiKey - Gemini API 키 (기본값은 환경변수)
   * @param {string} options.model - 사용할 모델 (기본값: gemini-2.0-flash-lite)
   * @param {number} options.keyIndex - 사용할 API 키 인덱스 (기본값: 0)
   */
  constructor(options = {}) {
    // 환경변수에서 콤마로 구분된 API 키 목록 가져오기
    this.apiKeys = process.env.GEMINI_API_KEYS ?
      process.env.GEMINI_API_KEYS.split(',').map(key => key.trim()) :
      [];

    // 단일 API 키도 지원 (기존 방식 호환성 유지)
    if (process.env.GEMINI_API_KEY && !this.apiKeys.includes(process.env.GEMINI_API_KEY)) {
      this.apiKeys.push(process.env.GEMINI_API_KEY);
    }

    // 옵션으로 전달된 키도 추가 (우선순위 부여)
    if (options.apiKey && !this.apiKeys.includes(options.apiKey)) {
      this.apiKeys.unshift(options.apiKey);
    }

    // 현재 사용할 키 인덱스 (순환 시 변경됨)
    this.currentKeyIndex = options.keyIndex || 0;
    if (this.currentKeyIndex >= this.apiKeys.length) {
      this.currentKeyIndex = 0;
    }

    // 현재 사용 중인 API 키
    this.apiKey = this.apiKeys.length > 0 ? this.apiKeys[this.currentKeyIndex] : null;
    this.modelName = options.model || 'gemini-2.0-flash-lite';

    // API 키 정보 로깅
    if (this.apiKeys.length > 0) {
      logger.info(`Gemini API 키 ${this.apiKeys.length}개 로드됨. 현재 인덱스: ${this.currentKeyIndex}`);
    } else {
      logger.warn('Gemini API 키가 설정되지 않았습니다. 테스트 환경으로 실행합니다.');
    }

    // API 키가 있는 경우에만 클라이언트 초기화
    if (this.apiKey) {
      this.initializeClient();
    }
  }

  /**
   * Gemini API 클라이언트 초기화
   */
  initializeClient() {
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      logger.info(`Gemini API 클라이언트 초기화 성공 (키 인덱스: ${this.currentKeyIndex})`);
    } catch (error) {
      logger.error(`Gemini API 클라이언트 초기화 실패: ${error.message}`);
      this.genAI = null;
    }
  }

  /**
   * 다음 API 키로 전환
   * @returns {boolean} 전환 성공 여부
   */
  rotateApiKey() {
    if (this.apiKeys.length <= 1) {
      logger.warn('사용 가능한 대체 API 키가 없습니다');
      return false;
    }

    // 다음 키 인덱스로 이동 (순환)
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.apiKey = this.apiKeys[this.currentKeyIndex];

    // 새 키로 클라이언트 초기화
    this.initializeClient();

    logger.info(`API 키 변경됨. 새 인덱스: ${this.currentKeyIndex}`);
    return true;
  }

  /**
   * 콘텐츠 생성 메서드 (키 순환 로직 포함)
   * @param {string} prompt - 프롬프트
   * @param {string} content - 추가 컨텍스트 (선택적)
   * @param {number} retryCount - 재시도 횟수 (내부용)
   * @returns {Promise<string>} 생성된 콘텐츠
   */
  async generateContent(prompt, content = '', retryCount = 0) {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API 키가 설정되지 않았습니다.');
      }

      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const fullPrompt = content ? `${prompt}\n\n${content}` : prompt;

      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      // API 한도 초과 관련 에러인지 확인 ("Too"가 메시지에 포함되는지 확인)
      const isTooManyRequestsError = error.message && error.message.includes('Too');

      // API 키 순환 조건: 한도 초과 에러고, 재시도 횟수가 키 개수보다 적은 경우
      if (isTooManyRequestsError && retryCount < this.apiKeys.length) {
        logger.warn(`API 한도 초과 감지됨: ${error.message}`);

        // 다음 키로 변경
        if (this.rotateApiKey()) {
          logger.info(`새 API 키로 재시도 중... (시도: ${retryCount + 1}/${this.apiKeys.length})`);

          // 재귀적으로 다시 시도 (재시도 카운터 증가)
          return this.generateContent(prompt, content, retryCount + 1);
        }
      }

      // 순환이 불가능하거나 다른 종류의 에러인 경우 에러 발생
      logger.error('Gemini API 요청 오류:', error);
      throw new Error(`Gemini API 요청 실패: ${error.message}`);
    }
  }

  /**
   * 채용공고 파싱을 위한 스키마 정의
   * @returns {Object} 채용공고 정보를 위한 스키마
   */
  getRecruitmentSchema() {
    return {
      type: SchemaType.OBJECT,
      properties: {
        success: {
          type: SchemaType.BOOLEAN,
          description: "채용공고인지 여부",
        },
        reason: {
          type: SchemaType.STRING,
          description: "채용공고가 아닌 경우 이유",
        },
        company_name: {
          type: SchemaType.STRING,
          description: "회사명",
        },
        department: {
          type: SchemaType.STRING,
          description: "부서",
        },
        experience: {
          type: SchemaType.STRING,
          description: "경력 요구사항",
        },
        description: {
          type: SchemaType.STRING,
          description: "직무 설명",
        },
        job_type: {
          type: SchemaType.STRING,
          description: "고용 형태",
        },
        posted_period: {
          type: SchemaType.STRING,
          description: "게시 기간",
        },
        requirements: {
          type: SchemaType.STRING,
          description: "필수 요건",
        },
        preferred_qualifications: {
          type: SchemaType.STRING,
          description: "우대 사항",
        },
        ideal_candidate: {
          type: SchemaType.STRING,
          description: "이상적인 후보자",
        }
      },
      required: ["success"]
    };
  }

  /**
   * 채용공고 분석을 위한 프롬프트 생성
   * @param {string} content - 분석할 텍스트 내용
   * @returns {string} 프롬프트 텍스트
   */
  getRecruitmentPrompt(content) {
    return `
당신은 채용공고 분석 전문가입니다. 다음 텍스트를 분석하여 채용공고인지 판단하세요.

만약 채용공고라면, 다음 정보를 추출하세요:
- company_name: 회사명
- department: 부서
- experience: 경력 요구사항
- description: 직무 설명
- job_type: 고용 형태 (정규직, 계약직 등)
- posted_period: 게시 기간
- requirements: 필수 요건
- preferred_qualifications: 우대 사항
- ideal_candidate: 이상적인 후보자

채용공고가 맞으면 success를 true로, 아니면 false로 설정하고 이유를 reason 필드에 제공하세요.
텍스트는 다음과 같습니다:

${content}
`;
  }

  /**
   * 채용공고 분석 메서드 (키 순환 로직 포함)
   * @param {string} content - 분석할 텍스트 내용
   * @param {number} retryCount - 재시도 횟수 (내부용)
   * @returns {Promise<Object>} 분석 결과 객체
   */
  async parseRecruitment(content, retryCount = 0) {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API 키가 설정되지 않았습니다.');
      }

      // 스키마 기반 모델 설정
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: this.getRecruitmentSchema(),
        },
      });

      // 프롬프트 준비 및 API 호출
      const promptText = this.getRecruitmentPrompt(content);
      const genAIResult = await model.generateContent(promptText);
      logger.info(genAIResult.response.usageMetadata);

      // 응답 텍스트 추출
      const responseText = genAIResult.response.text();
      logger.info('Gemini API 응답 텍스트:', responseText);

      // JSON 파싱
      const parsedResponse = JSON.parse(responseText);
      return parsedResponse;
    } catch (error) {
      // API 한도 초과 관련 에러인지 확인 ("Too"가 메시지에 포함되는지 확인)
      const isTooManyRequestsError = error.message && error.message.includes('Too');

      // API 키 순환 조건: 한도 초과 에러고, 재시도 횟수가 키 개수보다 적은 경우
      if (isTooManyRequestsError && retryCount < this.apiKeys.length) {
        logger.warn(`API 한도 초과 감지됨: ${error.message}`);

        // 다음 키로 변경
        if (this.rotateApiKey()) {
          logger.info(`새 API 키로 재시도 중... (시도: ${retryCount + 1}/${this.apiKeys.length})`);

          // 재귀적으로 다시 시도 (재시도 카운터 증가)
          return this.parseRecruitment(content, retryCount + 1);
        }
      }

      // JSON 파싱 오류 특별 처리
      if (error instanceof SyntaxError) {
        logger.error('JSON 파싱 오류:', error);
        throw new Error('Gemini API 응답을 JSON으로 파싱할 수 없습니다');
      }

      // 일반 오류
      logger.error('채용공고 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 API 키 상태 조회
   * @returns {Object} API 키 상태 정보
   */
  getKeyStatus() {
    return {
      totalKeys: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      hasValidKey: !!this.apiKey,
      model: this.modelName
    };
  }
}

module.exports = {
  GeminiService
};