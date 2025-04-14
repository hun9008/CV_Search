"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
require('dotenv').config();
var fs = require('fs');
var path = require('path');
var util = require('util');
var os = require('os');
// 콘솔 색상 코드
var colors = {
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
var LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};
/**
 * 로거 클래스
 */
var Logger = /** @class */ (function () {
    /**
     * 로거 초기화
     * @param {Object} options - 로거 옵션
     * @param {string} options.level - 로그 레벨 ('error', 'warn', 'info', 'debug', 'trace')
     * @param {boolean} options.useColors - 색상 사용 여부
     * @param {boolean} options.showTimestamp - 타임스탬프 표시 여부
     * @param {string} options.logDir - 로그 파일 저장 디렉토리 (없으면 콘솔만 출력)
     * @param {string} options.filename - 로그 파일명 (확장자 제외)
     * @param {boolean} options.toConsole - 콘솔에도 출력할지 여부
     * @param {boolean} options.jsonFormat - JSON 형식으로 로깅할지 여부
     */
    function Logger(options) {
        if (options === void 0) { options = {}; }
        this.options = {
            level: options.level || process.env.LOG_LEVEL || 'info',
            useColors: options.useColors !== undefined ? options.useColors : true,
            showTimestamp: options.showTimestamp !== undefined ? options.showTimestamp : true,
            logDir: options.logDir || process.env.LOG_DIR || './logs',
            filename: options.filename || 'app',
            toConsole: options.toConsole !== undefined ? options.toConsole : true,
            jsonFormat: options.jsonFormat !== undefined ? options.jsonFormat : true,
            rotateDaily: options.rotateDaily !== undefined ? options.rotateDaily : true,
            context: options.context || '', // 로그 파일명에 포함할 컨텍스트 추가
        };
        // 컨텍스트가 있을 경우 파일명에 추가
        if (this.options.context) {
            this.options.filename = "".concat(this.options.filename, "-").concat(this.options.context);
        }
        this.currentLevel = LOG_LEVELS[this.options.level.toUpperCase()] || LOG_LEVELS.INFO;
        this.hostname = os.hostname();
        this.pid = process.pid;
        // 로그 파일 설정
        if (this.options.logDir) {
            this.setupLogFiles();
        }
    }
    /**
     * 로그 파일 설정
     */
    Logger.prototype.setupLogFiles = function () {
        try {
            if (!fs.existsSync(this.options.logDir)) {
                fs.mkdirSync(this.options.logDir, { recursive: true });
            }
            var date = new Date().toISOString().split('T')[0];
            var logPath = path.join(this.options.logDir, "".concat(this.options.filename, "-").concat(date, ".log"));
            this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
            this.logStream.on('error', function (err) {
                console.error('로그 파일 쓰기 오류:', err);
            });
            this.currentLogDate = date;
            // 일별 로그 파일 교체를 위한 타이머 설정
            if (this.options.rotateDaily) {
                this.setupLogRotation();
            }
        }
        catch (err) {
            console.error('로그 파일 설정 오류:', err);
        }
    };
    /**
     * 일별 로그 파일 교체 설정
     */
    Logger.prototype.setupLogRotation = function () {
        var _this = this;
        // 자정(다음 날 00:00)까지 남은 시간 계산
        var now = new Date();
        var tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        var timeUntilMidnight = tomorrow - now;
        // 타이머 설정
        setTimeout(function () {
            // 기존 스트림 종료
            if (_this.logStream) {
                _this.logStream.end();
                _this.logStream = null;
            }
            // 새 로그 파일 설정
            _this.setupLogFiles();
            // 다음 날을 위한 로테이션 설정
            _this.setupLogRotation();
        }, timeUntilMidnight);
    };
    /**
     * 로그 메시지 JSON 포맷
     */ /**
  * 로그 메시지 JSON 포맷
  */
    Logger.prototype.formatJsonMessage = function (level, data) {
        var timestamp = new Date().toISOString();
        // JSON 객체 구성 (제안된 형식에 맞게)
        var logObject = __assign({ timestamp: timestamp, process: process.env.PS_NAME || "cv-search-process", version: process.env.APP_VERSION || "1.0.0", device: this.hostname, level: level.toUpperCase(), application: this.options.appName || "cv-search", logger_name: this.options.filename || "app", environment: process.env.NODE_ENV || "development" }, data.event ? data : { message: data });
        return JSON.stringify(logObject);
    };
    /**
     * 로그 메시지 텍스트 포맷
     */
    Logger.prototype.formatTextMessage = function (level, data) {
        var timestamp = this.options.showTimestamp ?
            "[".concat(new Date().toISOString(), "] ") : '';
        return "".concat(timestamp).concat(level, ": ").concat(data.event ? data.event : data).concat(data.error ? ' error :' + data.error : '', " runtime: ").concat(data.runtime, " ms").trim();
    };
    /**
     * 로그 메시지 색상 적용
     */
    Logger.prototype.colorize = function (level, message) {
        if (!this.options.useColors)
            return message;
        switch (level) {
            case 'ERROR': return "".concat(colors.red).concat(message).concat(colors.reset);
            case 'WARN': return "".concat(colors.yellow).concat(message).concat(colors.reset);
            case 'INFO': return "".concat(colors.green).concat(message).concat(colors.reset);
            case 'DEBUG': return "".concat(colors.blue).concat(message).concat(colors.reset);
            case 'TRACE': return "".concat(colors.gray).concat(message).concat(colors.reset);
            default: return message;
        }
    };
    /**
     * 로그 파일 날짜 확인 및 교체
     */
    Logger.prototype.checkLogFileDate = function () {
        if (!this.options.rotateDaily || !this.logStream)
            return;
        var currentDate = new Date().toISOString().split('T')[0];
        if (currentDate !== this.currentLogDate) {
            // 날짜가 변경됨, 로그 파일 교체
            this.logStream.end();
            this.setupLogFiles();
        }
    };
    // 각 로그 레벨별 메서드 아래에 추가:
    /**
     * 이벤트 기반 로깅 (측정된 런타임 포함)
     * @param {string} event - 이벤트 이름
     * @param {string} message - 로그 메시지
     * @param {number} runtime - 실행 시간 (밀리초)
     * @param {Object} data - 추가 데이터
     */
    Logger.prototype.logEvent = function (level, event, data) {
        if (data === void 0) { data = {}; }
        var eventData = __assign({ event: event }, data);
        this.log(level, eventData);
    };
    // 편의를 위한 각 레벨별 이벤트 로깅 메서드
    Logger.prototype.eventInfo = function (event, data) {
        if (data === void 0) { data = {}; }
        this.logEvent('INFO', event, data);
    };
    Logger.prototype.eventError = function (event, data) {
        if (data === void 0) { data = {}; }
        this.logEvent('ERROR', event, data);
    };
    Logger.prototype.eventWarn = function (event, data) {
        if (data === void 0) { data = {}; }
        this.logEvent('WARN', event, data);
    };
    Logger.prototype.eventDebug = function (event, data) {
        if (data === void 0) { data = {}; }
        this.logEvent('DEBUG', event, data);
    };
    /**
     * 로그 출력
     */
    Logger.prototype.log = function (level, data) {
        var logLevel = LOG_LEVELS[level.toUpperCase()];
        // 설정된 로그 레벨보다 낮은 레벨은 무시
        if (logLevel > this.currentLevel)
            return;
        this.checkLogFileDate();
        // JSON 또는 텍스트 형식으로 포맷팅
        var formattedMessage;
        if (this.options.jsonFormat) {
            formattedMessage = this.formatJsonMessage(level, data);
        }
        else {
            formattedMessage = this.formatTextMessage(level, data);
        }
        // 콘솔에 출력
        if (this.options.toConsole) {
            var consoleMessage = this.options.jsonFormat ?
                this.formatTextMessage(level, data) : formattedMessage;
            console.log(this.colorize(level, consoleMessage));
        }
        // 파일에 로그 저장
        if (this.logStream) {
            this.logStream.write(formattedMessage + '\n');
        }
    };
    // 각 로그 레벨별 메서드
    Logger.prototype.error = function (data) {
        this.log('error', data);
    };
    Logger.prototype.warn = function (data) {
        this.log('warn', data);
    };
    Logger.prototype.info = function (data) {
        this.log('info', data);
    };
    Logger.prototype.debug = function (data) {
        this.log('debug', data);
    };
    Logger.prototype.trace = function (data) {
        this.log('trace', data);
    };
    return Logger;
}());
// 기본 로거 인스턴스 생성 (싱글톤)
var defaultLogger = new Logger({
    logDir: process.env.LOG_DIR || './logs',
    level: process.env.LOG_LEVEL || 'info',
    toConsole: true,
    jsonFormat: true,
    rotateDaily: true
});
module.exports = {
    Logger: Logger,
    defaultLogger: defaultLogger,
    // 로거 팩토리 함수
    createLogger: function (options) { return new Logger(options); }
};
