"use strict";
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
var WorkerPool = require('@crawl/worker-task').WorkerPool;
var baseWorker = require('@crawl/baseWorker');
var logger = require('@utils/logger').defaultLogger;
/**
 * 페이지에서 onclick 속성을 가진 요소들을 찾아 이벤트를 실행
 * @param {Object} options 옵션 객체
 * @param {Browser} options.browser Puppeteer 브라우저 인스턴스
 * @param {string} options.url 현재 URL
 * @param {Array<Object>} options.onclickElements 클릭 이벤트를 가진 요소 목록
 * @param {boolean} options.headless 헤드리스 모드 사용 여부
 * @param {number} options.maxConcurrency 최대 동시 실행 작업 수
 * @param {number} options.timeout 각 작업의 제한 시간 (ms)
 * @returns {Promise<Object>} 실행 결과 및 발견된 URL들
 */
function processOnClickEvents(options) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, url, _a, onclickElements, _b, headless, _c, maxConcurrency, _d, timeout, result, workerPool, starTime, tasks, onclickResults, runtime, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    browser = options.browser, url = options.url, _a = options.onclickElements, onclickElements = _a === void 0 ? [] : _a, _b = options.headless, headless = _b === void 0 ? true : _b, _c = options.maxConcurrency, maxConcurrency = _c === void 0 ? 3 : _c, _d = options.timeout, timeout = _d === void 0 ? 5000 : _d;
                    result = {
                        totalElements: onclickElements.length,
                        processed: 0,
                        successful: 0,
                        failed: 0,
                        discoveredUrls: new Set(),
                        results: []
                    };
                    // onclick 요소가 없으면 바로 반환
                    if (!onclickElements || onclickElements.length === 0) {
                        logger.debug("유효한 onclick 이벤트가 없습니다.");
                        return [2 /*return*/, result];
                    }
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    workerPool = new WorkerPool(maxConcurrency);
                    starTime = Date.now();
                    tasks = onclickElements.map(function (item, idx) { return ({
                        id: idx + 1,
                        currentUrl: url,
                        onclickItem: item,
                        index: idx + 1,
                        total: onclickElements.length,
                        headless: headless,
                        timeout: timeout,
                        urlDetectionTimeout: Math.floor(timeout * 0.5), // 감지 타임아웃은 실행 타임아웃의 절반으로 설정
                        browser: browser // 브라우저 인스턴스 재사용 (worker-task에서 이를 지원해야 함)
                    }); });
                    return [4 /*yield*/, workerPool.processTasks(tasks)];
                case 2:
                    onclickResults = _e.sent();
                    // 결과 처리
                    onclickResults.forEach(function (onclickResult) {
                        // 결과를 배열에 추가
                        result.results.push(onclickResult);
                        result.processed++;
                        // 성공/실패 카운트
                        if (onclickResult.success) {
                            result.successful++;
                            // URL 변경이 감지된 경우
                            if (onclickResult.urlChanged && onclickResult.detectedUrl) {
                                var detectedUrl = onclickResult.detectedUrl;
                                if (detectedUrl && typeof detectedUrl === 'string' && detectedUrl.startsWith('http')) {
                                    result.discoveredUrls.add(detectedUrl);
                                    logger.debug("[OnClick ".concat(onclickResult.index, "] \uC0C8 URL \uBC1C\uACAC: ").concat(detectedUrl));
                                }
                            }
                        }
                        else {
                            result.failed++;
                        }
                    });
                    logger.debug("=== onclick \uC774\uBCA4\uD2B8 \uCC98\uB9AC \uC644\uB8CC ===");
                    logger.debug("- \uCC98\uB9AC\uB41C \uC774\uBCA4\uD2B8: ".concat(result.processed, "/").concat(result.totalElements, "\uAC1C"));
                    logger.debug("- \uC131\uACF5: ".concat(result.successful, "\uAC1C"));
                    logger.debug("- \uC2E4\uD328: ".concat(result.failed, "\uAC1C"));
                    logger.debug("- \uBC1C\uACAC\uB41C URL: ".concat(result.discoveredUrls.size, "\uAC1C"));
                    runtime = Date.now() - starTime;
                    logger.eventInfo('execute_onclick', { runtime: runtime });
                    return [2 /*return*/, result];
                case 3:
                    error_1 = _e.sent();
                    logger.debug('onclick 실행 오류:', error_1);
                    result.error = error_1.toString();
                    return [2 /*return*/, result];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 페이지에서 onclick 요소를 추출하고 처리
 * @param {Object} options 옵션 객체
 * @param {Browser} options.browser Puppeteer 브라우저 인스턴스
 * @param {string} options.url 대상 URL
 * @param {boolean} options.headless 헤드리스 모드 여부
 * @param {number} options.maxConcurrency 최대 동시 실행 작업 수
 * @param {number} options.timeout 제한 시간 (ms)
 * @returns {Promise<Object>} 실행 결과 및 발견된 URL들
 */
