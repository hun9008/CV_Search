import { IUrlManager } from './IUrlManager';
import { RobotsParsingResult } from './urlUtils';
export type UrlStatus = 'visited' | 'notvisited' | 'hasRecruitInfo' | 'noRecruitInfo';
export declare const enum URLSTAUS {
    NOT_VISITED = "notvisited",
    VISITED = "visited",
    HAS_RECRUITINFO = "hasRecruitInfo",
    NO_RECRUITINFO = "noRecruitInfo"
}
/**
 * Redis를 사용한 URL 관리자 구현
 */
export declare class RedisUrlManager implements IUrlManager {
    /**
     * robots.txt 캐시
     */
    robotsCache: Record<string, RobotsParsingResult>;
    /**
     * Redis 클라이언트
     */
    private redisClient;
    /**
     * 현재 도메인 인덱스
     */
    private currentDomainIndex;
    /**
     * 사용 가능한 도메인 목록
     */
    private availableDomains;
    /**
     * 재귀 횟수 제한을 위한 카운터
     */
    private recursionCount;
    /**
     * 오류 횟수 제한을 위한 카운터
     */
    private errorCount;
    /**
     * RedisUrlManager 생성자
     * @param redisClient Redis 커넥터 인스턴스
     */
    constructor(availableDomains?: string[]);
    /**
      * Connects to the Redis server.
      * Attempts to establish a connection to the Redis server and checks the connection by sending a ping.
      */
    connect(): Promise<void>;
    /**
     * URL 상태 설정
     * @param url URL
     * @param newStatus 새 상태
     */
    setURLStatus(url: string, newStatus: UrlStatus): Promise<void>;
    /**
     * URL 상태 가져오기
     * @param url URL
     * @returns URL 상태 또는 null
     */
    getUrlStatus(url: string): Promise<UrlStatus | null>;
    /**
   * favicon 가져오기
   * @param domain URL
   * @returns URL 상태 또는 null
   */
    getFavicon(domain: string): Promise<string | null>;
    /**
     * URL에서 도메인 추출
     * @param url URL 문자열
     * @returns 도메인 또는 null
     */
    private extractDomain;
    /**
     * 특정 상태의 모든 URL 가져오기
     * @param status 상태
     * @param limit 최대 개수
     * @returns URL 배열
     */
    getURLsByStatus(status: UrlStatus, limit?: number): Promise<string[]>;
    /**
     * 특정 도메인의 특정 상태 URL 가져오기
     * @param domain 도메인
     * @param status URL 상태
     * @param limit 최대 개수
     * @returns URL 배열
     */
    getURLsByDomainAndStatus(domain: string, status: UrlStatus, limit?: number): Promise<string[]>;
    /**
     * Gets all available domains.
     * Retrieves all domains stored in Redis.
     * @returns A promise that resolves to an array of domain strings.
     */
    getAllDomains(): Promise<string[]>;
    /**
     * 사용 가능한 도메인 목록 초기화
     */
    initAvailableDomains(): Promise<void>;
    /**
     * 도메인 목록에 도메인 추가
     * @param domain 도메인
     */
    addDomain(domain: string): Promise<void>;
    /**
    * Redis transection을 사용해서 원자적으로 업데이트함
    *
    * @param domain 검색할 도메인
    * @returns URL과 도메인 정보가 포함된 객체 또는 URL이 없을 경우 null
    */
    getNextUrlFromDomain(domain: string): Promise<{
        url: string;
        domain: string;
    } | null>;
    /**
     * 다음에 방문할 URL 가져오기
     * @returns URL 및 도메인 정보 객체 또는 null
     */
    getNextUrl(): Promise<{
        url: string;
        domain: string;
    } | null>;
    /**
     * 주어진 텍스트의 sha256 해시를 생성하여, 해당 해시값을 포함하는 Redis 키(text:{sha256})가 존재하는지 확인
     * @param text 확인할 텍스트
     * @returns 키가 존재하면 true, 그렇지 않으면 false
     */
    textExists(text: string): Promise<boolean>;
    /**
     * 주어진 텍스트의 sha256 해시를 생성하고, 해당 해시가 Redis에 없으면 텍스트를 저장합니다.
     * @param text 저장할 텍스트
     * @returns 텍스트가 새로 저장되었으면 true, 이미 존재하면 false
     */
    saveTextHash(text: string): Promise<boolean>;
    /**
     * 특정 상태의 랜덤 URL 가져오기
     * @param status URL 상태
     * @returns 랜덤 URL 또는 null
     */
    getRandomUrlByStatus(status: UrlStatus): Promise<string | null>;
    /**
     * 방문하지 않은 URL 추가하기
     * @param url URL 문자열
     * @param domain 도메인 이름
     * @param status 초기 상태 (기본값: not_visited)
     */
    addUrl(url: string, domain: string, urlStatus: UrlStatus): Promise<void>;
    /**
     * 도메인 오류 처리
     * @returns URL 및 도메인 정보 객체 또는 null
     */
    handleDomainError(): Promise<{
        url: string;
        domain: string;
    } | null>;
}
