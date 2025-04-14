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
require('dotenv');
var _a = require('@models/visitResult'), VisitResult = _a.VisitResult, extractDomain = _a.extractDomain;
var RecruitInfo = require('@models/recruitInfo');
var mongoService = require('@database/mongodb-service').mongoService;
var GeminiService = require('@parse/geminiService').GeminiService; // Gemini API 서비스
var logger = require('@utils/logger').defaultLogger;
/**
 * 채용공고 파싱 및 필터링을 관리하는 클래스
 */
var ParseManager = /** @class */ (function () {
    /**
     * ParseManager 생성자
     * @param {Object} options - 옵션 객체
     * @param {number} options.batchSize - 한 번에 처리할 URL 수 (기본값: 10)
     * @param {number} options.maxRetries - 실패 시 재시도 횟수 (기본값: 3)
     * @param {number} options.delayBetweenRequests - 요청 간 지연 시간(ms) (기본값: 1000)
     */
    function ParseManager(options) {
        if (options === void 0) { options = {}; }
        this.batchSize = options.batchSize || 10;
        this.maxRetries = options.maxRetries || 3;
        this.concurrency = options.concurrency || 2;
        this.delayBetweenRequests = options.delayBetweenRequests || 1000;
        this.geminiService = new GeminiService();
        this.isRunning = false;
        this.stats = {
            processed: 0,
            isRecruit: 0,
            notRecruit: 0,
            failed: 0,
            saved: 0
        };
    }
    /**
     * MongoDB에 연결
     */
    ParseManager.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, mongoService.connect()];
                    case 1:
                        _a.sent();
                        logger.debug('MongoDB에 연결되었습니다.');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger.error('MongoDB 연결 오류:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 미분류된 URL을 추출
     * @param {number} limit - 추출할 URL 수
     * @returns {Promise<Array>} 미분류 URL 객체 배열
     */
    ParseManager.prototype.fetchUnclassifiedUrls = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var pipeline, urls, error_2;
            if (limit === void 0) { limit = this.batchSize; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        pipeline = [
                            { $match: { 'suburl_list.visited': true, 'suburl_list.success': true } },
                            { $unwind: '$suburl_list' },
                            {
                                $match: {
                                    'suburl_list.visited': true,
                                    'suburl_list.success': true,
                                    $or: [
                                        { 'suburl_list.isRecruit': null },
                                        { 'suburl_list.isRecruit': { $exists: false } }
                                    ]
                                }
                            },
                            { $limit: limit },
                            {
                                $project: {
                                    _id: 0,
                                    domain: 1,
                                    url: '$suburl_list.url',
                                    text: '$suburl_list.text',
                                    title: '$suburl_list.title',
                                    visitedAt: '$suburl_list.visitedAt'
                                }
                            }
                        ];
                        return [4 /*yield*/, VisitResult.aggregate(pipeline)];
                    case 2:
                        urls = _a.sent();
                        logger.debug("".concat(urls.length, "\uAC1C\uC758 \uBBF8\uBD84\uB958 URL \uCD94\uCD9C \uC644\uB8CC"));
                        return [2 /*return*/, urls];
                    case 3:
                        error_2 = _a.sent();
                        logger.eventError('fetch_unclassified_urls', { error: error_2.message });
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * URL이 채용공고인지 Gemini API로 판별
     * @param {Object} urlData - URL 데이터 객체
     * @returns {Promise<Object>} 판별 결과와 파싱된 데이터
     */
    ParseManager.prototype.requestUrlParse = function (urlData) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, url, title, text, content, response, runtime, error_3, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        url = urlData.url, title = urlData.title, text = urlData.text;
                        content = "\n    Title: ".concat(title || '', "\n\n    Content:\n    ").concat((text === null || text === void 0 ? void 0 : text.substring(0, 5000)) || '', " // \uD14D\uC2A4\uD2B8\uAC00 \uB108\uBB34 \uAE38\uBA74 \uC798\uB77C\uB0C4\n    ");
                        logger.debug("URL \uB0B4\uC6A9 \uBD84\uC11D \uC694\uCCAD: ".concat(url));
                        return [4 /*yield*/, this.geminiService.parseRecruitment(content)];
                    case 2:
                        response = _a.sent();
                        runtime = Date.now() - startTime;
                        logger.eventInfo('parse_url_content', {
                            url: url,
                            isRecruit: (response === null || response === void 0 ? void 0 : response.success) || false,
                            contentLength: content.length,
                            runtime: runtime
                        });
                        return [2 /*return*/, response];
                    case 3:
                        error_3 = _a.sent();
                        runtime = Date.now() - startTime;
                        logger.warn("\uD14D\uC2A4\uD2B8 \uC5C5\uBB34 \uB0B4\uC6A9\uC73C\uB85C \uBCC0\uD658 \uC911 \uC624\uB958: ".concat(error_3));
                        logger.eventError('parse_url_content_error', {
                            url: urlData === null || urlData === void 0 ? void 0 : urlData.url,
                            error: error_3.message,
                            runtime: runtime,
                            stack: error_3.stack
                        });
                        throw error_3; // 오류를 상위로 전파하여 재시도 메커니즘이 작동하도록 함
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
   * Gemini API 응답을 RecruitInfo 모델 형식으로 변환
   * @param {Object} geminiResponse - Gemini API의 응답 데이터
   * @param {Object} urlData - 원본 URL 데이터
   * @returns {Object} RecruitInfo -모델에 맞게 변환된 객체
   */
    ParseManager.prototype.convertToRecruitInfoSchema = function (geminiResponse, urlData) {
        try {
            logger.debug('채용공고 데이터 변환 시작', { url: urlData.url });
            if (!geminiResponse.success) {
                logger.warn('채용공고가 아닌 데이터에 대한 변환 시도', { url: urlData.url });
                return null;
            }
            // 기본 날짜 설정 (현재 날짜 및 30일 후)
            var currentDate = new Date();
            var defaultEndDate = new Date();
            defaultEndDate.setDate(currentDate.getDate() + 30);
            // 날짜 파싱 함수
            var parseDate = function (dateStr) {
                if (!dateStr)
                    return null;
                try {
                    // YYYY-MM-DD 형식 파싱
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        return new Date(dateStr);
                    }
                    // 날짜 문자열에서 날짜 추출 시도
                    var date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                    // 한국어 날짜 형식 처리 (예: 2023년 5월 10일)
                    var koreanDateMatch = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
                    if (koreanDateMatch) {
                        return new Date(parseInt(koreanDateMatch[1]), parseInt(koreanDateMatch[2]) - 1, parseInt(koreanDateMatch[3]));
                    }
                    return null;
                }
                catch (error) {
                    logger.warn("\uB0A0\uC9DC \uD30C\uC2F1 \uC624\uB958: ".concat(dateStr), error);
                    return null;
                }
            };
            // 게시 기간에서 시작일과 종료일 추출
            var startDate = null;
            var endDate = null;
            if (geminiResponse.posted_period) {
                // 게시 기간이 범위 형식인 경우 (예: 2023-01-01 ~ 2023-02-01)
                var periodMatch = geminiResponse.posted_period.match(/(.+?)\s*[~\-]\s*(.+)/);
                if (periodMatch) {
                    startDate = parseDate(periodMatch[1].trim());
                    endDate = parseDate(periodMatch[2].trim());
                }
                else {
                    // 단일 날짜만 있는 경우, 종료일로 처리
                    endDate = parseDate(geminiResponse.posted_period.trim());
                }
            }
            // Gemini 응답에서 직접 날짜 필드가 있는 경우 이를 우선 사용
            if (geminiResponse.start_date) {
                startDate = parseDate(geminiResponse.start_date);
            }
            if (geminiResponse.end_date) {
                endDate = parseDate(geminiResponse.end_date);
            }
            // 날짜가 유효하지 않은 경우 기본값 사용
            if (!startDate)
                startDate = currentDate;
            if (!endDate)
                endDate = defaultEndDate;
            // 원본 데이터 추출
            var domain = urlData.domain, url = urlData.url, title = urlData.title, text = urlData.text, meta = urlData.meta, visitedAt = urlData.visitedAt;
            // RecruitInfo 모델에 맞는 객체 생성
            var recruitInfo = {
                domain: domain,
                url: url,
                title: title || '',
                company_name: geminiResponse.company_name || '알 수 없음',
                department: geminiResponse.department || '',
                experience: geminiResponse.experience || '',
                description: geminiResponse.description || '',
                job_type: geminiResponse.job_type || '',
                start_date: startDate,
                end_date: endDate,
                expires_at: endDate, // expires_at은 end_date와 동일하게 설정
                requirements: geminiResponse.requirements || '',
                preferred_qualifications: geminiResponse.preferred_qualifications || '',
                ideal_candidate: geminiResponse.ideal_candidate || '',
                raw_text: text || '',
                meta: meta || {},
                status: 'active', // 기본 상태
                original_parsed_data: geminiResponse, // 원본 파싱 결과 저장
                visited_at: visitedAt || currentDate,
                created_at: currentDate,
                updated_at: currentDate
            };
            logger.debug('채용공고 데이터 변환 완료', {
                url: url,
                company: recruitInfo.company_name,
                start_date: recruitInfo.start_date,
                end_date: recruitInfo.end_date
            });
            return recruitInfo;
        }
        catch (error) {
            logger.error("RecruitInfo \uBCC0\uD658 \uC624\uB958 (".concat(urlData.url, "):"), error);
            // 최소한의 기본 정보를 포함한 객체 반환
            return {
                url: urlData.url,
                title: urlData.title || '',
                raw_text: urlData.text || '',
                created_at: new Date(),
                updated_at: new Date(),
                error_message: error.message
            };
        }
    };
    ParseManager.prototype.updateSubUrlStatus = function (url, isRecruit) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, domain, result, runtime, success, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        domain = extractDomain(url);
                        if (!domain) {
                            logger.warn("\uB3C4\uBA54\uC778\uC744 \uCD94\uCD9C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: ".concat(url));
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, VisitResult.findOneAndUpdate({ domain: domain, 'suburl_list.url': url }, {
                                $set: {
                                    'suburl_list.$.isRecruit': isRecruit,
                                    'suburl_list.$.updated_at': new Date()
                                }
                            }, { new: true })];
                    case 2:
                        result = _a.sent();
                        runtime = Date.now() - startTime;
                        success = !!result;
                        logger.debug("URL ".concat(url, "\uC758 isRecruit \uC0C1\uD0DC\uB97C ").concat(isRecruit, "\uB85C \uC5C5\uB370\uC774\uD2B8 ").concat(success ? '성공' : '실패'));
                        logger.eventInfo('update_url_status', {
                            url: url,
                            domain: domain,
                            isRecruit: isRecruit,
                            success: success,
                            runtime: runtime,
                            reason: success ? null : 'document_not_found'
                        });
                        return [2 /*return*/, success];
                    case 3:
                        error_4 = _a.sent();
                        logger.eventError('update_url_status', {
                            url: url,
                            error: error_4.message,
                            stack: error_4.stack
                        });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 채용공고 정보를 RecruitInfo 컬렉션에 저장
     * @param {Object} recruitData - 채용공고 데이터
     * @returns {Promise<Object>} 저장된 문서
     */
    ParseManager.prototype.saveRecruitInfo = function (recruitData) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, RecruitInfo.findOneAndUpdate({ url: recruitData.url }, recruitData, {
                                upsert: true,
                                new: true,
                                setDefaultsOnInsert: true
                            })];
                    case 1:
                        result = _a.sent();
                        logger.debug("URL ".concat(recruitData.url, " \uCC44\uC6A9\uC815\uBCF4 \uC800\uC7A5 \uC644\uB8CC"));
                        return [2 /*return*/, result];
                    case 2:
                        error_5 = _a.sent();
                        logger.error("\uCC44\uC6A9\uC815\uBCF4 \uC800\uC7A5 \uC624\uB958 (".concat(recruitData.url, "):"), error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
   * 단일 URL 처리 (분류 및 저장)
   * @param {Object} urlData - URL 데이터
   * @returns {Promise<Object>} 처리 결과
   */
    ParseManager.prototype.processUrl = function (urlData) {
        return __awaiter(this, void 0, void 0, function () {
            var response, isRecruit, recruitInfoData, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        this.stats.processed++;
                        // 1. Gemini API로 URL 분석
                        logger.debug("URL \uBD84\uC11D \uC2DC\uC791: ".concat(urlData.url));
                        return [4 /*yield*/, this.requestUrlParse(urlData)];
                    case 1:
                        response = _a.sent();
                        if (!response) {
                            throw new Error('URL 분석 결과가 없습니다');
                        }
                        isRecruit = response.success === true;
                        return [4 /*yield*/, this.updateSubUrlStatus(urlData.url, isRecruit)];
                    case 2:
                        _a.sent();
                        if (!isRecruit) return [3 /*break*/, 6];
                        this.stats.isRecruit++;
                        recruitInfoData = this.convertToRecruitInfoSchema(response, urlData);
                        logger.debug(recruitInfoData);
                        if (!recruitInfoData) return [3 /*break*/, 4];
                        logger.debug(recruitInfoData);
                        return [4 /*yield*/, this.saveRecruitInfo(recruitInfoData)];
                    case 3:
                        _a.sent();
                        this.stats.saved++;
                        return [3 /*break*/, 5];
                    case 4:
                        logger.debug("\uBCC0\uD658\uB41C RecruitInfo \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4: ".concat(urlData.url));
                        _a.label = 5;
                    case 5: return [2 /*return*/, {
                            url: urlData.url,
                            success: true,
                            isRecruit: true,
                            message: '채용공고로 분류되어 저장되었습니다.'
                        }];
                    case 6:
                        this.stats.notRecruit++;
                        return [2 /*return*/, {
                                url: urlData.url,
                                success: true,
                                isRecruit: false,
                                message: '채용공고가 아닌 것으로 분류되었습니다.',
                                reason: response.reason || '이유가 제공되지 않았습니다'
                            }];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_6 = _a.sent();
                        this.stats.failed++;
                        logger.eventError("process_url", { error: error_6.message });
                        return [2 /*return*/, {
                                url: urlData.url,
                                success: false,
                                error: error_6.message
                            }];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 대기 함수 (요청 간 지연 시간)
     * @param {number} ms - 대기 시간(ms)
     * @returns {Promise<void>}
     */
    ParseManager.prototype.wait = function () {
        return __awaiter(this, arguments, void 0, function (ms) {
            if (ms === void 0) { ms = this.delayBetweenRequests; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    /**
     * 일괄 처리 실행 - 병렬 처리 및 성능 개선
     * @param {number} batchSize - 처리할 URL 수
     * @param {number} concurrency - 동시 처리할 URL 수 (기본값: 5)
     * @returns {Promise<Object>} 처리 결과 통계
     */
    ParseManager.prototype.run = function () {
        return __awaiter(this, arguments, void 0, function (batchSize, concurrency) {
            var startTime, fetchStartTime, urls, fetchRuntime, totalRuntime, urlQueue_1, results_1, pendingPromises_1, processedUrls_1, processNextUrl, _loop_1, this_1, unprocessedUrls, error_7, failRuntime;
            var _this = this;
            if (batchSize === void 0) { batchSize = this.batchSize; }
            if (concurrency === void 0) { concurrency = this.concurrency; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        if (this.isRunning) {
                            logger.debug('이미 실행 중입니다.');
                            return [2 /*return*/, { success: false, message: '이미 실행 중입니다.' }];
                        }
                        this.isRunning = true;
                        this.isCancelled = false;
                        this.stats = {
                            processed: 0,
                            isRecruit: 0,
                            notRecruit: 0,
                            failed: 0,
                            retried: 0,
                            saved: 0,
                            startTime: startTime,
                            endTime: null,
                            runtime: 0
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 12, 13, 14]);
                        logger.debug("ParseManager \uC2E4\uD589 \uC2DC\uC791: \uBC30\uCE58 \uD06C\uAE30 ".concat(batchSize, ", \uB3D9\uC2DC\uC131 ").concat(concurrency));
                        logger.eventInfo('parse_manager_start', { batchSize: batchSize, concurrency: concurrency });
                        fetchStartTime = Date.now();
                        return [4 /*yield*/, this.fetchUnclassifiedUrls(batchSize)];
                    case 2:
                        urls = _a.sent();
                        fetchRuntime = Date.now() - fetchStartTime;
                        logger.eventInfo('fetch_unclassified_urls', {
                            count: urls.length,
                            runtime: fetchRuntime
                        });
                        if (urls.length === 0) {
                            logger.debug('처리할 미분류 URL이 없습니다.');
                            this.isRunning = false;
                            totalRuntime = Date.now() - startTime;
                            logger.eventInfo('parse_manager_complete', {
                                urls: 0,
                                runtime: totalRuntime,
                                message: '처리할 URL 없음'
                            });
                            return [2 /*return*/, {
                                    success: true,
                                    message: '처리할 미분류 URL이 없습니다.',
                                    stats: this.stats
                                }];
                        }
                        logger.debug("".concat(urls.length, "\uAC1C URL \uCC98\uB9AC \uC2DC\uC791"));
                        urlQueue_1 = __spreadArray([], urls, true);
                        results_1 = [];
                        pendingPromises_1 = new Set();
                        processedUrls_1 = new Set();
                        processNextUrl = function () { return __awaiter(_this, void 0, void 0, function () {
                            var urlData, retryCount, urlStartTime, result, urlRuntime, error_8, baseDelay, maxDelay, retryDelay, failedResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (this.isCancelled)
                                            return [2 /*return*/, null];
                                        urlData = urlQueue_1.shift();
                                        if (!urlData)
                                            return [2 /*return*/, null];
                                        // URL이 이미 처리된 경우 건너뛰기
                                        if (processedUrls_1.has(urlData.url)) {
                                            return [2 /*return*/, {
                                                    url: urlData.url,
                                                    success: false,
                                                    skipped: true,
                                                    message: "중복 URL 건너뛰기"
                                                }];
                                        }
                                        // 처리 시작 전 URL 기록
                                        processedUrls_1.add(urlData.url);
                                        retryCount = 0;
                                        _a.label = 1;
                                    case 1:
                                        if (!(retryCount <= this.maxRetries)) return [3 /*break*/, 8];
                                        if (this.isCancelled) {
                                            return [2 /*return*/, {
                                                    url: urlData.url,
                                                    success: false,
                                                    cancelled: true,
                                                    message: "작업이 취소되었습니다"
                                                }];
                                        }
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 7]);
                                        urlStartTime = Date.now();
                                        // 재시도 시 로그
                                        if (retryCount > 0) {
                                            logger.debug("URL \uC7AC\uC2DC\uB3C4 \uC911 (".concat(retryCount, "/").concat(this.maxRetries, "): ").concat(urlData.url));
                                        }
                                        return [4 /*yield*/, this.processUrl(urlData)];
                                    case 3:
                                        result = _a.sent();
                                        urlRuntime = Date.now() - urlStartTime;
                                        // 결과에 메타데이터 추가
                                        result.runtime = urlRuntime;
                                        result.retries = retryCount;
                                        // 성공 로그
                                        logger.eventInfo('process_url_complete', {
                                            url: urlData.url,
                                            isRecruit: result.isRecruit,
                                            success: result.success,
                                            runtime: urlRuntime,
                                            retries: retryCount
                                        });
                                        // 성공한 결과 저장 및 반환
                                        results_1.push(result);
                                        return [2 /*return*/, result];
                                    case 4:
                                        error_8 = _a.sent();
                                        if (!(retryCount < this.maxRetries && !this.isCancelled)) return [3 /*break*/, 6];
                                        retryCount++;
                                        this.stats.retried++;
                                        baseDelay = this.delayBetweenRequests;
                                        maxDelay = 30000;
                                        retryDelay = Math.min(baseDelay * Math.pow(2, retryCount - 1) + Math.random() * 1000, maxDelay);
                                        logger.debug("URL \uCC98\uB9AC \uC2E4\uD328, ".concat(retryDelay, "ms \uD6C4 \uC7AC\uC2DC\uB3C4 \uC608\uC815 (").concat(retryCount, "/").concat(this.maxRetries, "): ").concat(urlData.url));
                                        return [4 /*yield*/, this.wait(retryDelay)];
                                    case 5:
                                        _a.sent();
                                        return [3 /*break*/, 1]; // 재시도 실행
                                    case 6:
                                        // 최대 재시도 횟수 초과 시 실패 처리
                                        logger.error("URL \uCC98\uB9AC \uC2E4\uD328 (\uCD5C\uB300 \uC7AC\uC2DC\uB3C4 \uD69F\uC218 \uCD08\uACFC): ".concat(urlData.url), error_8);
                                        logger.eventInfo('process_url_error', {
                                            url: urlData.url,
                                            error: error_8.message,
                                            retries: retryCount
                                        });
                                        failedResult = {
                                            url: urlData.url,
                                            success: false,
                                            error: error_8.message,
                                            retries: retryCount
                                        };
                                        // 실패한 결과 저장
                                        results_1.push(failedResult);
                                        this.stats.failed++;
                                        return [2 /*return*/, failedResult];
                                    case 7: return [3 /*break*/, 1];
                                    case 8: return [2 /*return*/, null];
                                }
                            });
                        }); };
                        logger.debug("conccurency ".concat(concurrency));
                        _a.label = 3;
                    case 3:
                        if (!(urlQueue_1.length > 0 && !this.isCancelled)) return [3 /*break*/, 9];
                        _loop_1 = function () {
                            var promise;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        promise = processNextUrl().then(function (result) {
                                            pendingPromises_1.delete(promise);
                                            return result;
                                        });
                                        pendingPromises_1.add(promise);
                                        // 서버 부하 방지를 위한 짧은 대기
                                        return [4 /*yield*/, this_1.wait(50)];
                                    case 1:
                                        // 서버 부하 방지를 위한 짧은 대기
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 4;
                    case 4:
                        if (!(pendingPromises_1.size < concurrency && urlQueue_1.length > 0)) return [3 /*break*/, 6];
                        return [5 /*yield**/, _loop_1()];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 6:
                        if (!(pendingPromises_1.size > 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, Promise.race(__spreadArray([], pendingPromises_1, true))];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 3];
                    case 9:
                        if (!(pendingPromises_1.size > 0)) return [3 /*break*/, 11];
                        logger.debug("\uB0A8\uC740 ".concat(pendingPromises_1.size, "\uAC1C \uC791\uC5C5 \uC644\uB8CC \uB300\uAE30 \uC911..."));
                        return [4 /*yield*/, Promise.all(__spreadArray([], pendingPromises_1, true))];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11:
                        // 최종 통계 계산
                        this.stats.endTime = Date.now();
                        this.stats.runtime = this.stats.endTime - this.stats.startTime;
                        unprocessedUrls = urls
                            .filter(function (urlData) { return !processedUrls_1.has(urlData.url); })
                            .map(function (urlData) { return urlData.url; });
                        // 최종 결과 로깅
                        logger.debug("\uCC98\uB9AC \uC644\uB8CC: \uCD1D ".concat(this.stats.processed, "\uAC1C, \uCC44\uC6A9\uACF5\uACE0 ").concat(this.stats.isRecruit, "\uAC1C, \uBE44\uCC44\uC6A9\uACF5\uACE0 ").concat(this.stats.notRecruit, "\uAC1C, \uC2E4\uD328 ").concat(this.stats.failed, "\uAC1C, \uC7AC\uC2DC\uB3C4 ").concat(this.stats.retried, "\uAC1C"));
                        logger.eventInfo('parse_manager_complete', {
                            urls: urls.length,
                            processed: processedUrls_1.size,
                            unprocessed: unprocessedUrls.length,
                            runtime: this.stats.runtime,
                            avg_speed: (processedUrls_1.size / (this.stats.runtime / 1000)).toFixed(2) + " URLs/sec",
                            stats: __assign({}, this.stats)
                        });
                        if (unprocessedUrls.length > 0) {
                            logger.debug("\uCC98\uB9AC\uB418\uC9C0 \uC54A\uC740 URL: ".concat(unprocessedUrls.length, "\uAC1C"));
                        }
                        return [2 /*return*/, {
                                success: true,
                                message: "".concat(urls.length, "\uAC1C URL \uCC98\uB9AC \uC644\uB8CC (").concat(this.stats.runtime, "ms)"),
                                stats: this.stats,
                                results: results_1,
                                unprocessedUrls: unprocessedUrls.length > 0 ? unprocessedUrls : undefined
                            }];
                    case 12:
                        error_7 = _a.sent();
                        failRuntime = Date.now() - startTime;
                        logger.error('실행 오류:', error_7);
                        logger.eventError('parse_manager_error', {
                            error: error_7.message,
                            runtime: failRuntime,
                            stack: error_7.stack
                        });
                        return [2 /*return*/, {
                                success: false,
                                message: "\uC624\uB958 \uBC1C\uC0DD: ".concat(error_7.message),
                                error: error_7.message,
                                runtime: failRuntime
                            }];
                    case 13:
                        this.isRunning = false;
                        return [7 /*endfinally*/];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 실행 중인 배치 작업 취소
     */
    ParseManager.prototype.cancel = function () {
        if (!this.isRunning) {
            return false;
        }
        logger.debug('배치 처리 작업 취소 중...');
        this.isCancelled = true;
        logger.eventInfo('parse_manager_cancel', { stats: __assign({}, this.stats) });
        return true;
    };
    /**
     * 현재 상태 정보 반환
     * @returns {Object} 상태 정보
     */
    ParseManager.prototype.getStatus = function () {
        return {
            isRunning: this.isRunning,
            stats: this.stats,
            config: {
                batchSize: this.batchSize,
                maxRetries: this.maxRetries,
                delayBetweenRequests: this.delayBetweenRequests
            }
        };
    };
    return ParseManager;
}());
if (require.main === module) {
    (function () { return __awaiter(void 0, void 0, void 0, function () {
        var args, batchSize, delay, concurrency, parseManager, startTime, result, endTime, elapsedTime, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // dotenv 설정 (환경 변수 로드)
                    try {
                        require('dotenv').config();
                    }
                    catch (error) {
                        logger.warn('dotenv를 불러올 수 없습니다. 환경 변수가 이미 설정되어 있다고 가정합니다.');
                    }
                    args = process.argv.slice(2);
                    batchSize = parseInt(args[0]) || parseInt(process.env.BATCH_SIZE);
                    delay = parseInt(args[1]) || 1000;
                    concurrency = parseInt(process.env.CONCURRENCY);
                    logger.eventInfo("concurrency ".concat(concurrency));
                    parseManager = new ParseManager({
                        batchSize: batchSize,
                        delayBetweenRequests: delay,
                        concurrency: concurrency
                    });
                    startTime = Date.now();
                    return [4 /*yield*/, parseManager.run(batchSize)];
                case 1:
                    result = _a.sent();
                    endTime = Date.now();
                    elapsedTime = (endTime - startTime) / 1000;
                    process.exit(0);
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _a.sent();
                    logger.error('실행 오류:', error_9);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); })();
}
module.exports = ParseManager;
