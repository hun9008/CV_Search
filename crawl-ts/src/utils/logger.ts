import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'event';

export class Logger {
  private logDir: string;
  private currentLogFile: string;
  private logLevel: LogLevel;

  private logLevelPriority: Record<LogLevel, number> = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    event: 5,
  };

  constructor(options: { logDir?: string; logLevel?: LogLevel } = {}) {
    this.logDir = options.logDir || './logs';
    this.logLevel = options.logLevel || 'debug';
    this.currentLogFile = this.getLogFileName();
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    return path.join(this.logDir, `app-${dateString}.log`);
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      this.logLevelPriority[level] >= this.logLevelPriority[this.logLevel]
    );
  }

  private formatLogMessage(
    level: LogLevel,
    message: string,
    data?: any
  ): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
      try {
        logMessage += ` ${
          typeof data === 'object' ? JSON.stringify(data) : data
        }`;
      } catch {
        logMessage += ` [Object cannot be stringified]`;
      }
    }

    return logMessage;
  }

  private colorize(level: LogLevel, message: string): string {
    switch (level) {
      case 'debug':
        return chalk.gray(message);
      case 'info':
        return chalk.blue(message);
      case 'warn':
        return chalk.yellow(message);
      case 'error':
        return chalk.red(message);
      case 'event':
        return chalk.green(message);
      default:
        return message;
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const logMessage = this.formatLogMessage(level, message, data);
    const colored = this.colorize(level, logMessage);

    // 콘솔 출력
    console.log(colored);

    // 로그 파일 이름 갱신 (날짜 바뀔 수 있음)
    const logFileName = this.getLogFileName();
    if (logFileName !== this.currentLogFile) {
      this.currentLogFile = logFileName;
    }

    // 파일 저장
    try {
      fs.appendFileSync(this.currentLogFile, logMessage + '\n');
    } catch (error) {
      console.error(`로그 파일 저장 오류: ${error}`);
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  eventInfo(event: string, data?: any): void {
    this.log('event', `EVENT:${event}`, data);
  }

  eventError(event: string, data?: any): void {
    this.log('error', `EVENT_ERROR:${event}`, data);
  }
}

// 기본 인스턴스
export const defaultLogger = new Logger({ logDir: './logs', logLevel:'event' });