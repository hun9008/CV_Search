// 브라우저 관리 인터페이스
interface IBrowserManager {
  initBrowser(): Promise<any>;
  closeBrowser(): Promise<void>;
  killChromeProcesses(): void;
  saveErrorScreenshot(page: any, url: string): Promise<string | null>;
}

// 콘텐츠 추출 인터페이스
interface IContentExtractor {
  extractPageContent(page: any): Promise<object>;
  extractLinks(page: any, allowedDomains: string[]): Promise<string[]>;
}

// URL 관리 인터페이스
interface IUrlManager {
  getNextUrl(): Promise<{ url: string; domain: string } | null>;
  initAvailableDomains(): Promise<void>;
  selectTargetDomain(): string;
  getUrlForDomain(targetDomain: string): Promise<{ url: string; domain: string } | null>;
  filterAllowedUrls(urls: any[], targetDomain: string): Promise<any[]>;
  tryNextDomain(): Promise<{ url: string; domain: string } | null>;
  handleDomainError(): Promise<{ url: string; domain: string } | null>;
}

// 데이터베이스 인터페이스
interface IDbConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveVisitResult(subUrlResult: object): Promise<boolean>;
}

// 최상위 크롤러 인터페이스 (다른 인터페이스들을 조합)
interface ICrawler extends IBrowserManager, IContentExtractor, IUrlManager, IDbConnector {
  delayBetweenRequests: number;
  headless: boolean;
  maxUrls: number;
  strategy: string;
  currentUrl?: string;
  datab_uri: string;

  initialize(): Promise<void>;
  visitUrl(urlInfo: { url: string; domain: string }): Promise<object>;
  processQueue(): Promise<void>;
  run(): Promise<void>;
}