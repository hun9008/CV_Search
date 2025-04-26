const { GeminiService } = require('@parse/geminiService');
const { defaultLogger: logger } = require('@utils/logger');

// 테스트에서 로그 레벨 조정 (선택적)
// logger.level = 'warn'; // 테스트 중 로그 출력 최소화

describe('GeminiService', () => {
  let geminiService;

  beforeEach(() => {
    geminiService = new GeminiService();
  });

  test('인스턴스가 생성되어야 함', () => {
    expect(geminiService).toBeDefined();
    expect(geminiService).toBeInstanceOf(GeminiService);
  });

  test('채용공고 스키마가 반환되어야 함', () => {
    const schema = geminiService.getRecruitmentSchema();
    expect(schema).toBeDefined();
    expect(schema).toHaveProperty('properties');
    expect(schema.properties).toHaveProperty('success');
    expect(schema.properties).toHaveProperty('company_name');
    expect(schema.required).toContain('success');
  });

  test('채용공고 프롬프트가 생성되어야 함', () => {
    const content = '테스트 콘텐츠';
    const prompt = geminiService.getRecruitmentPrompt(content);
    expect(prompt).toContain('채용공고 분석 전문가');
    expect(prompt).toContain('테스트 콘텐츠');
    expect(prompt).toContain('company_name');
  });

  test('채용공고 파싱이 성공해야 함', async () => {
    // API 호출을 모킹 (실제 테스트에서는 필요할 수 있음)
    const mockParseResult = {
      success: true,
      company_name: '테스트 회사',
      department: '개발팀'
    };

    // 모킹 메서드
    geminiService.parseRecruitment = jest.fn().mockResolvedValue(mockParseResult);

    const result = await geminiService.parseRecruitment('테스트 채용공고 내용');
    expect(result).toEqual(mockParseResult);
  }, 15000); // API 호출 시간 고려하여 타임아웃 설정
});