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
var logger = require('@utils/logger').defaultLogger;
var RobotsParser = require('robots-parser');
// node-fetch v2를 사용하는 경우: const fetch = require('node-fetch');
// Node.js 18+ 에서는 내장 fetch 사용 가능, 또는 node-fetch v3 (ESM) 사용 시 import 방식 사용
// 예시에서는 Node.js 18+ 내장 fetch 또는 전역 fetch가 있다고 가정합니다.
// 만약 node-fetch v2 (CommonJS)를 사용한다면 위에 주석 처리된 라인을 활성화하세요.
/**
 * 주어진 URL이 허용된 도메인에 속하는지 확인합니다.
 * @param {string} url - 확인할 URL
 * @param {string[]} allowedDomains - 허용된 도메인 목록
 * @returns {boolean} - URL이 허용되면 true, 그렇지 않으면 false
 */
function isUrlAllowed(url, allowedDomains) {
    try {
        // URL이 유효한지 검증
        var parsedUrl = new URL(url);
        // 지원되는 프로토콜인지 확인 (http 또는 https만 허용)
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            logger.debug("Unsupported protocol: ".concat(parsedUrl.protocol, " in URL: ").concat(url));
            return false;
        }
        // 도메인 추출
        var domain_1 = parsedUrl.hostname; // host 대신 hostname 사용 (포트 번호 제외)
        // 허용된 도메인인지 확인
        return allowedDomains.some(function (allowedDomain) {
            return domain_1 === allowedDomain ||
                domain_1.endsWith(".".concat(allowedDomain));
        });
    }
    catch (error) {
        // URL 파싱에 실패하면 (잘못된 URL 형식) false 반환
        logger.debug("Invalid URL format: ".concat(url), error);
        return false;
    }
}
/**
 * URL에서 도메인 추출
 * @param {string} url URL
 * @returns {string | null} 도메인 또는 null
 */
function extractDomain(url) {
    try {
        var urlObj = new URL(url);
        return urlObj.hostname; // host 대신 hostname 사용 (포트 번호 제외)
    }
    catch (error) {
        logger.debug("URL\uC5D0\uC11C \uB3C4\uBA54\uC778 \uCD94\uCD9C \uC911 \uC624\uB958: ".concat(url), error);
        return null;
    }
}
/**
 * robots.txt 파일을 가져와서 파싱하고 규칙 객체 반환
 * @param {string} domain 도메인 이름
 * @returns {Promise<Object>} 파싱 결과 객체 { domain, url, parser, success, error? }
 */
