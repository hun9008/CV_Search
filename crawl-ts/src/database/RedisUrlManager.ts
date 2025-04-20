import { redis } from './RedisConnector';

/**
 * URL 상태 열거형
 */
export enum UrlStatus {
  NOT_VISITED = 'not_visited',
  VISITING = 'visiting',
  VISITED = 'visited',
  FAILED = 'failed',
}

/**
 * Redis URL 관리자 클래스
 * Redis 기반 URL 큐 관리를 담당합니다.
 */
export class RedisUrlManager {
  private static instance: RedisUrlManager;

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): RedisUrlManager {
    if (!RedisUrlManager.instance) {
      RedisUrlManager.instance = new RedisUrlManager();
    }
    return RedisUrlManager.instance;
  }

  /**
   * URL 추가하기
   * @param url URL 문자열
   * @param domain 도메인 이름
   * @param status 초기 상태 (기본값: not_visited)
   */
  public async addUrl(url: string, domain: string, status: UrlStatus = UrlStatus.NOT_VISITED): Promise<void> {
    try {
      // URL을 도메인 세트에 추가
      await redis.sAdd(`domain:${domain}:urls`, url);

      // URL을 상태 세트에 추가
      await redis.sAdd(`status:${status}:urls`, url);

      // URL 상태 설정
      await redis.hSet('url:status', url, status);

      // URL 도메인 설정
      await redis.hSet('url:domain', url, domain);

      // 도메인을 전체 도메인 세트에 추가
      await redis.sAdd('domains', domain);
    } catch (error) {
      console.error(`Error adding URL ${url} to Redis:`, error);
      throw error;
    }
  }

  /**
   * 도메인 추가
   * @param domain 도메인 이름
   * @returns 성공 여부 (true: 새로 추가됨, false: 이미 존재함)
   */
  public async addDomain(domain: string): Promise<boolean> {
    try {

      // 도메인을 전체 도메인 세트에 추가 (이미 있으면 false 반환)
      return await redis.sAdd('domains', domain) > 0;
    } catch (error) {
      console.error(`Error adding domain ${domain} to Redis:`, error);
      throw error;
    }
  }

  /**
   * URL 상태 업데이트
   * @param url URL 문자열
   * @param newStatus 새 상태
   */
  public async updateUrlStatus(url: string, newStatus: UrlStatus): Promise<void> {
    try {
      // 현재 상태 가져오기
      const currentStatus = await redis.hGet('url:status', url) as UrlStatus;

      if (!currentStatus) {
        throw new Error(`URL ${url} not found in Redis`);
      }

      // 이전 상태 세트에서 제거
      await redis.sRem(`status:${currentStatus}:urls`, url);

      // 새 상태 세트에 추가
      await redis.sAdd(`status:${newStatus}:urls`, url);

      // URL 상태 업데이트
      await redis.hSet('url:status', url, newStatus);
    } catch (error) {
      console.error(`Error updating URL ${url} status to ${newStatus}:`, error);
      throw error;
    }
  }

  /**
   * 도메인의 모든 URL 가져오기
   * @param domain 도메인 이름
   */
  public async getUrlsByDomain(domain: string): Promise<string[]> {
    try {
      return await redis.sMembers(`domain:${domain}:urls`);
    } catch (error) {
      console.error(`Error getting URLs for domain ${domain}:`, error);
      throw error;
    }
  }

  /**
   * 특정 상태의 모든 URL 가져오기
   * @param status URL 상태
   */
  public async getUrlsByStatus(status: UrlStatus): Promise<string[]> {
    try {
      return await redis.sMembers(`status:${status}:urls`);
    } catch (error) {
      console.error(`Error getting URLs with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * URL 상태 가져오기
   * @param url URL 문자열
   */
  public async getUrlStatus(url: string): Promise<UrlStatus | null> {
    try {
      const status = await redis.hGet('url:status', url);
      return status as UrlStatus;
    } catch (error) {
      console.error(`Error getting status for URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * URL 도메인 가져오기
   * @param url URL 문자열
   */
  public async getUrlDomain(url: string): Promise<string | null> {
    try {
      return await redis.hGet('url:domain', url)??null;
    } catch (error) {
      console.error(`Error getting domain for URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * 특정 도메인의 특정 상태 URL 가져오기
   * @param domain 도메인 이름
   * @param status URL 상태
   */
  public async getUrlsByDomainAndStatus(domain: string, status: UrlStatus): Promise<string[]> {
    try {
      // 도메인 URL 세트와 상태 URL 세트의 교집합 구하기
      return await redis.sInter([`domain:${domain}:urls`, `status:${status}:urls`]);
    } catch (error) {
      console.error(`Error getting URLs for domain ${domain} with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * 모든 도메인 목록 가져오기
   */
  public async getAllDomains(): Promise<string[]> {
    try {
      // domains 세트에서 모든 도메인 가져오기
      return await redis.sMembers('domains');
    } catch (error) {
      console.error('Error getting all domains:', error);
      throw error;
    }
  }

  /**
   * 도메인 URL 통계 가져오기
   * @param domain 도메인 이름
   */
  public async getDomainStats(domain: string): Promise<{ [key in UrlStatus]: number }> {
    try {
      const stats: { [key in UrlStatus]: number } = {
        [UrlStatus.NOT_VISITED]: 0,
        [UrlStatus.VISITING]: 0,
        [UrlStatus.VISITED]: 0,
        [UrlStatus.FAILED]: 0,
      };

      // 각 상태별 URL 개수 가져오기
      for (const status of Object.values(UrlStatus)) {
        stats[status] = (await this.getUrlsByDomainAndStatus(domain, status as UrlStatus)).length;
      }

      return stats;
    } catch (error) {
      console.error(`Error getting stats for domain ${domain}:`, error);
      throw error;
    }
  }
}

export default RedisUrlManager;