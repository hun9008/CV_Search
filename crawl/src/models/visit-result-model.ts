import mongoose from 'mongoose';
import Table from 'cli-table3';

// 오류 정보 인터페이스
export interface IError {
  type: string;
  message: string;
  stack?: string;
  url?: string;
}

// 크롤링 통계 인터페이스
export interface ICrawlStats {
  blocked_by_robots?: number;
  allowed_after_robots?: number;
  total?: number;
  href?: number;
  onclick?: number;
}

// SubUrl 인터페이스 정의
export interface ISubUrl {
  url: string;
  visited?: boolean;
  visitedAt?: Date;
  discoveredAt?: Date;
  created_at?: Date;
  updated_at?: Date;
  isRecruit?: boolean;
  isRecruit_claude?: boolean;
  success?: boolean;
  error?: string;
  errors?: IError[];
  finalUrl?: string;
  text?: string;
  title?: string;
  meta?: Record<string, any>;
  crawlStats?: ICrawlStats;
  domain?: string;
  redirected?: boolean;
  crawledUrls?: string[];
}

// VisitResult 인터페이스 정의
export interface IVisitResult {
  domain: string;
  suburl_list: ISubUrl[];
  created_at?: Date;
  updated_at?: Date;
  url?: string;
}

// 도메인 통계 인터페이스
export interface IDomainStats {
  domain: string;
  total: number;
  visited: number;
  pending: number;
}

// 통계 요약 인터페이스
export interface IStatsSummary {
  totalDomains: number;
  activeDomains: number;
  totalUrls: number;
  visitedUrls: number;
  pendingUrls: number;
}

// 로거 인터페이스
export interface ILogger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

// SubUrl 모델 클래스
export class SubUrlModel implements ISubUrl {
  url: string;
  visited: boolean;
  visitedAt?: Date;
  discoveredAt?: Date;
  created_at: Date;
  updated_at: Date;
  isRecruit?: boolean;
  isRecruit_claude?: boolean;
  success?: boolean;
  error?: string;
  errors?: IError[];
  finalUrl?: string;
  text?: string;
  title?: string;
  meta?: Record<string, any>;
  crawlStats?: ICrawlStats;
  domain?: string;
  redirected?: boolean;
  crawledUrls: string[];

  constructor(data: Partial<ISubUrl> = {}) {
    this.url = data.url || '';
    this.visited = data.visited !== undefined ? data.visited : false;
    this.visitedAt = data.visitedAt;
    this.discoveredAt = data.discoveredAt;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.isRecruit = data.isRecruit;
    this.isRecruit_claude = data.isRecruit_claude;
    this.success = data.success;
    this.error = data.error;
    this.errors = data.errors || [];
    this.finalUrl = data.finalUrl;
    this.text = data.text;
    this.title = data.title;
    this.meta = data.meta;
    this.crawlStats = data.crawlStats;
    this.domain = data.domain;
    this.redirected = data.redirected;
    this.crawledUrls = data.crawledUrls || [];
  }

  /**
   * SubUrl 항목의 상세 정보를 테이블 형식으로 로깅
   * @param logger - 로깅에 사용할 로거 객체
   */
  logSummary(logger?: ILogger): void {
    try {
      if (!logger) {
        console.warn('로거가 제공되지 않았습니다. 기본 콘솔을 사용합니다.');
        logger = console as unknown as ILogger;
      }

      // URL 기본 정보
      logger.info(`\nURL 항목 요약 정보:`);

      // 커스텀 테이블 생성
      const table = new Table({
        head: ['항목', '값'],
        colWidths: [15, 65], // 열 너비 고정
        wordWrap: true       // 긴 텍스트 자동 줄바꿈
      });

      // 데이터 추가
      table.push(
        ['URL', this.url],
        ['도메인', this.domain || extractDomain(this.url)],
        ['제목', this.title || '제목 없음'],
        ['방문여부', this.visited ? '방문함' : '방문하지 않음'],
        ['성공여부', this.success ? '성공' : this.visited ? '실패' : '미방문'],
        ['리다이렉트', this.redirected ? `${this.url} → ${this.finalUrl}` : '없음'],
        ['방문시간', this.visitedAt ? new Date(this.visitedAt).toLocaleString() : '없음'],
        ['발견시간', this.discoveredAt ? new Date(this.discoveredAt).toLocaleString() : new Date(this.created_at).toLocaleString()],
        ['생성시간', new Date(this.created_at).toLocaleString()],
        ['수정시간', new Date(this.updated_at).toLocaleString()]
      );

      // 내용은 별도 테이블로 처리
      if (this.text) {
        const contentPreview = this.text.length > 200
          ? this.text.substring(0, 197) + '...'
          : this.text;

        table.push(['내용 미리보기', contentPreview]);
        table.push(['내용 길이', `${this.text.length}자`]);
      }

      // 테이블 출력
      logger.debug(`\nURL 항목 요약 정보:`);
      logger.debug('\n' + table.toString());

      // 크롤링 통계가 있으면 표시
      if (this.crawlStats) {
        const crawlStats = {
          '총 링크 수': this.crawlStats.total || 0,
          'href 링크 수': this.crawlStats.href || 0,
          'onclick 링크 수': this.crawlStats.onclick || 0
        };

        logger.info('크롤링 통계:');
        console.table(crawlStats);
      }

      // 메타 정보가 있으면 표시 (최상위 속성만)
      if (this.meta && typeof this.meta === 'object') {
        const metaInfo: Record<string, string> = {};

        // 중첩된 객체는 [Object]로 표시, 배열은 [Array(길이)]로 표시
        Object.keys(this.meta).forEach(key => {
          const value = this.meta![key];
          if (value === null || value === undefined) {
            metaInfo[key] = 'null';
          } else if (typeof value === 'object') {
            if (Array.isArray(value)) {
              metaInfo[key] = `[Array(${value.length})]`;
            } else {
              metaInfo[key] = '[Object]';
            }
          } else {
            // 문자열이 너무 길면 잘라서 표시
            const strValue = value.toString();
            metaInfo[key] = strValue.length > 50 ? strValue.substring(0, 47) + '...' : strValue;
          }
        });

        if (Object.keys(metaInfo).length > 0) {
          logger.info('메타 정보:');
          console.table(metaInfo);
        }
      }

      // 오류 정보가 있으면 표시
      if (this.error) {
        logger.error('오류 정보:', this.error);
      }

      // 텍스트 내용이 있으면 일부 표시
      if (this.text) {
        const textLength = this.text.length;
        const previewText = textLength > 200 ? this.text.substring(0, 197) + '...' : this.text;

        logger.info(`텍스트 내용 (${textLength} 글자):`);
        logger.info(previewText);
      }
    } catch (error) {
      if (logger) {
        logger.error('URL 항목 요약 정보 생성 중 오류 발생:', error);
      } else {
        console.error('URL 항목 요약 정보 생성 중 오류 발생:', error);
      }
    }
  }

