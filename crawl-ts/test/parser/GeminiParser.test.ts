import { GeminiParser, ParseError } from '../../src/parser/GeminiParser';
import { IRawContent } from '../../src/models/RawContentModel';
import { GeminiResponseRecruitInfoDTO } from '../../src/models/RecruitInfoModel';
import { jest } from '@jest/globals';

jest.mock('../../src/models/VisitResult', () => ({
  VisitResultModel: {
    aggregate: jest.fn(),
  },
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockImplementation(async () => ({
        response: {
          text: async () => '{"result":"적합","reason":"Valid job posting"}'
        }
      }))
    })
  })),
  SchemaType: {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    BOOLEAN: 'boolean',
  },
}));

describe('GeminiParser', () => {
  let parser: GeminiParser;

  beforeEach(() => {
    parser = new GeminiParser();
  });

  describe('validateRecruitInfo', () => {
    it('should return valid result when API responds with valid data', async () => {
      // Given
      const rawText = 'Sample job posting text';
      const retryNumber = 3;

      // When
      const result = await parser.validateRecruitInfo(rawText, retryNumber);

      // Then
      expect(result).toEqual({ result: '적합', reason: 'Valid job posting' });
    });

    it('should throw ParseError when API fails after retries', async () => {
      // Given
      const rawText = 'Sample job posting text';
      const retryNumber = 3;
      jest.spyOn(parser, 'validateRecruitInfo').mockRejectedValue(new ParseError('API failed'));

      // When & Then
      await expect(parser.validateRecruitInfo(rawText, retryNumber)).rejects.toThrow(ParseError);
    });
  });

  describe('loadMongoRawContent', () => {
    it('should return raw content when data exists', async () => {
      // Given
      const mockData: IRawContent[] = [
        { domain: 'example.com', url: 'http://example.com', text: 'Sample text', title: 'Sample title' },
      ];
      jest.spyOn(parser, 'loadMongoRawContent').mockResolvedValue(mockData);

      // When
      const result = await parser.loadMongoRawContent(10);

      // Then
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no data exists', async () => {
      // Given
      jest.spyOn(parser, 'loadMongoRawContent').mockResolvedValue([]);

      // When
      const result = await parser.loadMongoRawContent(10);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findJobEndDate', () => {
    it('should return a valid date when API responds with valid data', async () => {
      // Given
      const rawText = 'Sample job posting text';
      const retryNumber = 3;
      const mockDate = new Date('2025-12-31');
      jest.spyOn(parser, 'findJobEndDate').mockResolvedValue(mockDate);

      // When
      const result = await parser.findJobEndDate(rawText, retryNumber);

      // Then
      expect(result).toEqual(mockDate);
    });

    it('should throw ParseError when API fails after retries', async () => {
      // Given
      const rawText = 'Sample job posting text';
      const retryNumber = 3;
      jest.spyOn(parser, 'findJobEndDate').mockRejectedValue(new ParseError('API failed'));

      // When & Then
      await expect(parser.findJobEndDate(rawText, retryNumber)).rejects.toThrow(ParseError);
    });
  });

  describe('verifyRecruitInfo', () => {
    it('should return true for valid recruitment info', () => {
      // Given
      const response: GeminiResponseRecruitInfoDTO = {
        is_recruit_info: true,
        title: 'Job Title',
        company_name: 'Company Name',
        job_description: 'Job Description',
        region_id: [],
        region_text: '',
        apply_start_date: undefined,
        apply_end_date: undefined,
        job_type: '',
        require_experience: '',
      };

      // When
      const result = parser.verifyRecruitInfo(response);

      // Then
      expect(result).toBe(true);
    });

    it('should return false for invalid recruitment info', () => {
      // Given
      const response: GeminiResponseRecruitInfoDTO = {
        is_recruit_info: false,
        title: '',
        company_name: '',
        job_description: '',
        region_id: [],
        region_text: '',
        apply_start_date: undefined,
        apply_end_date: undefined,
        job_type: '',
        require_experience: '',
      };

      // When
      const result = parser.verifyRecruitInfo(response);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('parseRawContentRetry', () => {
    it('should parse raw content and return valid recruitment info', async () => {
      // Given
      const rawContent: IRawContent = {
        domain: 'example.com',
        url: 'http://example.com',
        text: 'Sample job posting text',
        title: 'Sample title',
      };
      const mockResponse: GeminiResponseRecruitInfoDTO = {
        is_recruit_info: true,
        title: 'Job Title',
        company_name: 'Company Name',
        job_description: 'Job Description',
        region_id: [1],
        region_text: 'Seoul',
        apply_start_date: new Date('2025-01-01'),
        apply_end_date: new Date('2025-12-31'),
        job_type: 'Full-time',
        require_experience: 'None',
      };
      jest.spyOn(parser, 'parseRawContentRetry').mockResolvedValue(mockResponse);

      // When
      const result = await parser.parseRawContentRetry(rawContent, 3);

      // Then
      expect(result).toEqual(mockResponse);
    });

    it('should throw ParseError when retries are exhausted', async () => {
      // Given
      const rawContent: IRawContent = {
        domain: 'example.com',
        url: 'http://example.com',
        text: 'Sample job posting text',
        title: 'Sample title',
      };
      jest.spyOn(parser, 'parseRawContentRetry').mockRejectedValue(new ParseError('Failed to parse recruitment info'));

      // When & Then
      await expect(parser.parseRawContentRetry(rawContent, 3)).rejects.toThrow(ParseError);
    });
  });

  describe('makeDbRecruitInfo', () => {
    it('should create a valid DB recruitment info object', () => {
      // Given
      const botRecruitInfo: GeminiResponseRecruitInfoDTO = {
        is_recruit_info: true,
        title: 'Job Title',
        company_name: 'Company Name',
        job_description: 'Job Description',
        region_id: [1],
        region_text: 'Seoul',
        apply_start_date: new Date('2025-01-01'),
        apply_end_date: new Date('2025-12-31'),
        job_type: 'Full-time',
        require_experience: 'None',
      };
      const rawContent: IRawContent = {
        domain: 'example.com',
        url: 'http://example.com',
        text: 'Sample job posting text',
        title: 'Sample title',
      };
      const favicon = 'http://example.com/favicon.ico';

      // When
      const result = parser.makeDbRecruitInfo(botRecruitInfo, rawContent, favicon);

      // Then
      expect(result).toMatchObject({
        ...rawContent,
        ...botRecruitInfo,
        favicon,
        is_public: true,
      });
    });
  });
});