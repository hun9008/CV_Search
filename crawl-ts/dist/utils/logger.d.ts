/**
 * 로그 레벨 타입
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'event';
/**
 * 로거 클래스
 */
export declare class Logger {
    private logDir;
    private currentLogFile;
    private logLevel;
    /**
     * 로거 생성자
     * @param options 로거 옵션
     */
    constructor(options?: {
        logDir?: string;
        logLevel?: LogLevel;
    });
    /**
     * 로그 디렉토리 확인 및 생성
     */
    private ensureLogDirectory;
    /**
     * 현재 날짜 기반 로그 파일명 생성
     */
    private getLogFileName;
    /**
     * 로그 메시지 포맷팅
     * @param level 로그 레벨
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    private formatLogMessage;
    /**
     * 로그 메시지 저장
     * @param level 로그 레벨
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    private log;
    /**
     * 디버그 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    debug(message: string, data?: any): void;
    /**
     * 정보 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    info(message: string, data?: any): void;
    /**
     * 경고 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    warn(message: string, data?: any): void;
    /**
     * 에러 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    error(message: string, data?: any): void;
    /**
     * 이벤트 정보 로그
     * @param event 이벤트 이름
     * @param data 이벤트 데이터
     */
    eventInfo(event: string, data?: any): void;
    /**
     * 이벤트 에러 로그
     * @param event 이벤트 이름
     * @param data 이벤트 데이터
     */
    eventError(event: string, data?: any): void;
}
export declare const defaultLogger: Logger;
