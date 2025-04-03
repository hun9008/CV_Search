const { BaseWorkerManager } = require('@crawl/baseWorkerManager');

// 모킹 설정
jest.mock('@database/mongodb-service');
jest.mock('puppeteer');
jest.mock('@crawl/baseWorker');
jest.mock('@config/config');

describe('BaseWorkerManager - extractPageContent', () => {
  let manager;
  let mockPage;

  beforeEach(() => {
    manager = new BaseWorkerManager();

    // 테스트용 페이지 콘텐츠
    const mockPageContent = {
      title: '테스트 페이지',
      meta: {
        'description': '페이지 설명',
        'keywords': '테스트, 단위 테스트, Jest'
      },
      text: '이것은 테스트 페이지 본문입니다.'
    };

    // 모의 페이지 객체
    mockPage = {
      evaluate: jest.fn().mockResolvedValue(mockPageContent)
    };
  });

  test('페이지 콘텐츠 추출', async () => {
    const content = await manager.extractPageContent(mockPage);

    // evaluate 함수가 호출되었는지 확인
    expect(mockPage.evaluate).toHaveBeenCalled();

    // 반환된 콘텐츠 구조 확인
    expect(content).toHaveProperty('title');
    expect(content).toHaveProperty('meta');
    expect(content).toHaveProperty('text');

    // 콘텐츠 값 확인
    expect(content.title).toBe('테스트 페이지');
    expect(content.meta.description).toBe('페이지 설명');
    expect(content.meta.keywords).toBe('테스트, 단위 테스트, Jest');
    expect(content.text).toBe('이것은 테스트 페이지 본문입니다.');
  });

  test('빈 페이지 콘텐츠 처리', async () => {
    // 빈 콘텐츠로 모킹 재설정
    mockPage.evaluate.mockResolvedValue({
      title: '',
      meta: {},
      text: ''
    });

    const content = await manager.extractPageContent(mockPage);

    // 빈 값도 정상적으로 처리되는지 확인
    expect(content.title).toBe('');
    expect(content.meta).toEqual({});
    expect(content.text).toBe('');
  });
});