import { IUrlManager } from './IUrlManager';
import { defaultLogger as logger } from '../utils/logger';
import { VisitResult, VisitResultModel, SubUrl, ISubUrl } from '../models/visitResult';
import { extractDomain, parseRobotsTxt, isUrlAllowedWithRobots } from './urlUtils';

// robots.txt 파싱 결과 타입 정의를 가져옵니다
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
export class MongoDbUrlManager implements IUrlManager {
  robotsCache: Record<string, RobotsParsingResult> = {};
  availableDomains?: Array<{domain: string}>;
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
  }) {
    this.strategy = options.strategy;
    this.specificDomain = options.specificDomain;
  }

  /**
   * 다음에 방문할 URL 가져오기
   * @returns URL 및 도메인 정보 또는 null
   */
  async getNextUrl(): Promise<{ url: string; domain: string } | null> {
    const startTime = Date.now();
    let result = null;

    try {
      // 도메인 목록 초기화
      if (!this.availableDomains) {
        await this.initAvailableDomains();
      }

      // 인덱스 초기화
      if (this.currentDomainIndex === undefined) {
        this.currentDomainIndex = 0;
      }

      // robots.txt 캐시 초기화
      if (!this.robotsCache) {
        this.robotsCache = {};
      }

      // 도메인 선택
      const targetDomain = this.selectTargetDomain();

      // robots.txt 파싱 (없는 경우에만)
      if (!this.robotsCache[targetDomain]) {
        this.robotsCache[targetDomain] = await parseRobotsTxt(targetDomain);
      }

      // 도메인에서 URL 가져오기
      result = await this.getUrlForDomain(targetDomain);

      const runtime = Date.now() - startTime;
      logger.eventInfo('get_next_url', {
        url: result ? result.url : 'none',
        domain: targetDomain,
        runtime
      });

      return result;
    } catch (error) {
      const runtime = Date.now() - startTime;
      logger.error(`URL 가져오기 중 오류:`, error);
      logger.eventInfo('get_next_url', {
        url: 'error',
        error: error instanceof Error ? error.message : String(error),
        runtime
      });
      return this.handleDomainError();
    }
  }

  /**
   * 사용 가능한 도메인 목록 초기화
   */
  async initAvailableDomains(): Promise<void> {
    try {
      const findStartTime = Date.now();
      // 데이터베이스에서 모든 도메인 문서 가져오기
      const domains = await VisitResultModel.find({}, { domain: 1, _id: 0 });
      const findRuntime = Date.now() - findStartTime;
      logger.eventInfo('find_domain', { runtime: findRuntime });

      if (domains && domains.length > 0) {
        // 중복 없는 도메인 목록 생성
        this.availableDomains = domains.map((doc: any) => ({ domain: doc.domain }));
        logger.debug(`${this.availableDomains.length}개의 도메인을 불러왔습니다.`);

        // 도메인 목록 로깅 (최대 5개)
        if (this.availableDomains.length > 0) {
          const domainSample = this.availableDomains.slice(0, 5).map(d => d.domain);
          logger.debug(`도메인 샘플: ${domainSample.join(', ')}${this.availableDomains.length > 5 ? ` 외 ${this.availableDomains.length - 5}개` : ''}`);
        }
      } else {
        // 도메인이 없는 경우 시작 URL 도메인으로 초기화
        const startDomain = this.specificDomain || '';
        this.availableDomains = [{ domain: startDomain }];
        logger.debug(`도메인이 없어 시작 도메인 ${startDomain}으로 초기화합니다.`);
      }
    } catch (error) {
      logger.debug('도메인 목록 로드 중 오류:', error);
      // 오류 시 기본 시작 URL의 도메인 사용
      const startDomain = this.specificDomain || '';
      this.availableDomains = [{ domain: startDomain }];
      logger.debug(`오류로 인해 시작 도메인 ${startDomain}으로 초기화합니다.`);
    }
  }

  /**
   * 크롤링 전략에 따라 타겟 도메인 선택
   * @returns 선택된 도메인
   */
  selectTargetDomain(): string {
    let targetDomain;

    switch (this.strategy) {
      case 'specific':
        // 특정 도메인만 탐색
        targetDomain = this.specificDomain || '';
        break;

      case 'random':
        // 랜덤 도메인 탐색
        if (!this.availableDomains || this.availableDomains.length === 0) {
          targetDomain = this.specificDomain || '';
        } else {
          const randomIndex = Math.floor(Math.random() * this.availableDomains.length);
          targetDomain = this.availableDomains[randomIndex].domain;
          logger.debug(`랜덤 도메인 선택: ${targetDomain} (인덱스: ${randomIndex}/${this.availableDomains.length})`);
        }
        break;

      case 'sequential':
      default:
        // 순차적 도메인 탐색
        if (!this.availableDomains || this.availableDomains.length === 0 || this.currentDomainIndex === undefined) {
          targetDomain = this.specificDomain || '';
        } else {
          targetDomain = this.availableDomains[this.currentDomainIndex].domain;
          logger.debug(`순차적 도메인 선택: ${targetDomain} (인덱스: ${this.currentDomainIndex}/${this.availableDomains.length})`);

          // 다음 도메인으로 인덱스 이동
          this.currentDomainIndex = (this.currentDomainIndex + 1) % this.availableDomains.length;
        }
        break;
    }

    return targetDomain;
  }

  /**
   * 특정 도메인에서 방문할 URL 가져오기
   * @param targetDomain 대상 도메인
   * @returns URL 및 도메인 정보 또는 null
   */
  async getUrlForDomain(targetDomain: string): Promise<{ url: string; domain: string } | null> {
    try {
      // 도메인 문서 가져오기
      const findStartTime = Date.now();
      const domainDoc = await VisitResultModel.findOne({ domain: targetDomain });
      const findRuntime = Date.now() - findStartTime;
      logger.eventInfo('find_domain_document', { domain: targetDomain, runtime: findRuntime });

      // 도메인 문서나 URL 목록이 없는 경우 처리
      if (!domainDoc || !domainDoc.suburl_list || domainDoc.suburl_list.length === 0) {
        return this.tryNextDomain();
      }

      // 방문하지 않은 URL 필터링
      const filterStartTime = Date.now();
      const allowedUnvisitedUrls = await this.filterAllowedUrls(domainDoc.suburl_list, targetDomain);
      const filterRuntime = Date.now() - filterStartTime;
      logger.eventInfo('filter_urls', {
        domain: targetDomain,
        total: domainDoc.suburl_list.length,
        filtered: allowedUnvisitedUrls.length,
        runtime: filterRuntime
      });

      // 방문할 URL이 있는 경우
      if (allowedUnvisitedUrls.length > 0) {
        const unvisitedUrl = allowedUnvisitedUrls[0];
        logger.debug(`도메인 ${targetDomain}에서 방문할 URL을 찾았습니다: ${unvisitedUrl.url}`);
        this._recursionCount = 0; // 재귀 카운터 초기화
        return { url: unvisitedUrl.url, domain: targetDomain };
      }
      // 방문할 URL이 없는 경우
      else {
        logger.debug(`도메인 ${targetDomain}에 방문 가능한 URL이 없습니다.`);
        return this.tryNextDomain();
      }
    } catch (error) {
      logger.error(`도메인 ${targetDomain}에서 URL 가져오기 실패:`, error);
      return this.tryNextDomain();
    }
  }

  /**
   * 허용된 URL 필터링
   * @param urls URL 목록
   * @param targetDomain 대상 도메인
   * @returns 필터링된 URL 목록
   */
  async filterAllowedUrls(urls: Array<ISubUrl>, targetDomain: string): Promise<Array<ISubUrl>> {
    const results: Array<ISubUrl> = [];
    const batchSize = 10; // 병렬 처리 배치 크기

    // 방문하지 않은 URL만 선별
    const unvisitedUrls = urls.filter(item => !item.visited);
    logger.debug(`도메인 ${targetDomain}에서 방문하지 않은 URL ${unvisitedUrls.length}개 발견`);

    // 빈 URL 리스트인 경우 조기 반환
    if (unvisitedUrls.length === 0) {
      return results;
    }

    // 효율성을 위해 배치 처리
    for (let i = 0; i < unvisitedUrls.length; i += batchSize) {
      const batch = unvisitedUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(item =>
        isUrlAllowedWithRobots(item.url, [targetDomain], this.robotsCache)
          .then(isAllowed => isAllowed ? item : null)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(item => item !== null));

      // 충분한 URL을 찾으면 조기 반환 (최적화)
      if (results.length >= 5) {
        logger.debug(`허용된 URL을 충분히 찾았습니다. 나머지 URL 필터링 생략.`);
        break;
      }
    }

    return results;
  }

  /**
   * 다음 도메인 시도
   * @returns URL 및 도메인 정보 또는 null
   */
  async tryNextDomain(): Promise<{ url: string; domain: string } | null> {
    if (!this._recursionCount) this._recursionCount = 0;
    this._recursionCount++;

    // 모든 도메인을 순회했으면 중단
    if (!this.availableDomains ||
        this._recursionCount > this.availableDomains.length) {
      logger.debug('모든 도메인에 방문할 URL이 없습니다.');
      this._recursionCount = 0;
      return null;
    }

    logger.debug(`다른 도메인 시도 중... (${this._recursionCount}/${this.availableDomains?.length || 0})`);
    return this.getNextUrl();
  }

  /**
   * 도메인 오류 처리
   * @returns URL 및 도메인 정보 또는 null
   */
  async handleDomainError(): Promise<{ url: string; domain: string } | null> {
    logger.debug('다른 도메인에서 URL 가져오기 시도...');

    if (!this._errorCount) this._errorCount = 0;
    this._errorCount++;

    if (this._errorCount > 3) {
      logger.debug('너무 많은 오류가 발생했습니다.');
      this._errorCount = 0;
      return null;
    }

    return this.getNextUrl();
  }
}