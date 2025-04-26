const mongoose = require('mongoose');
const CONFIG = require('@config/config');
const { defaultLogger: logger } = require('@utils/logger');

/**
 * MongoDB 연결만을 담당하는 서비스 클래스
 * 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 인스턴스만 사용
 */
class MongoDBService {
  constructor() {
    // 싱글톤 인스턴스 확인
    if (MongoDBService.instance) {
      return MongoDBService.instance;
    }

    this.mongoose = mongoose;
    this.isConnected = false;
    this.connectionPromise = null;

    // config 또는 환경변수에서 연결 정보 가져오기
    this.uri = process.env.MONGODB_ADMIN_URI || CONFIG.DATABASE.MONGODB_URI;
    this.dbName = process.env.MONGODB_DB_NAME || CONFIG.DATABASE.MONGODB_DB_NAME;

    // 싱글톤 인스턴스 저장
    MongoDBService.instance = this;

    // 연결 이벤트 리스너 설정
    mongoose.connection.on('connected', () => {
      logger.debug('MongoDB 연결 성공');
      this.isConnected = true;
    });

    mongoose.connection.on('disconnected', () => {
      logger.debug('MongoDB 연결이 끊어졌습니다.');
      this.isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      logger.debug('MongoDB 연결 오류:', err);
    });
  }

  /**
   * MongoDB 연결 URI 변경
   * @param {string} uri 새 MongoDB 연결 URI
   */
  setUri(uri) {
    this.uri = uri;
    if (this.isConnected) {
      logger.debug('MongoDB 연결 URI가 변경되었습니다. 연결을 재설정하려면 disconnect() 후 connect()를 호출하세요.');
    }
    return this;
  }

  /**
   * MongoDB 데이터베이스 이름 변경
   * @param {string} dbName 새 데이터베이스 이름
   */
  setDbName(dbName) {
    this.dbName = dbName;
    if (this.isConnected) {
      logger.warn('MongoDB 데이터베이스 이름이 변경되었습니다. 연결을 재설정하려면 disconnect() 후 connect()를 호출하세요.');
    }
    return this;
  }

  /**
   * MongoDB에 연결합니다.
   * @returns {Promise<mongoose.Connection>} MongoDB 연결 객체
   */
  async connect() {
    if (this.isConnected) {
      return mongoose.connection;
    }

    // 이미 연결 중인 경우 진행 중인 Promise 반환
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    try {
      logger.debug(`MongoDB에 연결 중... URI: ${this.uri}, DB: ${this.dbName}`);

      this.connectionPromise = mongoose.connect(this.uri, {
        dbName: this.dbName,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000, // 서버 선택 제한 시간 15초
        connectTimeoutMS: 30000, // 연결 제한 시간 30초
      });

      await this.connectionPromise;
      this.connectionPromise = null;
      this.isConnected = true;

      return mongoose.connection;
    } catch (error) {
      this.connectionPromise = null;
      logger.error('MongoDB 연결 실패:', error);
      throw error;
    }
  }

  /**
   * MongoDB 연결을 종료합니다.
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.debug('MongoDB 연결 종료됨');
    } catch (error) {
      logger.error('MongoDB 연결 종료 중 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 MongoDB 연결 상태를 반환합니다.
   * @returns {boolean} 연결 상태
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      uri: this.uri,
      dbName: this.dbName
    };
  }

  /**
   * Mongoose 인스턴스를 반환합니다.
   * @returns {mongoose} Mongoose 인스턴스
   */
  getMongoose() {
    return mongoose;
  }

  /**
   * 현재 연결된 데이터베이스 객체를 반환합니다.
   * @returns {mongoose.Connection} Mongoose 연결 객체
   */
  getConnection() {
    return mongoose.connection;
  }
}

// 싱글톤 인스턴스 초기화
MongoDBService.instance = null;

// 서비스 인스턴스 생성 및 내보내기
const mongoService = new MongoDBService();

module.exports = {
  MongoDBService,
  mongoService  // 편의를 위해 기본 인스턴스도 내보냄
};