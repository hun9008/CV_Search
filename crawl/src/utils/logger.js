const fs = require('fs');
const path = require('path');
const util = require('util');

// 콘솔 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// 로그 레벨 정의
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

/**
 * 로거 클래스
 */
class Logger {
  /**
   * 로거 초기화
   * @param {Object} options - 로거 옵션
   * @param {string} options.level - 로그 레벨 ('error', 'warn', 'info', 'debug', 'trace')
   * @param {boolean} options.useColors - 색상 사용 여부
   * @param {boolean} options.showTimestamp - 타임스탬프 표시 여부
   * @param {string} options.logDir - 로그 파일 저장 디렉토리 (없으면 콘솔만 출력)
   * @param {string} options.filename - 로그 파일명 (확장자 제외)
   * @param {boolean} options.toConsole - 콘솔에도 출력할지 여부
   */
  constructor(options = {}) {
    this.options = {
      level: options.level || process.env.LOG_LEVEL || 'info',
      useColors: options.useColors !== undefined ? options.useColors : true,
      showTimestamp: options.showTimestamp !== undefined ? options.showTimestamp : true,
      logDir: options.logDir || process.env.LOG_DIR,
      filename: options.filename || 'app',
      toConsole: options.toConsole !== undefined ? options.toConsole : true
    };

    this.currentLevel = LOG_LEVELS[this.options.level.toUpperCase()] || LOG_LEVELS.INFO;

    // 로그 파일 설정
    if (this.options.logDir) {
      this.setupLogFiles();
    }
  }

  /**
   * 로그 파일 설정
   */
  setupLogFiles() {
    try {
      if (!fs.existsSync(this.options.logDir)) {
        fs.mkdirSync(this.options.logDir, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      const logPath = path.join(this.options.logDir, `${this.options.filename}-${date}.log`);

      this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
      this.logStream.on('error', (err) => {
        console.error('로그 파일 쓰기 오류:', err);
      });
    } catch (err) {
      console.error('로그 파일 설정 오류:', err);
    }
  }

  /**
   * 로그 메시지 포맷
   */
  formatMessage(level, message, ...args) {
    const timestamp = this.options.showTimestamp ?
      `[${new Date().toISOString()}] ` : '';

    const formattedLevel = level.toUpperCase().padEnd(5);

    // 객체를 문자열로 변환 (최대 2단계 깊이)
    const formattedMessage = typeof message === 'object'
      ? util.inspect(message, { depth: 2 })
      : message;

    // 추가 인자들도 처리
    const formattedArgs = args.map(arg =>
      typeof arg === 'object' ? util.inspect(arg, { depth: 2 }) : arg
    ).join(' ');

    return `${timestamp}${formattedLevel}: ${formattedMessage} ${formattedArgs}`.trim();
  }

  /**
   * 로그 메시지 색상 적용
   */
  colorize(level, message) {
    if (!this.options.useColors) return message;

    switch (level) {
      case 'error': return `${colors.red}${message}${colors.reset}`;
      case 'warn':  return `${colors.yellow}${message}${colors.reset}`;
      case 'info':  return `${colors.green}${message}${colors.reset}`;
      case 'debug': return `${colors.blue}${message}${colors.reset}`;
      case 'trace': return `${colors.gray}${message}${colors.reset}`;
      default:      return message;
    }
  }

  /**
   * 로그 출력
   */
  log(level, message, ...args) {
    const logLevel = LOG_LEVELS[level.toUpperCase()];

    // 설정된 로그 레벨보다 낮은 레벨은 무시
    if (logLevel > this.currentLevel) return;

    const formattedMessage = this.formatMessage(level, message, ...args);

    // 콘솔에 출력
    if (this.options.toConsole) {
      console.log(this.colorize(level, formattedMessage));
    }

    // 파일에 로그 저장
    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  // 각 로그 레벨별 메서드
  error(message, ...args) {
    this.log('error', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  trace(message, ...args) {
    this.log('trace', message, ...args);
  }
}

// 기본 로거 인스턴스 생성 (싱글톤)
const defaultLogger = new Logger();

module.exports = {
  Logger,
  defaultLogger,
  // 로거 팩토리 함수
  createLogger: (options) => new Logger(options)
};