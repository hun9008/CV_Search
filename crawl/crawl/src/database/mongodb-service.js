require('module-alias/register');
const { MongoClient } = require('mongodb');
const CONFIG = require('@config/config');
const { startMongoDBService, checkMongoDBStatus } = require('@database/init-mongodb');
const { defaultLogger: logger } = require('@utils/logger');
const { VisitResult } = require('@models/visitResult');


class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    this.domainsCollection = null;
    // config 또는 환경변수에서 연결 정보 가져오기
    this.uri = process.env.MONGODB_ADMIN_URI || CONFIG.DATABASE.MONGODB_URI
    this.dbName = process.env.MONGODB_DB_NAME || CONFIG.DATABASE.MONGODB_DB_NAME;
  }

  /**
   * MongoDB 서비스에 연결합니다. Docker가 실행 중이 아니면 시작을 시도합니다.
   */
/**
 * 모든 도메인을 URL 개수 기준으로 정렬하여 가져옵니다.
 * @param {Object} options 옵션 객체
 * @param {string} options.sortBy 정렬 기준 ('total', 'visited', 'pending', 기본값: 'total')
 * @param {number} options.sortOrder 정렬 순서 (1: 오름차순, -1: 내림차순, 기본값: -1)
 * @param {number} options.limit 결과 제한 개수 (기본값: 0 = 모든 결과)
 * @returns {Promise<Array<Object>>} 도메인 통계 배열
 */
async getDomainsByUrlCount(options = {}) {
  await this.connect();

  try {
    const {
      sortBy = 'total',
      sortOrder = -1,
      limit = 0
    } = options;

    console.log(`도메인 통계 조회 중... 정렬 기준: ${sortBy}, 정렬 순서: ${sortOrder === 1 ? '오름차순' : '내림차순'}`);

    // 정렬 필드 설정
    let sortField;
    switch (sortBy) {
      case 'visited':
        sortField = 'stats.visited';
        break;
      case 'pending':
        sortField = 'stats.pending';
        break;
      case 'total':
      default:
        sortField = 'stats.total';
        break;
    }

    // 도메인 목록과 URL 통계를 가져오는 집계 파이프라인
    const result = await this.domainsCollection.aggregate([
      // 각 도메인의 URL 관련 통계 계산
      {
        $project: {
          _id: 0,
          domain: 1,
          url: 1,
          created_at: 1,
          updated_at: 1,
          stats: {
            total: { $size: { $ifNull: ['$suburl_list', []] } },
            visited: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$suburl_list', []] },
                  as: 'url',
                  cond: '$$url.visited'
                }
              }
            }
          }
        }
      },
      // 미방문 URL 수 계산
      {
        $addFields: {
          'stats.pending': { $subtract: ['$stats.total', '$stats.visited'] }
        }
      },
      // 방문된 URL 비율 계산 (총 URL이 0이 아닐 경우에만)
      {
        $addFields: {
          'stats.visitedRatio': {
            $cond: [
              { $eq: ['$stats.total', 0] },
              0,
              { $divide: ['$stats.visited', '$stats.total'] }
            ]
          }
        }
      },
      // 결과 정렬
      {
        $sort: { [sortField]: sortOrder, domain: 1 }
      },
      // 결과 제한
      ...(limit > 0 ? [{ $limit: limit }] : [])
    ]).toArray();

    console.log(`총 ${result.length}개 도메인 통계 조회 완료`);

    // 결과를 콘솔에 표 형식으로 출력 (선택적)
    if (result.length > 0) {
      console.table(result.map(item => ({
        domain: item.domain,
        total: item.stats.total,
        visited: item.stats.visited,
        pending: item.stats.pending,
        visitedRatio: `${Math.round(item.stats.visitedRatio * 100)}%`
      })));
    }

    return result;
  } catch (error) {
    console.error('URL 개수 기준 도메인 조회 중 오류:', error);
    throw error;
  }
}

  /**
 * URL 총 개수와 기타 통계를 가져옵니다.
 * @param {Object} options 검색 옵션 (getAllUrls와 동일)
 * @returns {Promise<Object>} 통계 정보
 */
