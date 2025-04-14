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
require('dotenv').config();
require('module-alias/register');
var logger = require('@utils/logger').defaultLogger;
var mysqlService = require('../database/mysql-service').mysqlService;
var mongoService = require('@database/mongodb-service').mongoService;
var mongoose = require('mongoose');
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
function processJobData(jobData) {
    return __awaiter(this, void 0, void 0, function () {
        var formattedData, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // 필수 필드가 있는지 확인
                    if (!jobData.title || !jobData.company_name) {
                        logger.warn('불완전한 데이터 건너뜀:', { id: jobData._id || 'unknown' });
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    formattedData = {
                        title: jobData.title,
                        company_name: jobData.company_name,
                        description: jobData.description || '',
                        url: jobData.url || null,
                        job_type: jobData.job_type || null,
                        experience: jobData.experience || null,
                        department: jobData.department || null,
                        requirements: jobData.requirements || null,
                        preferred_qualifications: jobData.preferred_qualifications || null,
                        ideal_candidate: jobData.ideal_candidate || null,
                        raw_jobs_text: jobData.raw_text || '', // MongoDB의 raw_text를 MySQL의 raw_jobs_text로 매핑
                        posted_at: jobData.posted_at ? new Date(jobData.posted_at) : null,
                        end_date: jobData.end_date ? new Date(jobData.end_date) : null,
                        created_at: new Date(),
                        updated_at: new Date()
                    };
                    return [4 /*yield*/, mysqlService.upsertJobByUrl(formattedData)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 3:
                    error_2 = _a.sent();
                    logger.error('데이터 처리 중 오류:', error_2);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// MongoDB에서 완전한 데이터만 로드하는 함수
var loadCompleteJobsFromMongoDB = timeLog(function loadCompleteJobsFromMongoDB() {
    return __awaiter(this, void 0, void 0, function () {
        var completeDataFilter, completeJobs, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // MongoDB 연결
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    // MongoDB 연결
                    _a.sent();
                    completeDataFilter = {
                        company_name: { $exists: true, $ne: null, $nin: ['Unknown Company', '알 수 없음', '명시되지 않음'] },
                        description: { $exists: true, $ne: null, $ne: 'No description available.' },
                        job_type: { $exists: true, $ne: null, $ne: '' },
                        experience: { $exists: true, $ne: null, $ne: '' }
                    };
                    return [4 /*yield*/, RecruitInfoClaude.find(completeDataFilter).lean()];
                case 2:
                    completeJobs = _a.sent();
                    logger.info("MongoDB\uC5D0\uC11C ".concat(completeJobs.length, "\uAC1C\uC758 \uC644\uC804\uD55C \uCC44\uC6A9\uACF5\uACE0 \uB370\uC774\uD130\uB97C \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4."));
                    return [2 /*return*/, completeJobs];
                case 3:
                    error_3 = _a.sent();
                    logger.error('MongoDB에서 데이터 로드 중 오류:', error_3);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
});
// MongoDB에서 IT 관련 채용공고만 로드하는 함수
var loadItJobsFromMongoDB = timeLog(function loadItJobsFromMongoDB() {
    return __awaiter(this, void 0, void 0, function () {
        var itKeywords, itRegex, itJobsFilter, itJobs, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // MongoDB 연결
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    // MongoDB 연결
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
                        ]
                    };
                    return [4 /*yield*/, RecruitInfoClaude.find(itJobsFilter).lean()];
                case 2:
                    itJobs = _a.sent();
                    logger.info("MongoDB\uC5D0\uC11C ".concat(itJobs.length, "\uAC1C\uC758 IT \uAD00\uB828 \uCC44\uC6A9\uACF5\uACE0 \uB370\uC774\uD130\uB97C \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4."));
                    return [2 /*return*/, itJobs];
                case 3:
                    error_4 = _a.sent();
                    logger.error('MongoDB에서 IT 관련 데이터 로드 중 오류:', error_4);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
});
// MongoDB에서 모든 채용공고 로드하는 함수
var loadAllJobsFromMongoDB = timeLog(function loadAllJobsFromMongoDB() {
    return __awaiter(this, void 0, void 0, function () {
        var allJobs, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // MongoDB 연결
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    // MongoDB 연결
                    _a.sent();
                    return [4 /*yield*/, RecruitInfoClaude.find({}).limit(1000).lean()];
                case 2:
                    allJobs = _a.sent();
                    logger.info("MongoDB\uC5D0\uC11C ".concat(allJobs.length, "\uAC1C\uC758 \uCC44\uC6A9\uACF5\uACE0 \uB370\uC774\uD130\uB97C \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4."));
                    return [2 /*return*/, allJobs];
                case 3:
                    error_5 = _a.sent();
                    logger.error('MongoDB에서 모든 데이터 로드 중 오류:', error_5);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
});
// MongoDB 데이터를 MySQL에 저장하는 함수
var processMongoDB = timeLog(function processMongoDB(jobs) {
    return __awaiter(this, void 0, void 0, function () {
        var successCount, failCount, _i, jobs_1, job, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    successCount = 0;
                    failCount = 0;
                    logger.info("\uCD1D ".concat(jobs.length, "\uAC1C\uC758 \uCC44\uC6A9\uACF5\uACE0 \uCC98\uB9AC \uC2DC\uC791"));
                    _i = 0, jobs_1 = jobs;
                    _a.label = 1;
                case 1:
                    if (!(_i < jobs_1.length)) return [3 /*break*/, 4];
                    job = jobs_1[_i];
                    return [4 /*yield*/, processJobData(job)];
                case 2:
                    success = _a.sent();
                    if (success)
                        successCount++;
                    else
                        failCount++;
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    logger.info("\uCC98\uB9AC \uC644\uB8CC: \uC131\uACF5 ".concat(successCount, ", \uC2E4\uD328 ").concat(failCount));
                    return [2 /*return*/, { successCount: successCount, failCount: failCount }];
            }
        });
    });
});
// 메인 실행 함수
var main = timeLog(function main() {
    return __awaiter(this, void 0, void 0, function () {
        var mode, jobs, _a, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    logger.info('MySQL 데이터 업데이트 시작');
                    mode = process.argv[2] || 'complete';
                    jobs = [];
                    _a = mode;
                    switch (_a) {
                        case 'all': return [3 /*break*/, 1];
                        case 'it': return [3 /*break*/, 3];
                        case 'complete': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 5];
                case 1:
                    logger.info('모든 채용공고 데이터를 MongoDB에서 가져옵니다.');
                    return [4 /*yield*/, loadAllJobsFromMongoDB()];
                case 2:
                    jobs = _b.sent();
                    return [3 /*break*/, 7];
                case 3:
                    logger.info('IT 관련 채용공고 데이터를 MongoDB에서 가져옵니다.');
                    return [4 /*yield*/, loadItJobsFromMongoDB()];
                case 4:
                    jobs = _b.sent();
                    return [3 /*break*/, 7];
                case 5:
                    logger.info('완전한 채용공고 데이터를 MongoDB에서 가져옵니다.');
                    return [4 /*yield*/, loadCompleteJobsFromMongoDB()];
                case 6:
                    jobs = _b.sent();
                    return [3 /*break*/, 7];
                case 7: 
                // 데이터 처리 및 MySQL 저장
                return [4 /*yield*/, processMongoDB(jobs)];
                case 8:
                    // 데이터 처리 및 MySQL 저장
                    _b.sent();
                    logger.info('MySQL 데이터 업데이트 완료');
                    process.exit(0);
                    return [3 /*break*/, 10];
                case 9:
                    error_6 = _b.sent();
                    logger.error('프로그램 실행 중 오류:', error_6);
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
});
// MySQL 서비스 확인
if (!mysqlService.upsertJobByUrl || typeof mysqlService.upsertJobByUrl !== 'function') {
    logger.error('MySQL 서비스가 올바르게 구성되지 않았습니다. upsertJobByUrl 함수가 없습니다.');
    process.exit(1);
}
// 스크립트 실행
main();
