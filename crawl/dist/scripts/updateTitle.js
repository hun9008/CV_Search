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
require('dotenv').config();
require('module-alias/register');
var logger = require('@utils/logger').defaultLogger;
var mongoService = require('@database/mongodb-service').mongoService;
var mongoose = require('mongoose');
var _a = require('@models/visitResult'), VisitResult = _a.VisitResult, extractDomain = _a.extractDomain;
var RecruitInfo = require('@models/recruitInfo');
// Create a model for Claude-parsed recruitment info using the same schema
var RecruitInfoClaude = mongoose.model('RecruitInfoClaude', RecruitInfo.schema, 'recruitinfos_claude');
// 실행 타임스탬프를 측정하는 유틸리티 함수
function timeLog(func) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, endTime, duration, error_1, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = new Date();
                        logger.info("".concat(func.name, " \uC2DC\uC791: ").concat(startTime.toISOString()));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, func.apply(this, args)];
                    case 2:
                        result = _a.sent();
                        endTime = new Date();
                        duration = (endTime - startTime) / 1000;
                        logger.info("".concat(func.name, " \uC644\uB8CC: ").concat(endTime.toISOString(), " (\uC18C\uC694\uC2DC\uAC04: ").concat(duration, "\uCD08)"));
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        endTime = new Date();
                        duration = (endTime - startTime) / 1000;
                        logger.error("".concat(func.name, " \uC2E4\uD328: ").concat(endTime.toISOString(), " (\uC18C\uC694\uC2DC\uAC04: ").concat(duration, "\uCD08)"), error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
}
// URL 기반으로 VisitResult에서 타이틀 정보 가져오기
function getTitleFromVisitResult(url) {
    return __awaiter(this, void 0, void 0, function () {
        var domain, visitResult, urlEntry, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    domain = extractDomain(url);
                    if (!domain)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, VisitResult.findOne({ domain: domain })];
                case 1:
                    visitResult = _a.sent();
                    if (!visitResult || !visitResult.suburl_list || visitResult.suburl_list.length === 0)
                        return [2 /*return*/, null];
                    urlEntry = visitResult.suburl_list.find(function (item) { return item.url === url; });
                    if (!urlEntry)
                        return [2 /*return*/, null];
                    return [2 /*return*/, urlEntry.title || null];
                case 2:
                    error_2 = _a.sent();
                    logger.error("URL\uC5D0\uC11C \uD0C0\uC774\uD2C0 \uAC00\uC838\uC624\uAE30 \uC624\uB958: ".concat(url), error_2);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Claude 채용공고 단일 항목의 타이틀 업데이트
function updateSingleJobTitle(job) {
    return __awaiter(this, void 0, void 0, function () {
        var title, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!job || !job.url)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, getTitleFromVisitResult(job.url)];
                case 1:
                    title = _a.sent();
                    if (!title) {
                        logger.warn("\uD0C0\uC774\uD2C0 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C: ".concat(job.url));
                        return [2 /*return*/, false];
                    }
                    // 타이틀이 이미 존재하고 동일하면 업데이트하지 않음
                    if (job.title && job.title === title)
                        return [2 /*return*/, true];
                    // 타이틀 업데이트
                    return [4 /*yield*/, RecruitInfoClaude.updateOne({ _id: job._id }, { $set: { title: title } })];
                case 2:
                    // 타이틀 업데이트
                    _a.sent();
                    logger.info("\uD0C0\uC774\uD2C0 \uC5C5\uB370\uC774\uD2B8 \uC644\uB8CC: ".concat(job._id, " - ").concat(title));
                    return [2 /*return*/, true];
                case 3:
                    error_3 = _a.sent();
                    logger.error("\uD0C0\uC774\uD2C0 \uC5C5\uB370\uC774\uD2B8 \uC624\uB958: ".concat(job._id), error_3);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 모든 채용공고 타이틀 업데이트
var updateAllJobTitles = timeLog(function updateAllJobTitles() {
    return __awaiter(this, void 0, void 0, function () {
        var query, batchSize, processed, updated, page, hasMore, jobs, _i, jobs_1, job, success, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    _a.sent();
                    query = {
                        $or: [
                            { title: { $exists: false } },
                            { title: null },
                            { title: '' },
                            { title: 'Untitled Position' }
                        ],
                        url: { $exists: true, $ne: null } // URL이 있는 것만 대상
                    };
                    batchSize = 100;
                    processed = 0;
                    updated = 0;
                    page = 0;
                    hasMore = true;
                    logger.info('타이틀 업데이트 시작');
                    _a.label = 2;
                case 2:
                    if (!hasMore) return [3 /*break*/, 8];
                    return [4 /*yield*/, RecruitInfoClaude.find(query)
                            .skip(page * batchSize)
                            .limit(batchSize)
                            .lean()];
                case 3:
                    jobs = _a.sent();
                    if (!jobs || jobs.length === 0) {
                        hasMore = false;
                        return [3 /*break*/, 8];
                    }
                    logger.info("\uBC30\uCE58 ".concat(page + 1, ": ").concat(jobs.length, "\uAC1C \uCC98\uB9AC \uC911..."));
                    _i = 0, jobs_1 = jobs;
                    _a.label = 4;
                case 4:
                    if (!(_i < jobs_1.length)) return [3 /*break*/, 7];
                    job = jobs_1[_i];
                    return [4 /*yield*/, updateSingleJobTitle(job)];
                case 5:
                    success = _a.sent();
                    if (success)
                        updated++;
                    processed++;
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    logger.info("\uBC30\uCE58 ".concat(page + 1, " \uC644\uB8CC: ").concat(jobs.length, "\uAC1C \uC911 ").concat(updated, "\uAC1C \uC5C5\uB370\uC774\uD2B8\uB428"));
                    page++;
                    return [3 /*break*/, 2];
                case 8:
                    logger.info("\uBAA8\uB4E0 \uC791\uC5C5 \uC644\uB8CC: \uCD1D ".concat(processed, "\uAC1C \uC911 ").concat(updated, "\uAC1C \uD0C0\uC774\uD2C0 \uC5C5\uB370\uC774\uD2B8\uB428"));
                    return [2 /*return*/, { processed: processed, updated: updated }];
                case 9:
                    error_4 = _a.sent();
                    logger.error('타이틀 업데이트 중 오류 발생:', error_4);
                    throw error_4;
                case 10: return [2 /*return*/];
            }
        });
    });
});
// 수동으로 선택한 채용공고 타이틀 업데이트
var updateSelectedJobTitles = timeLog(function updateSelectedJobTitles() {
    return __awaiter(this, arguments, void 0, function (filter) {
        var query, jobs, updated, _i, jobs_2, job, success, error_5;
        if (filter === void 0) { filter = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    _a.sent();
                    query = __assign(__assign({}, filter), { url: { $exists: true, $ne: null } // URL이 있는 것만 대상
                     });
                    return [4 /*yield*/, RecruitInfoClaude.find(query).lean()];
                case 2:
                    jobs = _a.sent();
                    logger.info("\uC120\uD0DD\uB41C \uCC44\uC6A9\uACF5\uACE0: ".concat(jobs.length, "\uAC1C"));
                    updated = 0;
                    _i = 0, jobs_2 = jobs;
                    _a.label = 3;
                case 3:
                    if (!(_i < jobs_2.length)) return [3 /*break*/, 6];
                    job = jobs_2[_i];
                    return [4 /*yield*/, updateSingleJobTitle(job)];
                case 4:
                    success = _a.sent();
                    if (success)
                        updated++;
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    logger.info("\uC120\uD0DD\uB41C \uCC44\uC6A9\uACF5\uACE0 \uD0C0\uC774\uD2C0 \uC5C5\uB370\uC774\uD2B8 \uC644\uB8CC: ".concat(jobs.length, "\uAC1C \uC911 ").concat(updated, "\uAC1C \uC5C5\uB370\uC774\uD2B8\uB428"));
                    return [2 /*return*/, { total: jobs.length, updated: updated }];
                case 7:
                    error_5 = _a.sent();
                    logger.error('선택된 채용공고 타이틀 업데이트 중 오류 발생:', error_5);
                    throw error_5;
                case 8: return [2 /*return*/];
            }
        });
    });
});
// 완전한 데이터를 가진 채용공고 타이틀 업데이트
var updateCompleteJobTitles = timeLog(function updateCompleteJobTitles() {
    return __awaiter(this, void 0, void 0, function () {
        var completeDataFilter, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    _a.sent();
                    completeDataFilter = {
                        company_name: { $exists: true, $ne: null, $nin: ['Unknown Company', '알 수 없음', '명시되지 않음'] },
                        description: { $exists: true, $ne: null, $ne: 'No description available.' },
                        job_type: { $exists: true, $ne: null, $ne: '' },
                        experience: { $exists: true, $ne: null, $ne: '' },
                        url: { $exists: true, $ne: null } // URL이 있는 것만 대상
                    };
                    return [4 /*yield*/, updateSelectedJobTitles(completeDataFilter)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_6 = _a.sent();
                    logger.error('완전한 데이터 채용공고 타이틀 업데이트 중 오류 발생:', error_6);
                    throw error_6;
                case 4: return [2 /*return*/];
            }
        });
    });
});
// IT 관련 채용공고 타이틀 업데이트
var updateItJobTitles = timeLog(function updateItJobTitles() {
    return __awaiter(this, void 0, void 0, function () {
        var itKeywords, itRegex, itJobsFilter, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    _a.sent();
                    itKeywords = [
                        'IT', '개발자', '프로그래머', '소프트웨어', '엔지니어', '데이터', '클라우드',
                        '웹', '모바일', '앱', 'AI', '인공지능', '머신러닝', '딥러닝', '블록체인',
                        'DevOps', '프론트엔드', '백엔드', '풀스택', 'Java', 'Python', 'JavaScript',
                        'React', 'Angular', 'Vue', 'Node.js', '.NET', 'C#', 'C++', 'Swift', 'Kotlin',
                        '데이터베이스', 'SQL', 'NoSQL', '시스템', '네트워크', '보안', 'QA', '테스트',
                        '서버', 'UX', 'UI', '인프라', 'SaaS', 'PaaS', 'IaaS', 'R&D', '연구개발'
                    ];
                    itRegex = new RegExp(itKeywords.join('|'), 'i');
                    itJobsFilter = {
                        $or: [
                            { title: { $regex: itRegex } },
                            { description: { $regex: itRegex } },
                            { job_type: { $regex: itRegex } },
                            { department: { $regex: itRegex } },
                            { requirements: { $regex: itRegex } }
                        ],
                        url: { $exists: true, $ne: null }
                    };
                    return [4 /*yield*/, updateSelectedJobTitles(itJobsFilter)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_7 = _a.sent();
                    logger.error('IT 관련 채용공고 타이틀 업데이트 중 오류 발생:', error_7);
                    throw error_7;
                case 4: return [2 /*return*/];
            }
        });
    });
});
// 메인 함수
var main = timeLog(function main() {
    return __awaiter(this, void 0, void 0, function () {
        var mode, _a, error_8;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 8, , 9]);
                    logger.info('채용공고 타이틀 업데이트 시작');
                    mode = process.argv[2] || 'all';
                    _a = mode;
                    switch (_a) {
                        case 'complete': return [3 /*break*/, 1];
                        case 'it': return [3 /*break*/, 3];
                        case 'all': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 5];
                case 1:
                    logger.info('완전한 데이터 채용공고 타이틀 업데이트');
                    return [4 /*yield*/, updateCompleteJobTitles()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 3:
                    logger.info('IT 관련 채용공고 타이틀 업데이트');
                    return [4 /*yield*/, updateItJobTitles()];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 5:
                    logger.info('모든 채용공고 타이틀 업데이트');
                    return [4 /*yield*/, updateAllJobTitles()];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 7:
                    logger.info('채용공고 타이틀 업데이트 완료');
                    process.exit(0);
                    return [3 /*break*/, 9];
                case 8:
                    error_8 = _b.sent();
                    logger.error('채용공고 타이틀 업데이트 중 오류 발생:', error_8);
                    process.exit(1);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
});
// 스크립트 실행
main();
