import { UrlStatus } from './RedisUrlManager';
export interface IUrlManager {
    connect(): Promise<void>;
    /**
    * URL 상태 설정
    * @param url URL
    * @param newStatus 새 상태
    */
    setURLStatus(url: string, newStatus: UrlStatus): Promise<void>;
    /**
     * 다음에 방문할 URL 가져오기
     * @returns URL 및 도메인 정보 객체 또는 null
     */
    getNextUrl(): Promise<{
        url: string;
        domain: string;
    } | null>;
    /**
    * 다음에 방문할 URL 가져오기
    * @returns URL 및 도메인 정보 객체 또는 null
    */
    textExists(text: string): Promise<boolean>;
    /**
    * 주어진 텍스트의 sha256 해시를 생성하고, 해당 해시가 Redis에 없으면 텍스트를 저장합니다.
    * @param text 저장할 텍스트
    * @returns 텍스트가 새로 저장되었으면 true, 이미 존재하면 false
    */
    saveTextHash(text: string): Promise<boolean>;
    /**
     * 방문하지 않은 URL 추가하기
     * @param url URL 문자열
     * @param domain 도메인 이름
     * @param status 초기 상태 (기본값: not_visited)
     */
    addUrl(url: string, domain: string, urlStatus: UrlStatus): Promise<void>;
    /**
      * 특정 domain에서 방문하지 않은 url을 가져와야한다.
      *
      * @param domain 검색할 도메인
      * @returns URL과 도메인 정보가 포함된 객체 또는 URL이 없을 경우 null
      */
    getNextUrlFromDomain(domain: string): Promise<{
        url: string;
        domain: string;
    } | null>;
}
