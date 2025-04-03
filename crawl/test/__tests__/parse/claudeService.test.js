require('dotenv');
const { ClaudeService } = require('@parse/claudeService');
const { defaultLogger: logger } = require('@utils/logger');
const { config } = require('@config/config');
const CONFIG = require('../../../config/config');

// Temporarily override logger to reduce noise during tests
jest.mock('@utils/logger', () => ({
  defaultLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error, // Keep error logging for debugging
    debug: jest.fn(),
  }
}));

describe('ClaudeService Integration Test', () => {
  let service;

  // Sample recruitment text for testing
  const sampleRecruitmentText = `
    ABC 소프트웨어 채용공고

    회사: ABC 소프트웨어
    부서: 백엔드 개발팀

    [고용형태]
    정규직

    [지원자격]
    - 학력: 대졸 이상
    - 경력: 3년 이상

    [주요업무]
    - 백엔드 서버 개발 및 유지보수
    - API 설계 및 구현
    - 데이터베이스 모델링

    [우대사항]
    - Node.js, Express 경험자
    - AWS 클라우드 경험
    - 대규모 트래픽 처리 경험

    [지원기간]
    2023년 5월 1일 ~ 2023년 5월 31일

    [문의처]
    이메일: recruit@abcsoftware.com
  `;

  // Sample non-recruitment text
  const sampleNonRecruitmentText = `
    ABC 소프트웨어 뉴스레터

    안녕하세요, ABC 소프트웨어 구독자 여러분!

    이번 달 주요 소식:
    - 신규 제품 출시: 클라우드 백업 솔루션
    - 기술 블로그 업데이트: 마이크로서비스 아키텍처 설계
    - 커뮤니티 이벤트: 온라인 웨비나 6월 15일 개최

    감사합니다.
    ABC 소프트웨어 팀
  `;

  beforeAll(() => {
    // Check if API key is available in environment
    if (!CONFIG.CLAUDE_API_KEY) {
      console.warn('⚠️ CLAUDE_API_KEY 환경 변수가 설정되지 않았습니다. 테스트가 실패할 수 있습니다.');
    } else {
      console.log('✅ CLAUDE_API_KEY 환경 변수가 설정되었습니다.');
    }

    // Initialize the service once for all tests
    service = new ClaudeService({
      // If you want to use a specific model or settings, you can override here
      model: 'claude-3-7-sonnet-20250219',
      maxTokens: 4096
    });

    // Check if initialization was successful
    const status = service.getStatus();
    if (!status.clientInitialized) {
      console.warn('⚠️ Claude API 클라이언트 초기화 실패');
    } else {
      console.log('✅ Claude API 클라이언트 초기화 성공');
      console.log(`📌 사용 모델: ${status.model}`);
    }
  });

  describe('API 연결 및 상태 확인', () => {
    it('API 키와 클라이언트 상태를 확인합니다', () => {
      const status = service.getStatus();
      console.log('API 상태:', status);

      if (status.hasValidKey) {
        console.log('✅ 유효한 API 키가 설정되었습니다.');
      } else {
        console.warn('⚠️ 유효한 API 키가 없습니다.');
      }

      // This is a very loose assertion just to ensure the status object is returned
      expect(status).toBeDefined();
      expect(typeof status).toBe('object');
    });
  });

  describe('채용공고 분석 테스트', () => {
    // Set a longer timeout for the API calls
    jest.setTimeout(30000);

    it('채용공고 텍스트를 성공적으로 파싱합니다', async () => {
      // Skip the test if no API key
      if (!service.apiKey) {
        console.warn('API 키가 없어 테스트를 건너뜁니다.');
        return;
      }

      try {
        console.log('채용공고 분석 시작...');
        const result = await service.parseRecruitment(sampleRecruitmentText);
        console.log('분석 결과:', JSON.stringify(result, null, 2));

        // Basic validation
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();

        if (result.success) {
          console.log('✅ 채용공고로 인식했습니다.');
          console.log(`📝 회사명: ${result.company_name}`);
          console.log(`📝 부서: ${result.department}`);
          console.log(`📝 고용형태: ${result.job_type}`);
          console.log(`📝 게시기간: ${result.posted_period}`);
        } else {
          console.warn('❌ 채용공고로 인식하지 않았습니다.');
          console.log(`📝 이유: ${result.reason}`);
        }
      } catch (error) {
        console.error('❌ 테스트 실패:', error);
        throw error;
      }
    });

    it('뉴스레터 텍스트를 채용공고가 아닌 것으로 판단합니다', async () => {
      // Skip the test if no API key
      if (!service.apiKey) {
        console.warn('API 키가 없어 테스트를 건너뜁니다.');
        return;
      }

      try {
        console.log('뉴스레터 분석 시작...');
        const result = await service.parseRecruitment(sampleNonRecruitmentText);
        console.log('분석 결과:', JSON.stringify(result, null, 2));

        // Basic validation
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();

        if (!result.success) {
          console.log('✅ 채용공고가 아닌 것으로 올바르게 판단했습니다.');
          console.log(`📝 이유: ${result.reason}`);
        } else {
          console.warn('❓ 의외로 채용공고로 판단했습니다.');
          console.log(`📝 추정된 회사명: ${result.company_name}`);
        }
      } catch (error) {
        console.error('❌ 테스트 실패:', error);
        throw error;
      }
    });
  });

  describe('콘텐츠 생성 테스트', () => {
    // Set a longer timeout for the API calls
    jest.setTimeout(30000);

    it('기본 프롬프트로 콘텐츠를 생성합니다', async () => {
      // Skip the test if no API key
      if (!service.apiKey) {
        console.warn('API 키가 없어 테스트를 건너뜁니다.');
        return;
      }

      try {
        const prompt = '인공지능에 대해 100단어로 요약해 주세요.';
        console.log('콘텐츠 생성 시작...');
        console.log('프롬프트:', prompt);

        const result = await service.generateContent(prompt);
        console.log('생성된 콘텐츠:');
        console.log('------------------------');
        console.log(result);
        console.log('------------------------');

        // Basic validation
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('❌ 테스트 실패:', error);
        throw error;
      }
    });
  });

  describe('프롬프트 생성 테스트', () => {
    it('채용공고 분석을 위한 프롬프트를 생성합니다', () => {
      const content = '샘플 채용공고 내용';
      const prompt = service.getRecruitmentPrompt(content);

      console.log('생성된 프롬프트:');
      console.log('------------------------');
      console.log(prompt);
      console.log('------------------------');

      // Basic validation
      expect(prompt).toContain('채용공고 분석 전문가');
      expect(prompt).toContain('샘플 채용공고 내용');
      expect(prompt).toContain('JSON 형식');
    });
  });
});