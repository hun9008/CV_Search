const { mysqlService } = require('@database/mysql-service');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * MySQL 채용공고 테이블 생성 (존재하지 않을 경우)
 */
const createTableIfNotExists = async () => {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        job_type VARCHAR(100),
        experience VARCHAR(100),
        department VARCHAR(100),
        description TEXT,
        requirements TEXT,
        preferred_qualifications TEXT,
        ideal_candidate TEXT,
        url VARCHAR(500),
        posted_at DATETIME,
        end_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await mysqlService.query(sql);
    logger.info('MySQL jobs 테이블이 확인/생성되었습니다.');
  } catch (error) {
    logger.error('MySQL 테이블 생성 오류:', error);
    throw error;
  }
};

/**
 * 모든 MySQL 채용공고 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getMySqlJobs = async (req, res) => {
  try {
    await createTableIfNotExists();

    const {
      search = '',
      jobType = '',
      experience = '',
      sortBy = 'created_at',
      limit = 50,
      page = 1
    } = req.query;

    // 유효한 숫자로 변환
    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    // 기본 쿼리
    let sql = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];

    // 검색 필터
    if (search) {
      sql += ' AND (title LIKE ? OR company_name LIKE ? OR description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // 직무 유형 필터
    if (jobType) {
      sql += ' AND job_type LIKE ?';
      params.push(`%${jobType}%`);
    }

    // 경력 필터
    if (experience) {
      sql += ' AND experience LIKE ?';
      params.push(`%${experience}%`);
    }

    // 정렬
    sql += ` ORDER BY ${sortBy === 'created_at' ? 'created_at DESC' :
             sortBy === 'company_name' ? 'company_name ASC' :
             sortBy === 'job_type' ? 'job_type ASC' : 'created_at DESC'}`;

    // 페이징
    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // 쿼리 실행
    const jobs = await mysqlService.query(sql, params);

    // 총 결과 수 카운트
    let countSql = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
    const countParams = [];

    if (search) {
      countSql += ' AND (title LIKE ? OR company_name LIKE ? OR description LIKE ?)';
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }

    if (jobType) {
      countSql += ' AND job_type LIKE ?';
      countParams.push(`%${jobType}%`);
    }

    if (experience) {
      countSql += ' AND experience LIKE ?';
      countParams.push(`%${experience}%`);
    }

    const countResult = await mysqlService.query(countSql, countParams);
    const total = countResult[0].total;

    // 응답
    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      jobs
    });
  } catch (error) {
    logger.error('MySQL 채용정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'MySQL 채용정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * MySQL에 채용공고 저장
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.saveJobToMySql = async (req, res) => {
  try {
    await createTableIfNotExists();

    const {
      title,
      company_name,
      job_type,
      experience,
      department,
      description,
      requirements,
      preferred_qualifications,
      ideal_candidate,
      url,
      posted_at,
      end_date
    } = req.body;

    // 필수 필드 검증
    if (!title || !company_name) {
      return res.status(400).json({
        success: false,
        error: '제목과 회사명은 필수 항목입니다.'
      });
    }

    const sql = `
      INSERT INTO jobs (
        title, company_name, job_type, experience, department,
        description, requirements, preferred_qualifications,
        ideal_candidate, url, posted_at, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title, company_name, job_type || null, experience || null, department || null,
      description || null, requirements || null, preferred_qualifications || null,
      ideal_candidate || null, url || null,
      posted_at ? new Date(posted_at) : null,
      end_date ? new Date(end_date) : null
    ];

    const result = await mysqlService.query(sql, params);

    res.status(201).json({
      success: true,
      message: '채용공고가 MySQL에 저장되었습니다.',
      id: result.insertId
    });
  } catch (error) {
    logger.error('MySQL 채용정보 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: 'MySQL에 채용정보를 저장하는 중 오류가 발생했습니다.'
    });
  }
};

/**
 * MySQL 채용공고 필터 옵션 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getMySqlJobFilters = async (req, res) => {
  try {
    await createTableIfNotExists();

    // 직무 유형 조회
    const jobTypesSql = 'SELECT DISTINCT job_type FROM jobs WHERE job_type IS NOT NULL';
    const jobTypes = await mysqlService.query(jobTypesSql);

    // 경력 레벨 조회
    const experienceSql = 'SELECT DISTINCT experience FROM jobs WHERE experience IS NOT NULL';
    const experienceLevels = await mysqlService.query(experienceSql);

    res.status(200).json({
      success: true,
      jobTypes: jobTypes.map(item => item.job_type).filter(Boolean),
      experienceLevels: experienceLevels.map(item => item.experience).filter(Boolean)
    });
  } catch (error) {
    logger.error('MySQL 채용정보 필터 옵션 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'MySQL 채용정보 필터 옵션을 조회하는 중 오류가 발생했습니다.'
    });
  }
};

module.exports = exports;