async getUrlStats(options = {}) {
  await this.connect();

  try {
    const {
      domain = null,
      onlyVisited = null,
      searchText = null
    } = options;

    // 파이프라인 구성
    const pipeline = [];

    // 도메인 필터링
    if (domain) {
      pipeline.push({ $match: { domain } });
    }

    // unwind로 suburl_list 펼치기
    pipeline.push({
      $unwind: {
        path: '$suburl_list',
        preserveNullAndEmptyArrays: false
      }
    });

    // 방문 여부 필터링
    if (onlyVisited !== null) {
      pipeline.push({
        $match: { 'suburl_list.visited': onlyVisited }
      });
    }

    // 텍스트 검색
    if (searchText) {
      pipeline.push({
        $match: {
          $or: [
            { 'suburl_list.url': { $regex: searchText, $options: 'i' } },
            { 'suburl_list.text': { $regex: searchText, $options: 'i' } }
          ]
        }
      });
    }

    // 통계 계산
    pipeline.push({
      $group: {
        _id: null,
        totalUrls: { $sum: 1 },
        visitedUrls: { $sum: { $cond: ['$suburl_list.visited', 1, 0] } },
        urlsWithText: { $sum: { $cond: [{ $ne: ['$suburl_list.text', null] }, 1, 0] } },
        visitedUrlsNoText: { $sum: { $cond: [{ $and: ['$suburl_list.visited', { $eq: ['$suburl_list.text', null] }] }, 1, 0] } },
        domains: { $addToSet: '$domain' }
      }
    });

    // 최종 형식
    pipeline.push({
      $project: {
        _id: 0,
        totalUrls: 1,
        visitedUrls: 1,
        pendingUrls: { $subtract: ['$totalUrls', '$visitedUrls'] },
        urlsWithText: 1,
        visitedUrlsNoText: 1,
        uniqueDomains: { $size: '$domains' }
      }
    });

    // 집계 실행
    const results = await this.domainsCollection.aggregate(pipeline).toArray();

    // 결과가 없으면 기본값 반환
    if (results.length === 0) {
      return {
        totalUrls: 0,
        visitedUrls: 0,
        pendingUrls: 0,
        urlsWithText: 0,
        uniqueDomains: 0
      };
    }

    return results[0];
  } catch (error) {
    console.error('URL 통계 가져오기 실패:', error);
    throw error;
  }
}

  async setUri(uri) {
    this.uri = uri;
  }
   async setDbName(dbName) {
    this.dbName =dbName;
  }
  async connect() {
    if (this.client) return;

    try {
      // MongoDB 서비스 상태 확인 및 필요 시 시작
      const isRunning = await checkMongoDBStatus(this.uri).catch(() => false);

      if (!isRunning) {
        logger.warn('MongoDB 서비스가 실행 중이지 않습니다. 시작을 시도합니다...');
        await startMongoDBService();

        // 서비스가 완전히 시작할 때까지 잠시 대기
        logger.warn('MongoDB 서비스가 준비되는 동안 기다리는 중...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // 클라이언트 생성 및 연결
      this.client = new MongoClient(this.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000 // 서버 선택 제한 시간 15초
      });

      // 연결
      await this.client.connect();
      logger.warn('MongoDB 연결 성공');

      // 데이터베이스 및 컬렉션 설정
      this.db = this.client.db(this.dbName);
      this.domainsCollection = this.db.collection('domains');

      // 필요한 인덱스가 없으면 생성
      await this._ensureIndexes();
      logger.info(this.uri);
      logger.warn('MongoDB 연결 및 컬렉션 설정 완료');
    } catch (error) {
      logger.error('MongoDB 연결 오류:', error);
      throw error;
    }
  }

  /**
   * 필요한 인덱스가 생성되어 있는지 확인하고, 없으면 생성합니다.
   * @private
   */
  async _ensureIndexes() {
    try {
      const indexInfo = await this.domainsCollection.indexInformation();

      // domain 필드에 고유 인덱스 확인
      if (!indexInfo.domain_1) {
        await this.domainsCollection.createIndex({ domain: 1 }, { unique: true });
        console.log('domain 필드에 고유 인덱스 생성됨');
      }

      // suburl_list.url 필드에 인덱스 확인
      if (!indexInfo['suburl_list.url_1']) {
        await this.domainsCollection.createIndex({ 'suburl_list.url': 1 });
        console.log('suburl_list.url 필드에 인덱스 생성됨');
      }

      // suburl_list.visited 필드에 인덱스 확인
      if (!indexInfo['suburl_list.visited_1']) {
        await this.domainsCollection.createIndex({ 'suburl_list.visited': 1 });
        console.log('suburl_list.visited 필드에 인덱스 생성됨');
      }

      console.log('MongoDB 인덱스 확인 및 생성 완료');
    } catch (error) {
      console.error('인덱스 생성 중 오류:', error);
      throw error;
    }
  }

  /**
   * MongoDB 연결을 종료합니다.
   */
  async disconnect() {
    if (!this.client) return;

    try {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.domainsCollection = null;
      console.log('MongoDB 연결 종료');
    } catch (error) {
      console.error('MongoDB 연결 종료 오류:', error);
    }
  }


/**
 * 모든 도메인 목록을 가져옵니다.
 * @param {Object} options 옵션 객체 (includeStats: boolean - 통계 포함 여부, limit: number - 결과 제한)
 * @returns {Promise<Array<object>>} 도메인 객체 배열
 */
async getDomains(options = {}) {
  await this.connect();

  try {
    const { includeStats = false, limit = 0, sort = { domain: 1 } } = options;

    // 기본 프로젝션 설정
    const projection = {
      _id: 0,
      domain: 1,
      url: 1,
      created_at: 1,
      updated_at: 1
    };

    // 도메인 목록 쿼리
    let domains;
    if (includeStats) {
      // 통계 정보 포함하여 가져오기
      domains = await this.domainsCollection.aggregate([
        {
          $project: {
            domain: 1,
            url: 1,
            created_at: 1,
            updated_at: 1,
            total_urls: { $size: { $ifNull: ['$suburl_list', []] } },
            visited_urls: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$suburl_list', []] },
                  as: 'url',
                  cond: '$$url.visited'
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            domain: 1,
            url: 1,
            created_at: 1,
            updated_at: 1,
            stats: {
              total: '$total_urls',
              visited: '$visited_urls',
              pending: { $subtract: ['$total_urls', '$visited_urls'] }
            }
          }
        },
        { $sort: sort },
        ...(limit > 0 ? [{ $limit: limit }] : [])
      ]).toArray();
    } else {
      // 기본 도메인 정보만 가져오기
      domains = await this.domainsCollection
        .find({}, { projection })
        .sort(sort)
        .limit(limit || 0)
        .toArray();
    }

    return domains;
  } catch (error) {
    console.error('도메인 목록 조회 중 오류:', error);
    throw error;
  }
}


async countResults(keywords = []) {
    await this.connect();

    // Validate that the domains collection is available
    if (!this.domainsCollection) {
      throw new Error('domains collection not initialized');
    }

    // Base pipeline for aggregation
    const pipeline = [
      // Unwind the suburl_list array
      { $unwind: '$suburl_list' },

      // Only include URLs that have been visited and have text content
      { $match: {
        'suburl_list.visited': true,
        'suburl_list.text': { $exists: true, $ne: null }
      }}
    ];

    // If keywords provided, add keyword filtering
    if (keywords && keywords.length > 0) {
      // Add conditions to match all keywords in the text
      const keywordConditions = keywords.map(keyword => ({
        'suburl_list.text': {
          $regex: keyword,
          $options: 'i' // Case insensitive
        }
      }));

      pipeline.push({ $match: { $and: keywordConditions } });
    }

    // Count the results
    pipeline.push({ $count: 'total' });

    try {
      const result = await this.domainsCollection.aggregate(pipeline).toArray();
      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error counting results:', error);
      throw error;
    }
  }
   /**
   * Search for URLs containing all specified keywords in their text content
   * @param {string[]} keywords - Array of keywords to search for
   * @param {number} limit - Maximum number of results to return
   * @param {number} skip - Number of results to skip (for pagination)
   */
  async searchByKeywords(keywords = [], limit = 50, skip = 0) {
    await this.connect();

    // Validate that the domains collection is available
    if (!this.domainsCollection) {
      throw new Error('domains collection not initialized');
    }

    // Base pipeline for aggregation
    const pipeline = [
      // Unwind the suburl_list array to work with individual URLs
      { $unwind: '$suburl_list' },

      // Only include URLs that have been visited and have text content
      { $match: {
        'suburl_list.visited': true,
        'suburl_list.text': { $exists: true, $ne: null }
      }}
    ];

    // If keywords provided, add keyword filtering
    if (keywords && keywords.length > 0) {
      // Add conditions to match all keywords in the text
      const keywordConditions = keywords.map(keyword => ({
        'suburl_list.text': {
          $regex: keyword,
          $options: 'i' // Case insensitive
        }
      }));

      pipeline.push({ $match: { $and: keywordConditions } });
    }

    // Complete the pipeline with projection, sorting, skip and limit
    pipeline.push(
      // Project only the fields we need
      {
        $project: {
          _id: 0,
          domain: 1,
          url: '$suburl_list.url',
          text: '$suburl_list.text',
          createdAt: '$suburl_list.created_at'
        }
      },
      // Sort by creation date (most recent first)
      { $sort: { 'createdAt': -1 } },
      // Apply pagination
      { $skip: skip },
      { $limit: limit }
    );

    try {
      return await this.domainsCollection.aggregate(pipeline).toArray();
    } catch (error) {
      console.error('Error searching by keywords:', error);
      throw error;
    }
  }

  /**
   * 도메인을 추가하거나 업데이트합니다.
   * @param {string} domain 도메인 이름
   * @param {string} url 도메인의 기본 URL
   * @returns {Promise<boolean>} 새 도메인이 추가되었으면 true, 아니면 false
   */
  async addOrUpdateDomain(domain, url) {
    await this.connect();

    try {
      const now = new Date();

      // 도메인 존재 여부 확인 및 업데이트/추가
      const result = await this.domainsCollection.updateOne(
        { domain },
        {
          $setOnInsert: {
            domain,
            url,
            created_at: now,
            suburl_list: []
          },
          $set: {
            updated_at: now
          }
        },
        { upsert: true }
      );

      console.log(`도메인 ${domain} ${result.upsertedCount ? '추가됨' : '업데이트됨'}`);
      return result.upsertedCount > 0;
    } catch (error) {
      console.error(`도메인 ${domain} 추가/업데이트 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 하위 URL을 추가하거나 업데이트합니다.
   * @param {string} domain 도메인 이름
   * @param {object} subUrl 하위 URL 정보 (url, visited, text)
   * @returns {Promise<boolean>} 성공 여부
   */
  async addOrUpdateSubUrl(domain, subUrl) {
    await this.connect();

    const { url, visited = false, text = null } = subUrl;

    try {
      const now = new Date();

      // 해당 도메인이 존재하는지 확인
      const domainExists = await this.domainsCollection.findOne({ domain });

      if (!domainExists) {
        // 도메인이 존재하지 않으면 도메인과 함께 하위 URL 추가
        await this.domainsCollection.insertOne({
          domain,
          url: `http://${domain}`,
          created_at: now,
          updated_at: now,
          suburl_list: [{
            url,
            visited,
            text,
            created_at: now,
            updated_at: now
          }]
        });
        console.log(`새 도메인 ${domain}과 하위 URL ${url} 추가됨`);
        return true;
      }

      // suburl이 이미 존재하는지 확인
      const existingDoc = await this.domainsCollection.findOne({
        domain,
        'suburl_list.url': url
      });

      if (existingDoc) {
        // 기존 URL 업데이트
        await this.domainsCollection.updateOne(
          { domain, 'suburl_list.url': url },
          {
            $set: {
              'suburl_list.$.visited': visited,
              'suburl_list.$.updated_at': now,
              'updated_at': now
            },
            ...(text !== null ? { $set: { 'suburl_list.$.text': text } } : {})
          }
        );
        console.log(`서브 URL ${url} 업데이트 완료`);
      } else {
        // 새 URL 추가
        await this.domainsCollection.updateOne(
          { domain },
          {
            $push: {
              suburl_list: {
                url,
                visited,
                text,
                created_at: now,
                updated_at: now
              }
            },
            $set: { updated_at: now }
          }
        );
        console.log(`서브 URL ${url} 추가 완료`);
      }

      return true;
    } catch (error) {
      console.error(`서브 URL ${url} 추가/업데이트 중 오류:`, error);
      throw error;
    }
  }
 /**
   * URL이 이미 방문되었는지 확인합니다.
   * @param {string} domain 도메인 이름
   * @param {string} url 확인할 URL
   * @returns {Promise<boolean>} URL이 방문되었으면 true, 아니면 false
   */
  async isUrlVisited(domain, url) {
    await this.connect();

    try {
      // 해당 도메인의 방문 처리된 URL 확인
      const result = await this.domainsCollection.findOne({
        domain,
        suburl_list: {
          $elemMatch: {
            url: url,
            visited: true
          }
        }
      });

      // 결과가 있으면 방문된 URL
      return !!result;
    } catch (error) {
      console.error(`URL ${url} 방문 여부 확인 중 오류:`, error);
      // 오류 발생 시 안전하게 false 반환
      return false;
    }
  }
  /**
   * 방문되지 않은 URL 목록을 가져옵니다.
   * @param {string} domain 도메인 이름
   * @param {number} limit 가져올 URL 수 제한
   * @returns {Promise<Array<string>>} 방문되지 않은 URL 목록
   */
  async getUnvisitedUrls(domain, limit = 10) {
    await this.connect();

    try {
      const result = await this.domainsCollection.aggregate([
        { $match: { domain } },
        { $unwind: '$suburl_list' },
        { $match: { 'suburl_list.visited': false } },
        { $limit: limit },
        { $project: { _id: 0, url: '$suburl_list.url' } }
      ]).toArray();

      return result.map(item => item.url);
    } catch (error) {
      console.error(`도메인 ${domain}의 방문하지 않은 URL 조회 중 오류:`, error);
      throw error;
    }
  }

