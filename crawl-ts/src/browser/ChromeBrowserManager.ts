import { IBrowserManager } from './IBrowserManager';
import { defaultLogger as logger } from '../utils/logger';
import CONFIG from '../config/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Chrome 브라우저 관리 구현체
 * Puppeteer를 사용하여 Chrome 브라우저를 관리합니다.
 */
export class ChromeBrowserManager implements IBrowserManager {
  browser: any;
  browserPID?: number;

  /**
   * 브라우저 초기화
   * @returns 브라우저 인스턴스
   */
  async initBrowser(): Promise<any> {
    if (!this.browser) {
      logger.debug(`ChromeBrowserManager 초기화...`);

      // Puppeteer 동적 임포트 (필요할 때만 로드)
      const puppeteer = await import('puppeteer');

      this.browser = await puppeteer.launch({
        headless: CONFIG.BROWSER.HEADLESS ? 'new' : false,
        ignoreHTTPSErrors: true,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
        args: CONFIG.BROWSER.LAUNCH_ARGS,
        timeout: 10000, // 10 seconds
        protocolTimeout: 20000, // 20 seconds
      });

      // 브라우저 PID 저장
      this.browserPID = this.browser.process() ? this.browser.process().pid : null;
      if (this.browserPID) {
        logger.debug(`브라우저 프로세스 ID: ${this.browserPID}`);
      }

      // 프로세스 종료 신호 처리
      const processExit = async () => {
        logger.debug('프로세스 종료 감지, 브라우저 정리 중...');
        await this.closeBrowser();
        process.exit(0);
      };

      // 프로세스 종료 이벤트 리스너 등록
      process.once('SIGINT', processExit);
      process.once('SIGTERM', processExit);
    }

    return this.browser;
  }

  /**
   * 브라우저 종료
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      logger.debug('브라우저 정리 중...');
      try {
        // 모든 페이지 닫기 시도
        const pages = await this.browser.pages();
        await Promise.all(pages.map((page: any) => {
          try { return page.close(); }
          catch (e) { return Promise.resolve(); }
        }));

        // 브라우저 닫기
        await this.browser.close();
        this.browser = null;
        logger.debug('브라우저가 정상적으로 종료되었습니다.');
      } catch (err) {
        logger.error('브라우저 종료 중 오류:', err);
      } finally {
        // Google Chrome for Testing 프로세스 강제 종료
        this.killChromeProcesses();
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