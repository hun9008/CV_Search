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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var puppeteer = require('puppeteer');
var fs = require('fs');
var extractAndProcessOnClicks = require('@crawl/baseOnclick').extractAndProcessOnClicks;
var logger = require('@utils/logger').defaultLogger;
var _a = require('@crawl/urlManager'), isUrlAllowed = _a.isUrlAllowed, extractDomain = _a.extractDomain;
var CONFIG = require('@config/config');
var executablePath = require('puppeteer').executablePath;
/**
 * 페이지를 아래로 스크롤하는 함수
 * @param {Page} page Puppeteer 페이지 객체
 * @returns {Promise<number>} 스크롤 거리
 */
function scrollToBottom(page) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, page.evaluate(function () { return __awaiter(_this, void 0, void 0, function () {
                    var previousHeight;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                previousHeight = window.scrollY;
                                window.scrollTo(0, document.body.scrollHeight);
                                // 스크롤 변화가 있을 때까지 대기
                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                            case 1:
                                // 스크롤 변화가 있을 때까지 대기
                                _a.sent();
                                return [2 /*return*/, document.body.scrollHeight];
                        }
                    });
                }); })];
        });
    });
}
/**
 * 페이지를 무한 스크롤하는 함수
 * @param {Page} page Puppeteer 페이지 객체
 * @param {number} maxScrolls 최대 스크롤 수 (기본값: 20)
 * @returns {Promise<number>} 실행된 스크롤 수
 */
function infiniteScroll(page_1) {
    return __awaiter(this, arguments, void 0, function (page, maxScrolls) {
        var previousHeight, currentHeight, scrollCount;
        if (maxScrolls === void 0) { maxScrolls = 5; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    previousHeight = 0;
                    return [4 /*yield*/, page.evaluate(function () { return document.body.scrollHeight; })];
                case 1:
                    currentHeight = _a.sent();
                    scrollCount = 0;
                    _a.label = 2;
                case 2:
                    if (!(scrollCount < maxScrolls)) return [3 /*break*/, 4];
                    previousHeight = currentHeight;
                    return [4 /*yield*/, scrollToBottom(page)];
                case 3:
                    currentHeight = _a.sent();
                    scrollCount++;
                    logger.debug("\uC2A4\uD06C\uB864 ".concat(scrollCount, "/").concat(maxScrolls, " \uC218\uD589 \uC911... (\uB192\uC774: ").concat(previousHeight, " \u2192 ").concat(currentHeight, ")"));
                    return [3 /*break*/, 2];
                case 4: return [2 /*return*/, scrollCount];
            }
        });
    });
}
/**
 * 자바스크립트를 추출하고 실행하여 URL 추출
 * @param {string} url - 대상 URL
 * @param {Array<string>} allowedDomains - 허용된 도메인 목록
 * @param {Browser} browser - 브라우저 인스턴스
 * @returns {Promise<Array<string>>} 추출된 URL 목록
 */
