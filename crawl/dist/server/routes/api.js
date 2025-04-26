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
var express = require('express');
var router = express.Router();
var claudeJobsController = require('../controllers/claudeJobsController'); // Added Claude controller
var dataController = require('../controllers/dataController');
var jobsController = require('../controllers/jobsController');
var statsController = require('../controllers/statsController');
var mysqlJobsController = require('../controllers/mysqlJobsController');
var GeminiService = require('@parse/geminiService').GeminiService;
var logger = require('@utils/logger').defaultLogger;
// GeminiService 인스턴스 생성
var geminiService = new GeminiService();
/**
 * @route   GET /api/search
 * @desc    Get search results with optional keyword filtering
 * @query   {string} keywords - Comma-separated list of keywords to search for
 * @query   {number} limit - Maximum number of results to return (default: 50)
 * @query   {number} page - Page number for pagination (default: 1)
 * @access  Public
 */
router.get('/search', dataController.getResults);
/**
 * @route   POST /api/parse-cv
 * @desc    텍스트를 분석하여 채용공고인지 판별하고 정보 추출
 * @body    {string} content - 분석할 텍스트 내용
 * @returns {Object} 분석 결과 및 추출된 채용 정보
 * @access  Public
 */
router.post('/parse-cv', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = req.body.content;
                if (!content) {
                    logger.warn('내용이 제공되지 않은 요청');
                    return [2 /*return*/, res.status(400).json({ success: false, error: '내용이 제공되지 않았습니다' })];
                }
                logger.info('채용공고 분석 요청', { contentLength: content.length });
                return [4 /*yield*/, geminiService.parseRecruitment(content)];
            case 1:
                result = _a.sent();
                // 결과 반환
                return [2 /*return*/, res.status(200).json(result)];
            case 2:
                error_1 = _a.sent();
                logger.error('텍스트 처리 중 오류 발생:', error_1);
                // JSON 파싱 오류인 경우
                if (error_1.message.includes('JSON')) {
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            error: 'JSON 파싱 오류',
                            message: error_1.message
                        })];
                }
                // 일반 오류
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        error: error_1.message || '텍스트를 파싱하는 중 오류가 발생했습니다'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 통계 라우트
router.get('/stats', statsController.getStats);
router.get('/stats/job-types', statsController.getJobTypeStats);
router.get('/stats/experience', statsController.getExperienceStats);
router.get('/stats/domains', statsController.getDomainStats);
router.get('/stats/urls', statsController.getUrlStats);
router.get('/jobs', jobsController.getJobs);
router.get('/jobs/:id', jobsController.getJobById);
// Claude 채용 정보 라우트
router.get('/recruitinfos-claude', claudeJobsController.getClaudeJobs);
router.get('/recruitinfos-claude/filters', claudeJobsController.getClaudeJobFilters);
router.get('/recruitinfos-claude/:id', claudeJobsController.getClaudeJobById);
router.get('/stats/claude', claudeJobsController.getClaudeJobStats);
// 완전한 데이터를 가진 Claude 채용공고 조회 API
router.get('/recruitinfos-claude-complete', claudeJobsController.getCompleteClaudeJobs);
// Claude 채용정보 데이터 완성도 통계 API
router.get('/recruitinfos-claude/completion-stats', claudeJobsController.getCompletionStats);
// MySQL 채용공고 API 라우트
router.get('/mysql-jobs', mysqlJobsController.getMySqlJobs);
router.post('/mysql-jobs', mysqlJobsController.saveJobToMySql);
router.get('/mysql-jobs/filters', mysqlJobsController.getMySqlJobFilters);
module.exports = router;
