import { IBrowserManager } from '../browser/IBrowserManager';
import { IContentExtractor } from '../content/IContentExtractor';
import { IUrlManager } from '../url/IUrlManager';
import { IDbConnector } from '../database/IDbConnector';
import { SubUrl } from '../models/visitResult';

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
  contentExtractor: IContentExtractor;

  /**
   * URL 관리자
   */
  urlManager: IUrlManager;

  /**
   * 데이터베이스 커넥터
   */
  dbConnector: IDbConnector;

  /**
   * 요청 사이 지연 시간(ms)
   */
  delayBetweenRequests: number;

  /**
   * 헤드리스 모드 사용 여부
   */
  headless: boolean;

  /**
   * 최대 방문 URL 수
   */
  maxUrls: number;

  /**
   * 현재 URL
   */
  currentUrl?: string;

  /**
   * 크롤러 초기화
   */
  initialize(): Promise<void>;

  /**
   * URL 방문
   * @param urlInfo 방문할 URL 정보
   * @returns 방문 결과
   */
  visitUrl(urlInfo: { url: string; domain: string }): Promise<SubUrl>;

  /**
   * URL 큐 처리
   */
  processQueue(): Promise<void>;

  /**
   * 크롤러 실행
   */
  run(): Promise<void>;
}