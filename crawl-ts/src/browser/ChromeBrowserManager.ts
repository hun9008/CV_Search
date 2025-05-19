import { defaultLogger as logger } from '../utils/logger';
import CONFIG from '../config/config';
import { execSync } from 'child_process';
import { Browser, Page,BrowserContext} from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
/**
 * Chrome 브라우저 관리 구현체
 * Puppeteer를 사용하여 Chrome 브라우저를 관리합니다.
 *
 *
 *
 */


// ✅ 커스텀 에러 클래스
class NewPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NewPageError';
  }
}


export function timeoutAfter<T>(promise: Promise<T>, ms: number, error: Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(error), ms);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
export class ChromeBrowserManager{
  browser?: Browser;
  browserPid?: number;

  /**
   * 브라우저 초기화
   * @returns 브라우저 인스턴스
   */private isLaunching = false;


async initBrowser(concurrency = 8,  retries = 3, delay = 2000): Promise<Browser |undefined> {
  for (let i = 0; i < retries; i++) {

    if (this.isLaunching) {
      logger.debug('[BrowserManager] 브라우저가 이미 초기화 중입니다. 대기 중...');
      await new Promise(res => setTimeout(res, delay));
      continue;
    }

    if (this.browser) {
      logger.debug('[BrowserManager][initBrowser] 이미 초기화된 브라우저가 있습니다. 재사용 중...');
      return this.browser;
    }

    try {
      logger.debug('[BrowserManager][initBrowser] 브라우저 초기화 중...');
      this.isLaunching = true;
      this.browser = await puppeteer.launch({
        headless: CONFIG.BROWSER.HEADLESS,
        args: CONFIG.BROWSER.LAUNCH_ARGS,
        protocolTimeout : 100000_000,
        timeout: 30_000,
      });

      const browserProcess = this.browser.process();
      if (browserProcess) {
        const pid = browserProcess.pid;
        logger.info(`[BrowserManager][initBrowser] Puppeteer browser launched with PID: ${pid}`);
        this.browserPid= pid; // 원하면 클래스 멤버로 저장 가능
      }

      for (let i = 0; i < concurrency; i++) {
        await this.browser?.createBrowserContext()
      }

      this.browser.on('disconnected', () => {
        logger.debug('[BrowserManager] 브라우저가 종료되었습니다.');
        this.initBrowser(retries, delay);
      })

      this.browser.on('targetcreated', (target) => {
        logger.debug(`[BrowserManager] 타겟이 생성되었습니다. ${this.browser?.targets().length}개 남음`);
        this.browser?.targets().forEach((target) => {
              logger.debug(`[BrowserManager] 페이지가 생성되었습니다. ${target.url()}`);
          });
        logger.debug(`[BrowserManager] 컨택스트가  생성되었습니다. ${this.browser?.browserContexts().length}개 남음`);
        this.browser?.pages().then((pages) => { logger.debug(`[BrowserManager] 페이지가  생성되었습니다. ${pages.length }개 남음`) });
        });

      this.isLaunching = false;
      logger.debug('[BrowserManager][initBrowser] 브라우저 초기화 완료');
      return this.browser;

    } catch (err) {
      if (err instanceof Error) {
        logger.error(`puppeteer.launch() 실패 [시도 ${i + 1}/${retries}]: ${err.message}`);
        if (i === retries - 1) throw new Error("브라우저 재시도 실패");
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
}


  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      throw new Error("No browser initialized");
    }
    return await this.browser;
  }


  async getBrowserContext(processNumber: number): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error("No browser initialized");
    }
    const contexts = await this.browser.browserContexts();
    return contexts[processNumber]
  }

  /**
   * 새로운 페이지 생성 후 반환
   */
  async getNewPage(): Promise<Page>{
    if (!this.browser) {
      throw new Error("No broswer inialized");
    }
    return await timeoutAfter(this.browser.newPage(), 5000, new NewPageError('페이지 생성 시간 초과'))
  }
  /**
   * 브라우저 종료
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      logger.debug('[BrowserManager] 브라우저 정리 중...');
      try {


        await this.browser.close().catch((err) => {
          logger.error('[BrowserManager] 브라우저 종료 중 오류:', err);
        });
        this.browser = undefined;
        logger.debug('[BrowserManager] 브라우저가 정상적으로 종료되었습니다.');
      } catch (err) {
        logger.error('브라우저 종료 중 오류:', err);
      } finally {
        // Google Chrome for Testing 프로세스 강제 종료
        this.browser = undefined;
        if (this.browserPid) {
          try {
            process.kill(this.browserPid, 'SIGKILL'); // 강제 종료
            logger.debug(`[BrowserManager] 브라우저 PID(${this.browserPid}) 강제 종료 성공`);
          } catch (err) {
            logger.warn(`[BrowserManager] 브라우저 PID(${this.browserPid}) 강제 종료 실패: ${err}`);
          } finally {
            this.browserPid = undefined;
          }
        }
      }

    }
  }

  /**
   * Chrome 프로세스 강제 종료
   */
  killChromeProcesses(): void {
    try {
      logger.debug('남은 Chrome 프로세스 정리 중...');

      // OS별로 다른 명령어 실행
      if (process.platform === 'darwin') {
        // macOS
        execSync('pkill -f "Google Chrome for Testing"');
        logger.debug('Google Chrome for Testing 프로세스가 정리되었습니다.');
      } else if (process.platform === 'linux') {
        // Linux
        execSync('pkill -f "chrome-for-testing"');
        execSync('pkill -f "chrome-test"');
      } else if (process.platform === 'win32') {
        // Windows
        execSync('taskkill /F /IM "chrome.exe" /FI "WINDOWTITLE eq *Chrome for Testing*"');
      }
    } catch (error) {
      // 이미 죽어있거나 다른 이유로 실패할 수 있음 - 무시
      logger.debug('Chrome 프로세스 종료 완료 또는 종료할 프로세스가 없음');
    }
  }

  /**
   * 오류 발생 시 스크린샷 저장
   * @param page 페이지 객체
   * @param url 대상 URL
   * @returns 저장된 스크린샷 경로 또는 null
   */
  async saveErrorScreenshot(page: any, url: string): Promise<string | null> {
    if (!page) {
      logger.debug('페이지 객체가 없어 스크린샷을 저장할 수 없습니다.');
      return null;
    }

    try {
      // 스크린샷 저장 경로 생성
      const screenshotsDir = path.join(CONFIG.PATHS.ERROR_SCREENSHOTS_DIR);

      // 디렉토리가 없으면 생성
      await fs.promises.mkdir(screenshotsDir, { recursive: true });

      // 파일명에 사용할 수 있는 URL 문자열 생성 (잘못된 문자 제거)
      const sanitizedUrl = url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 100); // URL이 너무 길지 않도록 제한

      // 타임스탬프 추가
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const fileName = `${sanitizedUrl}_${timestamp}.png`;
      const filePath = path.join(screenshotsDir, fileName);

      // 스크린샷 저장
      await page.screenshot({
        path: filePath,
        fullPage: true // 전체 페이지 캡처
      });

      logger.debug(`에러 스크린샷 저장됨: ${filePath}`);
      return filePath;
    } catch (screenshotError) {
      logger.error('스크린샷 저장 중 오류:', screenshotError);
      return null;
    }
  }
}