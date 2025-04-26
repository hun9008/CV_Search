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
require('module-alias/register');
// const puppeteer = require('puppeteer');
var chromium = require('chrome-aws-lambda');
var mongoose = require('mongoose');
var _a = require('@crawl/baseWorker'), extractAndExecuteScripts = _a.extractAndExecuteScripts, extractAndExecuteScriptsPromise = _a.extractAndExecuteScriptsPromise;
var _b = require('@crawl/urlManager'), isUrlAllowed = _b.isUrlAllowed, extractDomain = _b.extractDomain, isUrlAllowedWithRobots = _b.isUrlAllowedWithRobots, parseRobotsTxt = _b.parseRobotsTxt;
var CONFIG = require('@config/config');
var logger = require('@utils/logger').defaultLogger;
var _c = require('@models/visitResult'), VisitResult = _c.VisitResult, SubUrl = _c.SubUrl;
var MONGODB_URI = process.env.MONGODB_ADMIN_URI;
logger.debug(MONGODB_URI);
/**
 * URL 탐색 관리자 클래스
 * 여러 URL을 큐에 넣고 순차적으로 탐색합니다.
 */
var BaseWorkerManager = /** @class */ (function () {
    /**
     * 생성자
     * @param {Object} options 옵션
     * @param {string} options.startUrl 시작 URL
     * @param {number} options.maxUrls 최대 방문 URL 수 (기본값: 100)
     * @param {number} options.delayBetweenRequests 요청 사이 지연 시간(ms) (기본값: 2000)
     * @param {boolean} options.headless 헤드리스 모드 사용 여부
     */
    function BaseWorkerManager(options) {
        if (options === void 0) { options = {}; }
        this.startUrl = options.startUrl || CONFIG.CRAWLER.START_URL;
        this.delayBetweenRequests = options.delayBetweenRequests || CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS;
        this.headless = options.headless !== undefined ? options.headless : CONFIG.BROWSER.HEADLESS;
        this.maxUrls = CONFIG.CRAWLER.MAX_URLS;
        this.strategy = options.strategy || CONFIG.CRAWLER.STRATEGY;
        this.currentUrl;
        if (this.strategy == "specific") {
            this.specificDomain = options.specificDomain || CONFIG.CRAWLER.BASE_DOMAIN;
        }
        // 실행 상태
        this.isRunning = false;
        // 브라우저 인스턴스
        this.browser = null;
        // 몽구스 연결 상태
        this.isConnected = false;
    }
    /**
     * MongoDB 연결
     */
    BaseWorkerManager.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, runtime, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isConnected)
                            return [2 /*return*/];
                        logger.debug("Try mongodb connect");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        return [4 /*yield*/, mongoose.connect(MONGODB_URI, {
                                useNewUrlParser: true,
                                useUnifiedTopology: true,
                                dbName: 'crwal_db',
                            })];
                    case 2:
                        _a.sent();
                        this.isConnected = true;
                        runtime = Date.now() - startTime;
                        logger.eventInfo('db_connect', { runtime: runtime });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        logger.error('db_connect', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * MongoDB 연결 종료
     */
    BaseWorkerManager.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, mongoose.disconnect()];
                    case 2:
                        _a.sent();
                        this.isConnected = false;
                        logger.eventInfo('DB연결 종료', 'DB연결 종료 성공');
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        logger.eventerror('DB연결 종료', error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 브라우저 초기화
     */
    BaseWorkerManager.prototype.initBrowser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, processExit;
            var _d;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!!this.browser) return [3 /*break*/, 3];
                        logger.debug("BaseWorkerManager \uCD08\uAE30\uD654 \uC644\uB8CC.");
                        _a = this;
                        _c = (_b = chromium.puppeteer).launch;
                        _d = {};
                        return [4 /*yield*/, chromium.executablePath];
                    case 1: return [4 /*yield*/, _c.apply(_b, [(_d.executablePath = _e.sent(),
                                _d.headless = 'new',
                                _d.ignoreHTTPSErrors = true,
                                _d.defaultViewport = null,
                                _d.ignoreDefaultArgs = ['--enable-automation'],
                                _d.args = CONFIG.BROWSER.LAUNCH_ARGS,
                                _d.defaultViewport = { width: 1920, height: 1080 },
                                _d.timeout = 10000,
                                _d.protocolTimeout = 20000,
                                _d)])];
                    case 2:
                        _a.browser = _e.sent();
                        // 브라우저 PID 저장
                        this.browserPID = this.browser.process() ? this.browser.process().pid : null;
                        if (this.browserPID) {
                            logger.debug("\uBE0C\uB77C\uC6B0\uC800 \uD504\uB85C\uC138\uC2A4 ID: ".concat(this.browserPID));
                        }
                        processExit = function () { return __awaiter(_this, void 0, void 0, function () {
                            var pages, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        logger.debug('프로세스 종료 감지, 브라우저 정리 중...');
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 6, 7, 8]);
                                        if (!this.browser) return [3 /*break*/, 5];
                                        return [4 /*yield*/, this.browser.pages()];
                                    case 2:
                                        pages = _a.sent();
                                        return [4 /*yield*/, Promise.all(pages.map(function (page) {
                                                try {
                                                    return page.close();
                                                }
                                                catch (e) {
                                                    return Promise.resolve();
                                                }
                                            }))];
                                    case 3:
                                        _a.sent();
                                        // 브라우저 닫기
                                        return [4 /*yield*/, this.browser.close()];
                                    case 4:
                                        // 브라우저 닫기
                                        _a.sent();
                                        logger.debug('브라우저가 안전하게 종료되었습니다.');
                                        _a.label = 5;
                                    case 5: return [3 /*break*/, 8];
                                    case 6:
                                        err_1 = _a.sent();
                                        logger.debug('브라우저 종료 중 오류:', err_1);
                                        return [3 /*break*/, 8];
                                    case 7:
                                        // 추가: Google Chrome for Testing 프로세스 강제 종료
                                        this.killChromeProcesses();
                                        return [7 /*endfinally*/];
                                    case 8:
                                        process.exit(0);
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        _e.label = 3;
                    case 3: return [2 /*return*/, this.browser];
                }
            });
        });
    };
    /**
     * 에러 발생 시 페이지 스크린샷을 저장하는 함수
     * @param {Page} page - Puppeteer 페이지 객체
     * @param {string} url - 스크린샷을 찍을 URL
     * @param {Object} visitResult - 방문 결과 객체 (스크린샷 경로를 저장할 객체)
     * @returns {Promise<string|null>} 저장된 스크린샷 경로 또는 실패 시 null
     */
    BaseWorkerManager.prototype.saveErrorScreenshot = function (page, url) {
        return __awaiter(this, void 0, void 0, function () {
            var fs, path, screenshotsDir, sanitizedUrl, timestamp, fileName, filePath, screenshotError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!page) {
                            logger.debug('페이지 객체가 없어 스크린샷을 저장할 수 없습니다.');
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        fs = require('fs').promises;
                        path = require('path');
                        screenshotsDir = path.join(CONFIG.PATHS.ERROR_SCREENSHOTS_DIR);
                        // 디렉토리가 없으면 생성
                        return [4 /*yield*/, fs.mkdir(screenshotsDir, { recursive: true })];
                    case 2:
                        // 디렉토리가 없으면 생성
                        _a.sent();
                        sanitizedUrl = url
                            .replace(/^https?:\/\//, '')
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .substring(0, 100);
                        timestamp = new Date().toISOString().replace(/:/g, '-');
                        fileName = "".concat(sanitizedUrl, "_").concat(timestamp, ".png");
                        filePath = path.join(screenshotsDir, fileName);
                        // 스크린샷 저장
                        return [4 /*yield*/, page.screenshot({
                                path: filePath,
                                fullPage: true // 전체 페이지 캡처
                            })];
                    case 3:
                        // 스크린샷 저장
                        _a.sent();
                        logger.debug("\uC5D0\uB7EC \uC2A4\uD06C\uB9B0\uC0F7 \uC800\uC7A5\uB428: ".concat(filePath));
                        return [2 /*return*/, filePath];
                    case 4:
                        screenshotError_1 = _a.sent();
                        logger.error('스크린샷 저장 중 오류:', screenshotError_1);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 페이지의 내용을 추출
     * @param {Page} page Puppeteer 페이지 객체
     * @returns {Promise<Object>} 페이지 내용 객체
     */
    BaseWorkerManager.prototype.extractPageContent = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, page.evaluate(function () {
                                // 페이지 내에서 텍스트 추출 함수 정의 (페이지 컨텍스트 내에서)
                                function extractTextFromNode(node) {
                                    // 텍스트 노드인 경우
                                    if (node.nodeType === Node.TEXT_NODE) {
                                        return node.textContent.trim();
                                    }
                                    // 특정 태그는 건너뛰기 (스크립트, 스타일, 코드, noscript 등)
                                    if (node.nodeName === 'SCRIPT' ||
                                        node.nodeName === 'STYLE' ||
                                        node.nodeName === 'CODE' ||
                                        node.nodeName === 'NOSCRIPT' ||
                                        node.nodeName === 'SVG') {
                                        return '';
                                    }
                                    // 노드가 보이지 않는 경우 건너뛰기
                                    try {
                                        var style = window.getComputedStyle(node);
                                        if (style && (style.display === 'none' || style.visibility === 'hidden')) {
                                            return '';
                                        }
                                    }
                                    catch (e) {
                                        // getComputedStyle은 요소 노드에서만 작동
                                    }
                                    // 자식 노드 처리
                                    var text = '';
                                    var childNodes = node.childNodes;
                                    for (var i = 0; i < childNodes.length; i++) {
                                        text += extractTextFromNode(childNodes[i]) + ' ';
                                    }
                                    return text.trim();
                                }
                                // 타이틀 추출
                                var title = document.title || '';
                                // 메타 태그 추출
                                var meta = {};
                                var metaTags = document.querySelectorAll('meta');
                                metaTags.forEach(function (tag) {
                                    var name = tag.getAttribute('name') || tag.getAttribute('property');
                                    var content = tag.getAttribute('content');
                                    if (name && content) {
                                        meta[name] = content;
                                    }
                                });
                                // 주요 텍스트 내용 추출 - 함수가 페이지 컨텍스트 내에 정의되어 있음
                                var mainText = extractTextFromNode(document.body);
                                // 긴 텍스트 정리 및 가독성 향상
                                var cleanedText = mainText
                                    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
                                    .replace(/\n\s*\n/g, '\n') // 빈 줄 제거
                                    .trim()
                                    .substring(0, 100000); // 텍스트 길이 제한
                                return {
                                    title: title,
                                    meta: meta,
                                    text: cleanedText
                                };
                            })];
                    case 1:
                        result = _a.sent();
                        runtime = Date.now() - startTime;
                        logger.eventInfo('extract_page_content', { runtime: runtime });
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
   * 페이지에서 링크 추출 (상대 경로 포함)
   * @param {Page} page Puppeteer 페이지 객체
   * @param {Array<string>} allowedDomains 허용된 도메인 목록
   * @returns {Promise<Array<string>>} 추출된 URL 배열
   */
    BaseWorkerManager.prototype.extractLinks = function (page, allowedDomains) {
        return __awaiter(this, void 0, void 0, function () {
            var pageUrl, baseUrl, currentPath, links, uniqueLinks, allowedLinks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pageUrl = page.url();
                        baseUrl = new URL(pageUrl).origin;
                        currentPath = new URL(pageUrl).pathname;
                        logger.debug("\uB9C1\uD06C \uCD94\uCD9C \uC911... \uAE30\uC900 URL: ".concat(pageUrl, ", \uD5C8\uC6A9 \uB3C4\uBA54\uC778: ").concat(allowedDomains.join(', ')));
                        return [4 /*yield*/, page.evaluate(function (baseUrl, currentPath) {
                                // 상대 경로를 절대 경로로 변환하는 함수
                                function resolveUrl(base, relative) {
                                    try {
                                        // 이미 절대 URL인 경우
                                        if (relative.startsWith('http://') || relative.startsWith('https://')) {
                                            return relative;
                                        }
                                        // 빈 링크, 자바스크립트 링크, 앵커 링크, 메일 링크 건너뛰기
                                        if (!relative || relative.startsWith('#') ||
                                            relative.startsWith('javascript:') ||
                                            relative.startsWith('mailto:') ||
                                            relative.startsWith('tel:')) {
                                            return null;
                                        }
                                        // 루트 경로인 경우
                                        if (relative.startsWith('/')) {
                                            return new URL(relative, base).href;
                                        }
                                        // 프로토콜 상대 URL인 경우
                                        if (relative.startsWith('//')) {
                                            return new URL("https:".concat(relative)).href;
                                        }
                                        // 상대 경로인 경우
                                        // 현재 경로의 마지막 부분 제거 (파일명이나 마지막 디렉토리)
                                        var pathParts = currentPath.split('/');
                                        // 파일 확장자가 있거나 마지막 요소가 비어있지 않은 경우 마지막 부분 제거
                                        if (pathParts[pathParts.length - 1].includes('.') || pathParts[pathParts.length - 1] !== '') {
                                            pathParts.pop();
                                        }
                                        var basePath = pathParts.join('/');
                                        if (!basePath.endsWith('/')) {
                                            basePath += '/';
                                        }
                                        return new URL(basePath + relative, base).href;
                                    }
                                    catch (e) {
                                        logger.debug("URL \uBCC0\uD658 \uC2E4\uD328: ".concat(relative), e);
                                        return null;
                                    }
                                }
                                // 모든 앵커 요소 찾기
                                var anchors = Array.from(document.querySelectorAll('a[href]'));
                                var extractedUrls = [];
                                anchors.forEach(function (anchor) {
                                    var href = anchor.getAttribute('href');
                                    // href 속성이 있는지 확인
                                    if (href) {
                                        var resolvedUrl = resolveUrl(baseUrl, href);
                                        if (resolvedUrl) {
                                            extractedUrls.push(resolvedUrl);
                                        }
                                    }
                                });
                                return extractedUrls;
                            }, baseUrl, currentPath)];
                    case 1:
                        links = _a.sent();
                        uniqueLinks = __spreadArray([], new Set(links.filter(Boolean)), true);
                        allowedLinks = uniqueLinks.filter(function (url) {
                            try {
                                return isUrlAllowed(url, allowedDomains);
                            }
                            catch (e) {
                                logger.debug("URL \uD544\uD130\uB9C1 \uC2E4\uD328: ".concat(url), e);
                                return false;
                            }
                        });
                        return [2 /*return*/, allowedLinks];
                }
            });
        });
    };
    /**
    * 다음에 방문할 URL 가져오기
    * @returns {Promise<{url: string, domain: string}|null>} 다음 URL 또는 없으면 null
    */
    BaseWorkerManager.prototype.getNextUrl = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, targetDomain, _a, _b, runtime, error_3, runtime;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        result = null;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 9, , 10]);
                        if (!!this.isConnected) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        if (!!this.availableDomains) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.initAvailableDomains()];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        // 인덱스 초기화
                        if (!this.currentDomainIndex) {
                            this.currentDomainIndex = 0;
                        }
                        // robots.txt 캐시 초기화
                        if (!this.robotsCache) {
                            this.robotsCache = {};
                        }
                        targetDomain = this.selectTargetDomain();
                        if (!!this.robotsCache[targetDomain]) return [3 /*break*/, 7];
                        _a = this.robotsCache;
                        _b = targetDomain;
                        return [4 /*yield*/, parseRobotsTxt(targetDomain)];
                    case 6:
                        _a[_b] = _c.sent();
                        _c.label = 7;
                    case 7: return [4 /*yield*/, this.getUrlForDomain(targetDomain)];
                    case 8:
                        // 도메인에서 URL 가져오기
                        result = _c.sent();
                        runtime = Date.now() - startTime;
                        logger.eventInfo('get_next_url', {
                            url: result ? result.url : 'none',
                            domain: targetDomain,
                            runtime: runtime
                        });
                        return [2 /*return*/, result];
                    case 9:
                        error_3 = _c.sent();
                        runtime = Date.now() - startTime;
                        logger.error("URL \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958:", error_3);
                        logger.eventInfo('get_next_url', {
                            url: 'error',
                            error: error_3.message,
                            runtime: runtime
                        });
                        return [2 /*return*/, null];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 도메인 목록 초기화
     * @private
     */
    BaseWorkerManager.prototype.initAvailableDomains = function () {
        return __awaiter(this, void 0, void 0, function () {
            var findStartTime, domains, findRuntime, domainSample, startDomain, error_4, startDomain;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        findStartTime = Date.now();
                        return [4 /*yield*/, VisitResult.find({}, { domain: 1, _id: 0 }).lean()];
                    case 1:
                        domains = _a.sent();
                        findRuntime = Date.now() - findStartTime;
                        logger.eventInfo('find_domain', { runtime: findRuntime });
                        if (domains && domains.length > 0) {
                            // 중복 없는 도메인 목록 생성
                            this.availableDomains = domains.map(function (doc) { return ({ domain: doc.domain }); });
                            logger.debug("".concat(this.availableDomains.length, "\uAC1C\uC758 \uB3C4\uBA54\uC778\uC744 \uBD88\uB7EC\uC654\uC2B5\uB2C8\uB2E4."));
                            // 도메인 목록 로깅 (최대 5개)
                            if (this.availableDomains.length > 0) {
                                domainSample = this.availableDomains.slice(0, 5).map(function (d) { return d.domain; });
                                logger.debug("\uB3C4\uBA54\uC778 \uC0D8\uD50C: ".concat(domainSample.join(', ')).concat(this.availableDomains.length > 5 ? " \uC678 ".concat(this.availableDomains.length - 5, "\uAC1C") : ''));
                            }
                        }
                        else {
                            startDomain = extractDomain(this.startUrl);
                            this.availableDomains = [{ domain: startDomain }];
                            logger.debug("\uB3C4\uBA54\uC778\uC774 \uC5C6\uC5B4 \uC2DC\uC791 \uB3C4\uBA54\uC778 ".concat(startDomain, "\uC73C\uB85C \uCD08\uAE30\uD654\uD569\uB2C8\uB2E4."));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        logger.debug('도메인 목록 로드 중 오류:', error_4);
                        startDomain = extractDomain(this.startUrl);
                        this.availableDomains = [{ domain: startDomain }];
                        logger.debug("\uC624\uB958\uB85C \uC778\uD574 \uC2DC\uC791 \uB3C4\uBA54\uC778 ".concat(startDomain, "\uC73C\uB85C \uCD08\uAE30\uD654\uD569\uB2C8\uB2E4."));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 전략에 따라 타겟 도메인 선택
     * @private
     */
    BaseWorkerManager.prototype.selectTargetDomain = function () {
        var targetDomain;
        switch (this.strategy) {
            case 'specific':
                // 특정 도메인만 탐색
                targetDomain = this.specificDomain || this.baseDomain || extractDomain(this.startUrl);
                break;
            case 'random':
                // 랜덤 도메인 탐색
                var randomIndex = Math.floor(Math.random() * this.availableDomains.length);
                targetDomain = this.availableDomains[randomIndex].domain;
                logger.debug("\uB79C\uB364 \uB3C4\uBA54\uC778 \uC120\uD0DD: ".concat(targetDomain, " (\uC778\uB371\uC2A4: ").concat(randomIndex, "/").concat(this.availableDomains.length, ")"));
                break;
            case 'sequential':
            default:
                // 순차적 도메인 탐색
                targetDomain = this.availableDomains[this.currentDomainIndex].domain;
                logger.debug("\uC21C\uCC28\uC801 \uB3C4\uBA54\uC778 \uC120\uD0DD: ".concat(targetDomain, " (\uC778\uB371\uC2A4: ").concat(this.currentDomainIndex, "/").concat(this.availableDomains.length, ")"));
                // 다음 도메인으로 인덱스 이동
                this.currentDomainIndex = (this.currentDomainIndex + 1) % this.availableDomains.length;
                break;
        }
        return targetDomain;
    };
    /**
     * 특정 도메인에서 URL 가져오기
     * @private
     */
    BaseWorkerManager.prototype.getUrlForDomain = function (targetDomain) {
        return __awaiter(this, void 0, void 0, function () {
            var findStartTime, domainDoc, findRuntime, filterStartTime, allowedUnvisitedUrls, filterRuntime, unvisitedUrl, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        findStartTime = Date.now();
                        return [4 /*yield*/, VisitResult.findOne({ domain: targetDomain })];
                    case 1:
                        domainDoc = _a.sent();
                        findRuntime = Date.now() - findStartTime;
                        logger.eventInfo('find_domain_document', { domain: targetDomain, runtime: findRuntime });
                        // 도메인 문서나 URL 목록이 없는 경우 처리
                        if (!domainDoc || !domainDoc.suburl_list) {
                            return [2 /*return*/, null];
                        }
                        filterStartTime = Date.now();
                        return [4 /*yield*/, this.filterAllowedUrls(domainDoc.suburl_list, targetDomain)];
                    case 2:
                        allowedUnvisitedUrls = _a.sent();
                        filterRuntime = Date.now() - filterStartTime;
                        logger.eventInfo('filter_urls', {
                            domain: targetDomain,
                            total: domainDoc.suburl_list.length,
                            filtered: allowedUnvisitedUrls.length,
                            runtime: filterRuntime
                        });
                        // 방문할 URL이 있는 경우
                        if (allowedUnvisitedUrls.length > 0) {
                            unvisitedUrl = allowedUnvisitedUrls[0];
                            logger.debug("\uB3C4\uBA54\uC778 ".concat(targetDomain, "\uC5D0\uC11C \uBC29\uBB38\uD560 URL\uC744 \uCC3E\uC558\uC2B5\uB2C8\uB2E4: ").concat(unvisitedUrl.url));
                            this._recursionCount = 0;
                            return [2 /*return*/, { url: unvisitedUrl.url, domain: targetDomain }];
                        }
                        // 방문할 URL이 없는 경우
                        else {
                            logger.debug("\uB3C4\uBA54\uC778 ".concat(targetDomain, "\uC5D0 \uBC29\uBB38 \uAC00\uB2A5\uD55C URL\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."));
                            return [2 /*return*/, null];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        logger.error("\uB3C4\uBA54\uC778 ".concat(targetDomain, "\uC5D0\uC11C URL \uAC00\uC838\uC624\uAE30 \uC2E4\uD328:"), error_5);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * URL 목록에서 방문 가능한 URL 필터링
     * @private
     */
    BaseWorkerManager.prototype.filterAllowedUrls = function (urls, targetDomain) {
        return __awaiter(this, void 0, void 0, function () {
            var results, batchSize, unvisitedUrls, i, batch, batchPromises, batchResults;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        batchSize = 10;
                        unvisitedUrls = urls.filter(function (item) { return !item.visited; });
                        logger.debug("\uB3C4\uBA54\uC778 ".concat(targetDomain, "\uC5D0\uC11C \uBC29\uBB38\uD558\uC9C0 \uC54A\uC740 URL ").concat(unvisitedUrls.length, "\uAC1C \uBC1C\uACAC"));
                        // 빈 URL 리스트인 경우 조기 반환
                        if (unvisitedUrls.length === 0) {
                            return [2 /*return*/, results];
                        }
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < unvisitedUrls.length)) return [3 /*break*/, 4];
                        batch = unvisitedUrls.slice(i, i + batchSize);
                        batchPromises = batch.map(function (item) {
                            return isUrlAllowedWithRobots(item.url, [targetDomain], _this.robotsCache)
                                .then(function (isAllowed) { return isAllowed ? item : null; });
                        });
                        return [4 /*yield*/, Promise.all(batchPromises)];
                    case 2:
                        batchResults = _a.sent();
                        results.push.apply(results, batchResults.filter(function (item) { return item !== null; }));
                        // 충분한 URL을 찾으면 조기 반환 (최적화)
                        if (results.length >= 5) {
                            logger.debug("\uD5C8\uC6A9\uB41C URL\uC744 \uCDA9\uBD84\uD788 \uCC3E\uC558\uC2B5\uB2C8\uB2E4. \uB098\uBA38\uC9C0 URL \uD544\uD130\uB9C1 \uC0DD\uB7B5.");
                            return [3 /*break*/, 4];
                        }
                        _a.label = 3;
                    case 3:
                        i += batchSize;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * 다음 도메인 시도 (재귀 제한)
     * @private
     */
    BaseWorkerManager.prototype.tryNextDomain = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this._recursionCount)
                    this._recursionCount = 0;
                this._recursionCount++;
                if (this._recursionCount > this.availableDomains.length) {
                    logger.debug('모든 도메인에 방문할 URL이 없습니다.');
                    this._recursionCount = 0;
                    return [2 /*return*/, null];
                }
                logger.debug("\uB2E4\uB978 \uB3C4\uBA54\uC778 \uC2DC\uB3C4 \uC911... (".concat(this._recursionCount, "/").concat(this.availableDomains.length, ")"));
                return [2 /*return*/, this.getNextUrl()];
            });
        });
    };
    /**
     * 도메인 에러 처리 (에러 제한)
     * @private
     */
    BaseWorkerManager.prototype.handleDomainError = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger.debug('다른 도메인에서 URL 가져오기 시도...');
                if (!this._errorCount)
                    this._errorCount = 0;
                this._errorCount++;
                if (this._errorCount > 3) {
                    logger.debug('너무 많은 오류가 발생했습니다.');
                    this._errorCount = 0;
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, this.getNextUrl()];
            });
        });
    };
    BaseWorkerManager.prototype.killChromeProcesses = function () {
        try {
            var execSync = require('child_process').execSync;
            logger.debug('남은 Chrome 프로세스 정리 중...');
            // OS별로 다른 명령어 실행
            if (process.platform === 'darwin') {
                // macOS
                execSync('pkill -f "Google Chrome for Testing"');
                logger.debug('Google Chrome for Testing 프로세스가 정리되었습니다.');
                // 일반 Chrome 프로세스도 확인 (필요한 경우)
                // execSync('pkill -f "Google Chrome Helper"');
            }
            else if (process.platform === 'linux') {
                // Linux
                execSync('pkill -f "chrome-for-testing"');
                execSync('pkill -f "chrome-test"');
            }
            else if (process.platform === 'win32') {
                // Windows
                execSync('taskkill /F /IM "chrome.exe" /FI "WINDOWTITLE eq *Chrome for Testing*"');
            }
        }
        catch (error) {
            // 이미 죽어있거나 다른 이유로 실패할 수 있음 - 무시
            logger.debug('Chrome 프로세스 종료 완료 또는 종료할 프로세스가 없음');
        }
    };
    /**
    * 단일 URL 방문 및 처리
    * @param {Object} urlInfo - 방문할 URL 정보
    * @param {string} urlInfo.url - 방문할 URL
    * @param {string} urlInfo.domain - 도메인
    * @returns {Promise<Object>} 방문 결과 객체
    */
    BaseWorkerManager.prototype.visitUrl = function (urlInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, domain, startTime, subUrlResult, page, browser, _a, error_6, extractStartTime, _b, extractRuntime, error_7, extractOnclickStartTime, _c, extractOnclickRuntime, error_8, robotsParser, filteredUrls, blockedUrls, _i, _d, url_1, isAllowed, runtime, error_9, runtime, pages, pageCloseError_1;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        url = urlInfo.url, domain = urlInfo.domain;
                        logger.debug("=== URL \uBC29\uBB38 \uC2DC\uC791: ".concat(url, " ==="));
                        startTime = Date.now();
                        subUrlResult = new SubUrl({
                            url: url,
                            domain: domain,
                            visited: true,
                            visitedAt: new Date(),
                        });
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 15, 17, 23]);
                        return [4 /*yield*/, this.initBrowser()];
                    case 2:
                        browser = _e.sent();
                        return [4 /*yield*/, browser.newPage()];
                    case 3:
                        // 새 페이지 열기
                        page = _e.sent();
                        // 자바스크립트 대화상자 처리
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
                    case 4:
                        // 페이지 로드
                        _e.sent();
                        // 현재 URL 가져오기 (리다이렉트 가능성)
                        subUrlResult.finalUrl = page.url();
                        // 최종 URL의 도메인 확인
                        subUrlResult.finalDomain = extractDomain(subUrlResult.finalUrl);
                        _e.label = 5;
                    case 5:
                        _e.trys.push([5, 7, , 8]);
                        // 페이지 내용 추출
                        _a = subUrlResult;
                        return [4 /*yield*/, this.extractPageContent(page)];
                    case 6:
                        // 페이지 내용 추출
                        _a.pageContent = _e.sent();
                        subUrlResult.title = subUrlResult.pageContent.title;
                        subUrlResult.text = subUrlResult.pageContent.text;
                        return [3 /*break*/, 8];
                    case 7:
                        error_6 = _e.sent();
                        logger.error('Error extracting page content:', error_6.message);
                        subUrlResult.errors.push({
                            type: 'content_extraction',
                            message: error_6.message,
                            stack: error_6.stack
                        });
                        return [3 /*break*/, 8];
                    case 8:
                        _e.trys.push([8, 10, , 11]);
                        extractStartTime = Date.now();
                        _b = subUrlResult;
                        return [4 /*yield*/, this.extractLinks(page, [domain])];
                    case 9:
                        _b.herfUrls = _e.sent();
                        extractRuntime = Date.now() - extractStartTime;
                        logger.eventInfo('extract_herf', { url: url, runtime: extractRuntime });
                        return [3 /*break*/, 11];
                    case 10:
                        error_7 = _e.sent();
                        logger.error('Error extracting links:', error_7.message);
                        subUrlResult.errors.push({
                            type: 'link_extraction',
                            message: error_7.message,
                            stack: error_7.stack
                        });
                        return [3 /*break*/, 11];
                    case 11:
                        _e.trys.push([11, 13, , 14]);
                        extractOnclickStartTime = Date.now();
                        _c = subUrlResult;
                        return [4 /*yield*/, extractAndExecuteScripts(subUrlResult.finalUrl, [domain], this.browser)];
                    case 12:
                        _c.onclickUrls = _e.sent();
                        extractOnclickRuntime = Date.now() - extractOnclickStartTime;
                        logger.eventInfo('extract_onclick', { url: url, runtime: extractOnclickRuntime });
                        return [3 /*break*/, 14];
                    case 13:
                        error_8 = _e.sent();
                        logger.error('Error extracting and executing scripts:', error_8.message);
                        subUrlResult.errors.push({
                            type: 'script_extraction',
                            message: error_8.message,
                            stack: error_8.stack,
                            url: subUrlResult.finalUrl
                        });
                        return [3 /*break*/, 14];
                    case 14:
                        subUrlResult.success = true;
                        // 모든 발견된 URL 병합
                        subUrlResult.crawledUrls = Array.from(new Set(__spreadArray(__spreadArray([], subUrlResult.herfUrls, true), subUrlResult.onclickUrls, true)));
                        // robots.txt 규칙에 따라 차단된 URL 필터링
                        if (this.robotsCache && this.robotsCache[domain] && this.robotsCache[domain].parser) {
                            robotsParser = this.robotsCache[domain].parser;
                            filteredUrls = [];
                            blockedUrls = [];
                            // 각 URL이 robots.txt에 의해 허용되는지 확인
                            for (_i = 0, _d = subUrlResult.crawledUrls; _i < _d.length; _i++) {
                                url_1 = _d[_i];
                                try {
                                    isAllowed = robotsParser.isAllowed(url_1, 'puppeteer');
                                    if (isAllowed) {
                                        filteredUrls.push(url_1);
                                    }
                                    else {
                                        blockedUrls.push(url_1);
                                    }
                                }
                                catch (error) {
                                    logger.warn("robots.txt \uADDC\uCE59 \uC801\uC6A9 \uC911 \uC624\uB958 (".concat(url_1, "):"), error.message);
                                    // 오류 발생 시 URL 포함 (보수적 접근)
                                    filteredUrls.push(url_1);
                                }
                            }
                            // 필터링 결과 로깅
                            if (blockedUrls.length > 0) {
                                logger.debug("robots.txt\uC5D0 \uC758\uD574 \uCC28\uB2E8\uB41C URL ".concat(blockedUrls.length, "\uAC1C \uC81C\uC678\uB428"));
                                if (blockedUrls.length <= 5) {
                                    logger.debug("\uCC28\uB2E8\uB41C URL: ".concat(blockedUrls.join(', ')));
                                }
                                else {
                                    logger.debug("\uCC28\uB2E8\uB41C URL \uC0D8\uD50C: ".concat(blockedUrls.slice(0, 5).join(', '), " \uC678 ").concat(blockedUrls.length - 5, "\uAC1C"));
                                }
                            }
                            // 필터링된 URL로 업데이트
                            subUrlResult.crawledUrls = filteredUrls;
                            // 통계 정보에 robots.txt 필터링 정보 추가
                            subUrlResult.crawlStats.blocked_by_robots = blockedUrls.length;
                            subUrlResult.crawlStats.allowed_after_robots = filteredUrls.length;
                        }
                        // 통계 정보 업데이트
                        subUrlResult.crawlStats = __assign(__assign({}, subUrlResult.crawlStats), { total: subUrlResult.crawledUrls.length, href: subUrlResult.herfUrls.length, onclick: subUrlResult.onclickUrls.length });
                        runtime = Date.now() - startTime;
                        logger.eventInfo('visit_url', { runtime: runtime });
                        return [2 /*return*/, subUrlResult];
                    case 15:
                        error_9 = _e.sent();
                        // 오류 정보를 결과 객체에 추가
                        subUrlResult.success = false;
                        subUrlResult.error = error_9.toString();
                        subUrlResult.errors.push(error_9.toString());
                        runtime = Date.now() - startTime;
                        logger.eventError('visit_url', { runtime: runtime, error: error_9.message });
                        // 클래스 메서드로 호출
                        return [4 /*yield*/, this.saveErrorScreenshot(page, url)];
                    case 16:
                        // 클래스 메서드로 호출
                        _e.sent();
                        return [2 /*return*/, subUrlResult];
                    case 17:
                        _e.trys.push([17, 21, , 22]);
                        if (!this.browser) return [3 /*break*/, 20];
                        return [4 /*yield*/, this.browser.pages()];
                    case 18:
                        pages = _e.sent();
                        if (!(pages.length > 0)) return [3 /*break*/, 20];
                        logger.debug("\uBC29\uBB38 \uD6C4 ".concat(pages.length, "\uAC1C\uC758 \uBBF8\uB2EB\uD798 \uD398\uC774\uC9C0 \uBC1C\uACAC, \uC815\uB9AC \uC911..."));
                        return [4 /*yield*/, Promise.all(pages.map(function (page) {
                                try {
                                    return page.close();
                                }
                                catch (e) {
                                    logger.debug('페이지 닫기 실패:', e.message);
                                    return Promise.resolve();
                                }
                            }))];
                    case 19:
                        _e.sent();
                        logger.debug('모든 페이지가 정리되었습니다.');
                        _e.label = 20;
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        pageCloseError_1 = _e.sent();
                        logger.error('페이지 정리 중 오류:', pageCloseError_1);
                        return [3 /*break*/, 22];
                    case 22: return [7 /*endfinally*/];
                    case 23: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 발견된 URL들을 도메인별로 그룹화
     * @param {Array<string>} urls - URL 목록
     * @returns {Object} 도메인별 URL 객체 목록
     */
    BaseWorkerManager.prototype.groupUrlsByDomain = function (urls) {
        var domainGroups = {};
        urls.forEach(function (url) {
            try {
                if (isUrlAllowed(url)) {
                    var urlDomain = extractDomain(url);
                    if (!domainGroups[urlDomain]) {
                        domainGroups[urlDomain] = [];
                    }
                    domainGroups[urlDomain].push({
                        url: url,
                        visited: false
                    });
                }
            }
            catch (e) {
                logger.debug("URL \uADF8\uB8F9\uD654 \uC2E4\uD328: ".concat(url), e);
            }
        });
        return domainGroups;
    };
    /**
     * 방문 결과를 데이터베이스에 저장하고 발견된 URL 처리
     * @param {Object|SubUrl} subUrlResult - visitUrl 함수의 반환 결과
     * @returns {Promise<boolean>} 성공 여부
     */
    BaseWorkerManager.prototype.saveVisitResult = function (subUrlResult) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, domain, url_2, domainDoc, existingUrlIndex, savedUrlEntry, subUrl, urlsToAdd, _loop_1, _i, urlsToAdd_1, newUrl, runtime, error_10, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!!this.isConnected) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        domain = subUrlResult.domain;
                        url_2 = subUrlResult.url;
                        logger.debug("\uB3C4\uBA54\uC778 ".concat(domain, "\uC758 URL ").concat(url_2, " \uBC29\uBB38 \uACB0\uACFC \uC800\uC7A5 \uC911..."));
                        return [4 /*yield*/, VisitResult.findOne({ domain: domain })];
                    case 4:
                        domainDoc = _a.sent();
                        if (!domainDoc) {
                            domainDoc = new VisitResult({
                                domain: domain,
                                suburl_list: [],
                            });
                            logger.debug("\uB3C4\uBA54\uC778 ".concat(domain, "\uC5D0 \uB300\uD55C \uC0C8 \uBB38\uC11C \uC0DD\uC131"));
                        }
                        // suburl_list 배열이 없으면 초기화
                        if (!domainDoc.suburl_list) {
                            domainDoc.suburl_list = [];
                        }
                        existingUrlIndex = domainDoc.suburl_list.findIndex(function (item) { return item.url === url_2; });
                        if (existingUrlIndex >= 0) {
                            domainDoc.suburl_list[existingUrlIndex] = subUrlResult.toObject();
                            logger.debug("\uAE30\uC874 URL ".concat(url_2, " \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8 (SubUrl \uBAA8\uB378 \uC0AC\uC6A9)"));
                        }
                        else {
                            domainDoc.suburl_list.push(subUrlResult.toObject());
                            logger.debug("\uC0C8 URL ".concat(url_2, " \uC815\uBCF4 \uCD94\uAC00 (SubUrl \uBAA8\uB378 \uC0AC\uC6A9)"));
                        }
                        savedUrlEntry = domainDoc.suburl_list.find(function (item) { return item.url === url_2; });
                        if (savedUrlEntry) {
                            subUrl = new SubUrl(savedUrlEntry);
                            // subUrl.logSummary(logger);
                        }
                        logger.debug("\uB3C4\uBA54\uC778 ".concat(domain, " \uBB38\uC11C \uC800\uC7A5 \uC644\uB8CC"));
                        urlsToAdd = subUrlResult.crawledUrls || [];
                        _loop_1 = function (newUrl) {
                            try {
                                // suburl_list 배열에 이미 URL이 있는지 확인
                                var urlExists = domainDoc.suburl_list.some(function (item) { return item.url === newUrl; });
                                if (!urlExists) {
                                    // 새 URL을 suburl_list에 추가 - SubUrl 모델 사용
                                    var newSubUrl = new SubUrl({
                                        url: newUrl,
                                        domain: domain,
                                        visited: false,
                                        discoveredAt: new Date(),
                                        created_at: new Date()
                                    });
                                    logger.debug("\uCD94\uAC00 url ".concat(newUrl, " \uCD94\uAC00 \uC644\uB8CC"));
                                    // toObject()로 변환하여 추가
                                    domainDoc.suburl_list.push(newSubUrl.toObject());
                                }
                            }
                            catch (urlError) {
                                logger.error("URL \uCD94\uAC00 \uC911 \uC624\uB958 (".concat(newUrl, "):"), urlError);
                            }
                        };
                        // 각 URL 처리
                        for (_i = 0, urlsToAdd_1 = urlsToAdd; _i < urlsToAdd_1.length; _i++) {
                            newUrl = urlsToAdd_1[_i];
                            _loop_1(newUrl);
                        }
                        // 도메인 문서 저장
                        domainDoc.updated_at = new Date();
                        return [4 /*yield*/, domainDoc.save()];
                    case 5:
                        _a.sent();
                        runtime = Date.now() - startTime;
                        logger.eventInfo('save_visit_result', { runtime: runtime });
                        return [2 /*return*/, true];
                    case 6:
                        error_10 = _a.sent();
                        logger.error("\uBC29\uBB38 \uACB0\uACFC \uC800\uC7A5 \uC911 \uC624\uB958:", error_10);
                        runtime = Date.now() - startTime;
                        logger.eventInfo('save_visit_result', { runtime: runtime, error: error_10.message });
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 큐에 있는 모든 URL을 방문
     */
    BaseWorkerManager.prototype.processQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var visitCount, nextUrlInfo, visitResult, error_11, error_12;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isRunning) {
                            return [2 /*return*/];
                        }
                        this.isRunning = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 16, 17, 19]);
                        // MongoDB 연결
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        // MongoDB 연결
                        _a.sent();
                        visitCount = 0;
                        _a.label = 3;
                    case 3:
                        if (!(visitCount < this.maxUrls)) return [3 /*break*/, 15];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 11, 12, 14]);
                        return [4 /*yield*/, this.getNextUrl()];
                    case 5:
                        nextUrlInfo = _a.sent();
                        if (!nextUrlInfo) {
                            return [3 /*break*/, 3];
                        }
                        visitCount++;
                        return [4 /*yield*/, this.initBrowser()];
                    case 6:
                        _a.sent();
                        logger.debug("URL ".concat(visitCount, "/").concat(this.maxUrls, " \uCC98\uB9AC \uC911..."));
                        this.currentUrl = nextUrlInfo;
                        return [4 /*yield*/, this.visitUrl(nextUrlInfo)];
                    case 7:
                        visitResult = _a.sent();
                        // 결과를 데이터베이스에 저장
                        return [4 /*yield*/, this.saveVisitResult(visitResult)];
                    case 8:
                        // 결과를 데이터베이스에 저장
                        _a.sent();
                        if (!(visitCount < this.maxUrls)) return [3 /*break*/, 10];
                        logger.debug("\uB2E4\uC74C URL \uCC98\uB9AC \uC804 ".concat(this.delayBetweenRequests, "ms \uB300\uAE30..."));
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.delayBetweenRequests); })];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [3 /*break*/, 14];
                    case 11:
                        error_11 = _a.sent();
                        logger.eventError("URL \uCC98\uB9AC \uC911 \uC624\uB958:", { error: error_11.message });
                        return [3 /*break*/, 14];
                    case 12: return [4 /*yield*/, this.closeBrowser()];
                    case 13:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 14: return [3 /*break*/, 3];
                    case 15:
                        logger.debug("\uD050 \uCC98\uB9AC \uC644\uB8CC. \uCD1D ".concat(visitCount, "\uAC1C URL \uBC29\uBB38"));
                        return [3 /*break*/, 19];
                    case 16:
                        error_12 = _a.sent();
                        logger.error('큐 처리 중 오류:', error_12);
                        return [3 /*break*/, 19];
                    case 17: return [4 /*yield*/, this.closeBrowser()];
                    case 18:
                        _a.sent();
                        this.isRunning = false;
                        return [7 /*endfinally*/];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 브라우저 종료
     */
    BaseWorkerManager.prototype.closeBrowser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pages, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.browser) return [3 /*break*/, 7];
                        logger.debug('브라우저 정리 중...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, this.browser.pages()];
                    case 2:
                        pages = _a.sent();
                        return [4 /*yield*/, Promise.all(pages.map(function (page) {
                                try {
                                    return page.close();
                                }
                                catch (e) {
                                    return Promise.resolve();
                                }
                            }))];
                    case 3:
                        _a.sent();
                        // 브라우저 닫기
                        return [4 /*yield*/, this.browser.close()];
                    case 4:
                        // 브라우저 닫기
                        _a.sent();
                        this.browser = null;
                        logger.debug('브라우저가 정상적으로 종료되었습니다.');
                        return [3 /*break*/, 7];
                    case 5:
                        err_2 = _a.sent();
                        logger.error('브라우저 종료 중 오류:', err_2);
                        return [3 /*break*/, 7];
                    case 6:
                        // Google Chrome for Testing 프로세스 강제 종료
                        this.killChromeProcesses();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 관리자 실행
     */ BaseWorkerManager.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.debug("BaseWorkerManager \uC2E4\uD589");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 5]);
                        return [4 /*yield*/, this.processQueue()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.closeBrowser()];
                    case 4:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 5:
                        logger.debug('BaseWorkerManager 실행 완료');
                        return [2 /*return*/];
                }
            });
        });
    };
    return BaseWorkerManager;
}());
// 이 파일이 직접 실행될 때만 아래 코드 실행
if (require.main === module) {
    // 관리자 인스턴스 생성
    var manager = new BaseWorkerManager({
        delayBetweenRequests: CONFIG.CRAWLER.DELAY_BETWEEN_REQUESTS,
        headless: CONFIG.BROWSER.HEADLESS,
        maxUrls: CONFIG.CRAWLER.MAX_URLS,
        strategy: process.argv[2],
        specificDomain: process.argv[3],
        startUrl: process.argv[4],
    });
    // 관리자 실행
    manager.run().then(function () { return __awaiter(void 0, void 0, void 0, function () {
        var totalUrls, visitedUrls, pendingUrls;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.debug('===== 크롤링 요약 =====');
                    return [4 /*yield*/, VisitResult.countDocuments()];
                case 1:
                    totalUrls = _a.sent();
                    return [4 /*yield*/, VisitResult.countDocuments({ visited: true })];
                case 2:
                    visitedUrls = _a.sent();
                    return [4 /*yield*/, VisitResult.countDocuments({ visited: false })];
                case 3:
                    pendingUrls = _a.sent();
                    logger.debug("- \uCD1D URL: ".concat(totalUrls, "\uAC1C"));
                    logger.debug("- \uBC29\uBB38\uD55C URL: ".concat(visitedUrls, "\uAC1C"));
                    logger.debug("- \uB0A8\uC740 \uBC29\uBB38 \uC608\uC815 URL: ".concat(pendingUrls, "\uAC1C"));
                    logger.debug('모든 작업이 완료되었습니다.');
                    return [2 /*return*/];
            }
        });
    }); }).catch(function (error) {
        logger.error("\uC2E4\uD589 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ".concat(error));
    });
}
module.exports = { BaseWorkerManager: BaseWorkerManager };
