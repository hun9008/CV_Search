export interface RobotsParser {
    isAllowed: (url: string, userAgent?: string) => boolean;
    [key: string]: any;
}
export interface RobotsParsingResult {
    parser?: RobotsParser;
    error?: Error;
}
/**
 * URL에서 도메인만 추출
 * @param url URL 문자열
 * @returns 도메인 문자열
 */
export declare function extractDomain(url: string): string;
/**
 * URL이 허용된 도메인에 속하는지 확인
 * @param url 확인할 URL
 * @param allowedDomains 허용된 도메인 목록 (비어있으면 모든 도메인 허용)
 * @returns 허용 여부
 */
export declare function isUrlAllowed(url: string, allowedDomains?: string[]): boolean;
/**
 * robots.txt 파일을 가져와 파싱
 * @param domain 도메인 이름
 * @returns robots.txt 파싱 결과
 */
export declare function parseRobotsTxt(domain: string): Promise<RobotsParsingResult>;
/**
 * URL이 robots.txt 규칙에 따라 허용되는지 확인
 * @param url 확인할 URL
 * @param allowedDomains 허용된 도메인 목록
 * @param robotsCache robots.txt 파싱 결과 캐시
 * @returns 허용 여부
 */
export declare function isUrlAllowedWithRobots(url: string, allowedDomains?: string[], robotsCache?: Record<string, RobotsParsingResult>): Promise<boolean>;