function extractAndProcessOnClicks(options) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, url, _a, headless, _b, maxConcurrency, _c, timeout, startTime, onclickElements, runtime, result, error_2;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    browser = options.browser, page = options.page, url = options.url, _a = options.headless, headless = _a === void 0 ? true : _a, _b = options.maxConcurrency, maxConcurrency = _b === void 0 ? 3 : _b, _c = options.timeout, timeout = _c === void 0 ? 5000 : _c;
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, , 7]);
                    // 페이지 설정
                    page.on('dialog', function (dialog) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    logger.debug("[OnClick \uBAA8\uB4C8] \uB300\uD654\uC0C1\uC790 \uAC10\uC9C0: ".concat(dialog.type(), ", \uBA54\uC2DC\uC9C0: ").concat(dialog.message()));
                                    return [4 /*yield*/, dialog.dismiss()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    startTime = Date.now();
                    return [4 /*yield*/, page.evaluate(function () {
                            // onclick 속성을 가진 모든 요소 수집
                            var elements = Array.from(document.querySelectorAll('[onclick]'));
                            return elements.map(function (element) {
                                return {
                                    tagName: element.tagName,
                                    id: element.id || null,
                                    className: element.className || null,
                                    onclick: element.getAttribute('onclick'),
                                    text: (element.textContent || '').trim().substring(0, 100) // 텍스트 길이 제한
                                };
                            });
                        })];
                case 2:
                    onclickElements = _d.sent();
                    runtime = Date.now() - startTime;
                    logger.eventInfo('extract_onclick', { runtime: runtime });
                    logger.debug("[OnClick \uBAA8\uB4C8] ".concat(onclickElements.length, "\uAC1C\uC758 onclick \uC694\uC18C\uB97C \uBC1C\uACAC\uD588\uC2B5\uB2C8\uB2E4."));
                    if (!(onclickElements.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, processOnClickEvents({
                            browser: browser,
                            url: url,
                            onclickElements: onclickElements,
                            headless: headless,
                            maxConcurrency: maxConcurrency,
                            timeout: timeout
                        })];
                case 3:
                    result = _d.sent();
                    return [2 /*return*/, {
                            success: true,
                            url: url,
                            currentUrl: url,
                            discoveredUrls: Array.from(result.discoveredUrls),
                            totalElements: result.totalElements,
                            processed: result.processed,
                            successful: result.successful,
                            failed: result.failed,
                            results: result.results
                        }];
                case 4: return [2 /*return*/, {
                        success: true,
                        url: url,
                        currentUrl: url,
                        discoveredUrls: [],
                        message: 'onclick 요소가 없습니다.'
                    }];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _d.sent();
                    logger.debug('onclick 실행 오류:', error_2);
                    return [2 /*return*/, {
                            success: false,
                            url: url,
                            error: error_2.toString(),
                            discoveredUrls: []
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
module.exports = {
    processOnClickEvents: processOnClickEvents,
    extractAndProcessOnClicks: extractAndProcessOnClicks
};
