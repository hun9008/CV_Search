import { GeminiParser, GeminiParserOptions } from '../../src/parser/GeminiParser';
import { IDbConnector } from '@database/IDbConnector';
import { IBotRecruitInfo, IRawContent } from '../../src/models/RecruitInfoModel';
import * as dotenv from 'dotenv';
import { MessageService, QueueNames } from '../../src/message/MessageService';
import { RedisUrlManager, URLSTAUS } from '../../src/url/RedisUrlManager';
import { IRecruitInfoRepository } from '../../src/database/IRecruitInfoRepository';
import { MysqlRecruitInfoRepository } from '@database/MysqlRecruitInfoRepository';
import { IUrlManager } from '@url/IUrlManager';
import { IMessageService } from '@message/IMessageService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock dependencies
jest.mock('../../src/database/MongoDbConnector', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    getCollection: jest.fn().mockReturnValue({}),
    isConnected: jest.fn().mockReturnValue(true),
  }));
});

jest.mock('../../src/database/MysqlRecruitInfoRepository', () => {
  return jest.fn().mockImplementation(() => ({
    createRecruitInfo: jest.fn().mockResolvedValue({ id: 1 }),
    updateRecruitInfo: jest.fn().mockResolvedValue(true),
    getRegionIdByCode: jest.fn().mockResolvedValue(1),
    findByUrl: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    deleteRecruitInfo: jest.fn().mockResolvedValue(true),
  }));
});

// Mock the RedisUrlManager
jest.mock('../../src/url/RedisUrlManager', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    setURLStatus: jest.fn().mockImplementation((url, status) => {
      return Promise.resolve(true);
    }),
    getURLStatus: jest.fn().mockResolvedValue(null),
    getRandomUrlByStatus: jest.fn().mockResolvedValue('https://example.com'),
    textExists: jest.fn().mockResolvedValue(false),
    saveTextHash: jest.fn().mockResolvedValue(true),
    addUrl: jest.fn().mockResolvedValue(undefined),
    getNextUrl: jest.fn().mockResolvedValue({
      url: 'https://example.com',
      domain: 'example.com'
    }),
    initAvailableDomains: jest.fn().mockResolvedValue(undefined),
    getAllDomains: jest.fn().mockResolvedValue(['example.com']),
  }));
});

// Mock the MessageService
jest.mock('../../src/message/messageService', () => {
  const MessageServiceMock = jest.fn().mockImplementation(() => ({
    // Implement all methods from the IMessageService interface
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    sendVisitResult: jest.fn().mockResolvedValue(true),
    sendRecruitInfo: jest.fn().mockResolvedValue(true),
    sendRawContent: jest.fn().mockResolvedValue(true),
    consumeMessages: jest.fn().mockResolvedValue([]),
    handleLiveMessage: jest.fn().mockResolvedValue(undefined),
    sendAck: jest.fn().mockResolvedValue(undefined)
  }));

  return {
    __esModule: true,
    default: MessageServiceMock,
    MessageService: MessageServiceMock,
    QueueNames: {
      VISIT_RESULTS: 'visit_results',
      URL_SEED: 'url_seed',
      RECRUIT_INFO: 'recruit_info'
    },
    // Export the interface too
    IMessageService: jest.fn()
  };
});

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_text: '서울시 강남구',
        region_id: '1168000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      })
    }
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        generateContent: mockGenerateContent
      }))
    })),
    SchemaType: {
      OBJECT: 'OBJECT',
      BOOLEAN: 'BOOLEAN',
      STRING: 'STRING'
    }
  };
});

// Mock VisitResultModel - static method를 모킹하기 위한 방법
jest.mock('../../src/models/visitResult', () => {
  return {
    VisitResultModel: {
      aggregate: jest.fn().mockResolvedValue([])
    }
  };
});

// 환경 변수 로드
dotenv.config();

