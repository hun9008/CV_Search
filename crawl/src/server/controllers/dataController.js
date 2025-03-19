const { MongoDBService } = require('@database/mongodb-service');

/**
 * Get search results with optional keyword filtering
 */

const mongoService = new MongoDBService();
exports.getResults = async (req, res, next) => {
  try {
    const { keywords, limit = 50, page = 1 } = req.query;

    // Parse keywords and limit
    const parsedKeywords = keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
    const parsedLimit = parseInt(limit) || 50;
    const parsedPage = parseInt(page) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    // Execute search
    const results = await mongoService.searchByKeywords(parsedKeywords, parsedLimit, skip);
    const totalCount = await mongoService.countResults(parsedKeywords);

    // Format response
    const response = {
      success: true,
      totalResults: totalCount,
      currentPage: parsedPage,
      resultsPerPage: parsedLimit,
      totalPages: Math.ceil(totalCount / parsedLimit),
      keywords: parsedKeywords,
      results: results.map(item => ({
        domain: item.domain,
        url: item.url,
        text: item.text || '',
        createdAt: item.createdAt
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};