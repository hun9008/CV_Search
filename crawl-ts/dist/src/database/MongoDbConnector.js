"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDbConnector = void 0;
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * MongoDB 데이터베이스 연결 구현체
 */
class MongoDbConnector {
    constructor({ dbUri } = {}) {
        this.isConnected = false;
        this.dbUri = dbUri ?? process.env.MONGODB_ADMIN_URI ?? "default";
    }
    /**
     * 데이터베이스 연결
     */
    async connect() {
        if (this.isConnected)
            return;
        logger_1.defaultLogger.debug("MongoDB 연결 시도 중...");
        try {
            const startTime = Date.now();
            // Mongoose를 사용하여 MongoDB 연결
            await mongoose_1.default.connect(this.dbUri, {
                dbName: process.env.MONGODB_DB_NAME,
            });
            this.isConnected = true;
            const runtime = Date.now() - startTime;
            logger_1.defaultLogger.eventInfo('db_connect', { runtime });
            logger_1.defaultLogger.debug("MongoDB 연결 성공");
        }
        catch (error) {
            logger_1.defaultLogger.error('MongoDB 연결 실패:', error);
            throw error;
        }
    }
    /**
     * 데이터베이스 연결 종료
     */
    async disconnect() {
        if (!this.isConnected)
            return;
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            logger_1.defaultLogger.eventInfo('DB연결 종료', 'DB연결 종료 성공');
        }
        catch (error) {
            logger_1.defaultLogger.error('DB연결 종료 실패:', error);
        }
    }
}
exports.MongoDbConnector = MongoDbConnector;
//# sourceMappingURL=MongoDbConnector.js.map