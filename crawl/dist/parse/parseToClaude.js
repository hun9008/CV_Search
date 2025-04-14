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
require('module-alias/register');
var mongoose = require('mongoose');
var _a = require('@models/visitResult'), VisitResult = _a.VisitResult, extractDomain = _a.extractDomain;
var RecruitInfo = require('@models/recruitInfo');
var ClaudeService = require('@parse/claudeService').ClaudeService; // Changed to ClaudeService
var logger = require('@utils/logger').defaultLogger;
// Create a new model using the RecruitInfo schema but with a different collection
var RecruitInfoClaude = mongoose.model('RecruitInfoClaude', RecruitInfo.schema, 'recruitinfos_claude');
/**
 * 방문한 URL 중 채용 공고(isRecruit=true)인 항목을 파싱하여
 * recruitinfos_claude 컬렉션에 저장
 */
var ClaudeParser = /** @class */ (function () {
    function ClaudeParser(options) {
        if (options === void 0) { options = {}; }
        this.batchSize = options.batchSize || 100;
        this.delayBetweenRequests = options.delayBetweenRequests || 1000;
        this.claudeService = new ClaudeService(); // Use ClaudeService instead of GeminiService
        this.isRunning = false;
        this.stats = {
            processed: 0,
            success: 0,
            failed: 0,
            skipped: 0
        };
    }
    /**
     * MongoDB에 연결
     */
    ClaudeParser.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!(mongoose.connection.readyState !== 1)) return [3 /*break*/, 2];
                        return [4 /*yield*/, mongoose.connect(process.env.MONGODB_ADMIN_URI, {
                                useNewUrlParser: true,
                                useUnifiedTopology: true,
                                dbName: 'crwal_db'
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        logger.info('MongoDB에 연결되었습니다.');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        logger.error('MongoDB 연결 오류:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * isRecruit=true이고 isRecruit_claude=null인 URL 가져오기
     */
    ClaudeParser.prototype.fetchRecruitUrls = function () {
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
                            {
                                $match: {
                                    'suburl_list.visited': true,
                                    'suburl_list.success': true,
                                    'suburl_list.isRecruit': true
                                }
                            },
                            { $unwind: '$suburl_list' },
                            {
                                $match: {
                                    'suburl_list.visited': true,
                                    'suburl_list.success': true,
                                    'suburl_list.isRecruit': true,
                                    $or: [
                                        { 'suburl_list.isRecruit_claude': { $exists: false } },
                                        { 'suburl_list.isRecruit_claude': null }
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
                                    meta: '$suburl_list.meta',
                                    visitedAt: '$suburl_list.visitedAt'
                                }
                            }
                        ];
                        return [4 /*yield*/, VisitResult.aggregate(pipeline)];
                    case 2:
                        urls = _a.sent();
                        logger.info("".concat(urls.length, "\uAC1C\uC758 Claude \uBD84\uC11D \uB300\uC0C1 \uCC44\uC6A9\uACF5\uACE0 URL \uCD94\uCD9C \uC644\uB8CC"));
                        return [2 /*return*/, urls];
                    case 3:
                        error_2 = _a.sent();
                        logger.error('채용공고 URL 추출 오류:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * URL이 채용공고인지 Claude API로 파싱
     */
    ClaudeParser.prototype.requestUrlParse = function (urlData) {
        return __awaiter(this, void 0, void 0, function () {
            var url, title, text, meta, content, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        url = urlData.url, title = urlData.title, text = urlData.text, meta = urlData.meta;
                        content = "\n      Title: ".concat(title || '', "\n      Meta Description: ").concat((meta === null || meta === void 0 ? void 0 : meta.description) || '', "\n\n      Content:\n      ").concat((text === null || text === void 0 ? void 0 : text.substring(0, 5000)) || '', " // \uD14D\uC2A4\uD2B8\uAC00 \uB108\uBB34 \uAE38\uBA74 \uC798\uB77C\uB0C4\n      ");
                        return [4 /*yield*/, this.claudeService.parseRecruitment(content)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 2:
                        error_3 = _a.sent();
                        logger.warn("\uD14D\uC2A4\uD2B8 \uBD84\uC11D \uC911 \uC624\uB958: ".concat(error_3));
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Claude API 응답을 RecruitInfo 모델 형식으로 변환
     */
    ClaudeParser.prototype.convertToRecruitInfoSchema = function (claudeResponse, urlData) {
        try {
            logger.debug('채용공고 데이터 변환 시작', { url: urlData.url });
            if (!claudeResponse.success) {
                logger.warn('파싱 실패', { url: urlData.url });
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
            if (claudeResponse.posted_period) {
                // 게시 기간이 범위 형식인 경우 (예: 2023-01-01 ~ 2023-02-01)
                var periodMatch = claudeResponse.posted_period.match(/(.+?)\s*[~\-]\s*(.+)/);
                if (periodMatch) {
                    startDate = parseDate(periodMatch[1].trim());
                    endDate = parseDate(periodMatch[2].trim());
                }
                else {
                    // 단일 날짜만 있는 경우, 종료일로 처리
                    endDate = parseDate(claudeResponse.posted_period.trim());
                }
            }
            // Claude 응답에서 직접 날짜 필드가 있는 경우 이를 우선 사용
            if (claudeResponse.start_date) {
                startDate = parseDate(claudeResponse.start_date);
            }
            if (claudeResponse.end_date) {
                endDate = parseDate(claudeResponse.end_date);
            }
            // 날짜가 유효하지 않은 경우 기본값 사용
            if (!startDate)
                startDate = currentDate;
            if (!endDate)
                endDate = defaultEndDate;
            // 원본 데이터 추출
            var domain = urlData.domain, url = urlData.url, title = urlData.title, text = urlData.text, meta = urlData.meta, visitedAt = urlData.visitedAt;
            // RecruitInfo 모델에 맞는 객체 생성
            return {
                domain: domain,
                url: url,
                title: title || '',
                company_name: claudeResponse.company_name || '알 수 없음',
                department: claudeResponse.department || '',
                experience: claudeResponse.experience || '',
                description: claudeResponse.description || '',
                job_type: claudeResponse.job_type || '',
                start_date: startDate,
                end_date: endDate,
                expires_at: endDate,
                requirements: claudeResponse.requirements || '',
                preferred_qualifications: claudeResponse.preferred_qualifications || '',
                ideal_candidate: claudeResponse.ideal_candidate || '',
                raw_text: text || '',
                meta: meta || {},
                status: 'active',
                success: true,
                original_parsed_data: claudeResponse,
                visited_at: visitedAt || currentDate,
                created_at: currentDate,
                updated_at: currentDate,
                posted_at: startDate || currentDate,
                parser: 'claude' // 추가: 어떤 파서를 사용했는지 표시
            };
        }
        catch (error) {
            logger.error("RecruitInfo \uBCC0\uD658 \uC624\uB958 (".concat(urlData.url, "):"), error);
            return {
                url: urlData.url,
                title: urlData.title || '',
                company_name: '파싱 실패',
                raw_text: urlData.text || '',
                created_at: new Date(),
                updated_at: new Date(),
                success: false,
                reason: error.message,
                parser: 'claude'
            };
        }
    };
    /**
     * 채용공고 정보를 RecruitInfoClaude 컬렉션에 저장하고
     * VisitResult 컬렉션의 isRecruit_claude 필드 업데이트
     */
    ClaudeParser.prototype.saveRecruitInfo = function (recruitData) {
        return __awaiter(this, void 0, void 0, function () {
            var result, isRecruitClaude, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, RecruitInfoClaude.findOneAndUpdate({ url: recruitData.url }, recruitData, {
                                upsert: true,
                                new: true,
                                setDefaultsOnInsert: true
                            })];
                    case 1:
                        result = _a.sent();
                        logger.info("URL ".concat(recruitData.url, " Claude \uBD84\uC11D \uACB0\uACFC:"), {
                            success: recruitData.success,
                            company_name: recruitData.company_name || 'N/A',
                            is_recruitment: recruitData.success ? '채용공고 맞음' : '채용공고 아님'
                        });
                        isRecruitClaude = recruitData.success === true ? true : false;
                        // URL로 VisitResult에서 해당 document 찾아서 업데이트
                        return [4 /*yield*/, VisitResult.updateOne({ 'suburl_list.url': recruitData.url }, { $set: { 'suburl_list.$.isRecruit_claude': isRecruitClaude } })];
                    case 2:
                        // URL로 VisitResult에서 해당 document 찾아서 업데이트
                        _a.sent();
                        logger.info("URL ".concat(recruitData.url, " \uCC44\uC6A9\uC815\uBCF4 \uC800\uC7A5 \uC644\uB8CC (recruitinfos_claude \uCEEC\uB809\uC158)"));
                        logger.info("URL ".concat(recruitData.url, " VisitResult isRecruit_claude=").concat(isRecruitClaude, " \uC5C5\uB370\uC774\uD2B8 \uC644\uB8CC"));
                        return [2 /*return*/, result];
                    case 3:
                        error_4 = _a.sent();
                        logger.error("\uCC44\uC6A9\uC815\uBCF4 \uC800\uC7A5 \uC624\uB958 (".concat(recruitData.url, "):"), error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 단일 URL 처리 (파싱 및 저장)
     */
    ClaudeParser.prototype.processUrl = function (urlData) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, response, recruitInfoData, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        this.stats.processed++;
                        return [4 /*yield*/, RecruitInfoClaude.findOne({ url: urlData.url })];
                    case 1:
                        existing = _a.sent();
                        if (existing) {
                            logger.info("URL ".concat(urlData.url, "\uC740 \uC774\uBBF8 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uAC74\uB108\uB701\uB2C8\uB2E4."));
                            this.stats.skipped++;
                            return [2 /*return*/, {
                                    url: urlData.url,
                                    success: true,
                                    skipped: true,
                                    message: '이미 처리된 URL'
                                }];
                        }
                        // 1. Claude API로 URL 분석
                        logger.debug("URL \uBD84\uC11D \uC2DC\uC791: ".concat(urlData.url));
                        return [4 /*yield*/, this.requestUrlParse(urlData)];
                    case 2:
                        response = _a.sent();
                        if (!response) {
                            throw new Error('URL 분석 결과가 없습니다');
                        }
                        recruitInfoData = this.convertToRecruitInfoSchema(response, urlData);
                        if (!recruitInfoData) return [3 /*break*/, 4];
                        // recruitInfoData
                        // 3. RecruitInfoClaude 컬렉션에 저장
                        return [4 /*yield*/, this.saveRecruitInfo(recruitInfoData)];
                    case 3:
                        // recruitInfoData
                        // 3. RecruitInfoClaude 컬렉션에 저장
                        _a.sent();
                        this.stats.success++;
                        return [2 /*return*/, {
                                url: urlData.url,
                                success: true,
                                message: 'recruitinfos_claude 컬렉션에 저장되었습니다.'
                            }];
                    case 4:
                        this.stats.failed++;
                        logger.warn("\uBCC0\uD658\uB41C RecruitInfo \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4: ".concat(urlData.url));
                        return [2 /*return*/, {
                                url: urlData.url,
                                success: false,
                                message: '데이터 변환 실패'
                            }];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_5 = _a.sent();
                        this.stats.failed++;
                        logger.error("URL \uCC98\uB9AC \uC624\uB958 (".concat(urlData.url, "):"), error_5);
                        return [2 /*return*/, {
                                url: urlData.url,
                                success: false,
                                error: error_5.message
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 대기 함수 (요청 간 지연 시간)
     */
    ClaudeParser.prototype.wait = function () {
        return __awaiter(this, arguments, void 0, function (ms) {
            if (ms === void 0) { ms = this.delayBetweenRequests; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    /**
     * 일괄 처리 실행
     */
    ClaudeParser.prototype.run = function () {
        return __awaiter(this, arguments, void 0, function (batchSize) {
            var apiStatus, urls, results, _i, urls_1, urlData, result, error_6, error_7;
            if (batchSize === void 0) { batchSize = this.batchSize; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isRunning) {
                            logger.warn('이미 실행 중입니다.');
                            return [2 /*return*/, { success: false, message: '이미 실행 중입니다.' }];
                        }
                        this.isRunning = true;
                        this.stats = {
                            processed: 0,
                            success: 0,
                            failed: 0,
                            skipped: 0
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, 11, 12]);
                        apiStatus = this.claudeService.getStatus();
                        if (!apiStatus.hasValidKey || !apiStatus.clientInitialized) {
                            throw new Error('Claude API 키가 설정되지 않았거나 클라이언트 초기화에 실패했습니다.');
                        }
                        logger.info("ClaudeParser \uC2E4\uD589 \uC2DC\uC791: \uBC30\uCE58 \uD06C\uAE30 ".concat(batchSize, ", \uBAA8\uB378: ").concat(apiStatus.model));
                        return [4 /*yield*/, this.fetchRecruitUrls(batchSize)];
                    case 2:
                        urls = _a.sent();
                        if (urls.length === 0) {
                            logger.info('처리할 채용공고 URL이 없습니다.');
                            this.isRunning = false;
                            return [2 /*return*/, {
                                    success: true,
                                    message: '처리할 채용공고 URL이 없습니다.',
                                    stats: this.stats
                                }];
                        }
                        logger.info("".concat(urls.length, "\uAC1C \uCC44\uC6A9\uACF5\uACE0 URL \uCC98\uB9AC \uC2DC\uC791"));
                        results = [];
                        _i = 0, urls_1 = urls;
                        _a.label = 3;
                    case 3:
                        if (!(_i < urls_1.length)) return [3 /*break*/, 9];
                        urlData = urls_1[_i];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 7, , 8]);
                        return [4 /*yield*/, this.processUrl(urlData)];
                    case 5:
                        result = _a.sent();
                        results.push(result);
                        // 요청 간 지연 시간
                        return [4 /*yield*/, this.wait()];
                    case 6:
                        // 요청 간 지연 시간
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_6 = _a.sent();
                        logger.error("URL \uCC98\uB9AC \uC2E4\uD328 (".concat(urlData.url, "):"), error_6);
                        results.push({
                            url: urlData.url,
                            success: false,
                            error: error_6.message
                        });
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 3];
                    case 9:
                        logger.info("\uCC98\uB9AC \uC644\uB8CC: \uCD1D ".concat(this.stats.processed, "\uAC1C, \uC131\uACF5 ").concat(this.stats.success, "\uAC1C, \uC2E4\uD328 ").concat(this.stats.failed, "\uAC1C, \uAC74\uB108\uB700 ").concat(this.stats.skipped, "\uAC1C"));
                        return [2 /*return*/, {
                                success: true,
                                message: "".concat(urls.length, "\uAC1C URL \uCC98\uB9AC \uC644\uB8CC"),
                                stats: this.stats,
                                results: results
                            }];
                    case 10:
                        error_7 = _a.sent();
                        logger.error('실행 오류:', error_7);
                        return [2 /*return*/, {
                                success: false,
                                message: "\uC624\uB958 \uBC1C\uC0DD: ".concat(error_7.message),
                                error: error_7.message
                            }];
                    case 11:
                        this.isRunning = false;
                        return [7 /*endfinally*/];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    return ClaudeParser;
}());
// 스크립트 실행
if (require.main === module) {
    (function () { return __awaiter(void 0, void 0, void 0, function () {
        var args, batchSize, delay, claudeParser, startTime, result, endTime, elapsedTime, error_8;
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
                    // Claude API 키 확인
                    if (!process.env.CLAUDE_API_KEY) {
                        logger.error('CLAUDE_API_KEY 환경 변수가 설정되지 않았습니다.');
                        process.exit(1);
                    }
                    args = process.argv.slice(2);
                    batchSize = parseInt(args[0]) || 100;
                    delay = parseInt(args[1]) || 1000;
                    logger.info('===== 채용공고 Claude 컬렉션 저장 시작 =====');
                    logger.info("\uBC30\uCE58 \uD06C\uAE30: ".concat(batchSize, ", \uC694\uCCAD \uAC04 \uC9C0\uC5F0: ").concat(delay, "ms"));
                    claudeParser = new ClaudeParser({
                        batchSize: batchSize,
                        delayBetweenRequests: delay
                    });
                    startTime = Date.now();
                    return [4 /*yield*/, claudeParser.run(batchSize)];
                case 1:
                    result = _a.sent();
                    endTime = Date.now();
                    elapsedTime = (endTime - startTime) / 1000;
                    // 결과 출력
                    if (result.success) {
                        logger.info('===== 채용공고 Claude 컬렉션 저장 완료 =====');
                        logger.info("\uC18C\uC694 \uC2DC\uAC04: ".concat(elapsedTime.toFixed(2), "\uCD08"));
                        logger.info('처리 통계:');
                        logger.info("- \uCD1D \uCC98\uB9AC: ".concat(result.stats.processed, "\uAC1C"));
                        logger.info("- \uC131\uACF5: ".concat(result.stats.success, "\uAC1C"));
                        logger.info("- \uC2E4\uD328: ".concat(result.stats.failed, "\uAC1C"));
                        logger.info("- \uAC74\uB108\uB700: ".concat(result.stats.skipped, "\uAC1C"));
                    }
                    else {
                        logger.error('===== 채용공고 Claude 컬렉션 저장 실패 =====');
                        logger.error("\uC624\uB958: ".concat(result.message));
                    }
                    process.exit(0);
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    logger.error('실행 오류:', error_8);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); })();
}
module.exports = ClaudeParser;
