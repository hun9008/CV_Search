import { IBrowserManager } from '../browser/IBrowserManager';
import { IContentExtractor } from '../content/IContentExtractor';
import { IUrlManager } from '../url/IUrlManager';
import { SubUrl } from '../models/VisitResult';
import { Producer } from '@message/Producer';
/**
 * 크롤러 인터페이스
 * 웹 크롤링 기능의 핵심 제어를 담당
 */
export interface ICrawler {
    /**
     * 브라우저 관리자
     */
    browserManager: IBrowserManager;
    /**
     * 콘텐츠 추출기
     */
    rawContentProducer: Producer;
    contentExtractor: IContentExtractor;
    /**
     *  Redis URL 관리자
     */
    urlManager: IUrlManager;
    /**
     * 크롤러 초기화
     */
    initialize(): Promise<void>;
    /**
     * URL 방문
     * @param url 방문할 URL 정보
     * @param domain 도메인 정보
     * @returns 방문 결과
     */
    visitUrl(url: string, domain: string): Promise<SubUrl>;
    /**
     * URL 큐 처리
     */
    processQueue(): Promise<void>;
    /**
     * 크롤러 실행
     */
    run(): Promise<void>;
}
