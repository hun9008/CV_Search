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
var _a = require('@models/visitResult'), VisitResult = _a.VisitResult, SubUrl = _a.SubUrl;
var mongoService = require('@database/mongodb-service').mongoService;
var logger = require('@utils/logger').defaultLogger;
/**
 * Get search results with optional keyword filtering
 */
exports.getResults = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, keywords, _b, limit, _c, page, parsedKeywords, parsedLimit, parsedPage, skip, query, keywordConditions, aggregationPipeline, countPipeline, results, countResults, totalCount, response, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 4, , 5]);
                // MongoDB 연결 확인
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // MongoDB 연결 확인
                _d.sent();
                _a = req.query, keywords = _a.keywords, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.page, page = _c === void 0 ? 1 : _c;
                parsedKeywords = keywords ? keywords.split(',').map(function (k) { return k.trim(); }).filter(Boolean) : [];
                parsedLimit = parseInt(limit) || 50;
                parsedPage = parseInt(page) || 1;
                skip = (parsedPage - 1) * parsedLimit;
                query = {};
                // 키워드가 있는 경우 텍스트 검색 조건 추가
                if (parsedKeywords.length > 0) {
                    keywordConditions = parsedKeywords.map(function (keyword) { return ({
                        $or: [
                            { 'suburl_list.text': { $regex: keyword, $options: 'i' } },
                            { 'suburl_list.title': { $regex: keyword, $options: 'i' } },
                            { 'suburl_list.meta.description': { $regex: keyword, $options: 'i' } }
                        ]
                    }); });
                    // 최종 쿼리에 키워드 조건 추가 (AND 조건으로 모든 키워드 포함)
                    query = { $and: keywordConditions };
                }
                // 방문한 URL만 포함하도록 조건 추가
                query['suburl_list.visited'] = true;
                query['suburl_list.success'] = true;
                aggregationPipeline = __spreadArray(__spreadArray([
                    { $match: query },
                    { $unwind: '$suburl_list' },
                    { $match: { 'suburl_list.visited': true, 'suburl_list.success': true } }
                ], (parsedKeywords.length > 0 ? [
                    {
                        $match: {
                            $or: parsedKeywords.map(function (keyword) { return ({
                                $or: [
                                    { 'suburl_list.text': { $regex: keyword, $options: 'i' } },
                                    { 'suburl_list.title': { $regex: keyword, $options: 'i' } },
                                    { 'suburl_list.meta.description': { $regex: keyword, $options: 'i' } }
                                ]
                            }); })
                        }
                    }
                ] : []), true), [
                    {
                        $project: {
                            _id: 0,
                            domain: 1,
                            url: '$suburl_list.url',
                            text: '$suburl_list.text',
                            title: '$suburl_list.title',
                            createdAt: '$suburl_list.created_at',
                            visitedAt: '$suburl_list.visitedAt',
                            meta: '$suburl_list.meta'
                        }
                    },
                    { $sort: { visitedAt: -1 } },
                    { $skip: skip },
                    { $limit: parsedLimit }
                ], false);
                countPipeline = __spreadArray(__spreadArray([
                    { $match: query },
                    { $unwind: '$suburl_list' },
                    { $match: { 'suburl_list.visited': true, 'suburl_list.success': true } }
                ], (parsedKeywords.length > 0 ? [
                    {
                        $match: {
                            $or: parsedKeywords.map(function (keyword) { return ({
                                $or: [
                                    { 'suburl_list.text': { $regex: keyword, $options: 'i' } },
                                    { 'suburl_list.title': { $regex: keyword, $options: 'i' } },
                                    { 'suburl_list.meta.description': { $regex: keyword, $options: 'i' } }
                                ]
                            }); })
                        }
                    }
                ] : []), true), [
                    { $count: 'totalCount' }
                ], false);
                return [4 /*yield*/, VisitResult.aggregate(aggregationPipeline)];
            case 2:
                results = _d.sent();
                return [4 /*yield*/, VisitResult.aggregate(countPipeline)];
            case 3:
                countResults = _d.sent();
                totalCount = countResults.length > 0 ? countResults[0].totalCount : 0;
                logger.info("\uAC80\uC0C9 \uC644\uB8CC: \uD0A4\uC6CC\uB4DC [".concat(parsedKeywords.join(', '), "], ").concat(totalCount, "\uAC1C \uACB0\uACFC \uC911 ").concat(results.length, "\uAC1C \uBC18\uD658"));
                response = {
                    success: true,
                    totalResults: totalCount,
                    currentPage: parsedPage,
                    resultsPerPage: parsedLimit,
                    totalPages: Math.ceil(totalCount / parsedLimit),
                    keywords: parsedKeywords,
                    results: results.map(function (item) {
                        var _a, _b;
                        return ({
                            domain: item.domain,
                            url: item.url,
                            title: item.title || '',
                            text: item.text || '',
                            meta: {
                                description: ((_a = item.meta) === null || _a === void 0 ? void 0 : _a.description) || '',
                                keywords: ((_b = item.meta) === null || _b === void 0 ? void 0 : _b.keywords) || ''
                            },
                            createdAt: item.createdAt,
                            visitedAt: item.visitedAt
                        });
                    })
                };
                res.status(200).json(response);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _d.sent();
                logger.error('검색 오류:', error_1);
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
/**
 * Get detailed information for a specific URL
 */