  // JSON 직렬화
  toJSON(): ISubUrl {
    return {
      url: this.url,
      visited: this.visited,
      visitedAt: this.visitedAt,
      discoveredAt: this.discoveredAt,
      created_at: this.created_at,
      updated_at: this.updated_at,
      isRecruit: this.isRecruit,
      isRecruit_claude: this.isRecruit_claude,
      success: this.success,
      error: this.error,
      errors: this.errors,
      finalUrl: this.finalUrl,
      text: this.text,
      title: this.title,
      meta: this.meta,
      crawlStats: this.crawlStats,
      domain: this.domain,
      redirected: this.redirected,
      crawledUrls: this.crawledUrls
    };
  }

  // 팩토리 메서드
  static fromJSON(data: ISubUrl): SubUrlModel {
    return new SubUrlModel(data);
  }
}

// VisitResult 모델 클래스
export class VisitResultModel implements IVisitResult {
  domain: string;
  suburl_list: SubUrlModel[];
  created_at: Date;
  updated_at: Date;
  url?: string;

  constructor(data: Partial<IVisitResult> = {}) {
    this.domain = data.domain || '';
    this.suburl_list = data.suburl_list?.map(url => new SubUrlModel(url)) || [];
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.url = data.url;
  }

  /**
   * URL로 서브URL 검색
   * @param url 검색할 URL
   * @returns 찾은 서브URL 또는 null
   */
  findSubUrlByUrl(url: string): SubUrlModel | null {
    const subUrl = this.suburl_list.find(item => item.url === url);
    return subUrl || null;
  }

  /**
   * 방문하지 않은 URL 찾기
   * @returns 방문하지 않은 첫 번째 URL 또는 null
   */
  findUnvisitedUrl(): { url: string; domain: string } | null {
    const unvisitedEntry = this.suburl_list.find(item => !item.visited);
    if (!unvisitedEntry) return null;

    return {
      url: unvisitedEntry.url,
      domain: this.domain
    };
  }

  /**
   * 도메인 통계 계산
   * @returns 도메인 통계 객체
   */
  getDomainStats(): IDomainStats {
    const total = this.suburl_list.length;
    const visited = this.suburl_list.filter(url => url.visited).length;
    const pending = total - visited;

    return {
      domain: this.domain,
      total,
      visited,
      pending
    };
  }

  // JSON 직렬화
  toJSON(): IVisitResult {
    return {
      domain: this.domain,
      suburl_list: this.suburl_list.map(subUrl => subUrl.toJSON()),
      created_at: this.created_at,
      updated_at: this.updated_at,
      url: this.url
    };
  }

  // 팩토리 메서드
  static fromJSON(data: IVisitResult): VisitResultModel {
    return new VisitResultModel(data);
  }
}

// 도메인 추출 헬퍼 함수
export function extractDomain(url: string): string | null {
  try {
    if (!url) return null;
    const hostname = new URL(url).hostname;
    return hostname;
  } catch (e) {
    console.error(`URL에서 도메인 추출 실패: ${url}`, e);
    return null;
  }
}