/**
 * 방문 결과 데이터를 추가하거나 업데이트합니다.
 * @param {VisitResult|Object} visitResult 방문 결과 객체
 * @returns {Promise<Object>} 저장 결과 ({success: boolean, operation: string, message: string})
 */
async addVisitedResult(visitResult) {
  await this.connect();

  try {
    // visitResult가 VisitResult 클래스의 인스턴스가 아니면 변환
    if (!(visitResult instanceof VisitResult)) {
      visitResult = new VisitResult(visitResult);
    }

    const domain = visitResult.domain;
    const url = visitResult.url;

    if (!domain || !url) {
      return {
        success: false,
        message: '도메인과 URL은 필수입니다'
      };
    }

    // VisitResult 객체의 toDbUpdateFormat 메서드 활용
    const updateData = visitResult.toDbUpdateFormat();
    const now = new Date();

    // 도메인 존재 여부 확인
    const domainExists = await this.domainsCollection.findOne({ domain });

    if (!domainExists) {
      // 도메인이 존재하지 않으면 도메인과 함께 하위 URL 추가
      const subUrlData = {
        url,
        ...visitResult.toDbFormat(),
        created_at: now
      };

      await this.domainsCollection.insertOne({
        domain,
        url: `http://${domain}`,
        created_at: now,
        updated_at: now,
        suburl_list: [subUrlData]
      });

      logger.info(`새 도메인 ${domain}과 함께 URL ${url} 방문 데이터 저장 완료`);

      return {
        success: true,
        operation: 'insert_domain',
        message: `새 도메인 ${domain}과 URL ${url} 추가 완료`
      };
    }

    // URL 존재 여부 확인
    const urlExists = await this.domainsCollection.findOne({
      domain,
      'suburl_list.url': url
    });

    if (urlExists) {
      // 기존 URL 업데이트
      const result = await this.domainsCollection.updateOne(
        { domain, 'suburl_list.url': url },
        { $set: updateData }
      );

      logger.info(`URL ${url} 방문 정보 업데이트 완료 (${visitResult.success ? '성공' : '실패'})`);

      return {
        success: true,
        operation: 'update',
        message: `URL ${url} 방문 정보 업데이트 완료`,
        modified: result.modifiedCount > 0
      };
    } else {
      // 새 URL 추가
      const subUrlData = {
        url,
        ...visitResult.toDbFormat(),
        created_at: now
      };

      const result = await this.domainsCollection.updateOne(
        { domain },
        {
          $push: { suburl_list: subUrlData },
          $set: { updated_at: now }
        }
      );

      logger.info(`URL ${url} 추가 및 방문 정보 저장 완료 (${visitResult.success ? '성공' : '실패'})`);

      return {
        success: true,
        operation: 'insert_url',
        message: `URL ${url} 추가 완료`,
        modified: result.modifiedCount > 0
      };
    }
  } catch (error) {
    logger.error(`URL ${visitResult?.url || 'unknown'} 방문 데이터 저장 중 오류:`, error);

    return {
      success: false,
      error: error.message,
      message: `방문 데이터 저장 중 오류: ${error.message}`
    };
  }
}

  /**
   * 도메인에 대한 통계 정보를 가져옵니다.
   * @param {string} domain 도메인 이름
   * @returns {Promise<object>} 통계 정보
   */
  async getDomainStats(domain) {
    await this.connect();

    try {
      const result = await this.domainsCollection.aggregate([
        { $match: { domain } },
        { $project: {
            total: { $size: { $ifNull: ['$suburl_list', []] } },
            visited: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$suburl_list', []] },
                  as: 'url',
                  cond: '$$url.visited'
                }
              }
            }
          }
        }
      ]).toArray();

      if (result.length === 0) {
        return { domain, total: 0, visited: 0, pending: 0 };
      }

      const stats = result[0];
      return {
        domain,
        total: stats.total || 0,
        visited: stats.visited || 0,
        pending: (stats.total || 0) - (stats.visited || 0)
      };
    } catch (error) {
      console.error(`도메인 ${domain} 통계 조회 중 오류:`, error);
      throw error;
    }
  }
