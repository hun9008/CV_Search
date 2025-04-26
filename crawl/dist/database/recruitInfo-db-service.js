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
var RecruitInfo = require('@models/recruitInfo');
var mongoose = require('mongoose');
/**
 * 채용 정보 데이터베이스 관리 서비스
 */
var RecruitInfoDbService = /** @class */ (function () {
    function RecruitInfoDbService() {
    }
    /**
     * 채용 정보 생성 또는 업데이트
     * @param {Object} jobData - 채용 정보 데이터
     * @returns {Promise<Object>} 생성/업데이트된 채용 정보
     */
    RecruitInfoDbService.prototype.createOrUpdate = function (jobData) {
        return __awaiter(this, void 0, void 0, function () {
            var existingJob, newJob, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        // URL이 필수 필드인지 확인
                        if (!jobData.url) {
                            throw new Error('URL은 필수 필드입니다');
                        }
                        return [4 /*yield*/, RecruitInfo.findByUrl(jobData.url)];
                    case 1:
                        existingJob = _a.sent();
                        if (!existingJob) return [3 /*break*/, 3];
                        // 기존 문서 업데이트
                        Object.assign(existingJob, jobData);
                        return [4 /*yield*/, existingJob.save()];
                    case 2:
                        _a.sent();
                        console.log("\uCC44\uC6A9 \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8 \uC644\uB8CC: ".concat(existingJob.url));
                        return [2 /*return*/, existingJob];
                    case 3:
                        newJob = new RecruitInfo(jobData);
                        return [4 /*yield*/, newJob.save()];
                    case 4:
                        _a.sent();
                        console.log("\uC0C8 \uCC44\uC6A9 \uC815\uBCF4 \uC0DD\uC131 \uC644\uB8CC: ".concat(newJob.url));
                        return [2 /*return*/, newJob];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        console.error('채용 정보 생성/업데이트 중 오류:', error_1);
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 다수의 채용 정보 일괄 생성/업데이트
     * @param {Array<Object>} jobsData - 채용 정보 데이터 배열
     * @returns {Promise<Object>} 처리 결과 (성공 및 실패 개수)
     */
    RecruitInfoDbService.prototype.bulkCreateOrUpdate = function (jobsData) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, jobsData_1, jobData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(jobsData) || jobsData.length === 0) {
                            throw new Error('유효한 채용 정보 배열이 필요합니다');
                        }
                        results = {
                            total: jobsData.length,
                            success: 0,
                            failed: 0,
                            errors: []
                        };
                        _i = 0, jobsData_1 = jobsData;
                        _a.label = 1;
                    case 1:
                        if (!(_i < jobsData_1.length)) return [3 /*break*/, 6];
                        jobData = jobsData_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.createOrUpdate(jobData)];
                    case 3:
                        _a.sent();
                        results.success++;
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        results.failed++;
                        results.errors.push({
                            url: jobData.url || 'unknown',
                            error: error_2.message
                        });
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * 채용 정보 조회
     * @param {string} url - 조회할 채용 정보의 URL
     * @returns {Promise<Object>} 채용 정보
     */
    RecruitInfoDbService.prototype.getByUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, RecruitInfo.findByUrl(url)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            throw new Error("URL\uC774 ".concat(url, "\uC778 \uCC44\uC6A9 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"));
                        }
                        return [2 /*return*/, job];
                    case 2:
                        error_3 = _a.sent();
                        console.error("\uCC44\uC6A9 \uC815\uBCF4 \uC870\uD68C \uC911 \uC624\uB958 (URL: ".concat(url, "):"), error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 모든 채용 정보 목록 조회
     * @param {Object} options - 페이지 옵션 (limit, page, sort)
     * @returns {Promise<Object>} 채용 정보 목록 및 페이지네이션 정보
     */
    RecruitInfoDbService.prototype.getAll = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var _a, limit, _b, page, _c, sort, skip, _d, jobs, total, error_4;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        _a = options.limit, limit = _a === void 0 ? 10 : _a, _b = options.page, page = _b === void 0 ? 1 : _b, _c = options.sort, sort = _c === void 0 ? { posted_at: -1 } : _c;
                        skip = (page - 1) * limit;
                        return [4 /*yield*/, Promise.all([
                                RecruitInfo.find()
                                    .sort(sort)
                                    .skip(skip)
                                    .limit(limit)
                                    .exec(),
                                RecruitInfo.countDocuments()
                            ])];
                    case 1:
                        _d = _e.sent(), jobs = _d[0], total = _d[1];
                        return [2 /*return*/, {
                                results: jobs,
                                pagination: {
                                    total: total,
                                    page: page,
                                    limit: limit,
                                    pages: Math.ceil(total / limit)
                                }
                            }];
                    case 2:
                        error_4 = _e.sent();
                        console.error('채용 정보 목록 조회 중 오류:', error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 검색 조건으로 채용 정보 조회
     * @param {Object} query - 검색 조건
     * @param {Object} options - 페이지 옵션 (limit, page, sort)
     * @returns {Promise<Object>} 채용 정보 목록 및 페이지네이션 정보
     */
    RecruitInfoDbService.prototype.search = function (query_1) {
        return __awaiter(this, arguments, void 0, function (query, options) {
            var _a, limit, _b, page, _c, sort, skip, searchQuery, _d, jobs, total, error_5;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        // 키워드 검색
                        if (query.keywords) {
                            return [2 /*return*/, this.searchByKeywords(query.keywords, options)];
                        }
                        _a = options.limit, limit = _a === void 0 ? 10 : _a, _b = options.page, page = _b === void 0 ? 1 : _b, _c = options.sort, sort = _c === void 0 ? { posted_at: -1 } : _c;
                        skip = (page - 1) * limit;
                        searchQuery = {};
                        if (query.company_name) {
                            searchQuery.company_name = { $regex: query.company_name, $options: 'i' };
                        }
                        if (query.department) {
                            searchQuery.department = { $regex: query.department, $options: 'i' };
                        }
                        if (query.experience) {
                            searchQuery.experience = { $regex: query.experience, $options: 'i' };
                        }
                        if (query.job_type) {
                            searchQuery.job_type = { $regex: query.job_type, $options: 'i' };
                        }
                        // 날짜 범위 검색
                        if (query.start_after) {
                            searchQuery.start_date = { $gte: new Date(query.start_after) };
                        }
                        if (query.end_before) {
                            searchQuery.end_date = { $lte: new Date(query.end_before) };
                        }
                        // 성공/실패 필터링
                        if (query.success !== undefined) {
                            searchQuery.success = query.success === 'true' || query.success === true;
                        }
                        return [4 /*yield*/, Promise.all([
                                RecruitInfo.find(searchQuery)
                                    .sort(sort)
                                    .skip(skip)
                                    .limit(limit)
                                    .exec(),
                                RecruitInfo.countDocuments(searchQuery)
                            ])];
                    case 1:
                        _d = _e.sent(), jobs = _d[0], total = _d[1];
                        return [2 /*return*/, {
                                results: jobs,
                                pagination: {
                                    total: total,
                                    page: page,
                                    limit: limit,
                                    pages: Math.ceil(total / limit)
                                }
                            }];
                    case 2:
                        error_5 = _e.sent();
                        console.error('채용 정보 검색 중 오류:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 키워드로 채용 정보 검색
     * @param {string|Array} keywords - 검색 키워드
     * @param {Object} options - 페이지 옵션 (limit, page, sort)
     * @returns {Promise<Object>} 채용 정보 목록 및 페이지네이션 정보
     */
    RecruitInfoDbService.prototype.searchByKeywords = function (keywords_1) {
        return __awaiter(this, arguments, void 0, function (keywords, options) {
            var _a, limit, _b, page, keywordsArray, jobs, searchText, total, error_6;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        _a = options.limit, limit = _a === void 0 ? 10 : _a, _b = options.page, page = _b === void 0 ? 1 : _b;
                        keywordsArray = Array.isArray(keywords)
                            ? keywords
                            : keywords.split(',').map(function (k) { return k.trim(); });
                        return [4 /*yield*/, RecruitInfo.searchByKeywords(keywordsArray, {
                                limit: limit,
                                page: page,
                                sort: options.sort
                            })];
                    case 1:
                        jobs = _c.sent();
                        searchText = keywordsArray.join(' ');
                        return [4 /*yield*/, RecruitInfo.countDocuments({
                                $text: { $search: searchText }
                            })];
                    case 2:
                        total = _c.sent();
                        return [2 /*return*/, {
                                results: jobs,
                                pagination: {
                                    total: total,
                                    page: page,
                                    limit: limit,
                                    pages: Math.ceil(total / limit)
                                }
                            }];
                    case 3:
                        error_6 = _c.sent();
                        console.error('키워드 검색 중 오류:', error_6);
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 채용 정보 삭제
     * @param {string} url - 삭제할 채용 정보의 URL
     * @returns {Promise<Object>} 삭제 결과
     */
    RecruitInfoDbService.prototype.deleteByUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, RecruitInfo.findOneAndDelete({ url: url })];
                    case 1:
                        result = _a.sent();
                        if (!result) {
                            throw new Error("URL\uC774 ".concat(url, "\uC778 \uCC44\uC6A9 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"));
                        }
                        return [2 /*return*/, { success: true, message: "URL\uC774 ".concat(url, "\uC778 \uCC44\uC6A9 \uC815\uBCF4\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4") }];
                    case 2:
                        error_7 = _a.sent();
                        console.error("\uCC44\uC6A9 \uC815\uBCF4 \uC0AD\uC81C \uC911 \uC624\uB958 (URL: ".concat(url, "):"), error_7);
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 다수의 채용 정보 일괄 삭제
     * @param {Array<string>} urls - 삭제할 채용 정보 URL 배열
     * @returns {Promise<Object>} 삭제 결과
     */
    RecruitInfoDbService.prototype.bulkDelete = function (urls) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(urls) || urls.length === 0) {
                            throw new Error('유효한 URL 배열이 필요합니다');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, RecruitInfo.deleteMany({ url: { $in: urls } })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                deleted: result.deletedCount,
                                total: urls.length
                            }];
                    case 3:
                        error_8 = _a.sent();
                        console.error('채용 정보 일괄 삭제 중 오류:', error_8);
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 만료된 채용 정보 삭제
     * @returns {Promise<Object>} 삭제 결과
     */
    RecruitInfoDbService.prototype.deleteExpired = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, result, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        now = new Date();
                        return [4 /*yield*/, RecruitInfo.deleteMany({
                                expires_at: { $lt: now }
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                deleted: result.deletedCount,
                                message: "".concat(result.deletedCount, "\uAC1C\uC758 \uB9CC\uB8CC\uB41C \uCC44\uC6A9 \uC815\uBCF4\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4")
                            }];
                    case 2:
                        error_9 = _a.sent();
                        console.error('만료된 채용 정보 삭제 중 오류:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 데이터베이스 통계 조회
     * @returns {Promise<Object>} 통계 정보
     */
    RecruitInfoDbService.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, _a, totalCount, successCount, failedCount, expiredCount, expiringCount, companyStats, recentJobs, error_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        now = new Date();
                        return [4 /*yield*/, Promise.all([
                                // 전체 채용 정보 수
                                RecruitInfo.countDocuments(),
                                // 성공적으로 파싱된 채용 정보 수
                                RecruitInfo.countDocuments({ success: true }),
                                // 파싱 실패한 채용 정보 수
                                RecruitInfo.countDocuments({ success: false }),
                                // 만료된 채용 정보 수
                                RecruitInfo.countDocuments({ expires_at: { $lt: now } }),
                                // 7일 내에 만료되는 채용 정보 수
                                RecruitInfo.countDocuments({
                                    expires_at: {
                                        $gte: now,
                                        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                                    }
                                }),
                                // 회사별 채용 정보 수 통계
                                RecruitInfo.aggregate([
                                    { $group: { _id: "$company_name", count: { $sum: 1 } } },
                                    { $sort: { count: -1 } },
                                    { $limit: 10 }
                                ])
                            ])];
                    case 1:
                        _a = _b.sent(), totalCount = _a[0], successCount = _a[1], failedCount = _a[2], expiredCount = _a[3], expiringCount = _a[4], companyStats = _a[5];
                        return [4 /*yield*/, RecruitInfo.find()
                                .sort({ posted_at: -1 })
                                .limit(5)
                                .select('company_name department experience job_type posted_at')];
                    case 2:
                        recentJobs = _b.sent();
                        return [2 /*return*/, {
                                total: totalCount,
                                parsing: {
                                    success: successCount,
                                    failed: failedCount,
                                    successRate: totalCount > 0 ? (successCount / totalCount * 100).toFixed(2) + '%' : '0%'
                                },
                                expiration: {
                                    expired: expiredCount,
                                    expiringSoon: expiringCount
                                },
                                topCompanies: companyStats.map(function (item) { return ({
                                    company: item._id,
                                    count: item.count
                                }); }),
                                recentJobs: recentJobs
                            }];
                    case 3:
                        error_10 = _b.sent();
                        console.error('통계 정보 조회 중 오류:', error_10);
                        throw error_10;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return RecruitInfoDbService;
}());
module.exports = new RecruitInfoDbService();
