/**
 * URL 관리 인터페이스
 * 크롤링할 URL을 관리하고 제공하는 기능 정의
 */
import { RobotsParsingResult } from './urlUtils';

export interface IUrlManager {
  /**
   * robots.txt 캐시
   */
  robotsCache: Record<string, RobotsParsingResult>;

  /**
   * 다음에 방문할 URL 가져오기
   * @returns URL 및 도메인 정보 객체 또는 null
   */
  getNextUrl(): Promise<{ url: string; domain: string } | null>;

  /**
   * 다음 도메인 시도
   * @returns URL 및 도메인 정보 객체 또는 null
   */
  tryNextDomain(): Promise<{ url: string; domain: string } | null>;

  /**
   * 도메인 오류 처리
   * @returns URL 및 도메인 정보 객체 또는 null
   */
  handleDomainError(): Promise<{ url: string; domain: string } | null>;
}