/**
 * 다수의 하위 URL을 한 번에 추가합니다. 각 URL은 VisitResult 형식으로 변환됩니다.
 * @param {string} domain 도메인 이름
 * @param {Array<string|object>} subUrls 하위 URL 배열 (문자열 또는 객체 형태)
 * @returns {Promise<number>} 추가된 URL 수
 */
async bulkAddSubUrls(domain, subUrls) {
  await this.connect();

  if (!subUrls || subUrls.length === 0) return 0;

  try {
    const now = new Date();

    // 도메인이 존재하는지 확인
    const domainDoc = await this.domainsCollection.findOne({ domain });
    if (!domainDoc) {
      // 도메인이 없으면 생성
      await this.addOrUpdateDomain(domain, `http://${domain}`);
    }

    // 기존 URL 목록 추출
    const existingUrls = new Set();

    if (domainDoc && domainDoc.suburl_list) {
      domainDoc.suburl_list.forEach(item => {
        if (item.url) existingUrls.add(item.url);
      });
    }

    // 입력된 URL 항목 정규화 및 VisitResult 객체로 변환
    const normalizedUrls = subUrls.map(item => {
      let urlString;

      // 문자열 또는 객체 형태의 URL 처리
      if (typeof item === 'string') {
        urlString = item;
      } else if (item && typeof item === 'object' && item.url) {
        urlString = item.url;
      } else {
        return null; // 유효하지 않은 입력은 null 반환
      }

      // URL 유효성 검사
      if (!urlString || typeof urlString !== 'string' || !urlString.startsWith('http')) {
        return null;
      }

      // 이미 존재하는 URL 필터링
      if (existingUrls.has(urlString)) {
        return null;
      }

      // 각 URL에 대한 VisitResult 객체 생성 (방문 안 함으로 표시)
      const visitResult = new VisitResult({
        url: urlString,
        domain: domain,
        success: false, // 아직 방문하지 않았으므로 false
        visitedAt: null, // 방문 시간 없음
        pageContent: {}, // 빈 콘텐츠
        crawledUrls: [] // 수집된 URL 없음
      });

      return visitResult;
    }).filter(item => item !== null); // null 항목 제거

    if (normalizedUrls.length === 0) {
      logger.info(`도메인 ${domain}에 추가할 새 URL이 없음`);
      return 0;
    }

    // VisitResult 객체를 DB 형식으로 변환
    const formattedSubUrls = normalizedUrls.map(visitResult => ({
      ...visitResult.toDbFormat(), // 나머지 필드는 기본 DB 형식 사용
      url: visitResult.url,
      domain: visitResult.domain,
      visited: false, // 항상 false로 설정
      success: false, // 아직 방문하지 않았으므로 false
      created_at: now,
      updated_at: now,
    }));

    // DB에 일괄 추가
    await this.domainsCollection.updateOne(
      { domain },
      {
        $push: { suburl_list: { $each: formattedSubUrls } },
        $set: { updated_at: now }
      }
    );

    logger.info(`${formattedSubUrls.length}개의 URL이 도메인 ${domain}에 추가됨`);
    return formattedSubUrls.length;
  } catch (error) {
    logger.error(`도메인 ${domain}에 대량 URL 추가 중 오류:`, error);
    throw error;
  }
}


  /**
 * 모든 도메인의 모든 하위 URL의 방문 상태를 초기화(false)합니다.
 * @param {string} [specificDomain=null] 특정 도메인만 초기화하려면 해당 도메인명 지정, null이면 모든 도메인
 * @returns {Promise<object>} 초기화 결과 ({totalDomains, totalUrls, updatedUrls})
 */
