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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var puppeteer = require('puppeteer');
/**
 * 기업 채용 사이트 URL을 생성하는 제너레이터 함수
 * @returns {AsyncGenerator<string>} URL 생성기
 */
function getUrlSeed() {
    return __asyncGenerator(this, arguments, function getUrlSeed_1() {
        var browser, page, i, error_1, buttonSelectors, j, url, pagePromise, clickErr_1, newPage, navError_1, currentUrl, error_2, error_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, __await(puppeteer.launch({
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-web-security'
                        ]
                    }))];
                case 1:
                    browser = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 42, 43, 45]);
                    return [4 /*yield*/, __await(browser.newPage())];
                case 3:
                    page = _a.sent();
                    // 브라우저 감지 우회 설정
                    return [4 /*yield*/, __await(page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'))];
                case 4:
                    // 브라우저 감지 우회 설정
                    _a.sent();
                    i = 1;
                    _a.label = 5;
                case 5:
                    if (!(i < 30)) return [3 /*break*/, 41];
                    console.log("\uD398\uC774\uC9C0 ".concat(i, "/29 \uCC98\uB9AC \uC911..."));
                    // JobKorea 페이지 열기
                    return [4 /*yield*/, __await(page.goto("https://www.jobkorea.co.kr/recruit/joblist?menucode=cotype1&cotype=1,2,3#anchorGICnt_".concat(i), { waitUntil: 'networkidle2', timeout: 30000 }))];
                case 6:
                    // JobKorea 페이지 열기
                    _a.sent();
                    // 페이지가 완전히 로드될 때까지 잠시 대기 (waitForTimeout 대신 setTimeout 사용)
                    return [4 /*yield*/, __await(new Promise(function (resolve) { return setTimeout(resolve, 2000); }))];
                case 7:
                    // 페이지가 완전히 로드될 때까지 잠시 대기 (waitForTimeout 대신 setTimeout 사용)
                    _a.sent();
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, __await(page.waitForSelector('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc', { timeout: 10000 }))];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    console.log('버튼을 찾는 동안 시간 초과');
                    return [3 /*break*/, 40]; // 버튼을 찾지 못하면 다음 페이지로
                case 11: return [4 /*yield*/, __await(page.$$('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc'))];
                case 12:
                    buttonSelectors = _a.sent();
                    console.log("".concat(buttonSelectors.length, "\uAC1C\uC758 \uC9C0\uC6D0 \uBC84\uD2BC \uBC1C\uACAC"));
                    j = 0;
                    _a.label = 13;
                case 13:
                    if (!(j < buttonSelectors.length)) return [3 /*break*/, 38];
                    _a.label = 14;
                case 14:
                    _a.trys.push([14, 36, , 37]);
                    return [4 /*yield*/, __await(page.evaluate(function (index) {
                            var buttons = document.querySelectorAll('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc');
                            var button = buttons[index];
                            // 버튼의 부모 요소에서 URL 정보 찾기 시도
                            var parentLink = button.closest('a');
                            if (parentLink && parentLink.href) {
                                return parentLink.href;
                            }
                            // 버튼의 data-url 속성 확인
                            if (button.dataset.url) {
                                return button.dataset.url;
                            }
                            // 버튼 주변에서 URL을 찾기 위해 부모 노드 탐색
                            var card = button.closest('.list-post');
                            if (card) {
                                var anchors = card.querySelectorAll('a');
                                for (var _i = 0, anchors_1 = anchors; _i < anchors_1.length; _i++) {
                                    var a = anchors_1[_i];
                                    if (a.href && a.href.includes('/Recruit/')) {
                                        return a.href;
                                    }
                                }
                            }
                            return null;
                        }, j))];
                case 15:
                    url = _a.sent();
                    if (!url) return [3 /*break*/, 18];
                    console.log("\uBC1C\uACAC\uB41C URL (DOM\uC5D0\uC11C \uCD94\uCD9C): ".concat(url));
                    return [4 /*yield*/, __await(url)];
                case 16: return [4 /*yield*/, _a.sent()];
                case 17:
                    _a.sent();
                    return [3 /*break*/, 37];
                case 18:
                    // DOM에서 URL을 추출하지 못했다면 새 페이지 만들기 시도
                    console.log("".concat(j + 1, "\uBC88\uC9F8 \uBC84\uD2BC \uD074\uB9AD \uC2DC\uB3C4..."));
                    pagePromise = new Promise(function (resolve) {
                        var resolved = false;
                        // 한 번만 실행되는 이벤트 핸들러
                        var targetHandler = function (target) { return __awaiter(_this, void 0, void 0, function () {
                            var newPage_1, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (resolved)
                                            return [2 /*return*/];
                                        resolved = true;
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, target.page()];
                                    case 2:
                                        newPage_1 = _a.sent();
                                        resolve(newPage_1);
                                        return [3 /*break*/, 4];
                                    case 3:
                                        err_1 = _a.sent();
                                        console.log('새 페이지 가져오기 실패:', err_1.message);
                                        resolve(null);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); };
                        // 이벤트 핸들러 등록
                        browser.once('targetcreated', targetHandler);
                        // 타임아웃 설정
                        setTimeout(function () {
                            if (resolved)
                                return;
                            resolved = true;
                            console.log('새 페이지 생성 타임아웃');
                            resolve(null);
                        }, 5000);
                    });
                    _a.label = 19;
                case 19:
                    _a.trys.push([19, 22, , 25]);
                    return [4 /*yield*/, __await(buttonSelectors[j].click())];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, __await(new Promise(function (resolve) { return setTimeout(resolve, 1000); }))];
                case 21:
                    _a.sent(); // 클릭 후 대기
                    return [3 /*break*/, 25];
                case 22:
                    clickErr_1 = _a.sent();
                    console.log('기본 클릭 방법 실패, evaluate로 시도:', clickErr_1.message);
                    return [4 /*yield*/, __await(page.evaluate(function (index) {
                            var buttons = document.querySelectorAll('button.tplBtn.tplBtn_1.tplBtnBlue.devApplyEtc');
                            buttons[index].click();
                        }, j))];
                case 23:
                    _a.sent();
                    return [4 /*yield*/, __await(new Promise(function (resolve) { return setTimeout(resolve, 1000); }))];
                case 24:
                    _a.sent(); // 클릭 후 대기
                    return [3 /*break*/, 25];
                case 25: return [4 /*yield*/, __await(pagePromise)];
                case 26:
                    newPage = _a.sent();
                    // newPage가 null인 경우 처리
                    if (!newPage) {
                        console.log('새 페이지가 생성되지 않았습니다. 다음 버튼으로 진행합니다.');
                        return [3 /*break*/, 37];
                    }
                    _a.label = 27;
                case 27:
                    _a.trys.push([27, 29, , 30]);
                    return [4 /*yield*/, __await(newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }))];
                case 28:
                    _a.sent();
                    return [3 /*break*/, 30];
                case 29:
                    navError_1 = _a.sent();
                    console.log('새 페이지 로딩 대기 시간 초과');
                    return [3 /*break*/, 30];
                case 30:
                    currentUrl = newPage.url();
                    if (!(currentUrl && currentUrl !== 'about:blank')) return [3 /*break*/, 33];
                    console.log("\uBC1C\uACAC\uB41C URL (\uC0C8 \uD398\uC774\uC9C0): ".concat(currentUrl));
                    return [4 /*yield*/, __await(currentUrl)];
                case 31: return [4 /*yield*/, _a.sent()];
                case 32:
                    _a.sent();
                    return [3 /*break*/, 34];
                case 33:
                    console.log('유효하지 않은 URL 건너뜀');
                    _a.label = 34;
                case 34: 
                // 새 탭 닫기
                return [4 /*yield*/, __await(newPage.close().catch(function (err) { return console.log('탭 닫기 실패:', err.message); }))];
                case 35:
                    // 새 탭 닫기
                    _a.sent();
                    return [3 /*break*/, 37];
                case 36:
                    error_2 = _a.sent();
                    console.error("\uBC84\uD2BC ".concat(j + 1, "\uBC88 \uD074\uB9AD \uC911 \uC624\uB958:"), error_2);
                    return [3 /*break*/, 37]; // 오류 발생 시 다음 버튼으로 진행
                case 37:
                    j++;
                    return [3 /*break*/, 13];
                case 38: 
                // 다음 페이지로 넘어가기 전에 잠시 대기
                return [4 /*yield*/, __await(new Promise(function (resolve) { return setTimeout(resolve, 2000); }))];
                case 39:
                    // 다음 페이지로 넘어가기 전에 잠시 대기
                    _a.sent();
                    _a.label = 40;
                case 40:
                    i++;
                    return [3 /*break*/, 5];
                case 41: return [3 /*break*/, 45];
                case 42:
                    error_3 = _a.sent();
                    console.error('URL 수집 중 오류 발생:', error_3);
                    return [3 /*break*/, 45];
                case 43: 
                // 브라우저 종료
                return [4 /*yield*/, __await(browser.close())];
                case 44:
                    // 브라우저 종료
                    _a.sent();
                    return [7 /*endfinally*/];
                case 45: return [2 /*return*/];
            }
        });
    });
}
module.exports = getUrlSeed;
