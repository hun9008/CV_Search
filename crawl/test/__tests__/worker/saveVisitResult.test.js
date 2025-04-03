const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { VisitResult, SubUrl, extractDomain } = require('@models/visitResult');

// 모듈 로깅을 위한 모의 로거
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

/**
 * 테스트용 saveVisitResult 함수 - BaseWorkerManager에서 추출
 * @param {Object|SubUrl} subUrlResult - visitUrl 함수의 반환 결과
 * @returns {Promise<boolean>} 성공 여부
 */
async function saveVisitResult(subUrlResult) {
  try {
    const domain = subUrlResult.domain;
    const url = subUrlResult.url;

    mockLogger.info(`도메인 ${domain}의 URL ${url} 방문 결과 저장 중...`);

    // 1. 도메인 문서 찾기 (없으면 생성)
    let domainDoc = await VisitResult.findOne({ domain });

    if (!domainDoc) {
      // 도메인 문서가 없으면 새로 생성
      domainDoc = new VisitResult({
        domain,
        suburl_list: [],  // 빈 배열로 초기화
      });
      mockLogger.info(`도메인 ${domain}에 대한 새 문서 생성`);
    }

    // 2. 확인: suburl_list 배열이 없으면 초기화
    if (!domainDoc.suburl_list) {
      domainDoc.suburl_list = [];
    }

    // 3. suburl_list 배열에서 해당 URL 찾기
    let existingUrlIndex = domainDoc.suburl_list.findIndex(item => item.url === url);

    if (existingUrlIndex >= 0) {
      domainDoc.suburl_list[existingUrlIndex] = subUrlResult.toObject();
      mockLogger.info(`기존 URL ${url} 정보 업데이트 (SubUrl 모델 사용)`);
    } else {
      domainDoc.suburl_list.push(subUrlResult.toObject());
      mockLogger.info(`새 URL ${url} 정보 추가 (SubUrl 모델 사용)`);
    }

    // 방금 저장한 URL 항목에 대한 요약 정보 표시
    const savedUrlEntry = domainDoc.suburl_list.find(item => item.url === url);
    if (savedUrlEntry) {
      // SubUrl 모델의 인스턴스 생성하여 logSummary 호출
      const subUrl = new SubUrl(savedUrlEntry);
      subUrl.logSummary(mockLogger);
    }

    mockLogger.info(`도메인 ${domain} 문서 저장 완료`);

    // 발견된 URL을 데이터베이스에 추가
    const urlsToAdd = subUrlResult.crawledUrls || [];

    // 각 URL 처리 (간소화)
    for (const newUrl of urlsToAdd) {
      try {
        // 해당 도메인에 URL 추가 시도
        const newUrlDomain = extractDomain(newUrl);
        if (!newUrlDomain) continue;

        // URL이 이미 존재하는지 확인
        const urlExists = domainDoc.suburl_list.some(item => item.url === newUrl);
        if (!urlExists && newUrlDomain === domain) {
          // 새 URL을 suburl_list에 추가 - SubUrl 모델 사용
          const newSubUrl = new SubUrl({
            url: newUrl,
            domain: newUrlDomain,
            visited: false,
            discoveredAt: new Date(),
            created_at: new Date()
          });

          // toObject()로 변환하여 추가
          domainDoc.suburl_list.push(newSubUrl.toObject());
        }
        // 다른 도메인인 경우 새 문서 생성 또는 기존 문서 업데이트
        else if (!urlExists && newUrlDomain !== domain) {
          let otherDomainDoc = await VisitResult.findOne({ domain: newUrlDomain });

          if (!otherDomainDoc) {
            otherDomainDoc = new VisitResult({
              domain: newUrlDomain,
              suburl_list: [],
              created_at: new Date(),
              updated_at: new Date()
            });
          }

          if (!otherDomainDoc.suburl_list) {
            otherDomainDoc.suburl_list = [];
          }

          const urlExistsInOtherDomain = otherDomainDoc.suburl_list.some(item => item.url === newUrl);

          if (!urlExistsInOtherDomain) {
            const newSubUrl = new SubUrl({
              url: newUrl,
              domain: newUrlDomain,
              visited: false,
              discoveredAt: new Date(),
              created_at: new Date()
            });

            otherDomainDoc.suburl_list.push(newSubUrl.toObject());
            otherDomainDoc.updated_at = new Date();
            await otherDomainDoc.save();
          }
        }
      } catch (urlError) {
        mockLogger.error(`URL 추가 중 오류 (${newUrl}):`, urlError);
      }
    }

    // 도메인 문서 저장
    domainDoc.updated_at = new Date();
    await domainDoc.save();

    return domainDoc;  // 테스트를 위해 저장된 도메인 문서 반환
  } catch (error) {
    mockLogger.error(`방문 결과 저장 중 오류:`, error);
    throw error;
  }
}

