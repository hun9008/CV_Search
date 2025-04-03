const ParseManager = require('@parse/parseManager');
const { GeminiService } = require('@parse/geminiService');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { VisitResult, SubUrl } = require('@models/visitResult');
const RecruitInfo = require('@models/recruitInfo');
const { defaultLogger: logger } = require('@utils/logger');
const { faker } = require('@faker-js/faker');

// GeminiService 모킹 - mockFaker 변수를 사용하여 faker 참조 문제 해결
jest.mock('@parse/geminiService', () => {
  // 모의 데이터 생성 함수
  const mockData = {
    companyNames: ['테스트 회사', '개발 기업', '소프트웨어 회사', 'IT 기업', '기술 스타트업'],
    departments: ['개발팀', '기술부서', 'R&D', '인프라팀', '프론트엔드팀', '백엔드팀'],
    experiences: ['신입', '경력 3년 이상', '경력 무관', '주니어', '시니어'],
    jobTypes: ['정규직', '계약직', '인턴', '프리랜서', '파트타임'],
    paragraphs: [
      '이 직무는 웹 개발과 관련된 업무를 담당합니다.',
      '소프트웨어 개발 및 유지보수 업무를 수행합니다.',
      '팀과 협업하여 고품질 소프트웨어를 개발합니다.',
      '애자일 방법론을 통한, 빠른 개발과 일정 진행을 합니다.',
      '새로운 기술을 연구하고 적용하여 업무를 혁신합니다.'
    ],
    requirements: [
      'JavaScript, TypeScript 능숙자',
      '컴퓨터 관련 학위 또는 유사 경험',
      'React, Vue.js 프레임워크 사용 경험',
      'SQL 및 NoSQL 데이터베이스 지식',
      '3년 이상의 개발 경험'
    ]
  };

  // 랜덤 항목 선택 함수
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 날짜 생성 함수
  const getRandomDate = (future = false) => {
    const date = new Date();
    if (future) {
      date.setDate(date.getDate() + Math.floor(Math.random() * 60) + 1);
    } else {
      date.setDate(date.getDate() - Math.floor(Math.random() * 10));
    }
    return date.toISOString().split('T')[0];
  };

  return {
    GeminiService: jest.fn().mockImplementation(() => ({
      parseRecruitment: jest.fn().mockImplementation(async (content) => {
        // 랜덤으로 채용공고 또는 비채용공고 응답 생성
        const isRecruit = Math.random() > 0.5;

        if (isRecruit) {
          return {
            success: true,
            isRecruit: true,
            company_name: getRandomItem(mockData.companyNames),
            department: getRandomItem(mockData.departments),
            experience: getRandomItem(mockData.experiences),
            description: getRandomItem(mockData.paragraphs),
            job_type: getRandomItem(mockData.jobTypes),
            posted_period: `${getRandomDate()} ~ ${getRandomDate(true)}`,
            requirements: getRandomItem(mockData.requirements),
            preferred_qualifications: getRandomItem(mockData.paragraphs),
            ideal_candidate: getRandomItem(mockData.paragraphs)
          };
        } else {
          return {
            success: false,
            isRecruit: false,
            reason: '채용공고가 아닙니다. 일반 콘텐츠로 판단됩니다.'
          };
        }
      })
    }))
  };
});

// MongoDB 메모리 서버
let mongoServer;
let uri;

/**
 * 테스트 데이터 생성 함수
 */
