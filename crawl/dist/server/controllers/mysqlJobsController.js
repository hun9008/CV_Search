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
var mysqlService = require('@database/mysql-service').mysqlService;
var logger = require('@utils/logger').defaultLogger;
/**
 * MySQL 채용공고 테이블 생성 (존재하지 않을 경우)
 */
var createTableIfNotExists = function () { return __awaiter(void 0, void 0, void 0, function () {
    var sql, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sql = "\n      CREATE TABLE IF NOT EXISTS jobs (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        title VARCHAR(255) NOT NULL,\n        company_name VARCHAR(255) NOT NULL,\n        job_type VARCHAR(100),\n        experience VARCHAR(100),\n        department VARCHAR(100),\n        description TEXT,\n        requirements TEXT,\n        preferred_qualifications TEXT,\n        ideal_candidate TEXT,\n        url VARCHAR(500),\n        posted_at DATETIME,\n        end_date DATETIME,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n      )\n    ";
                return [4 /*yield*/, mysqlService.query(sql)];
            case 1:
                _a.sent();
                logger.info('MySQL jobs 테이블이 확인/생성되었습니다.');
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger.error('MySQL 테이블 생성 오류:', error_1);
                throw error_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * 모든 MySQL 채용공고 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getMySqlJobs = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, search, _c, jobType, _d, experience, _e, sortBy, _f, limit, _g, page, limitNum, pageNum, offset, sql, params, searchParam, jobs, countSql, countParams, searchParam, countResult, total, error_2;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 4, , 5]);
                return [4 /*yield*/, createTableIfNotExists()];
            case 1:
                _h.sent();
                _a = req.query, _b = _a.search, search = _b === void 0 ? '' : _b, _c = _a.jobType, jobType = _c === void 0 ? '' : _c, _d = _a.experience, experience = _d === void 0 ? '' : _d, _e = _a.sortBy, sortBy = _e === void 0 ? 'created_at' : _e, _f = _a.limit, limit = _f === void 0 ? 50 : _f, _g = _a.page, page = _g === void 0 ? 1 : _g;
                limitNum = parseInt(limit) || 50;
                pageNum = parseInt(page) || 1;
                offset = (pageNum - 1) * limitNum;
                sql = 'SELECT * FROM jobs WHERE 1=1';
                params = [];
                // 검색 필터
                if (search) {
                    sql += ' AND (title LIKE ? OR company_name LIKE ? OR description LIKE ?)';
                    searchParam = "%".concat(search, "%");
                    params.push(searchParam, searchParam, searchParam);
                }
                // 직무 유형 필터
                if (jobType) {
                    sql += ' AND job_type LIKE ?';
                    params.push("%".concat(jobType, "%"));
                }
                // 경력 필터
                if (experience) {
                    sql += ' AND experience LIKE ?';
                    params.push("%".concat(experience, "%"));
                }
                // 정렬
                sql += " ORDER BY ".concat(sortBy === 'created_at' ? 'created_at DESC' :
                    sortBy === 'company_name' ? 'company_name ASC' :
                        sortBy === 'job_type' ? 'job_type ASC' : 'created_at DESC');
                // 페이징
                sql += ' LIMIT ? OFFSET ?';
                params.push(limitNum, offset);
                return [4 /*yield*/, mysqlService.query(sql, params)];
            case 2:
                jobs = _h.sent();
                countSql = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
                countParams = [];
                if (search) {
                    countSql += ' AND (title LIKE ? OR company_name LIKE ? OR description LIKE ?)';
                    searchParam = "%".concat(search, "%");
                    countParams.push(searchParam, searchParam, searchParam);
                }
                if (jobType) {
                    countSql += ' AND job_type LIKE ?';
                    countParams.push("%".concat(jobType, "%"));
                }
                if (experience) {
                    countSql += ' AND experience LIKE ?';
                    countParams.push("%".concat(experience, "%"));
                }
                return [4 /*yield*/, mysqlService.query(countSql, countParams)];
            case 3:
                countResult = _h.sent();
                total = countResult[0].total;
                // 응답
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
                error_2 = _h.sent();
                logger.error('MySQL 채용정보 조회 오류:', error_2);
                res.status(500).json({
                    success: false,
                    error: 'MySQL 채용정보를 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
/**
 * MySQL에 채용공고 저장
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.saveJobToMySql = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, company_name, job_type, experience, department, description, requirements, preferred_qualifications, ideal_candidate, url, posted_at, end_date, sql, params, result, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, createTableIfNotExists()];
            case 1:
                _b.sent();
                _a = req.body, title = _a.title, company_name = _a.company_name, job_type = _a.job_type, experience = _a.experience, department = _a.department, description = _a.description, requirements = _a.requirements, preferred_qualifications = _a.preferred_qualifications, ideal_candidate = _a.ideal_candidate, url = _a.url, posted_at = _a.posted_at, end_date = _a.end_date;
                // 필수 필드 검증
                if (!title || !company_name) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: '제목과 회사명은 필수 항목입니다.'
                        })];
                }
                sql = "\n      INSERT INTO jobs (\n        title, company_name, job_type, experience, department,\n        description, requirements, preferred_qualifications,\n        ideal_candidate, url, posted_at, end_date\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ";
                params = [
                    title, company_name, job_type || null, experience || null, department || null,
                    description || null, requirements || null, preferred_qualifications || null,
                    ideal_candidate || null, url || null,
                    posted_at ? new Date(posted_at) : null,
                    end_date ? new Date(end_date) : null
                ];
                return [4 /*yield*/, mysqlService.query(sql, params)];
            case 2:
                result = _b.sent();
                res.status(201).json({
                    success: true,
                    message: '채용공고가 MySQL에 저장되었습니다.',
                    id: result.insertId
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                logger.error('MySQL 채용정보 저장 오류:', error_3);
                res.status(500).json({
                    success: false,
                    error: 'MySQL에 채용정보를 저장하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * MySQL 채용공고 필터 옵션 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getMySqlJobFilters = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var jobTypesSql, jobTypes, experienceSql, experienceLevels, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, createTableIfNotExists()];
            case 1:
                _a.sent();
                jobTypesSql = 'SELECT DISTINCT job_type FROM jobs WHERE job_type IS NOT NULL';
                return [4 /*yield*/, mysqlService.query(jobTypesSql)];
            case 2:
                jobTypes = _a.sent();
                experienceSql = 'SELECT DISTINCT experience FROM jobs WHERE experience IS NOT NULL';
                return [4 /*yield*/, mysqlService.query(experienceSql)];
            case 3:
                experienceLevels = _a.sent();
                res.status(200).json({
                    success: true,
                    jobTypes: jobTypes.map(function (item) { return item.job_type; }).filter(Boolean),
                    experienceLevels: experienceLevels.map(function (item) { return item.experience; }).filter(Boolean)
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                logger.error('MySQL 채용정보 필터 옵션 조회 오류:', error_4);
                res.status(500).json({
                    success: false,
                    error: 'MySQL 채용정보 필터 옵션을 조회하는 중 오류가 발생했습니다.'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
module.exports = exports;
