"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.Logger = void 0;
/**
 * 로깅 유틸리티
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 로거 클래스
 */
class Logger {
    /**
     * 로거 생성자
     * @param options 로거 옵션
     */
    constructor(options = {}) {
        this.logDir = options.logDir || './logs';
        this.logLevel = options.logLevel || 'debug';
        this.currentLogFile = this.getLogFileName();
        this.ensureLogDirectory();
    }
    /**
     * 로그 디렉토리 확인 및 생성
     */
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    /**
     * 현재 날짜 기반 로그 파일명 생성
     */
    getLogFileName() {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        return path_1.default.join(this.logDir, `app-${dateString}.log`);
    }
    /**
     * 로그 메시지 포맷팅
     * @param level 로그 레벨
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    formatLogMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (data) {
            if (typeof data === 'object') {
                try {
                    logMessage += ` ${JSON.stringify(data)}`;
                }
                catch (e) {
                    logMessage += ` [Object cannot be stringified]`;
                }
            }
            else {
                logMessage += ` ${data}`;
            }
        }
        return logMessage;
    }
    /**
     * 로그 메시지 저장
     * @param level 로그 레벨
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    log(level, message, data) {
        const logMessage = this.formatLogMessage(level, message, data);
        // 콘솔 출력
        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'info':
                console.info(logMessage);
                break;
            default:
                console.log(logMessage);
        }
        // 현재 로그 파일 확인 (날짜가 바뀌었을 수 있음)
        const logFileName = this.getLogFileName();
        if (logFileName !== this.currentLogFile) {
            this.currentLogFile = logFileName;
        }
        // 파일에 로그 저장
        try {
            fs_1.default.appendFileSync(this.currentLogFile, logMessage + '\n');
        }
        catch (error) {
            console.error(`로그 파일 저장 오류: ${error}`);
        }
    }
    /**
     * 디버그 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    debug(message, data) {
        if (['debug'].includes(this.logLevel)) {
            this.log('debug', message, data);
        }
    }
    /**
     * 정보 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    info(message, data) {
        if (['debug', 'info'].includes(this.logLevel)) {
            this.log('info', message, data);
        }
    }
    /**
     * 경고 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    warn(message, data) {
        if (['debug', 'info', 'warn'].includes(this.logLevel)) {
            this.log('warn', message, data);
        }
    }
    /**
     * 에러 로그
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    error(message, data) {
        this.log('error', message, data);
    }
    /**
     * 이벤트 정보 로그
     * @param event 이벤트 이름
     * @param data 이벤트 데이터
     */
    eventInfo(event, data) {
        this.log('event', `EVENT:${event}`, data);
    }
    /**
     * 이벤트 에러 로그
     * @param event 이벤트 이름
     * @param data 이벤트 데이터
     */
    eventError(event, data) {
        this.log('error', `EVENT_ERROR:${event}`, data);
    }
}
exports.Logger = Logger;
// 기본 로거 인스턴스 생성
exports.defaultLogger = new Logger();
//# sourceMappingURL=logger.js.map