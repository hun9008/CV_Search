import { IBrowserManager } from './IBrowserManager';
/**
 * Chrome 브라우저 관리 구현체
 * Puppeteer를 사용하여 Chrome 브라우저를 관리합니다.
 */
export declare class ChromeBrowserManager implements IBrowserManager {
    browser: any;
    browserPID?: number;
    /**
     * 브라우저 초기화
     * @returns 브라우저 인스턴스
     */
    initBrowser(): Promise<any>;
    /**
     * 브라우저 종료
     */
    closeBrowser(): Promise<void>;
    /**
     * Chrome 프로세스 강제 종료
     */
    killChromeProcesses(): void;
    /**
     * 오류 발생 시 스크린샷 저장
     * @param page 페이지 객체
     * @param url 대상 URL
     * @returns 저장된 스크린샷 경로 또는 null
     */
    saveErrorScreenshot(page: any, url: string): Promise<string | null>;
}
