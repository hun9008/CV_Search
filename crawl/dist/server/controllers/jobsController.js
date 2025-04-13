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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var logger = require('@utils/logger').defaultLogger;
var mongoService = require('@database/mongodb-service').mongoService;
/**
 * 채용 정보 검색 및 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getJobs = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, keywords, _c, limit, _d, page, limitNum, pageNum, skip, searchQuery, keywordArray, keywordQueries, total, jobs, error_1;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 4, , 5]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _e.sent();
                _a = req.query, _b = _a.keywords, keywords = _b === void 0 ? '' : _b, _c = _a.limit, limit = _c === void 0 ? 50 : _c, _d = _a.page, page = _d === void 0 ? 1 : _d;
                limitNum = parseInt(limit) || 50;
                pageNum = parseInt(page) || 1;
                skip = (pageNum - 1) * limitNum;
                searchQuery = {};
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
                        searchQuery.$and = keywordQueries;
                    }
                }
                return [4 /*yield*/, RecruitInfo.countDocuments(searchQuery)];
            case 2:
                total = _e.sent();
                return [4 /*yield*/, RecruitInfo.find(searchQuery)
                        .sort({ created_at: -1 }) // 최신순으로 정렬
                        .skip(skip)
                        .limit(limitNum)];
            case 3:
                jobs = _e.sent();
                // 응답 전송
                res.status(200).json({
                    success: true,
                    total: total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum),
                    jobs: jobs
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _e.sent();
                logger.error('채용정보 조회 오류:', error_1);
                res.status(500).json({
                    success: false,
                    error: '채용정보를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
/**
 * ID로 특정 채용정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getJobById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, job, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, mongoService.connect()];
            case 1:
                _a.sent();
                id = req.params.id;
                return [4 /*yield*/, RecruitInfo.findById(id)];
            case 2:
                job = _a.sent();
                if (!job) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            error: '해당 ID의 채용정보를 찾을 수 없습니다.'
                        })];
                }
                res.status(200).json({
                    success: true,
                    job: job
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                logger.error('채용정보 상세 조회 오류:', error_2);
                res.status(500).json({
                    success: false,
                    error: '채용정보를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