// 테스트 그룹 분리
describe('GeminiParser', () => {
  let parser: GeminiParser;
  let options: GeminiParserOptions;

  // Repository mock 객체 직접 생성 (new 방식 대신)
  let mockRecruitInfoRepository: MysqlRecruitInfoRepository;
  let mockCacheRecruitInfoRepository: IRecruitInfoRepository;
  let mockRedisUrlManager: IUrlManager;
  let mockMessageService: IMessageService;

  // 각 테스트 전에 새로운 파서 인스턴스 생성
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // GeminiParser 옵션 설정을 위한 mock 인스턴스들 생성
    const dbConnector = {
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockRejectedValue(true),
    } as IDbConnector;

    const cacheDbConnector = {
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockRejectedValue(true),
    } as IDbConnector;

    // 직접 mock 객체 생성 - 인스턴스화 대신 mocked 함수들을 가진 객체 생성
    mockRecruitInfoRepository = {
      createRecruitInfo: jest.fn().mockResolvedValue({ id: 1 }),
      updateRecruitInfo: jest.fn().mockResolvedValue(true),
      getRegionIdByCode: jest.fn().mockResolvedValue(90),
    };

    mockCacheRecruitInfoRepository = {
      createRecruitInfo: jest.fn().mockResolvedValue({ id: 2 }),
      updateRecruitInfo: jest.fn().mockResolvedValue(true),
    };

    mockRedisUrlManager = {
      connect: jest.fn().mockResolvedValue(undefined),
      setURLStatus: jest.fn().mockResolvedValue(true),
      getURLStatus: jest.fn().mockResolvedValue(null),
      getRandomUrlByStatus: jest.fn().mockResolvedValue('https://example.com'),
      getNextUrlFromDomain :jest.fn().mockResolvedValue('example.com'),
      textExists: jest.fn().mockResolvedValue(false),
      saveTextHash: jest.fn().mockResolvedValue(true),
      addUrl: jest.fn().mockResolvedValue(undefined),
      getNextUrl: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        domain: 'example.com'
      }),
    } as IUrlManager;

    // MessageService 인스턴스 생성 대신 mock 객체 생성
    mockMessageService = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      sendVisitResult: jest.fn().mockResolvedValue(true),
      sendRecruitInfo: jest.fn().mockResolvedValue(true),
      sendRawContent: jest.fn().mockResolvedValue(true),
      consumeMessages: jest.fn().mockResolvedValue([]),
      handleLiveMessage: jest.fn().mockResolvedValue(undefined),
      sendAck: jest.fn().mockResolvedValue(undefined)
    };

    // GeminiParser 옵션 설정 - 직접 생성한 mock 객체들 사용
    options = {
      apiKey: 'test-api-key',
      model: 'gemini-1.5-pro',
      dbConnector :dbConnector,
      cacheDbConnector :cacheDbConnector,
      recruitInfoRepository: mockRecruitInfoRepository,
      cacheRecruitInfoRepository: mockCacheRecruitInfoRepository,
      urlManager: mockRedisUrlManager,
      messageService: mockMessageService
    };

    // GeminiParser 인스턴스 생성
    parser = new GeminiParser(options);
  });

  // 기본 테스트 - 모킹 없이 기본 설정 테스트
  describe('Basic Functionality', () => {
    // 파서 인스턴스가 생성되는지 테스트
    test('should create parser instance successfully', () => {
      expect(parser).toBeInstanceOf(GeminiParser);
    });

    test('should return correct parser name', () => {
      expect(parser.getName()).toBe('GeminiParser');
    });

    // 초기화 메서드 테스트
    test('should initialize parser successfully', async () => {
      const result = await parser.initialize();
      expect(result).toBe(true);
    });

    // Gemini API 키 상태 조회 테스트
    test('should return totalKeys property in keyStatus', async () => {
      await parser.initialize();
      const keyStatus = parser.getKeyStatus();
      expect(keyStatus).toHaveProperty('totalKeys');
    });

    test('should return currentKeyIndex property in keyStatus', async () => {
      await parser.initialize();
      const keyStatus = parser.getKeyStatus();
      expect(keyStatus).toHaveProperty('currentKeyIndex');
    });

    test('should return currentApiKey property in keyStatus', async () => {
      await parser.initialize();
      const keyStatus = parser.getKeyStatus();
      expect(keyStatus).toHaveProperty('currentApiKey');
    });

    test('should return isClientInitialized property in keyStatus', async () => {
      await parser.initialize();
      const keyStatus = parser.getKeyStatus();
      expect(keyStatus).toHaveProperty('isClientInitialized');
    });

    test('should return model property in keyStatus', async () => {
      await parser.initialize();
      const keyStatus = parser.getKeyStatus();
      expect(keyStatus).toHaveProperty('model');
    });
  });

  // API 키 초기화 메서드 테스트
  describe('_initializeKey Method Tests', () => {
    test('should initialize API key correctly with valid key', async () => {
      const result = parser['_initializeKey']('test-valid-key', undefined, 0);
      expect(result).toBe(true);
      expect(parser['apiKey']).toBe('test-valid-key');
      expect(parser['currentKeyIndex']).toBe(0);
    });

    test('should initialize API key correctly with valid key array', async () => {
      const keyArray = ['key1', 'key2', 'key3'];
      const result = parser['_initializeKey'](undefined, keyArray, 1);
      expect(result).toBe(true);
      expect(parser['apiKey']).toBe('key2');
      expect(parser['currentKeyIndex']).toBe(1);
    });

    test('should default to index 0 when no keyIndex provided', async () => {
      const keyArray = ['key1', 'key2', 'key3'];
      const result = parser['_initializeKey'](undefined, keyArray, undefined);
      expect(result).toBe(true);
      expect(parser['apiKey']).toBe('key1');
      expect(parser['currentKeyIndex']).toBe(0);
    });

    test('should handle invalid key index by defaulting to 0', async () => {
      const keyArray = ['key1', 'key2', 'key3'];
      // Index out of bounds
      const result = parser['_initializeKey'](undefined, keyArray, 10);
      expect(result).toBe(true);
      expect(parser['apiKey']).toBe('key1');
      expect(parser['currentKeyIndex']).toBe(0);
    });

    test('should handle negative key index by defaulting to 0', async () => {
      const keyArray = ['key1', 'key2', 'key3'];
      const result = parser['_initializeKey'](undefined, keyArray, -1);
      expect(result).toBe(true);
      expect(parser['apiKey']).toBe('key1');
      expect(parser['currentKeyIndex']).toBe(0);
    });

    test('should return false when no keys are provided', async () => {
      const result = parser['_initializeKey'](undefined, undefined, 0);
      expect(result).toBe(false);
      expect(parser['apiKey']).toBeNull();
      expect(parser['currentKeyIndex']).toBe(-1);
    });

    test('should prioritize single key over key array when both provided', async () => {
      const keyArray = ['key1', 'key2', 'key3'];
      const singleKey = 'main-key';
      const result = parser['_initializeKey'](singleKey, keyArray, 1);
      expect(result).toBe(true);
      expect(parser['apiKeys']).toContain(singleKey);
      // The index may not be 1 as expected since we're adding to a Set first
      expect(parser['apiKey']).not.toBeNull();
    });
  });

  // 모킹을 사용한 테스트 그룹
  describe('With Mocked API', () => {
    beforeEach(() => {
      // GenerativeModel 모킹
      jest.mock('@google/generative-ai', () => {
        const mockGenerateContent = jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              success: true,
              company_name: '테스트 회사',
              department: '개발팀',
              location: '서울시 강남구',
              require_experience: '경력 3년 이상',
              job_description: '웹 개발자 포지션',
              job_type: '정규직',
              apply_start_date: '2025-04-01',
              apply_end_date: '2025-05-01',
              requirements: 'JavaScript, TypeScript, React 경험',
              preferred_qualifications: 'NextJS, GraphQL 경험',
              ideal_candidate: '적극적이고 능동적인 개발자'
            })
          }
        });

        // GoogleGenerativeAI 모킹
        return {
          GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockImplementation(() => ({
              generateContent: mockGenerateContent
            }))
          })),
          SchemaType: {
            OBJECT: 'OBJECT',
            BOOLEAN: 'BOOLEAN',
            STRING: 'STRING'
          }
        };
      });
    });

    afterEach(() => {
      jest.unmock('@google/generative-ai');
    });

    // DB 저장용 모델 변환 테스트
    test('should correctly set is_recruit_info in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.is_recruit_info).toBe(true);
    });

    test('should correctly set company_name in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.company_name).toBe('테스트 회사');
    });

    test('should correctly set url in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.url).toBe('https://example.com/jobs/senior-developer');
    });

    test('should correctly set title in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.title).toBe('테스트 회사 경력직 개발자 채용');
    });

    test('should correctly set raw_text in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.text).toBe('테스트 채용 공고 내용');
    });

    test('should correctly set domain in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.domain).toBe('example.com');
    });

    test('should correctly set is_public in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.is_public).toBe(true);
    });

    test('should set created_at as Date instance in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.created_at).toBeInstanceOf(Date);
    });

    test('should set updated_at as Date instance in DB model', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_id: '서울시 강남구',
        region_text: '1165000000',
        require_experience: '경력 3년 이상',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01',
        requirements: 'JavaScript, TypeScript, React 경험',
        preferred_qualifications: 'NextJS, GraphQL 경험',
        ideal_candidate: '적극적이고 능동적인 개발자'
      };

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/senior-developer',
        title: '테스트 회사 경력직 개발자 채용',
        text: '테스트 채용 공고 내용',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const dbModel = parser.makeDbRecruitInfo(botInfo, rawContent);
      expect(dbModel.updated_at).toBeInstanceOf(Date);
    });

    // API 오류 처리 테스트 - 모킹으로 오류 상황 생성
    test('should handle API errors gracefully by returning undefined is_recruit_info', async () => {
      await parser.initialize();

      // API 호출 메서드 모킹 - 실패하는 케이스
      parser['_executeApiCallWithRetries'] = jest.fn().mockResolvedValue({
        success: false,
        reason: 'API 오류: 요청 실패'
      });

      const sampleText = {
        url: 'https://example.com/jobs/developer',
        title: '프론트엔드 개발자 채용',
        text: '테스트 채용공고'
      };
      const result = await parser.parseRawContent(sampleText);

      expect(result.is_recruit_info).toBe(undefined);
    });
  });

  // 파싱 및 API 관련 테스트
  describe('Parsing and API Functionality', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // 파싱 메서드 테스트
    test('should successfully parse raw content', async () => {
      // 초기화
      await parser.initialize();

      // 테스트용 원본 콘텐츠
      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/developer',
        title: '개발자 채용',
        text: '채용합니다. 좋은 개발자 구합니다.',
        domain: 'example.com',
        crawledAt: new Date()
      };

      // 모의 응답 설정
      const mockParsedContent = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_text: '서울시 강남구',
        region_id: '1168000000',
        require_experience: '경력',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01'
      };

      // 파싱 메서드 모킹
      parser['_parseRecruitment'] = jest.fn().mockResolvedValue(mockParsedContent);

      // 실행
      const result = await parser.parseRawContent(rawContent);

      // 검증
      expect(result).toEqual(mockParsedContent);
      expect(parser['_parseRecruitment']).toHaveBeenCalled();
    });

    test('should handle errors during parsing', async () => {
      // 초기화
      await parser.initialize();

      // 테스트용 원본 콘텐츠
      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/developer',
        title: '개발자 채용',
        text: '채용합니다. 좋은 개발자 구합니다.',
        domain: 'example.com',
        crawledAt: new Date()
      };

      // API 오류 모킹
      const mockError = new Error('API 요청 실패');
      parser['_parseRecruitment'] = jest.fn().mockRejectedValue(mockError);

      // 오류 발생 확인
      await expect(parser.parseRawContent(rawContent)).rejects.toThrow();
    });

    // API 키 로테이션 테스트
    test('should rotate API key on rate limit error', async () => {
      // 초기화
      parser['apiKeys'] = ['key1', 'key2', 'key3'];
      parser['currentKeyIndex'] = 0;
      parser['apiKey'] = 'key1';

      // _initializeClient 메서드 모킹
      parser['_initializeClient'] = jest.fn().mockImplementation(()=>{parser['genAI']= new GoogleGenerativeAI('temp')});

      // 실행
      const result = parser['_rotateApiKey']();

      // 검증
      expect(result).toBe(true);
      expect(parser['currentKeyIndex']).toBe(1);
      expect(parser['apiKey']).toBe('key2');
      expect(parser['_initializeClient']).toHaveBeenCalled();
    });

    test('should handle failure when no more keys are available', async () => {
      // 초기화 - 키가 하나만 있는 상태
      parser['apiKeys'] = ['key1'];

      parser['currentKeyIndex'] = 0;
      parser['apiKey'] = 'key1';

      expect(parser['apiKeys'].length).toBe(1);
      // 실행
      const result = parser['_rotateApiKey']();

      // 검증
      expect(result).toBe(false);
      expect(parser['currentKeyIndex']).toBe(0);
      expect(parser['apiKey']).toBe('key1');
    });

    // API 호출 실행 및 재시도 로직 테스트
    test('should retry API call on rate limit error', async () => {
      // 초기화
      parser['apiKeys'] = ['key1', 'key2'];
      parser['currentKeyIndex'] = 0;
      parser['apiKey'] = 'key1';
      parser['genAI'] = {} as any; // API 클라이언트가 초기화되어 있다고 가정

      // _rotateApiKey 메서드 모킹
      parser['_rotateApiKey'] = jest.fn().mockReturnValue(true);

      // API 호출 함수 (첫 번째는 실패, 두 번째는 성공)
      const apiCallFunction = jest.fn()
        .mockRejectedValueOnce({ status: 429, message: 'Resource has been exhausted' })
        .mockResolvedValueOnce({ success: true, data: 'API 응답' });

      // 실행
      const result = await parser['_executeApiCallWithRetries'](apiCallFunction);

      // 검증
      expect(result).toEqual({ success: true, data: 'API 응답' });
      expect(apiCallFunction).toHaveBeenCalledTimes(2); // 두 번 호출되었는지 확인
      expect(parser['_rotateApiKey']).toHaveBeenCalledTimes(1); // 키 로테이션이 한 번 발생했는지 확인
    });

    // URL 상태 업데이트 테스트
    test('should update URL status after parsing', async () => {
      // 초기화
      await parser.initialize();

      const rawContent: IRawContent = {
        url: 'https://example.com/jobs/developer',
        title: '개발자 채용',
        text: '채용합니다. 좋은 개발자 구합니다.',
        domain: 'example.com',
        crawledAt: new Date()
      };

      const parsedContent: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_text: '서울시 강남구',
        region_id: '1168000000',
        require_experience: '경력',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01'
      };

      // setURLStatus 메서드 모킹
      const setURLStatusSpy = jest.spyOn(parser.urlManager, 'setURLStatus');

      // 실행
      await parser.updateRecruitStatus(rawContent, parsedContent);

      // 검증
      expect(setURLStatusSpy).toHaveBeenCalledWith(
        'https://example.com/jobs/developer',
        URLSTAUS.HAS_RECRUITINFO
      );
    });

    // 전체 파싱 프로세스 테스트 (run 메서드)
    test('should process raw contents in run method', async () => {
      // 초기화
      await parser.initialize();

      // VisitResultModel.aggregate 모킹 - 가짜 데이터 반환
      const mockRawContents = [
        {
          url: 'https://example.com/jobs/1',
          title: '개발자 채용 1',
          text: '채용합니다. 좋은 개발자 구합니다. 1',
          domain: 'example.com',
          crawledAt: new Date()
        },
        {
          url: 'https://example.com/jobs/2',
          title: '개발자 채용 2',
          text: '채용합니다. 좋은 개발자 구합니다. 2',
          domain: 'example.com',
          crawledAt: new Date()
        }
      ];

      // loadMongoRawContent 메서드 모킹
      parser.loadMongoRawContent = jest.fn().mockResolvedValue(mockRawContents);

      // parseRawContent 메서드 모킹
      parser.parseRawContent = jest.fn().mockImplementation(() => ({
        is_recruit_info: true,
        is_it_recruit_info: true,
        company_name: '테스트 회사',
        department: '개발팀',
        region_text: '서울시 강남구',
        region_id: '1168000000',
        require_experience: '경력',
        job_description: '웹 개발자 포지션',
        job_type: '정규직',
        apply_start_date: '2025-04-01',
        apply_end_date: '2025-05-01'
      }));

      // updateRecruitStatus 메서드 모킹
      parser.updateRecruitStatus = jest.fn().mockResolvedValue(true);

      // makeDbRecruitInfo 메서드 모킹
      parser.makeDbRecruitInfo = jest.fn().mockImplementation((botInfo, rawContent) => ({
        ...botInfo,
        ...rawContent,
        created_at: new Date(),
        updated_at: new Date(),
        is_public: true
      }));

      // createRecruitInfo 메서드 모킹
      const createRecruitInfoSpy = jest.spyOn(parser.recruitInfoRepository, 'createRecruitInfo');

      // 실행
      await parser.run();

      // 검증
      expect(parser.loadMongoRawContent).toHaveBeenCalled();
      expect(parser.parseRawContent).toHaveBeenCalledTimes(2);
      expect(parser.updateRecruitStatus).toHaveBeenCalledTimes(2);
      expect(createRecruitInfoSpy).toHaveBeenCalledTimes(2);
    });
  });
});