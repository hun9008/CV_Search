/**
 * 브라우저 관리 인터페이스
 * 브라우저 인스턴스의 생성, 제어, 종료를 담당
 */
export interface IBrowserManager {
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
     * 남아있는 Chrome 프로세스 강제 종료
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
