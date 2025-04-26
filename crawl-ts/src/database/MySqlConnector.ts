import { IDbConnector } from './IDbConnector';
import { defaultLogger as logger } from '../utils/logger';
import { Sequelize } from 'sequelize';
import { mysqlRecruitInfoSequelize } from '../models/MysqlRecruitInfoModel';

/**
 * MySQL 데이터베이스 연결 구현체 (Sequelize 사용)
 */
export class MySqlConnector implements IDbConnector {
  private sequelize: Sequelize;
  isConnected: boolean = false;

  /**
   * MySqlConnector 생성자
   * @param config 데이터베이스 연결 설정
   */
  constructor() {
    // 기존 Sequelize 인스턴스 사용 또는 새로 생성
    this.sequelize = mysqlRecruitInfoSequelize
  }

  /**
   * 데이터베이스 연결 (Sequelize 사용)
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    logger.debug("MySQL 연결 시도 중 (Sequelize)...");
    try {
      const startTime = Date.now();

      // Sequelize 연결 테스트
      await this.sequelize.authenticate();

      this.isConnected = true;
      const runtime = Date.now() - startTime;
      logger.eventInfo('db_connect', { runtime });
      logger.debug("MySQL 연결 성공 (Sequelize)");
    } catch (error) {
      logger.error('MySQL 연결 실패 (Sequelize):', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 종료 (Sequelize 사용)
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.sequelize.close();
      this.isConnected = false;
      logger.eventInfo('DB연결 종료', 'DB연결 종료 성공 (Sequelize)');
    } catch (error) {
      logger.error('DB연결 종료 실패 (Sequelize):', error);
    }
  }
}