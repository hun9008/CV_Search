/**
 * URL 관리를 위한 유틸리티 함수들
 */
import axios, { AxiosResponse } from 'axios';
import { URL } from 'url';

// robots-parser 타입 정의
export interface RobotsParser {
  isAllowed: (url: string, userAgent?: string) => boolean;
  // 추가적인 메서드나 속성이 있을 수 있음
  [key: string]: any;
}

// robots.txt 파싱 결과 타입 정의
export interface RobotsParsingResult {
  parser?: RobotsParser;
  error?: Error;
}

/**
 * URL에서 도메인만 추출
 * @param url URL 문자열
 * @returns 도메인 문자열
 */
export function extractDomain(url: string): string {
  try {
    if (!url) {
      return '';
    }

    // URL이 http(s)로 시작하지 않으면 http:// 추가
    const urlWithProtocol = url.startsWith('http') ? url : `http://${url}`;

    const parsedUrl = new URL(urlWithProtocol);
    return parsedUrl.hostname;
  } catch (error) {
    console.error(`URL 파싱 오류: ${url}`, error);
    return '';
  }
}

/**
 * URL이 허용된 도메인에 속하는지 확인
 * @param url 확인할 URL
 * @param allowedDomains 허용된 도메인 목록 (비어있으면 모든 도메인 허용)
 * @returns 허용 여부
 */
export function isUrlAllowed(url: string, allowedDomains: string[] = []): boolean {
  try {
    // 빈 URL이나 http로 시작하지 않는 URL은 허용하지 않음
    if (!url) return false;
    if (!url.startsWith('http')) return false;

    // 허용 도메인이 없으면 모든 URL 허용
    if (allowedDomains.length === 0) return true;

    const domain = extractDomain(url);
    if (!domain) return false;

    // 어떤 허용 도메인의 서브도메인인지 확인
    return allowedDomains.some(allowedDomain => {
      return domain === allowedDomain || domain.endsWith(`.${allowedDomain}`);
    });
  } catch (error) {
    console.error(`URL 허용 여부 확인 오류: ${url}`, error);
    return false;
  }
}

/**
 * robots.txt 파일을 가져와 파싱
 * @param domain 도메인 이름
 * @returns robots.txt 파싱 결과
 */
export async function parseRobotsTxt(domain: string): Promise<RobotsParsingResult> {
  try {
    // robots-parser 모듈 동적 로드
    const robotsParserModule = await import('robots-parser');
    const robotsParser = robotsParserModule.default || robotsParserModule;

    const robotsUrl = `https://${domain}/robots.txt`;

    const response = await axios.get<string>(robotsUrl, {
      timeout: 5000,
      validateStatus: status => status === 200 || status === 404 // 404도 허용 (robots.txt가 없는 경우)
    });

    if (response.status === 200) {
      const parser = robotsParser(robotsUrl, response.data) as RobotsParser;
      return { parser };
    } else if (response.status === 404) {
      // robots.txt가 없는 경우 빈 규칙으로 파서 생성 (모든 URL 허용)
      const parser = robotsParser(robotsUrl, '') as RobotsParser;
      return { parser };
    } else {
      return { error: new Error(`robots.txt 요청 실패: HTTP ${response.status}`) };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: new Error(`robots.txt 파싱 중 오류: ${errorMessage}`) };
  }
}

/**
 * URL이 robots.txt 규칙에 따라 허용되는지 확인
 * @param url 확인할 URL
 * @param allowedDomains 허용된 도메인 목록
 * @param robotsCache robots.txt 파싱 결과 캐시
 * @returns 허용 여부
 */
export async function isUrlAllowedWithRobots(
  url: string,
  allowedDomains: string[] = [],
  robotsCache: Record<string, RobotsParsingResult> = {}
): Promise<boolean> {
  try {
    // 기본 URL 허용 확인
    if (!isUrlAllowed(url, allowedDomains)) {
      return false;
    }

    const domain = extractDomain(url);
    if (!domain) return false;

    // robots.txt 캐시에 없으면 로드
    if (!robotsCache[domain]) {
      robotsCache[domain] = await parseRobotsTxt(domain);
    }

    // robots.txt 파서가 있으면 확인
    if (robotsCache[domain]?.parser) {
      return robotsCache[domain].parser.isAllowed(url, 'puppeteer');
    }

    // 오류가 있거나 파서가 없으면 기본 허용 규칙 적용
    return true;
  } catch (error) {
    console.error(`robots.txt 확인 오류: ${url}`, error);
    return true; // 오류 시 허용 (덜 제한적 접근)
  }
}