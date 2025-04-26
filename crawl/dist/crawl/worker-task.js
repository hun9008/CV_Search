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
var puppeteer = require('puppeteer');
var logger = require('@utils/logger').defaultLogger;
/**
 * Onclick 스크립트를 실행하는 작업자 클래스
 */
var OnClickWorker = /** @class */ (function () {
    /**
     * @param {Object} options 작업 옵션
     * @param {number} options.id 작업 ID
     * @param {string} options.currentUrl 기본 URL
     * @param {Object} options.onclickItem onclick 요소 정보
     * @param {number} options.index 작업 인덱스
     * @param {number} options.total 전체 작업 수
     * @param {boolean} options.headless 헤드리스 모드 여부
     * @param {number} options.timeout 시간 제한(ms)
      */
    function OnClickWorker(options) {
        this.id = options.id || Date.now();
        this.currentUrl = options.currentUrl;
        this.onclickItem = options.onclickItem;
        this.index = options.index;
        this.total = options.total;
        this.headless = options.headless !== false;
        this.timeout = options.timeout || 3000;
        this.urlDetectionTimeout = options.urlDetectionTimeout || 3000;
        // 브라우저 인스턴스가 제공되면 재사용
        this.sharedBrowser = options.browser || null;
        this.browser = null;
        this.page = null;
        this.useSharedBrowser = !!this.sharedBrowser;
    }
    /**
     * 페이지를 스크롤합니다.
     * @param {Object} options 스크롤 옵션
     * @param {number} options.distance 스크롤 거리 (픽셀)
     * @param {number} options.delay 스크롤 사이의 지연 시간 (ms)
     * @param {number} options.steps 스크롤 단계 수
     * @returns {Promise<void>}
     */
    OnClickWorker.prototype.scrollPage = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var _a, distance, _b, delay, _c, steps, _d, fullPage, i, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = options.distance, distance = _a === void 0 ? 500 : _a, _b = options.delay, delay = _b === void 0 ? 100 : _b, _c = options.steps, steps = _c === void 0 ? 5 : _c, _d = options.fullPage, fullPage = _d === void 0 ? false // 전체 페이지 스크롤 여부
                         : _d;
                        logger.debug("[Worker ".concat(this.id, "] \uD398\uC774\uC9C0 \uC2A4\uD06C\uB864 \uC2DC\uC791..."));
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 9, , 10]);
                        if (!fullPage) return [3 /*break*/, 3];
                        // 전체 페이지 스크롤 (페이지 끝까지)
                        return [4 /*yield*/, this.scrollFullPage(delay)];
                    case 2:
                        // 전체 페이지 스크롤 (페이지 끝까지)
                        _e.sent();
                        return [3 /*break*/, 8];
                    case 3:
                        i = 0;
                        _e.label = 4;
                    case 4:
                        if (!(i < steps)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.page.evaluate(function (scrollDistance) {
                                window.scrollBy(0, scrollDistance);
                            }, distance)];
                    case 5:
                        _e.sent();
                        logger.debug("[Worker ".concat(this.id, "] \uC2A4\uD06C\uB864 ").concat(i + 1, "/").concat(steps, " \uC644\uB8CC (").concat(distance, "px)"));
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay); })];
                    case 6:
                        _e.sent();
                        _e.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 4];
                    case 8:
                        logger.debug("[Worker ".concat(this.id, "] \uD398\uC774\uC9C0 \uC2A4\uD06C\uB864 \uC644\uB8CC"));
                        return [3 /*break*/, 10];
                    case 9:
                        error_1 = _e.sent();
                        logger.error("[Worker ".concat(this.id, "] \uD398\uC774\uC9C0 \uC2A4\uD06C\uB864 \uC911 \uC624\uB958:"), error_1);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 페이지 끝까지 자동 스크롤합니다.
     * @param {number} delay 스크롤 사이의 지연 시간 (ms)
     * @returns {Promise<void>}
     */
    OnClickWorker.prototype.scrollFullPage = function () {
        return __awaiter(this, arguments, void 0, function (delay) {
            var error_2;
            var _this = this;
            if (delay === void 0) { delay = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.debug("[Worker ".concat(this.id, "] \uC804\uCCB4 \uD398\uC774\uC9C0 \uC2A4\uD06C\uB864 \uC2DC\uC791..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.page.evaluate(function (scrollDelay) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                                var totalHeight = 0;
                                                var distance = 300;
                                                var timer = setInterval(function () {
                                                    var scrollHeight = document.body.scrollHeight;
                                                    window.scrollBy(0, distance);
                                                    totalHeight += distance;
                                                    // 페이지 끝에 도달하거나 더 이상 스크롤되지 않으면 중지
                                                    if (totalHeight >= scrollHeight) {
                                                        clearInterval(timer);
                                                        resolve();
                                                    }
                                                }, scrollDelay);
                                            })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, delay)];
                    case 2:
                        _a.sent();
                        logger.debug("[Worker ".concat(this.id, "] \uC804\uCCB4 \uD398\uC774\uC9C0 \uC2A4\uD06C\uB864 \uC644\uB8CC"));
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        logger.error("[Worker ".concat(this.id, "] \uC804\uCCB4 \uD398\uC774\uC9C0 \uC2A4\uD06C\uB864 \uC911 \uC624\uB958:"), error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * onclick 스크립트를 실행합니다.
     * @returns {Promise<Object>} 실행 결과
     */
    OnClickWorker.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var beforeUrl, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // 작업 시작 로그
                        logger.debug("[Worker ".concat(this.id, "] onclick \uC2A4\uD06C\uB9BD\uD2B8 ").concat(this.index, "/").concat(this.total, " \uC2E4\uD589 \uC2DC\uC791..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 11]);
                        // 브라우저 및 페이지 초기화
                        return [4 /*yield*/, this.initialize()];
                    case 2:
                        // 브라우저 및 페이지 초기화
                        _a.sent();
                        // 페이지 설정
                        return [4 /*yield*/, this.setupPage()];
                    case 3:
                        // 페이지 설정
                        _a.sent();
                        return [4 /*yield*/, this.scrollPage()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.page.url()];
                    case 5:
                        beforeUrl = _a.sent();
                        return [4 /*yield*/, this.executeOnclick()];
                    case 6:
                        result = _a.sent();
                        // URL 변경 감지
                        return [4 /*yield*/, this.checkUrlChanges(result, beforeUrl)];
                    case 7:
                        // URL 변경 감지
                        _a.sent();
                        // 결과 형식 설정
                        this.formatResult(result);
                        // 자원 정리
                        return [4 /*yield*/, this.cleanup()];
                    case 8:
                        // 자원 정리
                        _a.sent();
                        logger.debug("[Worker ".concat(this.id, "] onclick ").concat(this.index, " \uC2E4\uD589 \uC644\uB8CC: ").concat(result.success ? (result.urlChanged ? '페이지 이동 감지' : '정상 실행') : '실패'));
                        return [2 /*return*/, result];
                    case 9:
                        error_3 = _a.sent();
                        logger.error("[Worker ".concat(this.id, "] onclick \uC2E4\uD589 \uC911 \uC624\uB958:"), error_3);
                        // 브라우저가 열려있으면 닫기
                        return [4 /*yield*/, this.cleanup()];
                    case 10:
                        // 브라우저가 열려있으면 닫기
                        _a.sent();
                        return [2 /*return*/, {
                                sourceType: 'onclick',
                                index: this.index,
                                success: false,
                                error: error_3.toString(),
                                elementInfo: {
                                    tagName: this.onclickItem.tagName,
                                    id: this.onclickItem.id,
                                    className: this.onclickItem.className,
                                    text: this.onclickItem.text
                                },
                                message: '실행 중 예외 발생'
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 브라우저와 페이지를 초기화합니다.
     */
    // initialize 메서드도 수정
    OnClickWorker.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.useSharedBrowser) return [3 /*break*/, 1];
                        // 공유 브라우저 인스턴스 사용
                        this.browser = this.sharedBrowser;
                        return [3 /*break*/, 3];
                    case 1:
                        // 새 브라우저 인스턴스 생성
                        _a = this;
                        return [4 /*yield*/, puppeteer.launch({
                                headless: this.headless
                            })];
                    case 2:
                        // 새 브라우저 인스턴스 생성
                        _a.browser = _c.sent();
                        _c.label = 3;
                    case 3:
                        // 페이지 생성
                        _b = this;
                        return [4 /*yield*/, this.browser.newPage()];
                    case 4:
                        // 페이지 생성
                        _b.page = _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 페이지를 설정합니다.
     */
    OnClickWorker.prototype.setupPage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // 자바스크립트 대화상자 처리
                        this.page.on('dialog', function (dialog) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        logger.debug("[Worker ".concat(this.id, "] onclick ").concat(this.index, " \uB300\uD654\uC0C1\uC790 \uAC10\uC9C0: ").concat(dialog.type(), ", \uBA54\uC2DC\uC9C0: ").concat(dialog.message()));
                                        return [4 /*yield*/, dialog.dismiss()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        // 각 탭에 번호를 표시하기 위해 제목 변경
                        return [4 /*yield*/, this.page.evaluate(function (index, id) {
                                document.title = "onclick \uC2E4\uD589 ".concat(index, " (Worker ").concat(id, ")");
                            }, this.index, this.id)];
                    case 1:
                        // 각 탭에 번호를 표시하기 위해 제목 변경
                        _a.sent();
                        // 콘솔 로그를 가로채서 출력
                        this.page.on('console', function (msg) { return logger.debug("[Worker ".concat(_this.id, "] onclick ").concat(_this.index, " \uCF58\uC194:"), msg.text()); });
                        // 페이지 로드
                        return [4 /*yield*/, this.page.goto(this.currentUrl, {
                                waitUntil: 'networkidle2',
                                timeout: 6000 // 충분한 로드 시간 제공
                            })];
                    case 2:
                        // 페이지 로드
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OnClickWorker.prototype.executeOnclick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.page.evaluate(function (onclickCode, elementInfo, timeout) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, new Promise(function (resolve) {
                                    // 타임아웃 설정
                                    var timeoutId = setTimeout(function () {
                                        resolve({
                                            success: true,
                                            message: '실행 완료 (타임아웃)'
                                        });
                                    }, timeout);
                                    try {
                                        // 대화상자 함수 오버라이드
                                        window.alert = function (message) {
                                            console.log("Alert \uB300\uD654\uC0C1\uC790: ".concat(message));
                                            return undefined;
                                        };
                                        window.confirm = function (message) {
                                            console.log("Confirm \uB300\uD654\uC0C1\uC790: ".concat(message));
                                            return true; // 항상 확인 버튼 클릭으로 처리
                                        };
                                        window.prompt = function (message, defaultValue) {
                                            console.log("Prompt \uB300\uD654\uC0C1\uC790: ".concat(message));
                                            return defaultValue || ''; // 기본값이나 빈 문자열 반환
                                        };
                                        // 실행될 onclick 코드에 대한 정보 출력
                                        console.log("".concat(elementInfo.tagName, " \uC694\uC18C\uC758 onclick \uC2E4\uD589: ").concat(onclickCode));
                                        // URL 변경 감지를 위한 기존 함수 백업
                                        var originalAssign_1 = window.location.assign;
                                        var originalReplace_1 = window.location.replace;
                                        var originalOpen_1 = window.open;
                                        var detectedUrl_1 = null;
                                        var urlChanged_1 = false;
                                        // location 함수 오버라이드 (주석 해제)
                                        window.location.assign = function (url) {
                                            detectedUrl_1 = url;
                                            urlChanged_1 = true;
                                            clearTimeout(timeoutId);
                                            resolve({
                                                success: true,
                                                detectedUrl: url,
                                                urlChanged: true,
                                                message: 'location.assign 호출됨'
                                            });
                                            return originalAssign_1.call(window.location, url);
                                        };
                                        window.location.replace = function (url) {
                                            detectedUrl_1 = url;
                                            urlChanged_1 = true;
                                            clearTimeout(timeoutId);
                                            resolve({
                                                success: true,
                                                detectedUrl: url,
                                                urlChanged: true,
                                                message: 'location.replace 호출됨'
                                            });
                                            return originalReplace_1.call(window.location, url);
                                        };
                                        // location.href 속성 재정의
                                        try {
                                            Object.defineProperty(window.location, 'href', {
                                                set: function (url) {
                                                    detectedUrl_1 = url;
                                                    urlChanged_1 = true;
                                                    clearTimeout(timeoutId);
                                                    resolve({
                                                        success: true,
                                                        detectedUrl: url,
                                                        urlChanged: true,
                                                        message: 'location.href 설정됨'
                                                    });
                                                    return url;
                                                },
                                                get: function () {
                                                    return window.location.toString();
                                                }
                                            });
                                        }
                                        catch (e) {
                                            console.error('location.href 속성 재정의 실패:', e);
                                        }
                                        // window.open 오버라이드
                                        window.open = function (url) {
                                            detectedUrl_1 = url;
                                            urlChanged_1 = true;
                                            clearTimeout(timeoutId);
                                            resolve({
                                                success: true,
                                                detectedUrl: url,
                                                urlChanged: true,
                                                message: 'window.open 호출됨'
                                            });
                                            return originalOpen_1 ? originalOpen_1.call(window, url) : null;
                                        };
                                        console.warn("onclick \uCF54\uB4DC \uC2E4\uD589: ".concat(onclickCode));
                                        // onclick 코드 실행
                                        eval(onclickCode);
                                        // URL이 변경되지 않았다면 바로 결과 반환
                                        if (!urlChanged_1) {
                                            clearTimeout(timeoutId);
                                            resolve({
                                                success: true,
                                                detectedUrl: null,
                                                urlChanged: false,
                                                message: '실행 완료 (URL 변경 없음)'
                                            });
                                        }
                                    }
                                    catch (error) {
                                        clearTimeout(timeoutId);
                                        console.error('onclick 실행 오류:', error.toString());
                                        resolve({
                                            success: false,
                                            error: error.toString(),
                                            message: 'onclick 실행 중 오류 발생'
                                        });
                                    }
                                })];
                        });
                    }); }, this.onclickItem.onclick, {
                        tagName: this.onclickItem.tagName,
                        id: this.onclickItem.id,
                        className: this.onclickItem.className,
                        text: this.onclickItem.text
                    }, this.timeout)];
            });
        });
    };
    /**
     * URL 변경을 확인하고 결과에 반영합니다.
     * @param {Object} result 결과 객체
     * @param {string} beforeUrl 실행 전 URL
     */
    OnClickWorker.prototype.checkUrlChanges = function (result, beforeUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var afterUrl;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // URL 변경 감지를 위해 추가 대기
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.urlDetectionTimeout); })];
                    case 1:
                        // URL 변경 감지를 위해 추가 대기
                        _a.sent();
                        return [4 /*yield*/, this.page.url()];
                    case 2:
                        afterUrl = _a.sent();
                        logger.debug("[Worker ".concat(this.id, "] afterUrl: ").concat(afterUrl));
                        // URL 변경 확인
                        if (afterUrl !== beforeUrl) {
                            result.urlChanged = true;
                            result.detectedUrl = afterUrl;
                            result.message = 'URL 변경 감지됨 (페이지 이동 확인)';
                            // 이 단계에서는 URL을 수집하지 않고 결과만 반환
                            // URL 수집은 메인 스레드에서 처리
                        }
                        else if (!result.urlChanged) {
                            result.urlChanged = false;
                            result.detectedUrl = null;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 결과 객체에 추가 정보를 설정합니다.
     * @param {Object} result 결과 객체
     */
    OnClickWorker.prototype.formatResult = function (result) {
        result.originalScript = this.onclickItem.onclick;
        result.sourceType = 'onclick';
        result.index = this.index;
        result.elementInfo = {
            tagName: this.onclickItem.tagName,
            id: this.onclickItem.id,
            className: this.onclickItem.className,
            text: this.onclickItem.text
        };
    };
    /**
     * 브라우저와 페이지 리소스를 정리합니다.
     */
    // cleanup 메서드도 수정
    OnClickWorker.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.page.close()];
                    case 2:
                        _a.sent();
                        this.page = null;
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        logger.error("[Worker ".concat(this.id, "] \uD398\uC774\uC9C0 \uC885\uB8CC \uC911 \uC624\uB958:"), error_4);
                        return [3 /*break*/, 4];
                    case 4:
                        if (!(this.browser && !this.useSharedBrowser)) return [3 /*break*/, 9];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.browser.close()];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_5 = _a.sent();
                        logger.error("[Worker ".concat(this.id, "] \uBE0C\uB77C\uC6B0\uC800 \uC885\uB8CC \uC911 \uC624\uB958:"), error_5);
                        return [3 /*break*/, 8];
                    case 8:
                        this.browser = null;
                        _a.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return OnClickWorker;
}());
/**
 * 작업 풀을 관리하는 클래스
 */
