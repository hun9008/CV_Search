import express, { Request, Response } from 'express';
// import claudeJobsController from '../controllers/claudeJobsController';
import dataController from '../controllers/dataController';
import jobsController from '../controllers/jobsController';
import statsController from '../controllers/statsController';
// import mysqlJobsController from '../controllers/mysqlJobsController';
import { defaultLogger as logger } from '../../utils/logger';

const router = express.Router();

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
 * @route   GET /api/favicon/:domain
 * @desc    Get favicon for specific domain
 * @param   {string} domain - Domain to get favicon for
 * @returns {Object} Favicon data for the domain
 * @access  Public
 */
router.get('/favicon/:domain', dataController.getFavicon);

/**
 * @route   GET /api/favicons
 * @desc    Get list of all domains with favicons
 * @returns {Array} List of domains with favicons
 * @access  Public
 */
router.get('/favicons', dataController.getAllFavicons);

/**
 * @route   POST /api/parse-cv
 * @desc    텍스트를 분석하여 채용공고인지 판별하고 정보 추출
 * @body    {string} content - 분석할 텍스트 내용
 * @returns {Object} 분석 결과 및 추출된 채용 정보
 * @access  Public
 */

// 통계 라우트
router.get('/stats', statsController.getStats);
router.get('/stats/job-types', statsController.getJobTypeStats);
router.get('/stats/experience', statsController.getExperienceStats);
router.get('/stats/domains', statsController.getDomainStats);
router.get('/stats/urls', statsController.getUrlStats);

router.get('/jobs', jobsController.getJobs);
router.get('/jobs/:id', jobsController.getJobById);

// // Claude 채용 정보 라우트
// router.get('/recruitinfos-claude', claudeJobsController.getClaudeJobs);
// router.get('/recruitinfos-claude/filters', claudeJobsController.getClaudeJobFilters);
// router.get('/recruitinfos-claude/:id', claudeJobsController.getClaudeJobById);
// router.get('/stats/claude', claudeJobsController.getClaudeJobStats);

// // 완전한 데이터를 가진 Claude 채용공고 조회 API
// router.get('/recruitinfos-claude-complete', claudeJobsController.getCompleteClaudeJobs);

// Claude 채용정보 데이터 완성도 통계 API
// router.get('/recruitinfos-claude/completion-stats', claudeJobsController.getCompletionStats);

// MySQL 채용공고 API 라우트
// router.get('/mysql-jobs', mysqlJobsController.getMySqlJobs);
// router.post('/mysql-jobs', mysqlJobsController.saveJobToMySql);
// router.get('/mysql-jobs/filters', mysqlJobsController.getMySqlJobFilters);

export default router;