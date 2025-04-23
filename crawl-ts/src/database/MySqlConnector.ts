import { IDbConnector } from './IDbConnector';
import { defaultLogger as logger } from '../utils/logger';
import { SubUrl } from '../models/VisitResult';
import mysql from 'mysql2/promise';

/**
 * MySQL 데이터베이스 연결 구현체
 */
export class MySqlConnector implements IDbConnector {
  private dbConfig: mysql.PoolOptions;
  private pool: mysql.Pool | null = null;
  isConnected: boolean = false;

  /**
   * MySqlConnector 생성자
   * @param config 데이터베이스 연결 설정
   */
  constructor(config?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    connectionLimit?: number;
  }) {
    this.dbConfig = {
      host: config?.host ?? process.env.MYSQL_HOST ?? 'localhost',
      port: config?.port ?? (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306),
      user: config?.user ?? process.env.MYSQL_USER ?? 'root',
      password: config?.password ?? process.env.MYSQL_PASSWORD ?? '',
      database: config?.database ?? process.env.MYSQL_DATABASE ?? 'crawl_db',
      connectionLimit: config?.connectionLimit ?? 10,
      waitForConnections: true,
      queueLimit: 0
    };
  }

  /**
   * 데이터베이스 연결
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    logger.debug("MySQL 연결 시도 중...");
    try {
      const startTime = Date.now();

      // MySQL 연결 풀 생성
      this.pool = mysql.createPool(this.dbConfig);

      // 테스트 쿼리를 실행하여 연결 확인
      const connection = await this.pool.getConnection();
      connection.release();

      this.isConnected = true;
      const runtime = Date.now() - startTime;
      logger.eventInfo('db_connect', { runtime });
      logger.debug("MySQL 연결 성공");
    } catch (error) {
      logger.error('MySQL 연결 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 종료
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.pool) return;

    try {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      logger.eventInfo('DB연결 종료', 'DB연결 종료 성공');
    } catch (error) {
      logger.error('DB연결 종료 실패:', error);
    }
  }


}