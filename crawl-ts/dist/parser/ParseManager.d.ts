import { IParser, ParseResult } from './IParserTypes';
import { IRecruitInfo } from './models/RecruitInfo';
/**
 * Parser Manager 옵션 인터페이스
 */
export interface ParseManagerOptions {
    /**
     * 한 번에 처리할 URL 수
     */
    batchSize?: number;
    /**
     * 최대 재시도 횟수
     */
    maxRetries?: number;
    /**
     * 요청 간 지연 시간(ms)
     */
    delayBetweenRequests?: number;
    /**
     * 동시 처리 수
     */
    concurrency?: number;
    /**
     * 사용할 기본 파서
     */
    defaultParser?: IParser;
}
/**
 * 파싱 처리 상태
 */
export interface ParsingStats {
    /**
     * 처리된 총 URL 수
     */
    processed: number;
    /**
     * 채용공고로 분류된 URL 수
     */
    isRecruit: number;
    /**
     * 채용공고가 아닌 것으로 분류된 URL 수
     */
    notRecruit: number;
    /**
     * 처리 실패한 URL 수
     */
    failed: number;
    /**
     * 재시도 횟수
     */
    retried: number;
    /**
     * 저장된 채용정보 수
     */
    saved: number;
    /**
     * 시작 시간
     */
    startTime: number;
    /**
     * 종료 시간
     */
    endTime?: number;
    /**
     * 처리 시간(ms)
     */
    runtime?: number;
}
/**
 * 채용공고 파싱 및 필터링을 관리하는 클래스
 */
export declare class ParseManager {
    private batchSize;
    private maxRetries;
    private concurrency;
    private delayBetweenRequests;
    private defaultParser?;
    private stats;
    private isRunning;
    private isCancelled;
    /**
     * ParseManager 생성자
     * @param options 옵션 객체
     */
    constructor(options?: ParseManagerOptions);
    /**
     * 통계 초기화
     * @private
     */
    private resetStats;
    /**
     * 파서 지정
     * @param parser 파서 인스턴스
     */
    setParser(parser: IParser): void;
    /**
     * URL 콘텐츠 파싱
     * @param urlData URL 데이터
     * @param parser 사용할 파서 (없으면 기본 파서 사용)
     */
    parseUrlContent(urlData: {
        url: string;
        title?: string;
        text?: string;
        domain?: string;
        meta?: Record<string, any>;
        visitedAt?: Date;
    }, parser?: IParser): Promise<ParseResult>;
    /**
     * 대기 함수 (요청 간 지연 시간)
     * @param ms 대기 시간(ms)
     */
    wait(ms?: number): Promise<void>;
    /**
     * 실행 중인 배치 작업 취소
     */
    cancel(): boolean;
    /**
     * 현재 상태 정보 반환
     */
    getStatus(): {
        isRunning: boolean;
        stats: ParsingStats;
        config: {
            batchSize: number;
            maxRetries: number;
            delayBetweenRequests: number;
            concurrency: number;
        };
    };
    /**
     * 채용 정보를 데이터베이스에 저장하는 메서드의 인터페이스
     * 이 메서드는 실제 구현에서 오버라이드해야 합니다.
     */
    saveRecruitInfo(recruitInfo: IRecruitInfo): Promise<any>;
    /**
     * URL 상태를 업데이트하는 메서드의 인터페이스
     * 이 메서드는 실제 구현에서 오버라이드해야 합니다.
     */
    updateUrlStatus(url: string, isRecruit: boolean): Promise<boolean>;
    /**
     * 미분류 URL 목록을 가져오는 메서드의 인터페이스
     * 이 메서드는 실제 구현에서 오버라이드해야 합니다.
     */
    fetchUnclassifiedUrls(limit?: number): Promise<Array<{
        url: string;
        title?: string;
        text?: string;
        domain?: string;
        meta?: Record<string, any>;
        visitedAt?: Date;
    }>>;
}