exports.getUrlDetails = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var url, decodedUrl, result, urlData, subUrl, response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // MongoDB 연결 확인
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // MongoDB 연결 확인
                _a.sent();
                url = req.params.url;
                if (!url) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'URL is required' })];
                }
                decodedUrl = decodeURIComponent(url);
                logger.info("URL \uC0C1\uC138 \uC815\uBCF4 \uC694\uCCAD: ".concat(decodedUrl));
                return [4 /*yield*/, VisitResult.findOne({ 'suburl_list.url': decodedUrl }, { 'suburl_list.$': 1, domain: 1 })];
            case 2:
                result = _a.sent();
                if (!result || !result.suburl_list || result.suburl_list.length === 0) {
                    logger.warn("URL\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C: ".concat(decodedUrl));
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'URL not found' })];
                }
                urlData = result.suburl_list[0];
                subUrl = new SubUrl(urlData);
                response = {
                    success: true,
                    result: {
                        domain: result.domain,
                        url: urlData.url,
                        title: urlData.title || '',
                        text: urlData.text || '',
                        meta: urlData.meta || {},
                        visited: urlData.visited,
                        visitedAt: urlData.visitedAt,
                        success: urlData.success,
                        crawlStats: urlData.crawlStats || {},
                        finalUrl: urlData.finalUrl,
                        redirected: urlData.redirected,
                        error: urlData.error,
                        createdAt: urlData.created_at
                    }
                };
                logger.info("URL \uC0C1\uC138 \uC815\uBCF4 \uBC18\uD658: ".concat(decodedUrl));
                res.status(200).json(response);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                logger.error('URL 상세 정보 오류:', error_2);
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Get domains with their stats
 */
