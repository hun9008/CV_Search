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
var mongoose = require('mongoose');
var RecruitInfo = require('@models/recruitInfo');
var logger = require('@utils/logger').defaultLogger;
var mongoService = require('@database/mongodb-service').mongoService;
// Create a model for Claude-parsed recruitment info using the same schema
var RecruitInfoClaude = mongoose.model('RecruitInfoClaude', RecruitInfo.schema, 'recruitinfos_claude');
/**
 * Claude로 파싱된 채용 정보 검색 및 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobs = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, keywords, _c, jobType, _d, experience, _e, search, _f, sortBy, _g, limit, _h, page, _j, complete, _k, itOnly, limitNum, pageNum, skip, searchQuery, itKeywords, itRegexPatterns, itSearchQuery, keywordArray, keywordQueries, searchRegex, searchOrQuery, sortOptions, total, totalAll, completeRatio, jobs, response, error_1;
    return __generator(this, function (_l) {
        switch (_l.label) {
            case 0:
                _l.trys.push([0, 6, , 7]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _l.sent();
                _a = req.query, _b = _a.keywords, keywords = _b === void 0 ? '' : _b, _c = _a.jobType, jobType = _c === void 0 ? '' : _c, _d = _a.experience, experience = _d === void 0 ? '' : _d, _e = _a.search, search = _e === void 0 ? '' : _e, _f = _a.sortBy, sortBy = _f === void 0 ? 'updated_at' : _f, _g = _a.limit, limit = _g === void 0 ? 50 : _g, _h = _a.page, page = _h === void 0 ? 1 : _h, _j = _a.complete, complete = _j === void 0 ? 'false' : _j, _k = _a.itOnly, itOnly = _k === void 0 ? 'false' : _k;
                limitNum = parseInt(limit) || 50;
                pageNum = parseInt(page) || 1;
                skip = (pageNum - 1) * limitNum;
                searchQuery = {};
                // 완전한 데이터 필터링 옵션
                if (complete === 'true') {
                    // 완전한 데이터를 가진 채용공고를 찾기 위한 쿼리
                    Object.assign(searchQuery, {
                        // 회사명이 있고 Unknown/알 수 없음/명시되지 않음이 아님
                        company_name: {
                            $exists: true,
                            $ne: null,
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                        },
                        // 직무 유형이 있고 비어있지 않음
                        job_type: {
                            $exists: true,
                            $ne: null,
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                        },
                        // 경력이 있고 비어있지 않음
                        experience: {
                            $exists: true,
                            $ne: null,
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                        },
                        // 설명이 있고 No description이 아님
                        description: {
                            $exists: true,
                            $ne: null,
                            $ne: 'No description available.',
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                        },
                        // 우대 사항 (선택, 선호 역량)
                        preferred_qualifications: {
                            $exists: true,
                            $ne: null,
                            $ne: 'No description available.',
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                        },
                        // 인재상 (선택, 원하는 인재상)
                        ideal_candidate: {
                            $exists: true,
                            $ne: null,
                            $ne: 'No description available.',
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                        },
                    });
                }
                // IT 관련 채용공고만 필터링
                if (itOnly === 'true') {
                    itKeywords = [
                        'IT', '개발', '소프트웨어', '프로그래머', '프로그래밍', '개발자', '엔지니어',
                        'SW', 'software', 'developer', 'programmer', 'engineer', 'frontend', 'backend',
                        '프론트엔드', '백엔드', 'fullstack', '풀스택', 'devops', '데브옵스', 'cloud', '클라우드',
                        'javascript', 'java', 'python', 'react', '리액트', 'node', '노드', 'angular', 'vue', 'django',
                        'spring', '스프링', 'AI', '인공지능', 'machine learning', '머신러닝', 'deep learning', '딥러닝',
                        'data', '데이터', 'blockchain', '블록체인', 'mobile', '모바일', 'app', '앱', 'web', '웹',
                        'system', '시스템', 'network', '네트워크', 'security', '보안', 'database', 'DB', '데이터베이스',
                        'DevOps', 'QA', '테스트', 'test', 'UX', 'UI', 'product', '서버', 'server', 'infrastructure', '인프라'
                    ];
                    itRegexPatterns = itKeywords.map(function (keyword) { return new RegExp(keyword, 'i'); });
                    itSearchQuery = {
                        $or: [
                            { job_type: { $in: itRegexPatterns } },
                            { description: { $in: itRegexPatterns } },
                            { requirements: { $in: itRegexPatterns } },
                            { preferred_qualifications: { $in: itRegexPatterns } },
                            { department: { $in: itRegexPatterns } },
                            { title: { $in: itRegexPatterns } }
                        ]
                    };
                    // 기존 검색 쿼리에 IT 관련 필터 추가
                    if (searchQuery.$and) {
                        searchQuery.$and.push(itSearchQuery);
                    }
                    else {
                        searchQuery.$and = [itSearchQuery];
                    }
                }
                // 키워드 검색 처리
                if (keywords) {
                    keywordArray = keywords.split(',').map(function (k) { return k.trim(); }).filter(Boolean);
                    if (keywordArray.length > 0) {
                        keywordQueries = keywordArray.map(function (keyword) {
                            var regex = new RegExp(keyword, 'i');
                            return {
                                $or: [
                                    { company_name: regex },
                                    { department: regex },
                                    { job_type: regex },
                                    { experience: regex },
                                    { description: regex },
                                    { requirements: regex },
                                    { preferred_qualifications: regex },
                                    { ideal_candidate: regex }
                                ]
                            };
                        });
                        if (searchQuery.$and) {
                            searchQuery.$and = __spreadArray(__spreadArray([], searchQuery.$and, true), keywordQueries, true);
                        }
                        else {
                            searchQuery.$and = keywordQueries;
                        }
                    }
                }
                // 직무 유형 필터
                if (jobType) {
                    searchQuery.job_type = { $regex: jobType, $options: 'i' };
                }
                // 경력 수준 필터
                if (experience) {
                    searchQuery.experience = { $regex: experience, $options: 'i' };
                }
                // 텍스트 검색 (제목, 회사명, 설명 등)
                if (search) {
                    searchRegex = { $regex: search, $options: 'i' };
                    searchOrQuery = [
                        { title: searchRegex },
                        { company_name: searchRegex },
                        { description: searchRegex }
                    ];
                    if (searchQuery.$or) {
                        // 이미 $or이 있는 경우 $and로 결합
                        if (!searchQuery.$and) {
                            searchQuery.$and = [];
                        }
                        searchQuery.$and.push({ $or: searchOrQuery });
                    }
                    else {
                        searchQuery.$or = searchOrQuery;
                    }
                }
                sortOptions = {};
                sortOptions['_id'] = 1; // 텍스트 필드는 오름차순
                return [4 /*yield*/, RecruitInfoClaude.countDocuments(searchQuery)];
            case 2:
                total = _l.sent();
                totalAll = null;
                completeRatio = null;
                if (!(complete === 'true')) return [3 /*break*/, 4];
                return [4 /*yield*/, RecruitInfoClaude.countDocuments({})];
            case 3:
                totalAll = _l.sent();
                completeRatio = totalAll > 0 ? (total / totalAll * 100).toFixed(2) : 0;
                _l.label = 4;
            case 4: return [4 /*yield*/, RecruitInfoClaude.find(searchQuery)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNum)];
            case 5:
                jobs = _l.sent();
                response = {
                    success: true,
                    total: total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum),
                    jobs: jobs
                };
                // complete=true인 경우 추가 통계 정보 포함
                if (complete === 'true') {
                    response.totalAll = totalAll;
                    response.completeRatio = completeRatio;
                }
                // 응답 전송
                res.status(200).json(response);
                return [3 /*break*/, 7];
            case 6:
                error_1 = _l.sent();
                logger.error('Claude 채용정보 조회 오류:', error_1);
                res.status(500).json({
                    success: false,
                    error: 'Claude 채용정보를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
/**
 * ID로 특정 Claude 채용정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, job, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _a.sent();
                id = req.params.id;
                return [4 /*yield*/, RecruitInfoClaude.findById(id)];
            case 2:
                job = _a.sent();
                if (!job) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            error: '해당 ID의 Claude 채용정보를 찾을 수 없습니다.'
                        })];
                }
                res.status(200).json({
                    success: true,
                    job: job
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                logger.error('Claude 채용정보 상세 조회 오류:', error_2);
                res.status(500).json({
                    success: false,
                    error: 'Claude 채용정보를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Claude 채용정보 필터 옵션 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobFilters = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var jobTypes, experienceLevels, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.distinct('job_type')];
            case 2:
                jobTypes = _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.distinct('experience')];
            case 3:
                experienceLevels = _a.sent();
                res.status(200).json({
                    success: true,
                    jobTypes: jobTypes.filter(function (type) { return type && type.trim(); }),
                    experienceLevels: experienceLevels.filter(function (level) { return level && level.trim(); })
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                logger.error('Claude 채용정보 필터 옵션  오류:', error_3);
                res.status(500).json({
                    success: false,
                    error: 'Claude 채용정보 필터 옵션을 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
/**
 * Claude 채용정보 통계 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getClaudeJobStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalJobs, jobTypeStats, experienceStats, domainStats, tenDaysAgo, dateStats, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.countDocuments({})];
            case 2:
                totalJobs = _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.aggregate([
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
            case 3:
                jobTypeStats = _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.aggregate([
                        {
                            $group: {
                                _id: "$experience",
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
            case 4:
                experienceStats = _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.aggregate([
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
            case 5:
                domainStats = _a.sent();
                tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                return [4 /*yield*/, RecruitInfoClaude.aggregate([
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
            case 6:
                dateStats = _a.sent();
                res.status(200).json({
                    success: true,
                    stats: {
                        totalJobs: totalJobs,
                        jobTypeStats: jobTypeStats.map(function (item) { return ({
                            type: item._id || 'Not specified',
                            count: item.count
                        }); }),
                        experienceStats: experienceStats.map(function (item) { return ({
                            level: item._id || 'Not specified',
                            count: item.count
                        }); }),
                        domainStats: domainStats.map(function (item) { return ({
                            domain: item._id || 'Unknown',
                            count: item.count
                        }); }),
                        dateStats: dateStats.map(function (item) { return ({
                            date: item._id,
                            count: item.count
                        }); })
                    }
                });
                return [3 /*break*/, 8];
            case 7:
                error_4 = _a.sent();
                logger.error('Claude 채용정보 통계 조회 오류:', error_4);
                res.status(500).json({
                    success: false,
                    error: 'Claude 채용정보 통계를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
/**
 * 완전한 데이터가 있는 Claude 채용정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getCompleteClaudeJobs = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, sortBy, _c, limit, _d, page, limitNum, pageNum, skip, completeDataQuery, sortOptions, total, totalAll, completeRatio, jobs, error_5;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 5, , 6]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _e.sent();
                _a = req.query, _b = _a.sortBy, sortBy = _b === void 0 ? 'updated_at' : _b, _c = _a.limit, limit = _c === void 0 ? 50 : _c, _d = _a.page, page = _d === void 0 ? 1 : _d;
                limitNum = parseInt(limit) || 50;
                pageNum = parseInt(page) || 1;
                skip = (pageNum - 1) * limitNum;
                completeDataQuery = {
                    // 회사명이 있고 Unknown/알 수 없음/명시되지 않음이 아님
                    company_name: {
                        $exists: true,
                        $ne: null,
                        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                    },
                    // 직무 유형이 있고 비어있지 않음
                    job_type: {
                        $exists: true,
                        $ne: null,
                        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                    },
                    // 경력이 있고 비어있지 않음
                    experience: {
                        $exists: true,
                        $ne: null,
                        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                    },
                    // 설명이 있고 No description이 아님
                    description: {
                        $exists: true,
                        $ne: null,
                        $ne: 'No description available.',
                        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                    },
                    // 우대 사항 (선택, 선호 역량)
                    preferred_qualifications: {
                        $exists: true,
                        $ne: null,
                        $ne: 'No description available.',
                        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                    },
                    // 인재상 (선택, 원하는 인재상)
                    ideal_candidate: {
                        $exists: true,
                        $ne: null,
                        $ne: 'No description available.',
                        $nin: ['Unknown Company', '알 수 없음', '명시되지 않음', '명시되지 언급되지 않음', '']
                    },
                };
                sortOptions = {};
                sortOptions['_id'] = 1; // 텍스트 필드는 오름차순
                return [4 /*yield*/, RecruitInfoClaude.countDocuments(completeDataQuery)];
            case 2:
                total = _e.sent();
                return [4 /*yield*/, RecruitInfoClaude.countDocuments({})];
            case 3:
                totalAll = _e.sent();
                completeRatio = totalAll > 0 ? (total / totalAll * 100).toFixed(2) : 0;
                return [4 /*yield*/, RecruitInfoClaude.find(completeDataQuery)
                        .sort(sortOptions)
                        .skip(skip)
                        .limit(limitNum)];
            case 4:
                jobs = _e.sent();
                logger.info(jobs);
                // 응답 전송
                res.status(200).json({
                    success: true,
                    total: total,
                    totalAll: totalAll,
                    completeRatio: completeRatio,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum),
                    jobs: jobs
                });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _e.sent();
                logger.error('완전한 Claude 채용정보 조회 오류:', error_5);
                res.status(500).json({
                    success: false,
                    error: '완전한 Claude 채용정보를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
/**
 * 데이터 완성도 통계 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getCompletionStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalDocs_1, fieldStats, stats, completeDataCount, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.countDocuments({})];
            case 2:
                totalDocs_1 = _a.sent();
                fieldStats = [
                    { field: 'company_name', display: '회사명' },
                    { field: 'job_type', display: '직무타입' },
                    { field: 'experience', display: '경력' },
                    { field: 'description', display: '설명' },
                    { field: 'requirements', display: '요구사항' },
                    { field: 'preferred_qualifications', display: '우대사항' }
                ];
                return [4 /*yield*/, Promise.all(fieldStats.map(function (item) { return __awaiter(void 0, void 0, void 0, function () {
                        var filledCount, unknownValues, unknownCount;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, RecruitInfoClaude.countDocuments((_a = {},
                                        _a[item.field] = { $exists: true, $ne: null, $ne: '' },
                                        _a))];
                                case 1:
                                    filledCount = _c.sent();
                                    unknownValues = ['Unknown', '알 수 없음', '명시되지 않음'];
                                    return [4 /*yield*/, RecruitInfoClaude.countDocuments((_b = {},
                                            _b[item.field] = { $in: unknownValues },
                                            _b))];
                                case 2:
                                    unknownCount = _c.sent();
                                    return [2 /*return*/, {
                                            field: item.field,
                                            display: item.display,
                                            filled: filledCount,
                                            unknown: unknownCount,
                                            empty: totalDocs_1 - filledCount,
                                            filledPercentage: ((filledCount / totalDocs_1) * 100).toFixed(2),
                                            unknownPercentage: ((unknownCount / totalDocs_1) * 100).toFixed(2),
                                            emptyPercentage: (((totalDocs_1 - filledCount) / totalDocs_1) * 100).toFixed(2)
                                        }];
                            }
                        });
                    }); }))];
            case 3:
                stats = _a.sent();
                return [4 /*yield*/, RecruitInfoClaude.countDocuments({
                        company_name: {
                            $exists: true, $ne: null, $ne: '',
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음']
                        },
                        job_type: { $exists: true, $ne: null, $nin: ['Unknown Company', '알 수 없음', '명시되지 않음'] },
                        experience: { $exists: true, $ne: null, $nin: ['Unknown Company', '알 수 없음', '명시되지 않음'] },
                        description: {
                            $exists: true, $ne: null, $ne: '',
                            $nin: ['Unknown Company', '알 수 없음', '명시되지 않음']
                        }
                    })];
            case 4:
                completeDataCount = _a.sent();
                // 응답 전송
                res.status(200).json({
                    success: true,
                    totalDocuments: totalDocs_1,
                    completeDocuments: completeDataCount,
                    completePercentage: ((completeDataCount / totalDocs_1) * 100).toFixed(2),
                    fieldStats: stats
                });
                return [3 /*break*/, 6];
            case 5:
                error_6 = _a.sent();
                res.status(500).json({
                    success: false,
                    error: '채용정보 완성도 통계를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
module.exports = exports;