var WorkerPool = /** @class */ (function () {
    /**
     * @param {number} maxConcurrency 최대 동시 실행 작업 수
     */
    function WorkerPool(maxConcurrency) {
        if (maxConcurrency === void 0) { maxConcurrency = 5; }
        this.maxConcurrency = maxConcurrency;
        this.active = 0;
        this.queue = [];
    }
    /**
     * 작업을 실행 큐에 추가합니다.
     * @param {Object} options 작업 옵션
     * @returns {Promise<Object>} 작업 결과
     */
    WorkerPool.prototype.enqueue = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var task = {
                            options: options,
                            execute: function () { return __awaiter(_this, void 0, void 0, function () {
                                var worker, result, error_6;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            this.active++;
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, 4, 5]);
                                            worker = new OnClickWorker(options);
                                            return [4 /*yield*/, worker.execute()];
                                        case 2:
                                            result = _a.sent();
                                            resolve(result);
                                            return [3 /*break*/, 5];
                                        case 3:
                                            error_6 = _a.sent();
                                            logger.error("[WorkerPool] \uC791\uC5C5 \uC2E4\uD589 \uC624\uB958:", error_6);
                                            resolve({
                                                success: false,
                                                error: error_6.toString(),
                                                sourceType: 'onclick',
                                                index: options.index,
                                                message: '작업 풀에서 실행 중 오류 발생'
                                            });
                                            return [3 /*break*/, 5];
                                        case 4:
                                            this.active--;
                                            this.processQueue();
                                            return [7 /*endfinally*/];
                                        case 5: return [2 /*return*/];
                                    }
                                });
                            }); }
                        };
                        _this.queue.push(task);
                        _this.processQueue();
                    })];
            });
        });
    };
    /**
     * 큐에 있는 작업을 처리합니다.
     */
    WorkerPool.prototype.processQueue = function () {
        while (this.active < this.maxConcurrency && this.queue.length > 0) {
            var task = this.queue.shift();
            task.execute();
        }
    };
    /**
     * 여러 작업을 병렬로 처리합니다.
     * @param {Array<Object>} tasks 작업 옵션 배열
     * @returns {Promise<Array<Object>>} 작업 결과 배열
     */
    WorkerPool.prototype.processTasks = function (tasks) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                promises = tasks.map(function (task) { return _this.enqueue(task); });
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    };
    return WorkerPool;
}());
module.exports = { OnClickWorker: OnClickWorker, WorkerPool: WorkerPool };
