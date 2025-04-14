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
var mysql = require('mysql2/promise');
var logger = require('@utils/logger').defaultLogger;
var MySqlService = /** @class */ (function () {
    function MySqlService() {
        this.pool = null;
    }
    MySqlService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connection, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.pool) {
                            return [2 /*return*/, this.pool];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.pool = mysql.createPool({
                            uri: process.env.RDB_URL,
                            user: process.env.RDB_USERNAME,
                            password: process.env.RDB_PASSWORD,
                            waitForConnections: true,
                            connectionLimit: 10,
                            queueLimit: 0
                        });
                        return [4 /*yield*/, this.pool.getConnection()];
                    case 2:
                        connection = _a.sent();
                        logger.info('MySQL 데이터베이스에 연결되었습니다.');
                        connection.release();
                        return [2 /*return*/, this.pool];
                    case 3:
                        error_1 = _a.sent();
                        logger.error('MySQL 연결 오류:', error_1);
                        throw new Error('MySQL 데이터베이스 연결 실패');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MySqlService.prototype.query = function (sql, params) {
        return __awaiter(this, void 0, void 0, function () {
            var results, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.pool.query(sql, params)];
                    case 2:
                        results = (_a.sent())[0];
                        return [2 /*return*/, results];
                    case 3:
                        error_2 = _a.sent();
                        logger.error('MySQL 쿼리 오류:', { error: error_2.message });
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * URL을 키로 사용하여 채용 공고 데이터를 업서트(upsert)합니다.
     * 동일한 URL이 있으면 업데이트하고, 없으면 새로 추가합니다.
     * @param {Object} jobData - 채용공고 데이터
     * @returns {boolean} - 성공 여부
     */ MySqlService.prototype.upsertJobByUrl = function (jobData) {
        return __awaiter(this, void 0, void 0, function () {
            var insertSql, insertParams, checkSql, existingJobs, updateSql, updateParams, insertSql, insertParams, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        if (!!jobData.url) return [3 /*break*/, 2];
                        insertSql = "\n        INSERT INTO jobs (\n          title, company_name, job_type, experience, department,\n          description, requirements, preferred_qualifications,\n          ideal_candidate, url, raw_jobs_text, posted_at, end_date, created_at, updated_at\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n      ";
                        insertParams = [
                            jobData.title, jobData.company_name, jobData.job_type, jobData.experience,
                            jobData.department, jobData.description, jobData.requirements,
                            jobData.preferred_qualifications, jobData.ideal_candidate, null,
                            jobData.raw_jobs_text, // raw_jobs_text 필드 추가
                            jobData.posted_at, jobData.end_date, jobData.created_at || new Date(),
                            jobData.updated_at || new Date()
                        ];
                        return [4 /*yield*/, this.query(insertSql, insertParams)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        checkSql = 'SELECT id FROM jobs WHERE url = ?';
                        return [4 /*yield*/, this.query(checkSql, [jobData.url])];
                    case 3:
                        existingJobs = _a.sent();
                        if (!(existingJobs.length > 0)) return [3 /*break*/, 5];
                        updateSql = "\n        UPDATE jobs SET\n          title = ?,\n          company_name = ?,\n          job_type = ?,\n          experience = ?,\n          department = ?,\n          description = ?,\n          requirements = ?,\n          preferred_qualifications = ?,\n          ideal_candidate = ?,\n          raw_jobs_text = ?,\n          posted_at = ?,\n          end_date = ?,\n          updated_at = ?\n        WHERE url = ?\n      ";
                        updateParams = [
                            jobData.title, jobData.company_name, jobData.job_type, jobData.experience,
                            jobData.department, jobData.description, jobData.requirements,
                            jobData.preferred_qualifications, jobData.ideal_candidate,
                            jobData.raw_jobs_text, // raw_jobs_text 필드 추가
                            jobData.posted_at, jobData.end_date, new Date(), jobData.url
                        ];
                        return [4 /*yield*/, this.query(updateSql, updateParams)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        insertSql = "\n        INSERT INTO jobs (\n          title, company_name, job_type, experience, department,\n          description, requirements, preferred_qualifications,\n          ideal_candidate, url, raw_jobs_text, posted_at, end_date, created_at, updated_at\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n      ";
                        insertParams = [
                            jobData.title, jobData.company_name, jobData.job_type, jobData.experience,
                            jobData.department, jobData.description, jobData.requirements,
                            jobData.preferred_qualifications, jobData.ideal_candidate, jobData.url,
                            jobData.raw_jobs_text, // raw_jobs_text 필드 추가
                            jobData.posted_at, jobData.end_date, new Date(), new Date()
                        ];
                        return [4 /*yield*/, this.query(insertSql, insertParams)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, true];
                    case 8:
                        error_3 = _a.sent();
                        logger.error('MySQL 업서트 오류:', error_3);
                        return [2 /*return*/, false];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return MySqlService;
}());
var mysqlService = new MySqlService();
module.exports = { mysqlService: mysqlService };
