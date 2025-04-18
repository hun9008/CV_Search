import { GeminiParser, GeminiParserOptions } from '../../src/parser/GeminiParser';
import { MongoDbConnector } from '../../src/database/MongoDbConnector';
import { IDbConnector } from '../../src/database';
import { IBotRecruitInfo, IRawContent } from '../../src/models/recruitinfoModel';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 테스트 그룹 분리
describe('GeminiParser', () => {
  let parser: GeminiParser;
  let mongod: MongoMemoryServer;
  let dbConnector: IDbConnector;

  // 테스트 전 초기화
  beforeAll(async () => {
    // MongoDB 메모리 서버 시작
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    // DB 커넥터 초기화
    dbConnector = new MongoDbConnector({ dbUri: uri });
    await dbConnector.connect();
  });

  // 테스트 후 정리
  afterAll(async () => {
    // Mongoose 연결 해제
    await dbConnector.disconnect();
    // MongoDB 메모리 서버 종료
    await mongod.stop();
  });

  // 각 테스트 전에 새로운 파서 인스턴스 생성
  beforeEach(() => {
    // GeminiParser 옵션 설정
    const options: GeminiParserOptions = {
      dbConnector,
      apiKey: process.env.GEMINI_API_KEY,
      useCache: false,  // 테스트에서는 캐시 사용 안 함
      model: 'gemini-2.0-flash'
    };

    // GeminiParser 인스턴스 생성
    parser = new GeminiParser(options);
  });

  // 기본 테스트 - 모킹 없이 기본 설정 테스트
  describe('Basic Functionality', () => {
    // 파서 인스턴스가 생성되는지 테스트
    test('creates parser instance successfully', () => {
      expect(parser).toBeInstanceOf(GeminiParser);
      expect(parser.getName()).toBe('GeminiParser');
    });

    // 초기화 메서드 테스트
    test('initializes parser successfully', async () => {
      const result = await parser.initialize();
      expect(result).toBe(true);
    });

    // Gemini API 키 상태 조회 테스트
    test('getKeyStatus returns correct information', async () => {
      await parser.initialize();
      const keyStatus = parser.getKeyStatus();

      expect(keyStatus).toHaveProperty('totalKeys');
      expect(keyStatus).toHaveProperty('currentKeyIndex');
      expect(keyStatus).toHaveProperty('currentApiKey');
      expect(keyStatus).toHaveProperty('isClientInitialized');
      expect(keyStatus).toHaveProperty('model');
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
    test('makeDbRecruitInfo converts to DB model correctly', async () => {
      const botInfo: IBotRecruitInfo = {
        is_recruit_info: true,
        is_it_recruit_info:true,
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
      expect(dbModel.company_name).toBe('테스트 회사');
      expect(dbModel.url).toBe('https://example.com/jobs/senior-developer');
      expect(dbModel.title).toBe('테스트 회사 경력직 개발자 채용');
      expect(dbModel.raw_text).toBe('테스트 채용 공고 내용');
      expect(dbModel.domain).toBe('example.com');
      expect(dbModel.is_public).toBe(true);
      expect(dbModel.created_at).toBeInstanceOf(Date);
      expect(dbModel.updated_at).toBeInstanceOf(Date);
    });

    // API 오류 처리 테스트 - 모킹으로 오류 상황 생성
    test('handles API errors gracefully with mocking', async () => {
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

  // 실제 API를 사용하는 테스트 그룹
  describe('With Real API (Integration Tests)', () => {
    // GEMINI_API_KEY 환경변수가 있을 때만 실행하는 로직
    beforeAll(() => {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('❗ GEMINI_API_KEY 환경변수가 설정되지 않았습니다. 실제 API 테스트를 건너뜁니다.');
      }
    });

    // 텍스트 콘텐츠 직접 파싱 테스트 - 채용 공고
    test('parseContent parses job posting correctly with real API', async () => {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY가 없어 테스트를 건너뜁니다.');
        return;
      }

      await parser.initialize();

      const sampleText = {
        url: 'https://example.com/jobs/developer',
        title: '프론트엔드 개발자 채용',
        text: `
      채용공고

      주식회사 테크솔루션에서 백엔드 개발자를 모집합니다.

      [채용 정보]
      - 회사명: 테크솔루션
      - 직무: 백엔드 개발자
      - 경력: 3년 이상
      - 근무지: 서울시 강남구
      - 고용형태: 정규직
      - 지원 기간: 2025년 5월 1일 ~ 2025년 5월 31일

      [업무 내용]
      - Node.js, TypeScript를 활용한 API 개발
      - 데이터베이스 설계 및 운영
      - CI/CD 파이프라인 구축 및 운영

      [지원 자격]
      - Node.js, TypeScript 개발 경험 3년 이상
      - RESTful API 설계 및 개발 경험
      - SQL, NoSQL 데이터베이스 활용 경험

      [우대 사항]
      - MSA 아키텍처 경험
      - AWS 등 클라우드 서비스 활용 경험
      - 컨테이너 기술(Docker, Kubernetes) 경험

      [지원 방법]
      - 이력서, 자기소개서 제출
      - 이메일: recruit@techsolution.com
      `};

      const result = await parser.parseRawContent(sampleText);
      console.log(result);
      console.log('job_type:', result.job_type);
      console.log('region_id:', result.region_id);
      expect(result.is_recruit_info).toBe(true);
      expect(result.company_name).toContain('테크솔루션');
      expect(result.job_type).toContain('정규직');
      expect(result.region_text).toContain('서울시 강남구');
      expect(result.region_id).toContain('1168000000');
      expect(result.require_experience).toContain('경력');
    }, 30000); // 타임아웃 30초로 설정 (API 호출 대기 시간 고려)

    // 텍스트 콘텐츠 직접 파싱 테스트 - 채용 공고가 아닌 경우
    test('parseContent identifies non-job content correctly with real API', async () => {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY가 없어 테스트를 건너뜁니다.');
        return;
      }

      await parser.initialize();

      const sampleText = {
        url: 'https://example.com/jobs/developer',
        title: ' 테크솔루션 회사 소개',
        text: `
      테크솔루션 회사 소개

      테크솔루션은 2015년에 설립된 IT 솔루션 전문 기업입니다.

      [주요 서비스]
      - 클라우드 인프라 구축
      - 웹/모바일 애플리케이션 개발
      - 빅데이터 분석 솔루션

      [회사 연혁]
      - 2015년: 회사 설립
      - 2018년: 벤처기업 인증
      - 2020년: 해외 지사 설립
      - 2023년: 연매출 100억 달성

      [오시는 길]
      서울시 강남구 테헤란로 123

      [문의]
      - 전화: 02-123-4567
      - 이메일: info@techsolution.com
      `};
      const result = await parser.parseRawContent(sampleText);

      expect(result.is_recruit_info).toBe(false);


      // 원본 콘텐츠 파싱 테스트 - 실제 API 사용
    });

     test('parseRawContent parses raw content with real API', async () => {
        if (!process.env.GEMINI_API_KEY) {
          console.warn('GEMINI_API_KEY가 없어 테스트를 건너뜁니다.');
          return;
        }

        await parser.initialize();

        const rawContent: IRawContent = {
          url: 'https://example.com/jobs/developer',
          title: '프론트엔드 개발자 채용',
          text: `
        채용공고

        우리 회사에서 프론트엔드 개발자를 모집합니다.

        - 회사명: 프론트테크
        - 직무: 프론트엔드 개발자
        - 경력: 신입 및 경력
        - 근무지: 서울시 서초구
        - 급여: 면접 후 결정
        - 모집기간: ~2025년 6월 30일

        주요 업무:
        - React 기반 웹 애플리케이션 개발
        - UI/UX 개선 및 최적화
        - RESTful API 연동

        자격 요건:
        - HTML, CSS, JavaScript 능숙자
        - React 개발 경험
        - 웹 표준 및 접근성 이해

        지원방법:
        이메일 지원: jobs@fronttech.com
        `,
          domain: 'example.com',
          crawledAt: new Date()
        };

        const result = await parser.parseRawContent(rawContent);
        console.log(result);
        expect(result.is_recruit_info).toBe(true);
        expect(result.company_name).toContain('프론트테크');
        expect(result.region_text).toContain('서울시 서초구');
        expect(result.region_id).toContain('1165000000');
      }, 30000);

  });

});