async resetAllVisitedStatus(specificDomain = null) {
  await this.connect();

  try {
    console.log(`${specificDomain ? `도메인 ${specificDomain}의` : '모든 도메인의'} URL 방문 상태 초기화 중...`);

    // 초기화에 사용할 쿼리 필터 설정
    const filter = specificDomain ? { domain: specificDomain } : {};

    // 초기화 전 상태 확인 (통계용)
    const beforeStats = await this.domainsCollection.aggregate([
      { $match: filter },
      { $project: {
          domain: 1,
          totalUrls: { $size: { $ifNull: ['$suburl_list', []] } },
          visitedUrls: {
            $size: {
              $filter: {
                input: { $ifNull: ['$suburl_list', []] },
                as: 'url',
                cond: '$$url.visited'
              }
            }
          }
        }
      }
    ]).toArray();

    // 초기 통계 데이터 계산
    const totalDomains = beforeStats.length;
    const totalUrls = beforeStats.reduce((sum, domain) => sum + domain.totalUrls, 0);
    const visitedUrls = beforeStats.reduce((sum, domain) => sum + domain.visitedUrls, 0);

    console.log(`초기화 전 통계:`);
    console.log(`- 도메인 수: ${totalDomains}`);
    console.log(`- 총 URL 수: ${totalUrls}`);
    console.log(`- 방문된 URL 수: ${visitedUrls}`);

    if (visitedUrls === 0) {
      console.log('이미 모든 URL이 미방문 상태입니다. 초기화가 필요하지 않습니다.');
      return {
        totalDomains,
        totalUrls,
        updatedUrls: 0
      };
    }

    // 현재 시간 (업데이트 시간 기록용)
    const now = new Date();

    // suburl_list 배열 내의 모든 URL의 visited 상태를 false로 설정
    const result = await this.domainsCollection.updateMany(
      filter,
      [
        {
          $set: {
            suburl_list: {
              $map: {
                input: '$suburl_list',
                as: 'suburl',
                in: {
                  url: '$$suburl.url',
                  visited: false,
                  text: '$$suburl.text',
                  created_at: '$$suburl.created_at',
                  updated_at: now
                }
              }
            },
            updated_at: now
          }
        }
      ]
    );

    console.log(`초기화 완료:`);
    console.log(`- 업데이트된 도메인: ${result.matchedCount}`);
    console.log(`- 수정된 도메인: ${result.modifiedCount}`);
    console.log(`- 초기화된 URL: ${visitedUrls}`);

    return {
      totalDomains,
      totalUrls,
      updatedUrls: visitedUrls
    };

  } catch (error) {
    console.error('URL 방문 상태 초기화 중 오류:', error);
    throw error;
  }
}

  /**
 * 방문에 실패한(success=false) URL들의 방문 상태를 초기화합니다.
 * @param {string} [specificDomain=null] 특정 도메인만 초기화하려면 해당 도메인명 지정, null이면 모든 도메인
 * @returns {Promise<object>} 초기화 결과 ({totalDomains, totalUrls, updatedUrls})
 */
