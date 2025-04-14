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
/**
 * 통계 컨트롤러
 * 통계 데이터 조회 관련 기능 처리
 */
var RecruitInfo = require('@models/recruitInfo');
var VisitResult = require('@models/visitResult').VisitResult;
var mongoService = require('@database/mongodb-service').mongoService;
var logger = require('@utils/logger').defaultLogger;
/**
 * 방문 URL 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} URL 통계 데이터
 */
exports.getUrlStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalVisits, urlStats, tenDaysAgo, urlTimeline, visitUrlStats, stats, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                // Mongoose 모델 직접 사용
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // Mongoose 모델 직접 사용
                _a.sent();
                return [4 /*yield*/, VisitResult.countDocuments({})];
            case 2:
                totalVisits = _a.sent();
                return [4 /*yield*/, VisitResult.aggregate([
                        {
                            $project: {
                                total_sub_urls: { $size: { $ifNull: ["$suburl_list", []] } },
                                analyzed_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $ifNull: ["$$url.isRecruit", false] }
                                        }
                                    }
                                },
                                recruit_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $eq: ["$$url.isRecruit", true] }
                                        }
                                    }
                                },
                                non_recruit_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $eq: ["$$url.isRecruit", false] }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total_sub_urls: { $sum: "$total_sub_urls" },
                                analyzed_urls: { $sum: "$analyzed_urls" },
                                recruit_urls: { $sum: "$recruit_urls" },
                                non_recruit_urls: { $sum: "$non_recruit_urls" }
                            }
                        }
                    ])];
            case 3:
                urlStats = _a.sent();
                tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                return [4 /*yield*/, VisitResult.aggregate([
                        {},
                        {
                            $project: {
                                date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                                total_sub_urls: { $size: { $ifNull: ["$suburl_list", []] } },
                                recruit_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $eq: ["$$url.isRecruit", true] }
                                        }
                                    }
                                },
                                non_recruit_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $eq: ["$$url.isRecruit", false] }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                total_urls: { $sum: "$total_sub_urls" },
                                recruit_urls: { $sum: "$recruit_urls" },
                                non_recruit_urls: { $sum: "$non_recruit_urls" }
                            }
                        },
                    ])];
            case 4:
                urlTimeline = _a.sent();
                visitUrlStats = {
                    total_visits: totalVisits,
                    total_sub_urls: 0,
                    analyzed_urls: 0,
                    recruit_urls: 0,
                    non_recruit_urls: 0,
                    analysis_ratio: 0
                };
                if (urlStats.length > 0) {
                    stats = urlStats[0];
                    visitUrlStats = {
                        total_visits: totalVisits,
                        total_sub_urls: stats.total_sub_urls,
                        analyzed_urls: stats.analyzed_urls,
                        recruit_urls: stats.recruit_urls,
                        non_recruit_urls: stats.non_recruit_urls,
                        analysis_ratio: stats.total_sub_urls > 0
                            ? Math.round((stats.analyzed_urls / stats.total_sub_urls) * 100)
                            : 0
                    };
                    console.log(visitUrlStats);
                }
                // 응답 반환
                res.status(200).json({
                    success: true,
                    data: {
                        visitUrlStats: visitUrlStats,
                        urlTimeline: urlTimeline.map(function (item) { return ({
                            date: item._id,
                            total_urls: item.total_urls,
                            recruit_urls: item.recruit_urls,
                            non_recruit_urls: item.non_recruit_urls
                        }); })
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                logger.error('URL 통계 조회 오류:', error_1);
                res.status(500).json({
                    success: false,
                    error: 'URL 통계 데이터를 조회하는 중 오류가 발생했습니다: ' + error_1.message
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
/**
 * 통계 요약 정보 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 통계 데이터 JSON
 */
exports.getStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalRecruitments, jobTypes, jobTypeMap_1, tenDaysAgo, timelineData, experienceStats, experienceMap_1, urlStats, visitUrlStats, stats, statsData, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                // 총 채용공고 수 (Mongoose 모델 직접 사용)
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // 총 채용공고 수 (Mongoose 모델 직접 사용)
                _b.sent();
                return [4 /*yield*/, RecruitInfo.countDocuments({})];
            case 2:
                totalRecruitments = _b.sent();
                return [4 /*yield*/, RecruitInfo.aggregate([
                        {
                            $group: {
                                _id: "$job_type",
                                count: { $sum: 1 }
                            }
                        }
                    ])];
            case 3:
                jobTypes = _b.sent();
                jobTypeMap_1 = {};
                jobTypes.forEach(function (type) {
                    var typeName = type._id || 'Not specified';
                    jobTypeMap_1[typeName] = type.count;
                });
                tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                return [4 /*yield*/, RecruitInfo.aggregate([
                        {
                            $match: {
                                created_at: { $gte: tenDaysAgo }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
                                },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: { _id: 1 }
                        }
                    ])];
            case 4:
                timelineData = _b.sent();
                return [4 /*yield*/, RecruitInfo.aggregate([
                        {
                            $group: {
                                _id: "$experience",
                                count: { $sum: 1 }
                            }
                        }
                    ])];
            case 5:
                experienceStats = _b.sent();
                experienceMap_1 = {};
                experienceStats.forEach(function (exp) {
                    var expName = exp._id || 'Not specified';
                    experienceMap_1[expName] = exp.count;
                });
                return [4 /*yield*/, VisitResult.aggregate([
                        {
                            $project: {
                                total_sub_urls: { $size: { $ifNull: ["$suburl_list", []] } },
                                analyzed_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $ifNull: ["$$url.isRecruit", 0] }
                                        }
                                    }
                                },
                                recruit_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $eq: ["$$url.isRecruit", true] }
                                        }
                                    }
                                },
                                non_recruit_urls: {
                                    $size: {
                                        $filter: {
                                            input: { $ifNull: ["$suburl_list", []] },
                                            as: "url",
                                            cond: { $eq: ["$$url.isRecruit", false] }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total_visits: { $sum: 1 },
                                total_sub_urls: { $sum: "$total_sub_urls" },
                                analyzed_urls: { $sum: "$analyzed_urls" },
                                recruit_urls: { $sum: "$recruit_urls" },
                                non_recruit_urls: { $sum: "$non_recruit_urls" }
                            }
                        }
                    ])];
            case 6:
                urlStats = _b.sent();
                _a = {};
                return [4 /*yield*/, VisitResult.countDocuments({})];
            case 7:
                visitUrlStats = (_a.total_visits = _b.sent(),
                    _a.total_sub_urls = 0,
                    _a.analyzed_urls = 0,
                    _a.recruit_urls = 0,
                    _a.non_recruit_urls = 0,
                    _a.analysis_ratio = 0,
                    _a);
                if (urlStats.length > 0) {
                    stats = urlStats[0];
                    visitUrlStats = {
                        total_visits: stats.total_visits,
                        total_sub_urls: stats.total_sub_urls,
                        analyzed_urls: stats.analyzed_urls,
                        recruit_urls: stats.recruit_urls,
                        non_recruit_urls: stats.non_recruit_urls,
                        analysis_ratio: stats.total_sub_urls > 0
                            ? Math.round((stats.analyzed_urls / stats.total_sub_urls) * 100)
                            : 0
                    };
                }
                statsData = {
                    recruitmentStats: {
                        total: totalRecruitments
                    },
                    jobTypeStats: {
                        total: totalRecruitments,
                        types: jobTypeMap_1
                    },
                    experienceStats: {
                        total: totalRecruitments,
                        types: experienceMap_1
                    },
                    timelineStats: timelineData.map(function (item) { return ({
                        date: item._id,
                        count: item.count
                    }); }),
                    // URL 통계 추가
                    visitUrlStats: visitUrlStats
                };
                // 응답 반환
                res.status(200).json({
                    success: true,
                    data: statsData
                });
                return [3 /*break*/, 9];
            case 8:
                error_2 = _b.sent();
                logger.error('통계 조회 오류:', error_2);
                res.status(500).json({
                    success: false,
                    error: '통계 데이터를 조회하는 중 오류가 발생했습니다: ' + error_2.message
                });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
