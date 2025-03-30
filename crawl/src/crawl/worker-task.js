const puppeteer = require('puppeteer');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * Onclick 스크립트를 실행하는 작업자 클래스
 */
class OnClickWorker {
  /**
   * @param {Object} options 작업 옵션
   * @param {number} options.id 작업 ID
   * @param {string} options.currentUrl 기본 URL
   * @param {Object} options.onclickItem onclick 요소 정보
   * @param {number} options.index 작업 인덱스
   * @param {number} options.total 전체 작업 수
   * @param {boolean} options.headless 헤드리스 모드 여부
   * @param {number} options.timeout 시간 제한(ms)
    */
  constructor(options) {
    this.id = options.id || Date.now();
    this.currentUrl = options.currentUrl;
    this.onclickItem = options.onclickItem;
    this.index = options.index;
    this.total = options.total;
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 3000;
    this.urlDetectionTimeout = options.urlDetectionTimeout || 3000;

    // 브라우저 인스턴스가 제공되면 재사용
    this.sharedBrowser = options.browser || null;
    this.browser = null;
    this.page = null;
    this.useSharedBrowser = !!this.sharedBrowser;
  }

/**
 * 페이지를 스크롤합니다.
 * @param {Object} options 스크롤 옵션
 * @param {number} options.distance 스크롤 거리 (픽셀)
 * @param {number} options.delay 스크롤 사이의 지연 시간 (ms)
 * @param {number} options.steps 스크롤 단계 수
 * @returns {Promise<void>}
 */
async scrollPage(options = {}) {
  const {
    distance = 500,       // 기본 스크롤 거리
    delay = 100,          // 기본 지연 시간
    steps = 5,            // 기본 스크롤 단계 수
    fullPage = false      // 전체 페이지 스크롤 여부
  } = options;

  logger.info(`[Worker ${this.id}] 페이지 스크롤 시작...`);

  try {
    if (fullPage) {
      // 전체 페이지 스크롤 (페이지 끝까지)
      await this.scrollFullPage(delay);
    } else {
      // 지정된 거리만큼 단계별 스크롤
      for (let i = 0; i < steps; i++) {
        await this.page.evaluate((scrollDistance) => {
          window.scrollBy(0, scrollDistance);
        }, distance);

        logger.info(`[Worker ${this.id}] 스크롤 ${i + 1}/${steps} 완료 (${distance}px)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    logger.info(`[Worker ${this.id}] 페이지 스크롤 완료`);
  } catch (error) {
    logger.error(`[Worker ${this.id}] 페이지 스크롤 중 오류:`, error);
  }
}

/**
 * 페이지 끝까지 자동 스크롤합니다.
 * @param {number} delay 스크롤 사이의 지연 시간 (ms)
 * @returns {Promise<void>}
 */
async scrollFullPage(delay = 100) {
  logger.info(`[Worker ${this.id}] 전체 페이지 스크롤 시작...`);

  try {
    await this.page.evaluate(async (scrollDelay) => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          // 페이지 끝에 도달하거나 더 이상 스크롤되지 않으면 중지
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, scrollDelay);
      });
    }, delay);

    logger.info(`[Worker ${this.id}] 전체 페이지 스크롤 완료`);
  } catch (error) {
    logger.error(`[Worker ${this.id}] 전체 페이지 스크롤 중 오류:`, error);
  }
}

  /**
   * onclick 스크립트를 실행합니다.
   * @returns {Promise<Object>} 실행 결과
   */
  async execute() {
    // 작업 시작 로그
    logger.info(`[Worker ${this.id}] onclick 스크립트 ${this.index}/${this.total} 실행 시작...`);

    try {
      // 브라우저 및 페이지 초기화
      await this.initialize();

      // 페이지 설정
      await this.setupPage();

      await this.scrollPage();

      // 실행 전 URL 기록
      const beforeUrl = await this.page.url();

      // onclick 실행
      const result = await this.executeOnclick();

      // URL 변경 감지
      await this.checkUrlChanges(result, beforeUrl);

      // 결과 형식 설정
      this.formatResult(result);

      // 자원 정리
      await this.cleanup();

      logger.info(`[Worker ${this.id}] onclick ${this.index} 실행 완료: ${result.success ? (result.urlChanged ? '페이지 이동 감지' : '정상 실행') : '실패'}`);

      return result;
    } catch (error) {
      logger.error(`[Worker ${this.id}] onclick 실행 중 오류:`, error);

      // 브라우저가 열려있으면 닫기
      await this.cleanup();

      return {
        sourceType: 'onclick',
        index: this.index,
        success: false,
        error: error.toString(),
        elementInfo: {
          tagName: this.onclickItem.tagName,
          id: this.onclickItem.id,
          className: this.onclickItem.className,
          text: this.onclickItem.text
        },
        message: '실행 중 예외 발생'
      };
    }
  }

  /**
   * 브라우저와 페이지를 초기화합니다.
   */
// initialize 메서드도 수정
  async initialize() {
    if (this.useSharedBrowser) {
      // 공유 브라우저 인스턴스 사용
      this.browser = this.sharedBrowser;
    } else {
      // 새 브라우저 인스턴스 생성
      this.browser = await puppeteer.launch({
        headless: this.headless
      });
    }

    // 페이지 생성
    this.page = await this.browser.newPage();
  }
  /**
   * 페이지를 설정합니다.
   */
  async setupPage() {
    // 자바스크립트 대화상자 처리
    this.page.on('dialog', async dialog => {
      logger.info(`[Worker ${this.id}] onclick ${this.index} 대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // 각 탭에 번호를 표시하기 위해 제목 변경
    await this.page.evaluate((index, id) => {
      document.title = `onclick 실행 ${index} (Worker ${id})`;
    }, this.index, this.id);

    // 콘솔 로그를 가로채서 출력
    this.page.on('console', msg => logger.info(`[Worker ${this.id}] onclick ${this.index} 콘솔:`, msg.text()));

    // 페이지 로드
    await this.page.goto(this.currentUrl, {
      waitUntil: 'networkidle2',
      timeout: 6000 // 충분한 로드 시간 제공
    });
  }

  async executeOnclick() {
  return this.page.evaluate(async (onclickCode, elementInfo, timeout) => {
    return new Promise(resolve => {
      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        resolve({
          success: true,
          message: '실행 완료 (타임아웃)'
        });
      }, timeout);

      try {
        // 대화상자 함수 오버라이드
        window.alert = function(message) {
          console.log(`Alert 대화상자: ${message}`);
          return undefined;
        };

        window.confirm = function(message) {
          console.log(`Confirm 대화상자: ${message}`);
          return true; // 항상 확인 버튼 클릭으로 처리
        };

        window.prompt = function(message, defaultValue) {
          console.log(`Prompt 대화상자: ${message}`);
          return defaultValue || ''; // 기본값이나 빈 문자열 반환
        };

        // 실행될 onclick 코드에 대한 정보 출력
        console.log(`${elementInfo.tagName} 요소의 onclick 실행: ${onclickCode}`);

        // URL 변경 감지를 위한 기존 함수 백업
        const originalAssign = window.location.assign;
        const originalReplace = window.location.replace;
        const originalOpen = window.open;
        let detectedUrl = null;
        let urlChanged = false;

        // location 함수 오버라이드 (주석 해제)
        window.location.assign = function(url) {
          detectedUrl = url;
          urlChanged = true;
          clearTimeout(timeoutId);
          resolve({
            success: true,
            detectedUrl: url,
            urlChanged: true,
            message: 'location.assign 호출됨'
          });
          return originalAssign.call(window.location, url);
        };

        window.location.replace = function(url) {
          detectedUrl = url;
          urlChanged = true;
          clearTimeout(timeoutId);
          resolve({
            success: true,
            detectedUrl: url,
            urlChanged: true,
            message: 'location.replace 호출됨'
          });
          return originalReplace.call(window.location, url);
        };

        // location.href 속성 재정의
        try {
          Object.defineProperty(window.location, 'href', {
            set: function(url) {
              detectedUrl = url;
              urlChanged = true;
              clearTimeout(timeoutId);
              resolve({
                success: true,
                detectedUrl: url,
                urlChanged: true,
                message: 'location.href 설정됨'
              });
              return url;
            },
            get: function() {
              return window.location.toString();
            }
          });
        } catch (e) {
          console.error('location.href 속성 재정의 실패:', e);
        }

        // window.open 오버라이드
        window.open = function(url) {
          detectedUrl = url;
          urlChanged = true;
          clearTimeout(timeoutId);
          resolve({
            success: true,
            detectedUrl: url,
            urlChanged: true,
            message: 'window.open 호출됨'
          });
          return originalOpen ? originalOpen.call(window, url) : null;
        };

        console.warn(`onclick 코드 실행: ${onclickCode}`);
        // onclick 코드 실행
        eval(onclickCode);

        // URL이 변경되지 않았다면 바로 결과 반환
        if (!urlChanged) {
          clearTimeout(timeoutId);
          resolve({
            success: true,
            detectedUrl: null,
            urlChanged: false,
            message: '실행 완료 (URL 변경 없음)'
          });
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('onclick 실행 오류:', error.toString());
        resolve({
          success: false,
          error: error.toString(),
          message: 'onclick 실행 중 오류 발생'
        });
      }
    });
  }, this.onclickItem.onclick, {
    tagName: this.onclickItem.tagName,
    id: this.onclickItem.id,
    className: this.onclickItem.className,
    text: this.onclickItem.text
  }, this.timeout);
}
  /**
   * URL 변경을 확인하고 결과에 반영합니다.
   * @param {Object} result 결과 객체
   * @param {string} beforeUrl 실행 전 URL
   */
  async checkUrlChanges(result, beforeUrl) {
    // URL 변경 감지를 위해 추가 대기
    await new Promise(resolve => setTimeout(resolve, this.urlDetectionTimeout));

    // 실행 후 URL 확인
    const afterUrl = await this.page.url();
    logger.info(`[Worker ${this.id}] afterUrl: ${afterUrl}`);

    // URL 변경 확인
    if (afterUrl !== beforeUrl) {
      result.urlChanged = true;
      result.detectedUrl = afterUrl;
      result.message = 'URL 변경 감지됨 (페이지 이동 확인)';

      // 이 단계에서는 URL을 수집하지 않고 결과만 반환
      // URL 수집은 메인 스레드에서 처리
    } else if (!result.urlChanged) {
      result.urlChanged = false;
      result.detectedUrl = null;
    }
  }

  /**
   * 결과 객체에 추가 정보를 설정합니다.
   * @param {Object} result 결과 객체
   */
  formatResult(result) {
    result.originalScript = this.onclickItem.onclick;
    result.sourceType = 'onclick';
    result.index = this.index;
    result.elementInfo = {
      tagName: this.onclickItem.tagName,
      id: this.onclickItem.id,
      className: this.onclickItem.className,
      text: this.onclickItem.text
    };
  }

  /**
   * 브라우저와 페이지 리소스를 정리합니다.
   */
 // cleanup 메서드도 수정
  async cleanup() {
    if (this.page) {
      try {
        await this.page.close();
        this.page = null;
      } catch (error) {
        logger.error(`[Worker ${this.id}] 페이지 종료 중 오류:`, error);
      }
    }

    // 공유 브라우저가 아닌 경우에만 브라우저를 닫음
    if (this.browser && !this.useSharedBrowser) {
      try {
        await this.browser.close();
      } catch (error) {
        logger.error(`[Worker ${this.id}] 브라우저 종료 중 오류:`, error);
      }
      this.browser = null;
    }
  }
}

/**
 * 작업 풀을 관리하는 클래스
 */
class WorkerPool {
  /**
   * @param {number} maxConcurrency 최대 동시 실행 작업 수
   */
  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
    this.active = 0;
    this.queue = [];
  }

  /**
   * 작업을 실행 큐에 추가합니다.
   * @param {Object} options 작업 옵션
   * @returns {Promise<Object>} 작업 결과
   */
  async enqueue(options) {
    return new Promise((resolve) => {
      const task = {
        options,
        execute: async () => {
          this.active++;
          try {
            const worker = new OnClickWorker(options);
            const result = await worker.execute();
            resolve(result);
          } catch (error) {
            logger.error(`[WorkerPool] 작업 실행 오류:`, error);
            resolve({
              success: false,
              error: error.toString(),
              sourceType: 'onclick',
              index: options.index,
              message: '작업 풀에서 실행 중 오류 발생'
            });
          } finally {
            this.active--;
            this.processQueue();
          }
        }
      };

      this.queue.push(task);
      this.processQueue();
    });
  }

  /**
   * 큐에 있는 작업을 처리합니다.
   */
  processQueue() {
    while (this.active < this.maxConcurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      task.execute();
    }
  }

  /**
   * 여러 작업을 병렬로 처리합니다.
   * @param {Array<Object>} tasks 작업 옵션 배열
   * @returns {Promise<Array<Object>>} 작업 결과 배열
   */
  async processTasks(tasks) {
    const promises = tasks.map(task => this.enqueue(task));
    return Promise.all(promises);
  }
}

module.exports = { OnClickWorker, WorkerPool };