// MongoDB 스키마 정의 (백엔드 사용 시)
export function createMongooseModels() {
  const Schema = mongoose.Schema;

  // SubUrl 스키마 정의
  const SubUrlSchema = new Schema({
    url: {
      type: String,
      required: true
    },
    visited: {
      type: Boolean,
      default: false
    },
    visitedAt: Date,
    discoveredAt: Date,
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    isRecruit: Boolean,
    isRecruit_claude: Boolean,
    success: Boolean,
    error: String,
    errors: [{
      type: { type: String },
      message: String,
      stack: String,
      url: String
    }],
    finalUrl: String,
    text: String,
    title: String,
    meta: Schema.Types.Mixed,
    crawlStats: {
      blocked_by_robots: Number,
      allowed_after_robots: Number,
      total: Number,
      href: Number,
      onclick: Number
    },
    domain: String,
    redirected: Boolean,
    crawledUrls: { type: [String], default: [] }
  });

  // logSummary 메서드 추가
  SubUrlSchema.methods.logSummary = function(logger: ILogger) {
    const subUrlModel = new SubUrlModel(this.toObject());
    return subUrlModel.logSummary(logger);
  };

  // VisitResult 스키마 정의
  const VisitResultSchema = new Schema({
    domain: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    suburl_list: [SubUrlSchema],
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    url: String
  }, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    collection: 'domains'
  });

  // URL로 검색하는 static 메서드 추가
  VisitResultSchema.statics.findByUrl = async function(url: string) {
    const domain = extractDomain(url);
    const result = await this.findOne({ domain });

    if (!result || !result.suburl_list) return null;

    // suburl_list 내에서 URL 검색
    const urlEntry = result.suburl_list.find((item: ISubUrl) => item.url === url);
    if (!urlEntry) return null;

    // URL 항목을 포함한 전체 결과 반환
    return {
      domain: result.domain,
      urlEntry
    };
  };

  // 방문하지 않은 URL 찾기
  VisitResultSchema.statics.findUnvisitedUrl = async function(domain: string) {
    try {
      const result = await this.findOne({ domain });

      if (!result || !result.suburl_list) return null;

      // suburl_list 내에서 방문하지 않은 URL 찾기
      const unvisitedEntry = result.suburl_list.find((item: ISubUrl) => !item.visited);
      if (!unvisitedEntry) return null;

      return {
        url: unvisitedEntry.url,
        domain
      };
    } catch (error) {
      console.error(`도메인 ${domain}에서 방문하지 않은 URL 찾기 오류:`, error);
      return null;
    }
  };

  // 도메인 통계 가져오기
  VisitResultSchema.statics.getDomainStatsEfficient = async function(logger?: ILogger) {
    try {
      // 모든 도메인 문서 가져오기
      const domains = await this.find({}).lean();

      // 도메인별 통계 계산
      const domainStats: IDomainStats[] = domains.map((domain: IVisitResult) => {
        // 각 도메인의 URL 통계 계산
        const total = domain.suburl_list ? domain.suburl_list.length : 0;
        const visited = domain.suburl_list ? domain.suburl_list.filter(url => url.visited).length : 0;
        const pending = total - visited;

        return {
          domain: domain.domain,
          total,
          visited,
          pending
        };
      });

      // 전체 요약 통계 계산
      const summary: IStatsSummary = {
        totalDomains: domainStats.length,
        activeDomains: domainStats.filter(d => d.total > 0).length,
        totalUrls: domainStats.reduce((sum, d) => sum + d.total, 0),
        visitedUrls: domainStats.reduce((sum, d) => sum + d.visited, 0),
        pendingUrls: domainStats.reduce((sum, d) => sum + d.pending, 0)
      };

      if (logger) {
        logger.info(`도메인 통계: 총 ${summary.totalDomains}개 도메인, ${summary.totalUrls}개 URL (방문: ${summary.visitedUrls}, 대기: ${summary.pendingUrls})`);
      }

      return { domains: domainStats, summary };
    } catch (error) {
      if (logger) {
        logger.error('도메인 통계 계산 오류:', error);
      } else {
        console.error('도메인 통계 계산 오류:', error);
      }
      return {
        domains: [],
        summary: {
          totalDomains: 0,
          activeDomains: 0,
          totalUrls: 0,
          visitedUrls: 0,
          pendingUrls: 0
        }
      };
    }
  };

  // MongoDB 모델 생성
  const SubUrl = mongoose.model('SubUrl', SubUrlSchema);
  const VisitResult = mongoose.model('VisitResult', VisitResultSchema);

  return { SubUrl, VisitResult };
}

// 리포지토리 인터페이스 (다양한 데이터베이스에 적용 가능)
export interface IVisitResultRepository {
  findByDomain(domain: string): Promise<VisitResultModel | null>;
  findByUrl(url: string): Promise<{ domain: string; urlEntry: SubUrlModel } | null>;
  findUnvisitedUrl(domain: string): Promise<{ url: string; domain: string } | null>;
  getDomainStats(logger?: ILogger): Promise<{ domains: IDomainStats[]; summary: IStatsSummary }>;
  createVisitResult(visitResult: IVisitResult): Promise<VisitResultModel>;
}

// 데이터베이스에 독립적인 모델과 리포지토리를 만들었으므로
// 다양한 데이터베이스에 대한 구현이 가능합니다.