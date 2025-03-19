const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

/**
 * @route   GET /api/search
 * @desc    Get search results with optional keyword filtering
 * @query   {string} keywords - Comma-separated list of keywords to search for
 * @query   {number} limit - Maximum number of results to return (default: 50)
 * @query   {number} page - Page number for pagination (default: 1)
 * @access  Public
 */
router.get('/search', dataController.getResults);

module.exports = router;