describe('saveVisitResult 함수 테스트', () => {
  let mongoServer;

  // 각 테스트 전에 메모리 MongoDB 서버 시작 및 연결
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // 각 테스트 후에 MongoDB 연결 해제 및 서버 종료
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // 각 테스트 전에 컬렉션 초기화
  beforeEach(async () => {
    await VisitResult.deleteMany({});
    jest.clearAllMocks();
  });

  test('SubUrl 인스턴스를 suburl_list에 저장', async () => {
    // 방문 결과로 SubUrl 인스턴스 생성
    const subUrl = new SubUrl({
      url: 'https://example.com/page1',
      domain: 'example.com',
      visited: true,
      visitedAt: new Date(),
      success: true,
      title: '예시 페이지 1',
      crawlStats: {
        total: 10,
        href: 8,
        onclick: 2
      },
      crawledUrls: [
        'https://example.com/page2',
        'https://example.com/page3',
        'https://other.com/page1'
      ]
    });

    // // 로그 호출 메서드 스텁
    // subUrl.logSummary = jest.fn();

    // saveVisitResult 함수 실행
    const result = await saveVisitResult(subUrl);

    // 결과 검증
    expect(result).toBeDefined();
    expect(result.domain).toBe('example.com');
    expect(result.suburl_list).toHaveLength(3); // 원본 URL + 같은 도메인의 크롤링된 2개 URL
    expect(result.suburl_list[0].url).toBe('https://example.com/page1');
    expect(result.suburl_list[0].title).toBe('예시 페이지 1');
    expect(result.suburl_list[0].visited).toBe(true);
    expect(result.suburl_list[0].success).toBe(true);
    expect(result.suburl_list[0].crawlStats.total).toBe(10);

    // 크롤링된 URL이 같은 도메인에 저장되었는지 확인
    expect(result.suburl_list[1].url).toBe('https://example.com/page2');
    expect(result.suburl_list[1].visited).toBe(false);
    expect(result.suburl_list[2].url).toBe('https://example.com/page3');

    // 다른 도메인의 URL이 별도 문서로 저장되었는지 확인
    const otherDomain = await VisitResult.findOne({ domain: 'other.com' });
    expect(otherDomain).toBeDefined();
    expect(otherDomain.suburl_list).toHaveLength(1);
    expect(otherDomain.suburl_list[0].url).toBe('https://other.com/page1');
    expect(otherDomain.suburl_list[0].visited).toBe(false);

    // logSummary 호출 확인
    // expect(subUrl.logSummary).toHaveBeenCalledWith(mockLogger);
  });

  test('기존 URL 업데이트', async () => {
    // 먼저 도메인 문서 생성
    const initialSubUrl = new SubUrl({
      url: 'https://example.com/page1',
      domain: 'example.com',
      visited: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    const initialDomain = new VisitResult({
      domain: 'example.com',
      suburl_list: [initialSubUrl.toObject()]
    });
    await initialDomain.save();

    // 같은 URL에 대한 방문 결과로 SubUrl 인스턴스 생성
    const updatedSubUrl = new SubUrl({
      url: 'https://example.com/page1',
      domain: 'example.com',
      visited: true,
      visitedAt: new Date(),
      success: true,
      title: '업데이트된 페이지 제목',
      text: '업데이트된 텍스트 내용',
      crawlStats: {
        total: 15,
        href: 12,
        onclick: 3
      }
    });

    // 로그 호출 메서드 스텁
    updatedSubUrl.logSummary = jest.fn();

    // saveVisitResult 함수 실행
    const result = await saveVisitResult(updatedSubUrl);

    // 결과 검증
    expect(result).toBeDefined();
    expect(result.domain).toBe('example.com');
    expect(result.suburl_list).toHaveLength(1);
    expect(result.suburl_list[0].url).toBe('https://example.com/page1');
    expect(result.suburl_list[0].title).toBe('업데이트된 페이지 제목');
    expect(result.suburl_list[0].visited).toBe(true);
    expect(result.suburl_list[0].success).toBe(true);
    expect(result.suburl_list[0].crawlStats.total).toBe(15);

    // logSummary 호출 확인
    // expect(updatedSubUrl.logSummary).toHaveBeenCalledWith(mockLogger);
  });

  test('오류 처리', async () => {
    // 의도적으로 오류를 발생시키기 위해 잘못된 URL 준비
    const invalidSubUrl = new SubUrl({
      domain: 'example.com',
      // URL이 없으면 스키마 유효성 검사 오류가 발생해야 함
    });

    // 오류가 발생하는지 확인
    await expect(saveVisitResult(invalidSubUrl)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  test('크롤링된 URL 처리', async () => {
    // 여러 도메인의 URL이 포함된 SubUrl 인스턴스 생성
    const subUrl = new SubUrl({
      url: 'https://example.com/page1',
      domain: 'example.com',
      visited: true,
      visitedAt: new Date(),
      success: true,
      crawlStats: {
        total: 5,
        href: 3,
        onclick: 2
      },
      crawledUrls: [
        'https://example.com/page2',
        'https://example.com/page3',
        'https://other1.com/page1',
        'https://other2.com/page1',
        'https://other3.com/page1'
      ]
    });

    // 로그 호출 메서드 스텁
    subUrl.logSummary = jest.fn();

    // saveVisitResult 함수 실행
    await saveVisitResult(subUrl);

    // 각 도메인별 문서가 생성되었는지 확인
    const domains = await VisitResult.find({}).lean();
    expect(domains.length).toBe(4); // example.com + 3개의 other 도메인

    // 각 도메인 문서의 URL 개수 확인
    const exampleDomain = domains.find(d => d.domain === 'example.com');
    expect(exampleDomain.suburl_list.length).toBe(3); // 원래 URL + 2개의 크롤링된 URL

    // 다른 도메인들 확인
    const otherDomains = domains.filter(d => d.domain !== 'example.com');
    otherDomains.forEach(domain => {
      expect(domain.suburl_list.length).toBe(1);
      expect(domain.suburl_list[0].visited).toBe(false);
    });
  });
});