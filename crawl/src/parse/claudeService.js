const { Anthropic } = require('@anthropic-ai/sdk');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * Claude API 서비스
 */
class ClaudeService {
  /**
   * ClaudeService 인스턴스 생성
   * @param {Object} options - 옵션
   * @param {string} options.apiKey - Claude API 키 (기본값은 환경변수)
   * @param {string} options.model - 사용할 모델 (기본값: claude-3-5-sonnet-20240620)
   * @param {number} options.maxTokens - 최대 토큰 수 (기본값: 4096)
   */
  constructor(options = {}) {
    // API 키 설정 (옵션 > 환경변수 순서로 우선순위)
    this.apiKey = options.apiKey || process.env.CLAUDE_API_KEY;

    // 모델 설정 (기본값: claude-3-5-sonnet-20240620)
    this.modelName = options.model || 'claude-3-7-sonnet-20250219';

    // 최대 토큰 설정
    this.maxTokens = options.maxTokens || 4096;

    // API 키 정보 로깅
    if (this.apiKey) {
      logger.info(`Claude API 서비스 초기화 (모델: ${this.modelName})`);
    } else {
      logger.warn('Claude API 키가 설정되지 않았습니다. 서비스를 사용할 수 없습니다.');
    }

    // API 키가 있는 경우에만 클라이언트 초기화
    if (this.apiKey) {
      this.initializeClient();
    }
  }

  /**
   * Claude API 클라이언트 초기화
   */
  initializeClient() {
    try {
      this.anthropic = new Anthropic({
        apiKey: this.apiKey,
      });
      logger.info(`Claude API 클라이언트 초기화 성공 (모델: ${this.modelName})`);
    } catch (error) {
      logger.error(`Claude API 클라이언트 초기화 실패: ${error.message}`);
      this.anthropic = null;
    }
  }

  /**
   * 콘텐츠 생성 메서드
   * @param {string} prompt - 프롬프트
   * @param {string} content - 추가 컨텍스트 (선택적)
   * @returns {Promise<string>} 생성된 콘텐츠
   */
  async generateContent(prompt, content = '') {
    try {
      if (!this.anthropic) {
        throw new Error('Claude API 키가 설정되지 않았습니다.');
      }

      const fullPrompt = content ? `${prompt}\n\n${content}` : prompt;

      const message = await this.anthropic.messages.create({
        model: this.modelName,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'user', content: fullPrompt }
        ],
      });

      return message.content[0].text;
    } catch (error) {
      logger.error('Claude API 요청 오류:', error);
      throw new Error(`Claude API 요청 실패: ${error.message}`);
    }
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

응답은 다음 JSON 형식으로만 제공하세요:
{
  "success": boolean,
  "reason": string,
  "company_name": string,
  "department": string,
  "experience": string,
  "description": string,
  "job_type": string,
  "posted_period": string,
  "requirements": string,
  "preferred_qualifications": string,
  "ideal_candidate": string
}

텍스트는 다음과 같습니다:

${content}
`;
  }

async parseRecruitment(content) {
  try {
    if (!this.anthropic) {
      throw new Error('Claude API 키가 설정되지 않았습니다.');
    }

    // 프롬프트 준비
    const promptText = this.getRecruitmentPrompt(content);

    // Claude API 호출 (response_format 없이)
    const message = await this.anthropic.messages.create({
      model: this.modelName,
      max_tokens: this.maxTokens,
      messages: [
        { role: 'user', content: promptText }
      ],
      system: "응답은 항상 올바른 JSON 형식으로만 제공하세요. 추가 설명이나 마크다운 포맷팅을 사용하지 마세요."
    });

    // 응답 텍스트 추출
    const responseText = message.content[0].text;
    logger.info('Claude API 응답 받음');

    // JSON 파싱
    const parsedResponse = JSON.parse(responseText);
    return parsedResponse;
  } catch (error) {
    // JSON 파싱 오류 특별 처리
    if (error instanceof SyntaxError) {
      logger.error('JSON 파싱 오류:', error);
      throw new Error('Claude API 응답을 JSON으로 파싱할 수 없습니다');
    }

    // 일반 오류
    logger.error('채용공고 분석 오류:', error);
    throw error;
  }
}

  /**
   * API 키 상태 조회
   * @returns {Object} API 키 상태 정보
   */
  getStatus() {
    return {
      hasValidKey: !!this.apiKey,
      model: this.modelName,
      maxTokens: this.maxTokens,
      clientInitialized: !!this.anthropic
    };
  }
}

module.exports = {
  ClaudeService
};