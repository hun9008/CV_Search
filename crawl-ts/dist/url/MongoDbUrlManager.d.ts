import { IUrlManager } from './IUrlManager';
import { ISubUrl } from '../models/visitResult';
interface RobotsParser {
    isAllowed: (url: string, userAgent?: string) => boolean;
}
interface RobotsParsingResult {
    parser?: RobotsParser;
    error?: Error;
}
/**
 * MongoDB 기반 URL 관리 구현체
 */
export declare class MongoDbUrlManager implements IUrlManager {
    robotsCache: Record<string, RobotsParsingResult>;
    availableDomains?: Array<{
        domain: string;
    }>;
    currentDomainIndex?: number;
    _recursionCount?: number;
    _errorCount?: number;
    strategy: string;
    specificDomain?: string;
    /**
     * MongoDB URL 관리자 생성자
     * @param options 설정 옵션
     */
    constructor(options: {
        strategy: string;
        specificDomain?: string;
    });
    /**
     * 다음에 방문할 URL 가져오기
     * @returns URL 및 도메인 정보 또는 null
     */
    getNextUrl(): Promise<{
        url: string;
        domain: string;
    } | null>;
    /**
     * 사용 가능한 도메인 목록 초기화
     */
    initAvailableDomains(): Promise<void>;
    /**
     * 크롤링 전략에 따라 타겟 도메인 선택
     * @returns 선택된 도메인
     */
    selectTargetDomain(): string;
    /**
     * 특정 도메인에서 방문할 URL 가져오기
     * @param targetDomain 대상 도메인
     * @returns URL 및 도메인 정보 또는 null
     */
    getUrlForDomain(targetDomain: string): Promise<{
        url: string;
        domain: string;
    } | null>;
    /**
     * 허용된 URL 필터링
     * @param urls URL 목록
     * @param targetDomain 대상 도메인
     * @returns 필터링된 URL 목록
     */
    filterAllowedUrls(urls: Array<ISubUrl>, targetDomain: string): Promise<Array<ISubUrl>>;
    /**
     * 다음 도메인 시도
     * @returns URL 및 도메인 정보 또는 null
     */
    tryNextDomain(): Promise<{
        url: string;
        domain: string;
    } | null>;
    /**
     * 도메인 오류 처리
     * @returns URL 및 도메인 정보 또는 null
     */
    handleDomainError(): Promise<{
        url: string;
        domain: string;
    } | null>;
}
export {};
