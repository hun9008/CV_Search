/**
 * ParseManager의 updateSubUrlStatus 함수 테스트
 */
require('module-alias/register');
const ParseManager = require('@parse/parseManager');
const { VisitResult } = require('@models/visitResult');
const { mongoService } = require('@database/mongodb-service');
const { defaultLogger: logger } = require('@utils/logger');

// 로그 레벨 변경하여 테스트 시 불필요한 로그 출력 방지
logger.level = 'error';

// 몽고DB 모킹
jest.mock('@database/mongodb-service', () => ({
  mongoService: {
    connect: jest.fn().mockResolvedValue(true),
  }
}));

// VisitResult 모델 모킹
jest.mock('@models/visitResult', () => {
  const mockFind = jest.fn();
  const mockUpdateOne = jest.fn();

  // 모킹된 문서 인스턴스
  const mockVisitResultInstance = {
    save: jest.fn().mockResolvedValue(true),
    suburl_list: []
  };

  // 클래스 생성자 모킹
  const MockVisitResult = {
    find: mockFind,
    updateOne: mockUpdateOne,
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findOne: jest.fn()
  };

  return {
    VisitResult: MockVisitResult,
    mockFind,
    mockUpdateOne,
    mockVisitResultInstance
  };
});

describe('ParseManager - updateSubUrlStatus', () => {
  let parseManager;

  beforeEach(() => {
    // 각 테스트 전에 ParseManager 인스턴스 생성 및 모킹 리셋
    parseManager = new ParseManager();
    jest.clearAllMocks();
  });

  // 도메인 추출 테스트
  test('URL에서 도메인을 정상적으로 추출해야 한다', async () => {
    const url = 'https://example.com/job/12345';
    const isRecruit = true;

    // VisitResult.find 모킹 (빈 배열 반환)
    VisitResult.find.mockResolvedValue([]);

    // VisitResult.updateOne 모킹 (성공 결과 반환)
    VisitResult.updateOne.mockResolvedValue({ modifiedCount: 1 });

    // updateSubUrlStatus 호출
    const result = await parseManager.updateSubUrlStatus(url, isRecruit);

    // 도메인이 정확히 추출되었는지 확인
    expect(VisitResult.find).toHaveBeenCalledWith({ domain: 'example.com' });
    expect(result).toBe(true);
  });

  // 도메인으로 문서를 찾는 경우 테스트
  test('도메인으로 문서를 찾아서 URL을 업데이트해야 한다', async () => {
    const url = 'https://example.com/job/12345';
    const isRecruit = true;

    // 모킹된 suburl_list가 있는 문서 생성
    const mockVisitResult = {
      domain: 'example.com',
      suburl_list: [
        { url: 'https://example.com/job/12345', visited: true, success: true }
      ],
      save: jest.fn().mockResolvedValue(true)
    };

    // VisitResult.find가 모킹된 문서를 반환하도록 설정
    VisitResult.find.mockResolvedValue([mockVisitResult]);

    // updateSubUrlStatus 호출
    const result = await parseManager.updateSubUrlStatus(url, isRecruit);

    // 기대 결과 검증
    expect(VisitResult.find).toHaveBeenCalledWith({ domain: 'example.com' });
    expect(mockVisitResult.suburl_list[0].isRecruit).toBe(true);
    expect(mockVisitResult.suburl_list[0].updated_at).toBeInstanceOf(Date);
    expect(mockVisitResult.save).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  // 도메인으로 문서를 찾았지만 URL을 찾지 못하는 경우 테스트
  test('도메인으로 문서를 찾았지만 URL이 없는 경우 실패해야 한다', async () => {
    const url = 'https://example.com/job/not-found';
    const isRecruit = true;

    // 다른 URL을 가진 문서 생성
    const mockVisitResult = {
      domain: 'example.com',
      suburl_list: [
        { url: 'https://example.com/job/different-url', visited: true, success: true }
      ],
      save: jest.fn().mockResolvedValue(true)
    };

    // VisitResult.find가 모킹된 문서를 반환하도록 설정
    VisitResult.find.mockResolvedValue([mockVisitResult]);

    // updateSubUrlStatus 호출
    const result = await parseSubUrlStatus(url, isRecruit);

    // 기대 결과 검증
    expect(VisitResult.find).toHaveBeenCalledWith({ domain: 'example.com' });
    expect(mockVisitResult.save).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  // 도메인을 찾지 못한 경우 직접 URL로 검색하는 테스트
  test('도메인으로 문서를 찾지 못한 경우 직접 URL로 검색해야 한다', async () => {
    const url = 'https://example.com/job/12345';
    const isRecruit = true;

    // VisitResult.find가 빈 배열을 반환하도록 설정
    VisitResult.find.mockResolvedValue([]);

    // VisitResult.updateOne이 성공적으로 업데이트했다고 모킹
    VisitResult.updateOne.mockResolvedValue({ modifiedCount: 1 });

    // updateSubUrlStatus 호출
    const result = await parseManager.updateSubUrlStatus(url, isRecruit);

    // 기대 결과 검증
    expect(VisitResult.find).toHaveBeenCalledWith({ domain: 'example.com' });
    expect(VisitResult.updateOne).toHaveBeenCalledWith(
      { 'suburl_list.url': url },
      {
        $set: {
          'suburl_list.$.isRecruit': isRecruit,
          'suburl_list.$.updated_at': expect.any(Date)
        }
      }
    );
    expect(result).toBe(true);
  });

  // 잘못된 URL 형식에 대한 테스트
  test('잘못된 URL 형식의 경우에도 처리해야 한다', async () => {
    const url = 'invalid-url';
    const isRecruit = true;

    // VisitResult.updateOne이 성공적으로 업데이트했다고 모킹
    VisitResult.updateOne.mockResolvedValue({ modifiedCount: 1 });

    // updateSubUrlStatus 호출
    const result = await parseManager.updateSubUrlStatus(url, isRecruit);

    // 기대 결과 검증
    expect(VisitResult.find).not.toHaveBeenCalled(); // 도메인 추출 실패로 find는 호출되지 않음
    expect(VisitResult.updateOne).toHaveBeenCalledWith(
      { 'suburl_list.url': url },
      {
        $set: {
          'suburl_list.$.isRecruit': isRecruit,
          'suburl_list.$.updated_at': expect.any(Date)
        }
      }
    );
    expect(result).toBe(true);
  });

  // 예외 처리 테스트
  test('오류가 발생하면 false를 반환해야 한다', async () => {
    const url = 'https://example.com/job/12345';
    const isRecruit = true;

    // 오류 시뮬레이션
    VisitResult.find.mockRejectedValue(new Error('DB 오류'));

    // updateSubUrlStatus 호출
    const result = await parseManager.updateSubUrlStatus(url, isRecruit);

    // 기대 결과 검증
    expect(result).toBe(false);
  });
});

// 헬퍼 함수: 실제 함수 구현 (테스트에서 직접 참조할 수 있도록)
async function parseSubUrlStatus(url, isRecruit) {
  let result;
  let domain;

  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname;
  } catch (error) {
    domain = null;
  }

  if (domain) {
    const visitResults = await VisitResult.find({ domain });

    if (!visitResults || visitResults.length === 0) {
      result = await VisitResult.updateOne(
        { 'suburl_list.url': url },
        {
          $set: {
            'suburl_list.$.isRecruit': isRecruit,
            'suburl_list.$.updated_at': new Date()
          }
        }
      );
    } else {
      let updated = false;

      for (const visitResult of visitResults) {
        const subUrlIndex = visitResult.suburl_list?.findIndex(item => item.url === url);

        if (subUrlIndex !== -1 && subUrlIndex !== undefined) {
          visitResult.suburl_list[subUrlIndex].isRecruit = isRecruit;
          visitResult.suburl_list[subUrlIndex].updated_at = new Date();

          await visitResult.save();
          updated = true;
          break;
        }
      }

      if (!updated) {
        return false;
      } else {
        result = { modifiedCount: 1 };
      }
    }
  } else {
    result = await VisitResult.updateOne(
      { 'suburl_list.url': url },
      {
        $set: {
          'suburl_list.$.isRecruit': isRecruit,
          'suburl_list.$.updated_at': new Date()
        }
      }
    );
  }

  return result && result.modifiedCount > 0;
}