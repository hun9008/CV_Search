import { IContentExtractor } from './IContentExtractor';
import { Page } from 'puppeteer';
/**
 * 웹 콘텐츠 추출 구현체
 * 페이지에서 콘텐츠와 링크를 추출합니다.
 */
export declare class WebContentExtractor implements IContentExtractor {
    /**
     * 웹 페이지에서 콘텐츠 추출
     * @param page Puppeteer 페이지 객체
     * @returns 추출된 콘텐츠 객체
     */
    extractPageContent(page: Page): Promise<{
        title: string;
        meta: Record<string, string>;
        text: string;
    }>;
    /**
     * 웹 페이지에서 링크 추출
     * @param page Puppeteer 페이지 객체
     * @param allowedDomains 허용된 도메인 목록
     * @returns 추출된 URL 목록
     */
    extractLinks(page: Page, allowedDomains: string[]): Promise<string[]>;
    extractOnclickLinks(page: Page, allowedDomains: string[]): Promise<string[]>;
    collectOnclickScriptsWithScroll(page: Page): Promise<string[]>;
}