exports.getDomainStats = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, limit, _c, page, parsedLimit, parsedPage, skip, aggregationPipeline, totalCount, domains, summary, response, error_3;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 5, , 6]);
                // MongoDB 연결 확인
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // MongoDB 연결 확인
                _d.sent();
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.page, page = _c === void 0 ? 1 : _c;
                parsedLimit = parseInt(limit) || 20;
                parsedPage = parseInt(page) || 1;
                skip = (parsedPage - 1) * parsedLimit;
                logger.info("\uB3C4\uBA54\uC778 \uD1B5\uACC4 \uC694\uCCAD: \uD398\uC774\uC9C0 ".concat(parsedPage, ", \uD56D\uBAA9 \uC218 ").concat(parsedLimit));
                aggregationPipeline = [
                    {
                        $project: {
                            domain: 1,
                            totalUrls: { $size: '$suburl_list' },
                            visitedUrls: {
                                $size: {
                                    $filter: {
                                        input: '$suburl_list',
                                        as: 'url',
                                        cond: { $eq: ['$$url.visited', true] }
                                    }
                                }
                            },
                            successUrls: {
                                $size: {
                                    $filter: {
                                        input: '$suburl_list',
                                        as: 'url',
                                        cond: { $and: [{ $eq: ['$$url.visited', true] }, { $eq: ['$$url.success', true] }] }
                                    }
                                }
                            },
                            lastVisited: { $max: '$suburl_list.visitedAt' },
                            created_at: 1,
                            updated_at: 1
                        }
                    },
                    {
                        $addFields: {
                            pendingUrls: { $subtract: ['$totalUrls', '$visitedUrls'] },
                            visitRate: {
                                $cond: [
                                    { $eq: ['$totalUrls', 0] },
                                    0,
                                    { $multiply: [{ $divide: ['$visitedUrls', '$totalUrls'] }, 100] }
                                ]
                            }
                        }
                    },
                    { $sort: { visitedUrls: -1, domain: 1 } },
                    { $skip: skip },
                    { $limit: parsedLimit }
                ];
                return [4 /*yield*/, VisitResult.countDocuments({})];
            case 2:
                totalCount = _d.sent();
                return [4 /*yield*/, VisitResult.aggregate(aggregationPipeline)];
            case 3:
                domains = _d.sent();
                return [4 /*yield*/, VisitResult.aggregate([
                        {
                            $group: {
                                _id: null,
                                totalDomains: { $sum: 1 },
                                totalUrls: { $sum: { $size: '$suburl_list' } },
                                visitedUrls: {
                                    $sum: {
                                        $size: {
                                            $filter: {
                                                input: '$suburl_list',
                                                as: 'url',
                                                cond: { $eq: ['$$url.visited', true] }
                                            }
                                        }
                                    }
                                },
                                successUrls: {
                                    $sum: {
                                        $size: {
                                            $filter: {
                                                input: '$suburl_list',
                                                as: 'url',
                                                cond: { $and: [{ $eq: ['$$url.visited', true] }, { $eq: ['$$url.success', true] }] }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                pendingUrls: { $subtract: ['$totalUrls', '$visitedUrls'] },
                                activeDomains: { $size: { $filter: {
                                            input: { $literal: domains },
                                            as: 'domain',
                                            cond: { $gt: ['$$domain.totalUrls', 0] }
                                        } } }
                            }
                        }
                    ])];
            case 4:
                summary = _d.sent();
                logger.info("\uB3C4\uBA54\uC778 \uD1B5\uACC4 \uC870\uD68C \uC644\uB8CC: ".concat(domains.length, "\uAC1C \uB3C4\uBA54\uC778 \uC815\uBCF4 \uBC18\uD658"));
                response = {
                    success: true,
                    totalDomains: totalCount,
                    currentPage: parsedPage,
                    domainsPerPage: parsedLimit,
                    totalPages: Math.ceil(totalCount / parsedLimit),
                    summary: summary.length > 0 ? {
                        totalDomains: summary[0].totalDomains,
                        activeDomains: summary[0].activeDomains,
                        totalUrls: summary[0].totalUrls,
                        visitedUrls: summary[0].visitedUrls,
                        pendingUrls: summary[0].pendingUrls,
                        successUrls: summary[0].successUrls,
                        visitRate: summary[0].totalUrls > 0 ?
                            (summary[0].visitedUrls / summary[0].totalUrls * 100).toFixed(2) + '%' : '0%'
                    } : {
                        totalDomains: 0,
                        activeDomains: 0,
                        totalUrls: 0,
                        visitedUrls: 0,
                        pendingUrls: 0,
                        successUrls: 0,
                        visitRate: '0%'
                    },
                    domains: domains.map(function (domain) { return ({
                        domain: domain.domain,
                        totalUrls: domain.totalUrls,
                        visitedUrls: domain.visitedUrls,
                        pendingUrls: domain.pendingUrls,
                        successUrls: domain.successUrls,
                        visitRate: domain.visitRate.toFixed(2) + '%',
                        lastVisited: domain.lastVisited,
                        createdAt: domain.created_at,
                        updatedAt: domain.updated_at
                    }); })
                };
                res.status(200).json(response);
                return [3 /*break*/, 6];
            case 5:
                error_3 = _d.sent();
                logger.error('도메인 통계 오류:', error_3);
                next(error_3);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
/**
 * Reset visited status for all URLs or URLs with failed visits
 */
exports.resetVisitedStatus = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, domain, onlyFailed, result, filter, updateResult, filter, updateResult, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                // MongoDB 연결 확인
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                // MongoDB 연결 확인
                _b.sent();
                _a = req.query, domain = _a.domain, onlyFailed = _a.onlyFailed;
                logger.info("\uBC29\uBB38 \uC0C1\uD0DC \uCD08\uAE30\uD654 \uC694\uCCAD: \uB3C4\uBA54\uC778=".concat(domain || '전체', ", \uC2E4\uD328\uB9CC=").concat(onlyFailed ? '예' : '아니오'));
                result = void 0;
                if (!(onlyFailed === 'true')) return [3 /*break*/, 3];
                filter = domain ? { domain: domain } : {};
                return [4 /*yield*/, VisitResult.updateMany(filter, { $set: { 'suburl_list.$[elem].visited': false, 'suburl_list.$[elem].updated_at': new Date() } }, {
                        arrayFilters: [{ 'elem.visited': true, 'elem.success': false }],
                        multi: true
                    })];
            case 2:
                updateResult = _b.sent();
                result = {
                    success: true,
                    message: "".concat(updateResult.modifiedCount, "\uAC1C\uC758 \uC2E4\uD328\uD55C URL \uBC29\uBB38 \uC0C1\uD0DC\uAC00 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4."),
                    modifiedCount: updateResult.modifiedCount,
                    matchedCount: updateResult.matchedCount
                };
                return [3 /*break*/, 5];
            case 3:
                filter = domain ? { domain: domain } : {};
                return [4 /*yield*/, VisitResult.updateMany(filter, { $set: { 'suburl_list.$[elem].visited': false, 'suburl_list.$[elem].updated_at': new Date() } }, {
                        arrayFilters: [{ 'elem.visited': true }],
                        multi: true
                    })];
            case 4:
                updateResult = _b.sent();
                result = {
                    success: true,
                    message: "".concat(updateResult.modifiedCount, "\uAC1C\uC758 URL \uBC29\uBB38 \uC0C1\uD0DC\uAC00 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4."),
                    modifiedCount: updateResult.modifiedCount,
                    matchedCount: updateResult.matchedCount
                };
                _b.label = 5;
            case 5:
                logger.info("\uBC29\uBB38 \uC0C1\uD0DC \uCD08\uAE30\uD654 \uC644\uB8CC: ".concat(result.message));
                res.status(200).json(result);
                return [3 /*break*/, 7];
            case 6:
                error_4 = _b.sent();
                logger.error('방문 상태 초기화 오류:', error_4);
                next(error_4);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
module.exports = exports;