async function generateTestData(domainsCount = 2, urlsPerDomain = 3) {
  const domains = [];

  for (let i = 0; i < domainsCount; i++) {
    const domain = faker.internet.domainName();
    domains.push(domain);

    const visitResult = new VisitResult({
      domain,
      url: `https://${domain}`,
      created_at: new Date(),
      updated_at: new Date(),
      suburl_list: []
    });

    for (let j = 0; j < urlsPerDomain; j++) {
      const path = j === 0 ? '/' : `/${faker.lorem.slug()}`;
      const url = `https://${domain}${path}`;

      const subUrl = {
        url,
        path,
        visited: true,
        success: true,
        visitedAt: new Date(),
        title: faker.lorem.sentence(),
        text: faker.lorem.paragraphs(3),
        meta: {
          description: faker.lorem.paragraph(),
          keywords: faker.lorem.words()
        },
        created_at: new Date(),
        updated_at: new Date(),
        isRecruit: null // 미분류 상태
      };

      visitResult.suburl_list.push(subUrl);
    }

    await visitResult.save();
  }

  return domains;
}

/**
 * MongoDB 메모리 서버 시작 및 연결
 */
async function startMemoryMongoDB() {
  mongoServer = await MongoMemoryServer.create();
  uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return uri;
}

/**
 * MongoDB 메모리 서버 종료 및 연결 해제
 */
async function stopMemoryMongoDB() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

// 테스트용 ParseManager 확장 클래스
class TestParseManager extends ParseManager {
  constructor(options = {}) {
    super(options);
    // 모킹된 GeminiService 사용
    this.geminiService = new GeminiService();
  }

  // MongoDB 연결 오버라이드
  async connect() {
    // 이미 메모리 DB에 연결되어 있으므로 아무것도 하지 않음
    return mongoose.connection;
  }

  // getStatus 메서드 추가 (테스트에서 필요)
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      config: {
        batchSize: this.batchSize,
        delayBetweenRequests: this.delayBetweenRequests,
        maxRetries: this.maxRetries
      }
    };
  }
}

