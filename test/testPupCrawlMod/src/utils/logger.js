const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.options = {
      logToConsole: true,
      logToFile: false,
      logLevel: 'info',
      logFilePath: 'crawler.log',
      ...options
    };

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.currentLevel = this.levels[this.options.logLevel] || this.levels.info;
  }

  async log(level, ...messages) {
    const levelNum = this.levels[level] || this.levels.info;
    if (levelNum > this.currentLevel) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${messages.join(' ')}`;

    if (this.options.logToConsole) {
      if (level === 'error') {
        console.error(formattedMessage);
      } else if (level === 'warn') {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }

    if (this.options.logToFile) {
      try {
        await fs.appendFile(this.options.logFilePath, formattedMessage + '\n');
      } catch (error) {
        console.error(`파일에 로그를 쓰는 중 오류 발생: ${error.message}`);
      }
    }
  }

  error(...messages) {
    return this.log('error', ...messages);
  }

  warn(...messages) {
    return this.log('warn', ...messages);
  }

  info(...messages) {
    return this.log('info', ...messages);
  }

  debug(...messages) {
    return this.log('debug', ...messages);
  }

  trace(...messages) {
    return this.log('trace', ...messages);
  }

  // 배치 시작/완료 등의 이벤트에 대한 로깅 헬퍼 함수
  startTask(taskName) {
    return this.info(`===== ${taskName} 시작 =====`);
  }

  endTask(taskName) {
    return this.info(`===== ${taskName} 완료 =====`);
  }

  // 진행 상태 표시 (프로그레스 바 등 포함 가능)
  progress(current, total, taskName = '') {
    const percent = Math.round((current / total) * 100);
    return this.info(`${taskName} 진행 중: ${current}/${total} (${percent}%)`);
  }
}

// 싱글톤 인스턴스 생성
const logger = new Logger();

module.exports = { Logger, logger };