/**
 * 직무 유형 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 직무 유형 통계 데이터
 */
exports.getJobTypeStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var jobTypesData, jobTypeStats, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // 직무 유형별 집계 (상위 10개)
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // 직무 유형별 집계 (상위 10개)
                _a.sent();
                return [4 /*yield*/, RecruitInfo.aggregate([
                        {
                            $group: {
                                _id: "$job_type",
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: { count: -1 }
                        },
                        {
                            $limit: 10
                        }
                    ])];
            case 2:
                jobTypesData = _a.sent();
                jobTypeStats = jobTypesData.map(function (item) { return ({
                    type: item._id || 'Not specified',
                    count: item.count
                }); });
                res.status(200).json({
                    success: true,
                    data: jobTypeStats
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                logger.error('직무 유형 통계 조회 오류:', error_3);
                res.status(500).json({
                    success: false,
                    error: '직무 유형 통계를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * 경력 요구사항 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 경력 요구사항 통계 데이터
 */
exports.getExperienceStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var experienceData, experienceStats, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, RecruitInfo.aggregate([
                        {
                            $group: {
                                _id: "$experience",
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: { count: -1 }
                        }
                    ])];
            case 1:
                experienceData = _a.sent();
                experienceStats = experienceData.map(function (item) { return ({
                    experience: item._id || 'Not specified',
                    count: item.count
                }); });
                res.status(200).json({
                    success: true,
                    data: experienceStats
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                logger.error('경력 요구사항 통계 조회 오류:', error_4);
                res.status(500).json({
                    success: false,
                    error: '경력 요구사항 통계를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * 도메인별 채용공고 통계 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 도메인별 채용공고 통계 데이터
 */
exports.getDomainStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var domainData, domainStats, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // 도메인별 채용공고 수 집계 (상위 10개)
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // 도메인별 채용공고 수 집계 (상위 10개)
                _a.sent();
                return [4 /*yield*/, RecruitInfo.aggregate([
                        {
                            $group: {
                                _id: "$domain",
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: { count: -1 }
                        },
                        {
                            $limit: 10
                        }
                    ])];
            case 2:
                domainData = _a.sent();
                domainStats = domainData.map(function (item) { return ({
                    domain: item._id || 'Unknown',
                    count: item.count
                }); });
                res.status(200).json({
                    success: true,
                    data: domainStats
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                logger.error('도메인별 통계 조회 오류:', error_5);
                res.status(500).json({
                    success: false,
                    error: '도메인별 통계를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
