/**
 * 로깅 유틸리티
 */
import fs from 'fs';
import path from 'path';

/**
 * 로그 레벨 타입
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'event';

/**
 * 로거 클래스
 */
export class Logger {
  private logDir: string;
  private currentLogFile: string;
  private logLevel: LogLevel;

  /**
   * 로거 생성자
   * @param options 로거 옵션
   */
  constructor(options: {
    logDir?: string;
    logLevel?: LogLevel;
  } = {}) {
    this.logDir = options.logDir || './logs';
    this.logLevel = options.logLevel || 'debug';
    this.currentLogFile = this.getLogFileName();
    this.ensureLogDirectory();
  }

  /**
   * 로그 디렉토리 확인 및 생성
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 현재 날짜 기반 로그 파일명 생성
   */
  private getLogFileName(): string {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    return path.join(this.logDir, `app-${dateString}.log`);
  }

  /**
   * 로그 메시지 포맷팅
   * @param level 로그 레벨
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  private formatLogMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
      if (typeof data === 'object') {
        try {
          logMessage += ` ${JSON.stringify(data)}`;
        } catch (e) {
          logMessage += ` [Object cannot be stringified]`;
        }
      } else {
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
  private log(level: string, message: string, data?: any): void {
    const logMessage = this.formatLogMessage(level, message, data);

    // 콘솔 출력
    switch(level) {
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
      fs.appendFileSync(this.currentLogFile, logMessage + '\n');
    } catch (error) {
      console.error(`로그 파일 저장 오류: ${error}`);
    }
  }

  /**
   * 디버그 로그
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  debug(message: string, data?: any): void {
    if (['debug'].includes(this.logLevel)) {
      this.log('debug', message, data);
    }
  }

  /**
   * 정보 로그
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  info(message: string, data?: any): void {
    if (['debug', 'info'].includes(this.logLevel)) {
      this.log('info', message, data);
    }
  }

  /**
   * 경고 로그
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  warn(message: string, data?: any): void {
    if (['debug', 'info', 'warn'].includes(this.logLevel)) {
      this.log('warn', message, data);
    }
  }

  /**
   * 에러 로그
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * 이벤트 정보 로그
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  eventInfo(event: string, data?: any): void {
    this.log('event', `EVENT:${event}`, data);
  }

  /**
   * 이벤트 에러 로그
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  eventError(event: string, data?: any): void {
    this.log('error', `EVENT_ERROR:${event}`, data);
  }
}

// 기본 로거 인스턴스 생성
export const defaultLogger = new Logger();