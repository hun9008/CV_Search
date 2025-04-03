const { VisitResult, SubUrl } = require('@models/visitResult');
const { mongoService } = require('@database/mongodb-service');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * Get search results with optional keyword filtering
 */
exports.getResults = async (req, res, next) => {
  try {
    // MongoDB 연결 확인
    await mongoService.connect();

    const { keywords, limit = 50, page = 1 } = req.query;

    // Parse keywords and limit
    const parsedKeywords = keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
    const parsedLimit = parseInt(limit) || 50;
    const parsedPage = parseInt(page) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    // 검색 쿼리 생성
    let query = {};

    // 키워드가 있는 경우 텍스트 검색 조건 추가
    if (parsedKeywords.length > 0) {
      // 모든 키워드에 대해 OR 조건 생성
      const keywordConditions = parsedKeywords.map(keyword => ({
        $or: [
          { 'suburl_list.text': { $regex: keyword, $options: 'i' } },
          { 'suburl_list.title': { $regex: keyword, $options: 'i' } },
          { 'suburl_list.meta.description': { $regex: keyword, $options: 'i' } }
        ]
      }));

      // 최종 쿼리에 키워드 조건 추가 (AND 조건으로 모든 키워드 포함)
      query = { $and: keywordConditions };
    }

    // 방문한 URL만 포함하도록 조건 추가
    query['suburl_list.visited'] = true;
    query['suburl_list.success'] = true;

    // 집계 파이프라인을 사용하여 suburl_list에서 필요한 데이터만 추출
    const aggregationPipeline = [
      { $match: query },
      { $unwind: '$suburl_list' },
      { $match: { 'suburl_list.visited': true, 'suburl_list.success': true } },
      // 키워드 조건 추가
      ...(parsedKeywords.length > 0 ? [
        {
          $match: {
            $or: parsedKeywords.map(keyword => ({
              $or: [
                { 'suburl_list.text': { $regex: keyword, $options: 'i' } },
                { 'suburl_list.title': { $regex: keyword, $options: 'i' } },
                { 'suburl_list.meta.description': { $regex: keyword, $options: 'i' } }
              ]
            }))
          }
        }
      ] : []),
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
    ];

    // 결과 카운트를 위한 집계 파이프라인
    const countPipeline = [
      { $match: query },
      { $unwind: '$suburl_list' },
      { $match: { 'suburl_list.visited': true, 'suburl_list.success': true } },
      // 키워드 조건 추가
      ...(parsedKeywords.length > 0 ? [
        {
          $match: {
            $or: parsedKeywords.map(keyword => ({
              $or: [
                { 'suburl_list.text': { $regex: keyword, $options: 'i' } },
                { 'suburl_list.title': { $regex: keyword, $options: 'i' } },
                { 'suburl_list.meta.description': { $regex: keyword, $options: 'i' } }
              ]
            }))
          }
        }
      ] : []),
      { $count: 'totalCount' }
    ];

    // mongoose를 사용하여 집계 실행
    const results = await VisitResult.aggregate(aggregationPipeline);

    // 결과 개수 계산
    const countResults = await VisitResult.aggregate(countPipeline);
    const totalCount = countResults.length > 0 ? countResults[0].totalCount : 0;

    logger.info(`검색 완료: 키워드 [${parsedKeywords.join(', ')}], ${totalCount}개 결과 중 ${results.length}개 반환`);

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
        title: item.title || '',
        text: item.text || '',
        meta: {
          description: item.meta?.description || '',
          keywords: item.meta?.keywords || ''
        },
        createdAt: item.createdAt,
        visitedAt: item.visitedAt
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('검색 오류:', error);
    next(error);
  }
};

/**
 * Get detailed information for a specific URL
 */
