import { ICrawler } from './ICrawler';
import { IBrowserManager } from '../browser/IBrowserManager';
import { IContentExtractor } from '../content/IContentExtractor';
import { IUrlManager } from '../url/IUrlManager';
import { IDbConnector } from '../database/IDbConnector';
import { SubUrl } from '../models/visitResult';
/**
 * 웹 크롤러 구현체
 * 브라우저, 콘텐츠 추출, URL 관리, DB 연결 컴포넌트를 조합한 크롤러
 */
export declare class WebCrawler implements ICrawler {
    browserManager: IBrowserManager;
    contentExtractor: IContentExtractor;
    urlManager: IUrlManager;
    dbConnector: IDbConnector;
    delayBetweenRequests: number;
    headless: boolean;
    maxUrls: number;
    strategy: string;
    currentUrl?: string;
    datab_uri: string;
    isRunning: boolean;
    /**
     * 웹 크롤러 생성자
     * @param options 크롤러 옵션
     */
    constructor(options: {
        browserManager: IBrowserManager;
        contentExtractor: IContentExtractor;
        urlManager: IUrlManager;
        dbConnector: IDbConnector;
        delayBetweenRequests: number;
        headless: boolean;
        maxUrls: number;
        strategy: string;
        datab_uri: string;
    });
    /**
     * 크롤러 초기화
     */
    initialize(): Promise<void>;
    /**
     * URL 방문 및 데이터 추출
     * @param urlInfo 방문할 URL 정보
     * @returns 방문 결과
     */
    visitUrl(urlInfo: {
        url: string;
        domain: string;
    }): Promise<SubUrl>;
    /**
     * URL 큐 처리
     */
    processQueue(): Promise<void>;
    /**
     * 크롤러 실행
     */
    run(): Promise<void>;
}
