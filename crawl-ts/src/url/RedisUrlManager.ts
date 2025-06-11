  // RedisUrlManager.ts
  import { isUrlAllowedWithRobots, RobotsParsingResult } from './urlUtils';
  import { defaultLogger as logger } from '../utils/logger';
  import { RedisKey, URLSTAUS} from '../models/ReidsModel';
  import { URL } from 'url';
  import { RedisClientType ,createClient} from 'redis';
  const redis :RedisClientType = createClient({
   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
   legacyMode: false, // 반드시 설정 !!
  });
  /**
   * Redis를 사용한 URL 관리자 구현
   */
  export class RedisUrlManager  {

    /**
     * Redis 클라이언트
     */
    private redisClient: RedisClientType;

    /**
     * 현재 도메인 인덱스
     */
    private currentDomainIndex: number = 0;

    /**
     * 사용 가능한 도메인 목록
     */
    private availableDomains: string[] = [];

    /**
     * 재귀 횟수 제한을 위한 카운터
     */
    private recursionCount: number = 0;

    /**
     * 오류 횟수 제한을 위한 카운터
     */
    private errorCount: number = 0;

    /**
     * RedisUrlManager 생성자
     * @param redisClient Redis 커넥터 인스턴스
     */
    constructor(availableDomains? : string[] ) {
      this.redisClient = redis;
      if (availableDomains) {
        this.availableDomains=availableDomains
      }
    }
   /**
     * Connects to the Redis server.
     * Attempts to establish a connection to the Redis server and checks the connection by sending a ping.
     */
    async connect() {
      try {
        if (this.redisClient.isOpen) {
          logger.debug('REDIS 클라이언트가 이미 연결되어 있습니다.');
          return;
        }
        await this.redisClient.connect();
        const pong = await this.redisClient.ping();  // 연결 확인
        if (pong === 'PONG') {
          logger.debug('REDIS 연결 성공 및 응답 확인 (PONG)');
        } else {
          logger.warn(`REDIS 연결되었지만 PING 응답이 예상과 다릅니다: ${pong}`);
        }
      } catch (error) {
        logger.error('REDIS 연결 실패:', error);
        throw error;
      }
    }
    async disconnect() {
      try {
        await this.redisClient.quit();
        logger.debug('REDIS 연결 종료 성공');

      } catch (error) {
        logger.error('REDIS 종료 실패:', error);
        throw error;
      }
    }


    async setURLStatusByOldStatus(url: string, oldStatus : URLSTAUS ,newStatus: URLSTAUS): Promise<void> {
      const domain = this.extractDomain(url);
      try {
        const multi = this.redisClient.multi();
        // multi.sRem(`urls:${this.extractDomain(url)}:${oldStatus}`, url);
        if (oldStatus !== URLSTAUS.VISITED) {
          multi.sRem(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, oldStatus), url);
          multi.sRem(RedisKey.URLSTATUS_KEY(oldStatus), url);
        }
        multi.sAdd(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, newStatus), url);
        multi.sAdd(RedisKey.URLSTATUS_KEY(newStatus), url);
        await multi.exec();

      } catch (error) {
        logger.error(`[RedisUrlManager][setUrlStatus] URL 상태 설정 중 오류 (${url}):`, error);
        throw error;
      }
    }
    /**
     * URL 상태 가져오기
     * @param url URL
     * @returns URL 상태 또는 null
     */
    async getUrlStatus(url: string): Promise<URLSTAUS | null> {
      const redisKey = `status:${this.extractDomain(url)}`;

      try {
        const status = await this.redisClient.hGet(redisKey, url);
        if (status) {
          return status as URLSTAUS;
        }
        return null;
      } catch (error) {
        logger.error(`URL 상태 가져오기 중 오류 (${url}):`, error);
        return null;
      }
    }

    async getAllFavicon(): Promise<{ domain: string, logo: string }[]> {

      const keys = await this.redisClient.keys('favicon*');
      const faviconList: { domain: string, logo: string }[] = [];
      for (const key of keys) {
        const domain = key.split(':')[1];
        const logo = await this.redisClient.get(key);
        if (logo) {
          faviconList.push({ domain, logo });
        }
      }
      return faviconList;
     }



      /**
     * favicon 가져오기
     * @param domain URL
     * @returns URL 상태 또는 null
     */
      async getFavicon(domain: string): Promise<string | null> {
        const redisKey = `favicon:${domain}`;

        try {
          const favicon = await this.redisClient.get(redisKey);
          return favicon;
        } catch (error) {
          throw new Error(`[getFavicon] 파비콘 가져오기 중 오류 (${domain}): ${error}`);
        }
      }

    /**
     * URL에서 도메인 추출
     * @param url URL 문자열
     * @returns 도메인 또는 null
     */
    private extractDomain(url: string): string  {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname;
      } catch (error) {
        logger.debug(`URL에서 도메인 추출 중 오류: ${url}`, error);
        throw new Error(`Invalid URL: ${url}`);
      }
    }

    /**
     * 특정 상태의 모든 URL 가져오기
     * @param status 상태
     * @param limit 최대 개수
     * @returns URL 배열
     */
    async getURLsByStatus(status: URLSTAUS):  Promise<string[]> {
      try {
        return await this.redisClient.sMembers(status);

      } catch (error) {
        if (error instanceof Error) {
          logger.error(`상태별 URL 가져오기 중 오류 (${status}):`, error.message);
        }
        return [];
      }
    }



    /**
     * 특정 도메인의 특정 상태 URL 가져오기
     * @param domain 도메인
     * @param status URL 상태
     * @param limit 최대 개수
     * @returns URL 배열
     */
    async getURLsByDomainAndStatus(domain: string, status: URLSTAUS, limit: number = 10): Promise<string[]> {
      try {
        return await this.redisClient.sMembers(`urls:${domain}:${status}`);
      } catch (error) {

        logger.error(`도메인별 URL 가져오기 중 오류 (${domain}, ${status}):`, error);
        return [];
      }
    }


    /**
     * Gets all available domains.
     * Retrieves all domains stored in Redis.
     * @returns A promise that resolves to an array of domain strings.
     */
    async getAllDomains(): Promise<string[]> {
      try {
        return await this.redisClient.sMembers('domains');
      } catch (error) {
        logger.error('도메인 목록 가져오기 중 오류:', error);
        throw error;
      }
    }

    /**
     * 사용 가능한 도메인 목록 초기화
     */
    async initAvailableDomains(): Promise<void> {
      try {
        // Redis에서 도메인 목록 가져오기
        this.availableDomains = await this.redisClient.sMembers(RedisKey.DOMAINS_KEY());
        if (this.availableDomains.length > 0) {
          logger.info(`${this.availableDomains.length}개의 도메인을 Redis에서 로드했습니다.`);
        } else {
          logger.warn('Redis에서 사용 가능한 도메인 목록을 찾을 수 없습니다.');
        }
      } catch (error) {
        const err = error as any;
        logger.error('도메인 목록 초기화 중 오류:', err.message || err);
        this.availableDomains = [];
      }
    }

    /**
     * 도메인 목록에 도메인 추가
     * @param domain 도메인
     */
    async addDomain(domain: string): Promise<void> {
      try {
        await this.redisClient.sAdd('domains', domain);

        // 로컬 캐시 업데이트
        if (!this.availableDomains.includes(domain)) {
          this.availableDomains.push(domain);
        }

        logger.info(`도메인 추가됨: ${domain}`);
      } catch (error) {
        logger.error(`도메인 추가 중 오류 (${domain}):`, error);
        throw error;
      }
    }
    /**
    * Redis transection을 사용해서 원자적으로 업데이트함
    *
    * @param domain 검색할 도메인
    * @returns URL과 도메인 정보가 포함된 객체 또는 URL이 없을 경우 null
    */
    async getNextUrlFromDomain(domain: string): Promise<{ url: string; domain: string } | null> {
      const result = await this.redisClient.sPop(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, URLSTAUS.NOT_VISITED), 1);

      try {
        if (result.length === 0) {
          const url = await this.redisClient.sRandMember(RedisKey.SEED_URL_KEY_BY_DOMAIN(domain));
          if (!url) {
            logger.debug(`[getNextUrlFromDomain] 도메인 ${domain}에 방문할 URL이 없습니다.`);
            throw new Error(`[getNextUrlFromDomain] 도메인 ${domain}에 방문할 URL이 없습니다.`);
          }
          return {url ,domain};
        }

        if (result.length > 0) {
          await this.setURLStatusByOldStatus(result[0],URLSTAUS.NOT_VISITED, URLSTAUS.VISITED)
          return { url: result[0] as string, domain };
        }


        return null;
      } catch (error) {
        await this.redisClient.sAdd(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, URLSTAUS.NOT_VISITED), result);
        return null;
      }
    }
    /**
     * 다음에 방문할 URL 가져오기
     * @returns URL 및 도메인 정보 객체 또는 null
     */
    async getNextUrl(): Promise<{ url: string; domain: string } | null> {
      try {
        // 도메인 목록이 없으면 초기화
        if (this.availableDomains.length === 0) {
          await this.initAvailableDomains();
        }

        // 도메인 순회 반복 제한
        if (this.recursionCount > this.availableDomains.length * 2) {
          logger.warn('모든 도메인에 방문할 URL이 없습니다.');
          this.recursionCount = 0;
          return null;
        }

        // 순차적으로 도메인 선택
        const domain = this.availableDomains[this.currentDomainIndex];
        this.currentDomainIndex = (this.currentDomainIndex + 1) % this.availableDomains.length;

        const result = await this.getNextUrlFromDomain(domain);

        if (result && await isUrlAllowedWithRobots(result.url, [domain]) === false) {
          logger.debug(`[getNextUrl] 사용할 수 없는 url 입니다. ${result?.url}`);
          // robots.txt에 의해 차단된 경우, 해당 URL을 visited 상태로 변경
          await this.setURLStatusByOldStatus(result.url,URLSTAUS.NO_RECRUITINFO ,URLSTAUS.NO_RECRUITINFO);
          return null;
        }

        if (result) {
          await this.setURLStatusByOldStatus(result.url, URLSTAUS.NOT_VISITED, URLSTAUS.VISITED);

        }
        return result;
      } catch (error) {
        const err = error as any;
        logger.error('다음 URL 가져오기 중 오류:', err.message || err);
        return this.handleDomainError();
      }
    }


      /**
       * 주어진 텍스트의 sha256 해시를 생성하여, 해당 해시값을 포함하는 Redis 키(text:{sha256})가 존재하는지 확인
       * @param text 확인할 텍스트
       * @returns 키가 존재하면 true, 그렇지 않으면 false
       */
      async textExists(text: string): Promise<boolean> {
        try {
        const { createHash } = await import('crypto');
        const sha256 = createHash('sha256').update(text).digest('hex');
        const key = `text:${sha256}`;
        const exists = await this.redisClient.exists(key);
        return exists === 1;
        } catch (error) {
        logger.error(`텍스트 키 존재 확인 중 오류 (${text}):`, error);
        throw error;
        }
      }

      /**
       * 주어진 텍스트의 sha256 해시를 생성하고, 해당 해시가 Redis에 없으면 텍스트를 저장합니다.
       * @param text 저장할 텍스트
       * @returns 텍스트가 새로 저장되었으면 true, 이미 존재하면 false
       */
      async saveTextHash(text: string): Promise<boolean> {
        try {
        const { createHash } = await import('crypto');
        const sha256 = createHash('sha256').update(text).digest('hex');
        const key = `text:${sha256}`;
        const exists = await this.redisClient.exists(key);
        if (exists === 1) {
          return false;
        }
        await this.redisClient.set(key, text);
        return true;
        } catch (error) {
        logger.error(`텍스트 키 저장 중 오류 (${text}):`, error);
        throw error;
        }
      }

    async checkIsSeedUrl(domain :string , url : string ): Promise<boolean> {
      try {
        const seedUrls = await this.redisClient.sMembers(RedisKey.SEED_URL_KEY_BY_DOMAIN(domain));
        return url in seedUrls;
      } catch (error) {
        logger.error('Seed URL 확인 중 오류:', error);
        throw error;
      }
    }

    /**
     * 특정 상태의 랜덤 URL 가져오기
     * @param status URL 상태
     * @returns 랜덤 URL 또는 null
     */
    async getRandomUrlByStatus(status: URLSTAUS): Promise<string | null> {
      return await redis.sRandMember(`status:${status}`);
    }


    public async checkAllowedUrlPrefix(url: string): Promise<boolean> {
      try {
        const domain = this.extractDomain(url);

        const allowedDomains = await this.redisClient.sMembers(RedisKey.ALLOWED_URL_PREFIX_KEY_BY_DOMAIN(domain));
        logger.info(`도메인 ${domain}에 대한 허용된 URL 접두사:`, allowedDomains);
        logger.info(`URL: ${url} 허용 여부 확인 중...`);
        return allowedDomains.some((prefix) => { return url.startsWith(prefix) || url.includes(prefix) });
      } catch (error) {
        logger.error(`URL 허용 여부 확인 중 오류 (${url}):`, error);
        throw error;
      }
    }

    /**
     * 도메인에 대한 URL 링크 저장
     * @param domain 도메인 이름
     * @param urls URL 배열
     */
    public async saveUrlLinks(domain: string, urls: string[]): Promise<void> {
      const multi = this.redisClient.multi();
      try {
        const allowedUrlPrefix = await this.redisClient.sMembers(RedisKey.ALLOWED_URL_PREFIX_KEY_BY_DOMAIN(domain));
        urls.filter((url) => {
          return allowedUrlPrefix.some((prefix) => url.startsWith(prefix));
        })
          .forEach((url) => {
            multi.sAdd(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, URLSTAUS.NOT_VISITED), url);
            multi.sAdd(RedisKey.URLSTATUS_KEY(URLSTAUS.NOT_VISITED), url);
          });
        await multi.exec();
        logger.debug(`[RedisUrlManager] 도메인 ${domain}에 URL 링크 저장 완료: ${urls.length}개`);
      } catch (error) {
        logger.error(`[RedisUrlManager]  도메인 ${domain}에 URL 링크 저장 중 오류:`, error);
        throw error;
      }
    }

    /**
     * 방문하지 않은 URL 추가하기
     * @param url URL 문자열
     * @param domain 도메인 이름
     * @param status 초기 상태 (기본값: not_visited)
     */
    public async addUrl(url: string, domain: string, urlStatus: URLSTAUS ): Promise<void> {
      try {
        const visited = await this.redisClient.sIsMember(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, URLSTAUS.VISITED), url);
        // logger.debug(`add URL ${urlOriginStatus}`);
        if (visited===false) {
          const multi = this.redisClient.multi();
          logger.debug(`[RedisUrlManger] add URL ${url}`);
          // URL을 도메인 세트에 추가
          await multi.sAdd(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, URLSTAUS.NOT_VISITED), url);
          // status set에 추가
          await multi.sAdd(RedisKey.URLSTATUS_KEY(URLSTAUS.NOT_VISITED), url);

          await multi.exec();

        }
      } catch (error) {
        console.error(`Error adding URL ${url} to Redis:`, error);
        throw error;
      }
    }
    /**
     * 도메인 오류 처리
     * @returns URL 및 도메인 정보 객체 또는 null
     */
    async handleDomainError(): Promise<{ url: string; domain: string } | null> {
      this.errorCount++;
      if (this.errorCount > 3) {
        logger.warn('너무 많은 오류가 발생했습니다.');
        this.errorCount = 0;
        return null;
      }
      logger.info('오류 발생 후 다른 도메인에서 URL 가져오기 시도...');
      return this.getNextUrl();
    }
}

export const redisUrlManager = new RedisUrlManager();