function extractAndExecuteScripts(url_1) {
    return __awaiter(this, arguments, void 0, function (url, allowedDomains, browser) {
        var startTime, page, processStartTime, extractedUrls, processRuntime, runtime, error_1, runtime;
        var _this = this;
        if (allowedDomains === void 0) { allowedDomains = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    logger.debug("URL ".concat(url, "\uC5D0\uC11C \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uC774\uBCA4\uD2B8 \uD578\uB4E4\uB7EC \uCD94\uCD9C \uC911..."));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    // JavaScript 대화 상자 무시
                    page.on('dialog', function (dialog) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, dialog.dismiss()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    // 페이지 로드
                    return [4 /*yield*/, page.goto(url, {
                            waitUntil: 'networkidle2',
                            timeout: CONFIG.BROWSER.TIMEOUT.PAGE_LOAD
                        })];
                case 3:
                    // 페이지 로드
                    _a.sent();
                    processStartTime = Date.now();
                    return [4 /*yield*/, processOnclick(page, url, allowedDomains)];
                case 4:
                    extractedUrls = _a.sent();
                    processRuntime = Date.now() - processStartTime;
                    logger.eventInfo('process_onclick', { url: url, runtime: processRuntime });
                    // 추출된 URL 및 페이지 정리
                    return [4 /*yield*/, page.close()];
                case 5:
                    // 추출된 URL 및 페이지 정리
                    _a.sent();
                    runtime = Date.now() - startTime;
                    logger.debug("\uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uCC98\uB9AC \uC644\uB8CC. \uCD94\uCD9C\uB41C URL: ".concat(extractedUrls.length, "\uAC1C"));
                    return [2 /*return*/, extractedUrls];
                case 6:
                    error_1 = _a.sent();
                    logger.error("\uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uCC98\uB9AC \uC911 \uC624\uB958:", error_1);
                    runtime = Date.now() - startTime;
                    return [2 /*return*/, []];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * onClick 이벤트 핸들러를 처리하여 URL 추출
 * @param {Page} page - Puppeteer 페이지 객체
 * @param {string} baseUrl - 기준 URL
 * @param {Array<string>} allowedDomains - 허용된 도메인 목록
 * @returns {Promise<Array<string>>} 추출된 URL 목록
 */
function processOnclick(page_1, baseUrl_1) {
    return __awaiter(this, arguments, void 0, function (page, baseUrl, allowedDomains) {
        var startTime, extractedUrls, uniqueUrls, filteredUrls, runtime, error_2;
        if (allowedDomains === void 0) { allowedDomains = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, page.evaluate(function (baseUrl) {
                            var results = [];
                            // 클릭 이벤트를 가질 수 있는 모든 요소 수집
                            var clickableElements = Array.from(document.querySelectorAll('a[onclick], button, input[type="button"], input[type="submit"], [role="button"], [onclick]'));
                            // 현재 문서의 URL 객체
                            var currentUrl = new URL(baseUrl);
                            var baseOrigin = currentUrl.origin;
                            // 각 요소에 클릭 이벤트 발생시키기
                            clickableElements.forEach(function (element) {
                                try {
                                    // 안전하게 클릭 이벤트 발생
                                    // 직접적인 onclick 속성 분석
                                    var onclickAttr = element.getAttribute('onclick');
                                    if (onclickAttr) {
                                        // href 또는 location.href 패턴 찾기
                                        var hrefMatches = onclickAttr.match(/(?:href|location\.href|window\.location)\s*=\s*['"]([^'"]+)['"]/i);
                                        if (hrefMatches && hrefMatches[1]) {
                                            var url = hrefMatches[1];
                                            // 상대 URL 처리
                                            if (url.startsWith('/')) {
                                                url = "".concat(baseOrigin).concat(url);
                                            }
                                            else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                                var urlObj = new URL(url, baseUrl);
                                                url = urlObj.href;
                                            }
                                            results.push(url);
                                        }
                                    }
                                    // 기본 속성에서 URL 추출 시도
                                    if (element.hasAttribute('href')) {
                                        var href = element.getAttribute('href');
                                        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                                            var url = void 0;
                                            try {
                                                url = new URL(href, baseUrl).href;
                                                results.push(url);
                                            }
                                            catch (e) {
                                                // URL 생성 오류 - 잘못된 형식일 수 있음
                                            }
                                        }
                                    }
                                }
                                catch (elementError) {
                                    // 요소별 오류 처리 - 조용히 넘어감
                                }
                            });
                            return Array.from(new Set(results)); // 중복 제거
                        }, baseUrl)];
                case 2:
                    extractedUrls = _a.sent();
                    uniqueUrls = __spreadArray([], new Set(extractedUrls), true);
                    filteredUrls = uniqueUrls.filter(function (url) {
                        try {
                            return isUrlAllowed(url, allowedDomains);
                        }
                        catch (e) {
                            return false;
                        }
                    });
                    runtime = Date.now() - startTime;
                    logger.debug("onClick \uC774\uBCA4\uD2B8 \uCC98\uB9AC \uC644\uB8CC. ".concat(filteredUrls.length, "\uAC1C URL \uCD94\uCD9C\uB428."));
                    return [2 /*return*/, filteredUrls];
                case 3:
                    error_2 = _a.sent();
                    logger.error("onClick \uC774\uBCA4\uD2B8 \uCC98\uB9AC \uC911 \uC624\uB958:", error_2);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Promise 형식의 확장 함수
function extractAndExecuteScriptsPromise(url, allowedDomains) {
    var _this = this;
    if (allowedDomains === void 0) { allowedDomains = []; }
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var puppeteer, browser, _a, _b, urls, error_3, error_4;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 9, , 10]);
                    logger.debug("\uB3C5\uB9BD \uD504\uB85C\uC138\uC2A4\uC5D0\uC11C URL ".concat(url, " \uCC98\uB9AC \uC911..."));
                    puppeteer = require('puppeteer');
                    _b = (_a = puppeteer).launch;
                    _c = {};
                    return [4 /*yield*/, executablePath()];
                case 1: return [4 /*yield*/, _b.apply(_a, [(_c.executablePath = _d.sent(),
                            _c.headless = 'new',
                            _c.args = CONFIG.BROWSER.LAUNCH_ARGS,
                            _c)])];
                case 2:
                    browser = _d.sent();
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, 6, 8]);
                    return [4 /*yield*/, extractAndExecuteScripts(url, allowedDomains, browser)];
                case 4:
                    urls = _d.sent();
                    resolve(urls);
                    return [3 /*break*/, 8];
                case 5:
                    error_3 = _d.sent();
                    reject(error_3);
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, browser.close()];
                case 7:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_4 = _d.sent();
                    reject(error_4);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
}
// 모듈로 내보내기
module.exports = {
    scrollToBottom: scrollToBottom,
    infiniteScroll: infiniteScroll,
    extractAndExecuteScripts: extractAndExecuteScripts,
    extractAndExecuteScriptsPromise: extractAndExecuteScriptsPromise,
    processOnclick: processOnclick
};
