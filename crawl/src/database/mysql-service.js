const mysql = require('mysql2/promise');
const { defaultLogger: logger } = require('@utils/logger');

class MySqlService {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (this.pool) {
      return this.pool;
    }

    try {
      this.pool = mysql.createPool({
        uri: process.env.RDB_URL,
        user: process.env.RDB_USERNAME,
        password: process.env.RDB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // 연결 테스트
      const connection = await this.pool.getConnection();
      logger.info('MySQL 데이터베이스에 연결되었습니다.');
      connection.release();

      return this.pool;
    } catch (error) {
      logger.error('MySQL 연결 오류:', error);
      throw new Error('MySQL 데이터베이스 연결 실패');
    }
  }

  async query(sql, params) {
    try {
      await this.connect();
      const [results] = await this.pool.query(sql, params);
      return results;
    } catch (error) {
      logger.error('MySQL 쿼리 오류:', { error:error.message });
      throw error;
    }
  }
/**
 * URL을 키로 사용하여 채용 공고 데이터를 업서트(upsert)합니다.
 * 동일한 URL이 있으면 업데이트하고, 없으면 새로 추가합니다.
 * @param {Object} jobData - 채용공고 데이터
 * @returns {boolean} - 성공 여부
 */async upsertJobByUrl(jobData) {
  try {
    if (!jobData.url) {
      // URL이 없는 경우 그냥 삽입
      const insertSql = `
        INSERT INTO jobs (
          title, company_name, job_type, experience, department,
          description, requirements, preferred_qualifications,
          ideal_candidate, url, raw_jobs_text, posted_at, end_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        jobData.title, jobData.company_name, jobData.job_type, jobData.experience,
        jobData.department, jobData.description, jobData.requirements,
        jobData.preferred_qualifications, jobData.ideal_candidate, null,
        jobData.raw_jobs_text, // raw_jobs_text 필드 추가
        jobData.posted_at, jobData.end_date, jobData.created_at || new Date(),
        jobData.updated_at || new Date()
      ];

      await this.query(insertSql, insertParams);
      return true;
    }

    // URL로 기존 데이터 조회
    const checkSql = 'SELECT id FROM jobs WHERE url = ?';
    const existingJobs = await this.query(checkSql, [jobData.url]);

    if (existingJobs.length > 0) {
      // 이미 존재하는 경우 업데이트
      const updateSql = `
        UPDATE jobs SET
          title = ?,
          company_name = ?,
          job_type = ?,
          experience = ?,
          department = ?,
          description = ?,
          requirements = ?,
          preferred_qualifications = ?,
          ideal_candidate = ?,
          raw_jobs_text = ?,
          posted_at = ?,
          end_date = ?,
          updated_at = ?
        WHERE url = ?
      `;

      const updateParams = [
        jobData.title, jobData.company_name, jobData.job_type, jobData.experience,
        jobData.department, jobData.description, jobData.requirements,
        jobData.preferred_qualifications, jobData.ideal_candidate,
        jobData.raw_jobs_text, // raw_jobs_text 필드 추가
        jobData.posted_at, jobData.end_date, new Date(), jobData.url
      ];

      await this.query(updateSql, updateParams);
    } else {
      // 새로운 데이터 삽입
      const insertSql = `
        INSERT INTO jobs (
          title, company_name, job_type, experience, department,
          description, requirements, preferred_qualifications,
          ideal_candidate, url, raw_jobs_text, posted_at, end_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        jobData.title, jobData.company_name, jobData.job_type, jobData.experience,
        jobData.department, jobData.description, jobData.requirements,
        jobData.preferred_qualifications, jobData.ideal_candidate, jobData.url,
        jobData.raw_jobs_text, // raw_jobs_text 필드 추가
        jobData.posted_at, jobData.end_date, new Date(), new Date()
      ];

      await this.query(insertSql, insertParams);
    }

    return true;
  } catch (error) {
    logger.error('MySQL 업서트 오류:', error);
    return false;
  }
}
}

const mysqlService = new MySqlService();
module.exports = { mysqlService };