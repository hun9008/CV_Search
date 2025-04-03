const express = require('express');
const router = express.Router();
const claudeJobsController = require('../controllers/claudeJobsController'); // Added Claude controller
const dataController = require('../controllers/dataController');
const jobsController = require('../controllers/jobsController');
const statsController = require('../controllers/statsController');
const { GeminiService } = require('@parse/geminiService');
const { defaultLogger: logger } = require('@utils/logger');

// GeminiService 인스턴스 생성
const geminiService = new GeminiService();

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
router.post('/parse-cv', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      logger.warn('내용이 제공되지 않은 요청');
      return res.status(400).json({ success: false, error: '내용이 제공되지 않았습니다' });
    }

    logger.info('채용공고 분석 요청', { contentLength: content.length });

    // GeminiService를 사용하여 채용공고 분석
    const result = await geminiService.parseRecruitment(content);

    // 결과 반환
    return res.status(200).json(result);

  } catch (error) {
    logger.error('텍스트 처리 중 오류 발생:', error);

    // JSON 파싱 오류인 경우
    if (error.message.includes('JSON')) {
      return res.status(500).json({
        success: false,
        error: 'JSON 파싱 오류',
        message: error.message
      });
    }

    // 일반 오류
    return res.status(500).json({
      success: false,
      error: error.message || '텍스트를 파싱하는 중 오류가 발생했습니다'
    });
  }
});


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

module.exports = router;