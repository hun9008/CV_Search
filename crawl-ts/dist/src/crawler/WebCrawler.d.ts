import { ICrawler } from './ICrawler';
import { IBrowserManager } from '../browser/IBrowserManager';
import { IContentExtractor } from '../content/IContentExtractor';
import { SubUrl } from '../models/VisitResult';
import { IUrlManager } from '../url/IUrlManager';
import { Producer } from '@message/Producer';
/**
 * 웹 크롤러 구현체
 * 브라우저, 콘텐츠 추출, URL 관리, DB 연결 컴포넌트를 조합한 크롤러
 */
export declare class WebCrawler implements ICrawler {
    browserManager: IBrowserManager;
    contentExtractor: IContentExtractor;
    urlManager: IUrlManager;
    rawContentProducer: Producer;
    /**
     * 웹 크롤러 생성자
     * @param options 크롤러 옵션
     */
    constructor(options: {
        browserManager: IBrowserManager;
        contentExtractor: IContentExtractor;
        rawContentProducer: Producer;
        urlManager: IUrlManager;
    });
    /**
     * 크롤러 초기화
     */
    initialize(): Promise<void>;
    /**
     * 페이지 방문 및 데이터 추출
     * @param urlInfo 방문할 URL 정보
     * @returns 방문 결과
     */
    visitUrl(url: string, domain: string): Promise<SubUrl>;
    /**
     * 방문한 URL 링크 레디스에 저장
     * @param result 방문 결과
     * @returns
     */
    saveLinkUrls(result: SubUrl): Promise<boolean>;
    /**
     * URL에서 추출한 RawContent RabbitMQ에 전송
     * @param result 방문 결과
     * @returns
     */
    sendRawContent(result: SubUrl): Promise<boolean>;
    processQueue(): Promise<void>;
    /**
     * 크롤러 실행
     */
    run(): Promise<void>;
}