async resetFailedVisitedStatus(specificDomain = null) {
  await this.connect();

  try {
    console.log(`${specificDomain ? `도메인 ${specificDomain}의` : '모든 도메인의'} 방문 실패 URL 초기화 중...`);

    // 초기화에 사용할 쿼리 필터 설정
    const filter = specificDomain ? { domain: specificDomain } : {};

    // 초기화 전 상태 확인 (통계용)
    const beforeStats = await this.domainsCollection.aggregate([
      { $match: filter },
      { $project: {
          domain: 1,
          totalUrls: { $size: { $ifNull: ['$suburl_list', []] } },
          visitedUrls: {
            $size: {
              $filter: {
                input: { $ifNull: ['$suburl_list', []] },
                as: 'url',
                cond: '$$url.visited'
              }
            }
          },
          failedUrls: {
            $size: {
              $filter: {
                input: { $ifNull: ['$suburl_list', []] },
                as: 'url',
                cond: { $and: ['$$url.visited', { $eq: ['$$url.success', false] }] }
              }
            }
          }
        }
      }
    ]).toArray();

    // 초기 통계 데이터 계산
    const totalDomains = beforeStats.length;
    const totalUrls = beforeStats.reduce((sum, domain) => sum + domain.totalUrls, 0);
    const visitedUrls = beforeStats.reduce((sum, domain) => sum + domain.visitedUrls, 0);
    const failedUrls = beforeStats.reduce((sum, domain) => sum + domain.failedUrls, 0);

    console.log(`초기화 전 통계:`);
    console.log(`- 도메인 수: ${totalDomains}`);
    console.log(`- 총 URL 수: ${totalUrls}`);
    console.log(`- 방문된 URL 수: ${visitedUrls}`);
    console.log(`- 방문 실패 URL 수: ${failedUrls}`);

    if (failedUrls === 0) {
      console.log('초기화할 방문 실패 URL이 없습니다.');
      return {
        totalDomains,
        totalUrls,
        updatedUrls: 0
      };
    }

    // 현재 시간 (업데이트 시간 기록용)
    const now = new Date();

    // suburl_list 배열 내에서 visited=true, success=false인 URL만 visited 상태를 false로 설정
    const result = await this.domainsCollection.updateMany(
      filter,
      [
        {
          $set: {
            suburl_list: {
              $map: {
                input: '$suburl_list',
                as: 'suburl',
                in: {
                  $cond: [
                    // 조건: visited가 true이고 success가 false인 경우만 업데이트
                    { $and: ['$$suburl.visited', { $eq: ['$$suburl.success', false] }] },
                    // true인 경우: visited를 false로 설정, 나머지는 유지
                    {
                      url: '$$suburl.url',
                      visited: false,  // visited 상태 변경
                      success: false,  // success 유지
                      text: '$$suburl.text',
                      error: '$$suburl.error',
                      created_at: '$$suburl.created_at',
                      updated_at: now
                    },
                    // false인 경우: 원래 값 그대로 유지
                    '$$suburl'
                  ]
                }
              }
            },
            updated_at: now
          }
        }
      ]
    );

    console.log(`초기화 완료:`);
    console.log(`- 업데이트된 도메인: ${result.matchedCount}`);
    console.log(`- 수정된 도메인: ${result.modifiedCount}`);
    console.log(`- 초기화된 URL: ${failedUrls}`);

    return {
      totalDomains,
      totalUrls,
      updatedUrls: failedUrls
    };

  } catch (error) {
    console.error('방문 실패 URL 초기화 중 오류:', error);
    throw error;
  }
}
  /**
   * 모든 도메인 목록을 가져옵니다.
   * @returns {Promise<Array<object>>} 도메인 객체 배열
   */
  async getAllDomains() {
    await this.connect();

    try {
      return await this.domainsCollection.find({}, {
        projection: {
          _id: 0,
          domain: 1,
          url: 1,
          created_at: 1,
          updated_at: 1
        }
      }).toArray();
    } catch (error) {
      console.error('도메인 목록 조회 중 오류:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 내보내기
module.exports = { MongoDBService };