describe('ParseManager', () => {
  let parseManager;

  beforeAll(async () => {
    await startMemoryMongoDB();
    await generateTestData(2, 3);
  }, 30000);

  afterAll(async () => {
    await stopMemoryMongoDB();
  });

  beforeEach(() => {
    parseManager = new TestParseManager({
      batchSize: 2,
      delayBetweenRequests: 100 // 테스트에서는 지연시간 최소화
    });
  });

  test('ParseManager 인스턴스가 생성되어야 함', () => {
    expect(parseManager).toBeDefined();
    expect(parseManager).toBeInstanceOf(ParseManager);
  });

  test('미분류 URL을 추출할 수 있어야 함', async () => {
    const urls = await parseManager.fetchUnclassifiedUrls(3);

    expect(Array.isArray(urls)).toBe(true);
    expect(urls.length).toBeGreaterThan(0);

    if (urls.length > 0) {
      const url = urls[0];
      expect(url).toHaveProperty('url');
      expect(url).toHaveProperty('domain');
      expect(url).toHaveProperty('text');
      expect(url).toHaveProperty('title');
    }
  });

  test('URL 분석 요청이 성공해야 함', async () => {
    const testUrl = {
      url: 'https://example.com/test',
      title: 'Test Job Posting',
      text: 'This is a test job posting content.',
      meta: { description: 'Job description' }
    };

    const result = await parseManager.requestUrlParse(testUrl);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');

    if (result.success) {
      expect(result).toHaveProperty('company_name');
      expect(result).toHaveProperty('description');
    } else {
      expect(result).toHaveProperty('reason');
    }
  });

  test('RecruitInfo 스키마로 데이터를 변환할 수 있어야 함', async () => {
    const testUrl = {
      domain: 'example.com',
      url: 'https://example.com/jobs/123',
      title: 'Senior Developer',
      text: 'Looking for an experienced developer',
      meta: { description: 'Job opportunity' }
    };

    const geminiResponse = {
      isRecruit: true,
      success: true,
      company_name: '테스트 회사',
      department: '개발팀',
      experience: '경력 3년 이상',
      description: '소프트웨어 개발 업무',
      job_type: '정규직',
      posted_period: '2025-03-01 ~ 2025-04-01',
      requirements: 'JavaScript, Node.js',
      preferred_qualifications: 'TypeScript, React',
      ideal_candidate: '열정적인 개발자'
    };

    const result = parseManager.convertToRecruitInfoSchema(geminiResponse, testUrl);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('url', testUrl.url);
    expect(result).toHaveProperty('company_name', geminiResponse.company_name);
    expect(result).toHaveProperty('domain', testUrl.domain);
    expect(result).toHaveProperty('start_date');
    expect(result).toHaveProperty('end_date');
    expect(result.start_date instanceof Date).toBe(true);
    expect(result.end_date instanceof Date).toBe(true);
  });

  test('URL 상태를 업데이트할 수 있어야 함', async () => {
    // 테스트할 URL 가져오기
    const urls = await parseManager.fetchUnclassifiedUrls(1);

    if (urls.length === 0) {
      logger.warn('테스트할 URL이 없습니다');
      return;
    }

    const testUrl = urls[0].url;
    const result = await parseManager.updateSubUrlStatus(testUrl, true);

    expect(typeof result).toBe('boolean');

    // URL 상태 확인
    const updatedDoc = await VisitResult.findOne(
      { 'suburl_list.url': testUrl },
      { 'suburl_list.$': 1 }
    );

    expect(updatedDoc).toBeDefined();
    expect(updatedDoc.suburl_list[0]).toHaveProperty('isRecruit', true);
  });

  test('채용공고 정보를 저장할 수 있어야 함', async () => {
    const randomSlug = Math.random().toString(36).substring(7);
    const testRecruitInfo = {
      domain: 'example.com',
      url: `https://example.com/jobs/${randomSlug}`,
      title: 'Test Job',
      company_name: '테스트 회사',
      department: 'IT',
      experience: '2+ years',
      description: 'Test job description',
      job_type: 'Full-time',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      requirements: 'JavaScript, Node.js',
      raw_text: 'Full job description here',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await parseManager.saveRecruitInfo(testRecruitInfo);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('_id');
    expect(result).toHaveProperty('url', testRecruitInfo.url);
    expect(result).toHaveProperty('company_name', testRecruitInfo.company_name);

    // 저장된 문서 확인
    const savedDoc = await RecruitInfo.findOne({ url: testRecruitInfo.url });
    expect(savedDoc).toBeDefined();
    expect(savedDoc.company_name).toBe(testRecruitInfo.company_name);
  });

  test('단일 URL을 처리할 수 있어야 함', async () => {
    const urls = await parseManager.fetchUnclassifiedUrls(1);

    if (urls.length === 0) {
      logger.warn('테스트할 URL이 없습니다');
      return;
    }

    const testUrl = urls[0];
    const result = await parseManager.processUrl(testUrl);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('url', testUrl.url);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('isRecruit');

    // URL 처리 후 상태 확인
    const updatedDoc = await VisitResult.findOne(
      { 'suburl_list.url': testUrl.url },
      { 'suburl_list.$': 1 }
    );

    expect(updatedDoc).toBeDefined();
    expect(updatedDoc.suburl_list[0].isRecruit !== null).toBe(true);

    // 채용공고로 분류된 경우 RecruitInfo 컬렉션에 저장되어야 함
    if (result.isRecruit) {
      const savedRecruitInfo = await RecruitInfo.findOne({ url: testUrl.url });
      expect(savedRecruitInfo).toBeDefined();
    }
  });

  test('배치 처리를 실행할 수 있어야 함', async () => {
    // ParseManager의 run 메서드가 구현되어 있다고 가정
    const result = await parseManager.run(2);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('stats');
    expect(result.stats).toHaveProperty('processed');
    expect(result.stats.processed).toBeGreaterThanOrEqual(0);
  });

  test('상태 정보를 반환할 수 있어야 함', () => {
    const status = parseManager.getStatus();

    expect(status).toBeDefined();
    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('stats');
    expect(status).toHaveProperty('config');
    expect(status.config).toHaveProperty('batchSize', 2);
    expect(status.config).toHaveProperty('delayBetweenRequests', 100);
  });
});