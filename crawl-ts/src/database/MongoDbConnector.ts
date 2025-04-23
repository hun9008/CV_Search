import { IDbConnector } from './IDbConnector';
import { defaultLogger as logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * MongoDB 데이터베이스 연결 구현체
 */
export class MongoDbConnector implements IDbConnector {
  private dbUri: string;
  isConnected: boolean = false;
    constructor({ dbUri }: { dbUri?: string } = {}) {
    this.dbUri = dbUri ?? process.env.MONGODB_ADMIN_URI ?? "default";
  }
  /**
   * 데이터베이스 연결
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    logger.debug("MongoDB 연결 시도 중...");
    try {
      const startTime = Date.now();

      // Mongoose를 사용하여 MongoDB 연결
      await mongoose.connect(this.dbUri, {
        dbName: process.env.MONGODB_DB_NAME,
      });

      this.isConnected = true;
      const runtime = Date.now() - startTime;
      logger.eventInfo('db_connect', { runtime });
      logger.debug("MongoDB 연결 성공");
    } catch (error) {
      logger.error('MongoDB 연결 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 종료
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.eventInfo('DB연결 종료', 'DB연결 종료 성공');
    } catch (error) {
      logger.error('DB연결 종료 실패:', error);
    }
  }


}