function parseRobotsTxt(domain) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, protocols, robotsUrl, response, robotsContent, success, fetchError, _i, protocols_1, protocol, error_1, parser, runtime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    protocols = ['https', 'http'];
                    robotsUrl = '';
                    response = null;
                    robotsContent = '';
                    success = false;
                    fetchError = null;
                    _i = 0, protocols_1 = protocols;
                    _a.label = 1;
                case 1:
                    if (!(_i < protocols_1.length)) return [3 /*break*/, 9];
                    protocol = protocols_1[_i];
                    robotsUrl = "".concat(protocol, "://").concat(domain, "/robots.txt");
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    logger.debug("Trying to fetch robots.txt from: ".concat(robotsUrl));
                    return [4 /*yield*/, fetch(robotsUrl, {
                            method: 'GET',
                            headers: {
                                'User-Agent': 'YourBotName/1.0 (+http://yourwebsite.com/botinfo)' // 적절한 User-Agent 설정 권장
                            },
                            // 필요에 따라 timeout 설정
                            // signal: AbortSignal.timeout(10000) // 예: 10초 타임아웃 (Node.js 16+)
                        })];
                case 3:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.text()];
                case 4:
                    robotsContent = _a.sent();
                    success = true;
                    logger.debug("".concat(domain, "\uC758 robots.txt \uAC00\uC838\uC624\uAE30 \uC131\uACF5 (").concat(robotsUrl, ")"));
                    return [3 /*break*/, 9]; // 성공 시 루프 종료
                case 5:
                    if (response.status === 404) {
                        logger.debug("".concat(domain, "\uC758 robots.txt \uCC3E\uC744 \uC218 \uC5C6\uC74C (404) (").concat(robotsUrl, "). \uBAA8\uB4E0 \uACBD\uB85C \uD5C8\uC6A9\uC73C\uB85C \uAC04\uC8FC."));
                        // robots.txt가 없으면 모든 경로 허용이 일반적 규칙
                        robotsContent = ''; // 빈 내용 전달
                        success = true; // 파일을 못 찾은 것도 '파싱 관점'에서는 처리 가능한 상태
                        fetchError = new Error("File not found (404)"); // 에러 정보 기록
                        return [3 /*break*/, 9]; // 404 확인 후 종료 (http 재시도 불필요)
                    }
                    else {
                        logger.debug("".concat(domain, "\uC758 robots.txt \uAC00\uC838\uC624\uAE30 \uC2E4\uD328 (").concat(robotsUrl, "): Status ").concat(response.status));
                        fetchError = new Error("Failed to fetch robots.txt: Status ".concat(response.status));
                        // 다른 프로토콜로 재시도하기 위해 루프 계속
                    }
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    logger.debug("".concat(domain, "\uC758 robots.txt \uAC00\uC838\uC624\uAE30 \uC911 \uB124\uD2B8\uC6CC\uD06C \uC624\uB958 (").concat(robotsUrl, "):"), error_1.message);
                    fetchError = error_1;
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9:
                    parser = null;
                    try {
                        // fetch 성공 여부와 관계없이 parser 인스턴스 생성 시도
                        // fetch 실패 시 robotsContent는 '' (빈 문자열) 이므로, 기본적으로 모든 것을 허용하는 파서 생성
                        parser = RobotsParser(robotsUrl || "https://".concat(domain, "/robots.txt"), robotsContent); // URL과 내용을 전달
                        runtime = Date.now() - startTime;
                        if (success) {
                            logger.debug("".concat(domain, "\uC758 robots.txt \uD30C\uC2F1 \uC644\uB8CC"));
                            logger.eventInfo('parse_robot_txt', { domain: domain, runtime: runtime });
                            // fetch가 성공했으므로 파싱 결과 반환
                            return [2 /*return*/, {
                                    domain: domain,
                                    url: robotsUrl,
                                    parser: parser,
                                    success: true,
                                    runtime: runtime,
                                }];
                        }
                        else {
                            // fetch 실패 시 (네트워크 오류 또는 404 외 다른 상태 코드)
                            logger.eventError('parse_robot_txt', { domain: domain, robotsUrl: robotsUrl || "https://".concat(domain, "/robots.txt"), runtime: runtime, error: (fetchError === null || fetchError === void 0 ? void 0 : fetchError.message) || 'Unknown fetch error' });
                            return [2 /*return*/, {
                                    domain: domain,
                                    url: robotsUrl || "https://".concat(domain, "/robots.txt"), // 시도했던 마지막 URL 또는 기본 URL
                                    parser: parser, // 빈 내용으로 생성된 기본 파서 (모든 것 허용)
                                    success: false, // 가져오기/파싱 과정에서 문제가 있었음을 명시
                                    error: (fetchError === null || fetchError === void 0 ? void 0 : fetchError.message) || 'Unknown fetch error',
                                    runtime: runtime,
                                }];
                        }
                    }
                    catch (parseError) {
                        // RobotsParser 생성자 자체에서 오류가 발생한 경우 (매우 드묾)
                        logger.debug("robots.txt \uD30C\uC2F1 \uC911 \uC608\uC678 \uBC1C\uC0DD (".concat(domain, "):"), parseError);
                        logger.eventError('parse_robot_txt', { domain: domain, error: parseError.message, runtime: runtime });
                        return [2 /*return*/, {
                                domain: domain,
                                success: false,
                                error: "Parser instantiation error: ".concat(parseError.message),
                                runtime: runtime,
                                parser: null, // 파서 생성 실패
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * URL이 허용되는지 확인 (robots.txt 규칙 포함)
 * @param {string} url - 확인할 URL
 * @param {Array<string>} allowedDomains - 허용된 도메인 목록
 * @param {Object} robotsCache - 도메인별 robots.txt 캐시
 * @returns {Promise<boolean>} 허용 여부
 */
function isUrlAllowedWithRobots(url_1) {
    return __awaiter(this, arguments, void 0, function (url, allowedDomains, robotsCache) {
        var domain, _a, _b, robotsData, userAgent, isAllowed, error_2;
        if (allowedDomains === void 0) { allowedDomains = []; }
        if (robotsCache === void 0) { robotsCache = {}; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // 1. 기본 도메인 및 프로토콜 검사
                    if (!isUrlAllowed(url, allowedDomains)) {
                        logger.debug("URL ".concat(url, " is not in allowed domains or has unsupported protocol."));
                        return [2 /*return*/, false];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    domain = extractDomain(url);
                    if (!domain) {
                        logger.debug("Could not extract domain from URL: ".concat(url));
                        return [2 /*return*/, false]; // 도메인 추출 실패 시 진행 불가
                    }
                    if (!!(domain in robotsCache)) return [3 /*break*/, 3];
                    logger.debug("Robots.txt for domain ".concat(domain, " not in cache. Parsing..."));
                    _a = robotsCache;
                    _b = domain;
                    return [4 /*yield*/, parseRobotsTxt(domain)];
                case 2:
                    _a[_b] = _c.sent();
                    return [3 /*break*/, 3];
                case 3:
                    robotsData = robotsCache[domain];
                    // 3. robots.txt 파싱 결과 확인 및 규칙 적용
                    // 파서 객체가 없거나 (파싱 중 심각한 오류 발생) 파싱에 실패(success:false)했지만 안전하게 진행하고 싶다면 허용 (선택적)
                    // 또는 파싱 실패 시 무조건 차단할 수도 있음. 현재 코드는 파싱 실패 시 기본 파서(모든 것 허용)를 사용함.
                    if (!robotsData || !robotsData.parser) {
                        logger.debug("No valid robots data or parser available for domain ".concat(domain, ". Allowing URL ").concat(url, " by default."));
                        return [2 /*return*/, true]; // robots.txt 정보가 없거나 파서 생성 실패 시 기본적으로 허용
                    }
                    userAgent = 'puppeteer';
                    isAllowed = robotsData.parser.isAllowed(url, userAgent);
                    if (!isAllowed) {
                        logger.debug("URL ".concat(url, " is disallowed by robots.txt for domain ").concat(domain, " (User-Agent: ").concat(userAgent, ")"));
                    }
                    else {
                        // logger.debug(`URL ${url} is allowed by robots.txt for domain ${domain} (User-Agent: ${userAgent})`);
                    }
                    return [2 /*return*/, isAllowed];
                case 4:
                    error_2 = _c.sent();
                    // URL 파싱 오류 등 예상치 못한 오류 처리
                    logger.error("Error checking if URL ".concat(url, " is allowed with robots:"), error_2);
                    return [2 /*return*/, true]; // 오류 발생 시 안전하게 기본적으로 허용 (또는 false로 변경 가능)
                case 5: return [2 /*return*/];
            }
        });
    });
}
module.exports = { isUrlAllowed: isUrlAllowed, extractDomain: extractDomain, parseRobotsTxt: parseRobotsTxt, isUrlAllowedWithRobots: isUrlAllowedWithRobots };