exports.getUrlDetails = async (req, res, next) => {
  try {
    // MongoDB 연결 확인
    await mongoService.connect();

    const { url } = req.params;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const decodedUrl = decodeURIComponent(url);

    logger.info(`URL 상세 정보 요청: ${decodedUrl}`);

    // URL 정보 조회
    const result = await VisitResult.findOne(
      { 'suburl_list.url': decodedUrl },
      { 'suburl_list.$': 1, domain: 1 }
    );

    if (!result || !result.suburl_list || result.suburl_list.length === 0) {
      logger.warn(`URL을 찾을 수 없음: ${decodedUrl}`);
      return res.status(404).json({ success: false, message: 'URL not found' });
    }

    const urlData = result.suburl_list[0];

    // 해당 URL에 대한 SubUrl 인스턴스 생성 (메서드 사용을 위해)
    const subUrl = new SubUrl(urlData);

    // 응답 형식 지정
    const response = {
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

    logger.info(`URL 상세 정보 반환: ${decodedUrl}`);
    res.status(200).json(response);
  } catch (error) {
    logger.error('URL 상세 정보 오류:', error);
    next(error);
  }
};

/**
 * Get domains with their stats
 */
exports.getDomainStats = async (req, res, next) => {
  try {
    // MongoDB 연결 확인
    await mongoService.connect();

    const { limit = 20, page = 1 } = req.query;

    const parsedLimit = parseInt(limit) || 20;
    const parsedPage = parseInt(page) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    logger.info(`도메인 통계 요청: 페이지 ${parsedPage}, 항목 수 ${parsedLimit}`);

    // 도메인별 통계 집계 파이프라인
    const aggregationPipeline = [
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

    // 전체 도메인 개수를 위한 카운트 쿼리
    const totalCount = await VisitResult.countDocuments({});

    // 도메인 통계 조회
    const domains = await VisitResult.aggregate(aggregationPipeline);

    // 전체 통계 요약
    const summary = await VisitResult.aggregate([
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
          }}}
        }
      }
    ]);

    logger.info(`도메인 통계 조회 완료: ${domains.length}개 도메인 정보 반환`);

    // 응답 형식 지정
    const response = {
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
      domains: domains.map(domain => ({
        domain: domain.domain,
        totalUrls: domain.totalUrls,
        visitedUrls: domain.visitedUrls,
        pendingUrls: domain.pendingUrls,
        successUrls: domain.successUrls,
        visitRate: domain.visitRate.toFixed(2) + '%',
        lastVisited: domain.lastVisited,
        createdAt: domain.created_at,
        updatedAt: domain.updated_at
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('도메인 통계 오류:', error);
    next(error);
  }
};

/**
 * Reset visited status for all URLs or URLs with failed visits
 */
exports.resetVisitedStatus = async (req, res, next) => {
  try {
    // MongoDB 연결 확인
    await mongoService.connect();

    const { domain, onlyFailed } = req.query;

    logger.info(`방문 상태 초기화 요청: 도메인=${domain || '전체'}, 실패만=${onlyFailed ? '예' : '아니오'}`);

    let result;

    if (onlyFailed === 'true') {
      // 실패한 URL만 초기화
      const filter = domain ? { domain } : {};
      const updateResult = await VisitResult.updateMany(
        filter,
        { $set: { 'suburl_list.$[elem].visited': false, 'suburl_list.$[elem].updated_at': new Date() } },
        {
          arrayFilters: [{ 'elem.visited': true, 'elem.success': false }],
          multi: true
        }
      );

      result = {
        success: true,
        message: `${updateResult.modifiedCount}개의 실패한 URL 방문 상태가 초기화되었습니다.`,
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount
      };
    } else {
      // 모든 URL 초기화
      const filter = domain ? { domain } : {};
      const updateResult = await VisitResult.updateMany(
        filter,
        { $set: { 'suburl_list.$[elem].visited': false, 'suburl_list.$[elem].updated_at': new Date() } },
        {
          arrayFilters: [{ 'elem.visited': true }],
          multi: true
        }
      );

      result = {
        success: true,
        message: `${updateResult.modifiedCount}개의 URL 방문 상태가 초기화되었습니다.`,
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount
      };
    }

    logger.info(`방문 상태 초기화 완료: ${result.message}`);
    res.status(200).json(result);
  } catch (error) {
    logger.error('방문 상태 초기화 오류:', error);
    next(error);
  }
};

module.exports = exports;