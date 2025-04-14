'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
require('module-alias/register');
var chromium = require('chrome-aws-lambda');
var BaseWorkerManager = require('@crawl/baseWorkerManager').BaseWorkerManager;
var logger = require('@utils/logger').defaultLogger;
var mongoService = require('@database/mongodb-service').mongoService;
var CONFIG = require('@config/config');
/**
 * 크롤링 작업 실행 함수
 * @param {Object} event - Lambda 이벤트 객체
 * @param {Object} context - Lambda 컨텍스트 객체
 * @returns {Promise<Object>} 작업 결과
 */
function runCrawler(event, context) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, manager, connectionEstablished, remainingTime, maxTime_1, timePerUrl, calculatedMaxUrls, maxUrls, executablePath, options, timeoutId, result, summary, error_1, cleanupError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    browser = null;
                    manager = null;
                    connectionEstablished = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 14]);
                    logger.info('Lambda 함수 시작');
                    logger.info('이벤트 데이터:', JSON.stringify(event, null, 2));
                    remainingTime = context.getRemainingTimeInMillis();
                    logger.info("\uB0A8\uC740 \uC2E4\uD589 \uC2DC\uAC04: ".concat(remainingTime, "ms"));
                    maxTime_1 = process.env.MAX_EXECUTION_TIME || 840000;
                    timePerUrl = process.env.TIME_PER_URL || 10000;
                    calculatedMaxUrls = Math.floor(Math.min(remainingTime - 60000, maxTime_1) / timePerUrl);
                    maxUrls = Math.min(calculatedMaxUrls, CONFIG.CRAWLER.MAX_URLS || 500, event.maxUrls || Number.MAX_SAFE_INTEGER);
                    logger.info("\uC124\uC815\uB41C \uCD5C\uB300 URL \uC218: ".concat(maxUrls));
                    // MongoDB 연결
                    return [4 /*yield*/, mongoService.connect()];
                case 2:
                    // MongoDB 연결
                    _a.sent();
                    connectionEstablished = true;
                    logger.info('MongoDB 연결 성공');
                    return [4 /*yield*/, chromium.executablePath];
                case 3:
                    executablePath = _a.sent();
                    return [4 /*yield*/, chromium.puppeteer.launch({
                            args: chromium.args,
                            defaultViewport: chromium.defaultViewport,
                            executablePath: executablePath,
                            headless: chromium.headless,
                            ignoreHTTPSErrors: true
                        })];
                case 4:
                    // 브라우저 인스턴스 생성
                    browser = _a.sent();
                    logger.info('Puppeteer 브라우저 인스턴스 생성 완료');
                    options = {
                        browser: browser,
                        headless: true,
                        delayBetweenRequests: event.delayBetweenRequests || CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS,
                        maxUrls: maxUrls,
                        startUrl: event.startUrl,
                        strategy: event.strategy || 'bfs',
                        specificDomain: event.specificDomain,
                        maxConcurrency: event.maxConcurrency || 2, // Lambda에서는 병렬 작업 제한
                        timeoutPerPage: event.timeoutPerPage || 30000,
                        restartBrowser: false, // Lambda에서는 브라우저 재시작 비활성화
                        lambdaMode: true // Lambda 환경 표시
                    };
                    // 필수 파라미터 검증
                    if (!options.startUrl) {
                        throw new Error('시작 URL(startUrl)이 제공되지 않았습니다.');
                    }
                    logger.info('크롤러 설정:', options);
                    // BaseWorkerManager 인스턴스 생성
                    manager = new BaseWorkerManager(options);
                    timeoutId = setTimeout(function () {
                        logger.warn("\uCD5C\uB300 \uC2E4\uD589 \uC2DC\uAC04(".concat(maxTime_1, "ms)\uC5D0 \uB3C4\uB2EC\uD558\uC5EC \uC791\uC5C5\uC744 \uC911\uB2E8\uD569\uB2C8\uB2E4."));
                        manager.stop(); // 작업 중단 메서드 (BaseWorkerManager에 구현 필요)
                    }, maxTime_1);
                    return [4 /*yield*/, manager.run()];
                case 5:
                    result = _a.sent();
                    // 타임아웃 취소
                    clearTimeout(timeoutId);
                    summary = {
                        startUrl: options.startUrl,
                        domain: options.specificDomain,
                        strategy: options.strategy,
                        urlsProcessed: (result === null || result === void 0 ? void 0 : result.urlsProcessed) || 0,
                        urlsDiscovered: (result === null || result === void 0 ? void 0 : result.urlsDiscovered) || 0,
                        success: true,
                        executionTimeMs: context.getRemainingTimeInMillis() ?
                            remainingTime - context.getRemainingTimeInMillis() :
                            'unknown'
                    };
                    logger.info('크롤링 완료, 결과 요약:', summary);
                    return [2 /*return*/, {
                            statusCode: 200,
                            body: JSON.stringify(summary)
                        }];
                case 6:
                    error_1 = _a.sent();
                    logger.error('크롤링 작업 중 오류 발생:', error_1);
                    return [2 /*return*/, {
                            statusCode: 500,
                            body: JSON.stringify({
                                message: "\uC624\uB958 \uBC1C\uC0DD: ".concat(error_1.message),
                                stack: process.env.NODE_ENV === 'development' ? error_1.stack : undefined
                            })
                        }];
                case 7:
                    _a.trys.push([7, 12, , 13]);
                    if (manager) {
                        // 관리자 종료 로직 (구현 필요)
                        logger.info('BaseWorkerManager 종료 중...');
                        // manager.cleanup(); // 이 메서드가 구현되어 있다면 호출
                    }
                    if (!browser) return [3 /*break*/, 9];
                    logger.info('브라우저 인스턴스 종료 중...');
                    return [4 /*yield*/, browser.close()];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    if (!connectionEstablished) return [3 /*break*/, 11];
                    logger.info('MongoDB 연결 종료 중...');
                    return [4 /*yield*/, mongoService.disconnect()];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    cleanupError_1 = _a.sent();
                    logger.error('리소스 정리 중 오류:', cleanupError_1);
                    return [3 /*break*/, 13];
                case 13:
                    logger.info('Lambda 함수 종료');
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
/**
 * Lambda 핸들러 함수
 */
