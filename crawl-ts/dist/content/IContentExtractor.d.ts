import { Page } from 'puppeteer';
/**
 * 콘텐츠 추출 인터페이스
 * 웹 페이지에서 콘텐츠와 링크를 추출하는 기능 정의
 */
export interface IContentExtractor {
    /**
     * 웹 페이지에서 콘텐츠 추출
     * @param page 페이지 객체
     * @returns 추출된 콘텐츠 객체
     */
    extractPageContent(page: Page): Promise<{
        title: string;
        meta: Record<string, string>;
        text: string;
    }>;
    /**
     * 웹 페이지에서 링크 추출
     * @param page 페이지 객체
     * @param allowedDomains 허용된 도메인 목록
     * @returns 추출된 URL 목록
     */
    extractLinks(page: Page, allowedDomains: string[]): Promise<string[]>;
    /**
    * 웹 페이지에서 onclick 링크 추출
    * @param page 페이지 객체
    * @param allowedDomains 허용된 도메인 목록
    * @returns 추출된 URL 목록
    */
    extractOnclickLinks(page: Page): Promise<string[]>;
}