exports.handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var isColdStart;
    return __generator(this, function (_a) {
        isColdStart = !global.lambdaWarmUp;
        global.lambdaWarmUp = true;
        if (isColdStart) {
            logger.info('Lambda 콜드 스타트 감지');
        }
        // "ping" 이벤트는 웜업 요청으로 처리
        if (event.ping) {
            logger.info('웜업 요청 수신');
            return [2 /*return*/, {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Lambda 함수가 준비되었습니다.' })
                }];
        }
        return [2 /*return*/, runCrawler(event, context)];
    });
}); };
// 로컬 실행을 위한 코드
if (require.main === module) {
    // 로컬 실행 환경에서 테스트를 위한 설정
    var testEvent = {
        startUrl: process.argv[2] || 'https://example.com',
        specificDomain: process.argv[3] || 'example.com',
        strategy: process.argv[4] || 'specific',
        maxUrls: parseInt(process.argv[5] || '50', 10),
        delayBetweenRequests: 1000
    };
    logger.info('로컬 환경에서 실행 중...');
    logger.info('테스트 이벤트:', testEvent);
    // 가상의 Lambda 컨텍스트 생성
    var mockContext = {
        getRemainingTimeInMillis: function () { return 900000; }, // 15분
        functionName: 'localRun',
        functionVersion: 'local',
        invokedFunctionArn: 'local:function',
        memoryLimitInMB: '2048',
        awsRequestId: 'local-' + Date.now(),
        logGroupName: '/local/crawler',
        logStreamName: "local/".concat(Date.now())
    };
    // Lambda 핸들러 함수 실행
    exports.handler(testEvent, mockContext)
        .then(function (result) {
        logger.info('실행 결과:', result);
        process.exit(0);
    })
        .catch(function (error) {
        logger.error('실행 중 오류 발생:', error);
        process.exit(1);
    });
}
