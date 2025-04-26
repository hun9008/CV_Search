"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlConnector = void 0;
const logger_1 = require("../utils/logger");
const MysqlRecruitInfoModel_1 = require("../models/MysqlRecruitInfoModel");
/**
 * MySQL 데이터베이스 연결 구현체 (Sequelize 사용)
 */
class MySqlConnector {
    /**
     * MySqlConnector 생성자
     * @param config 데이터베이스 연결 설정
     */
    constructor() {
        this.isConnected = false;
        // 기존 Sequelize 인스턴스 사용 또는 새로 생성
        this.sequelize = MysqlRecruitInfoModel_1.mysqlRecruitInfoSequelize;
    }
    /**
     * 데이터베이스 연결 (Sequelize 사용)
     */
    async connect() {
        if (this.isConnected)
            return;
        logger_1.defaultLogger.debug("MySQL 연결 시도 중 (Sequelize)...");
        try {
            const startTime = Date.now();
            // Sequelize 연결 테스트
            await this.sequelize.authenticate();
            this.isConnected = true;
            const runtime = Date.now() - startTime;
            logger_1.defaultLogger.eventInfo('db_connect', { runtime });
            logger_1.defaultLogger.debug("MySQL 연결 성공 (Sequelize)");
        }
        catch (error) {
            logger_1.defaultLogger.error('MySQL 연결 실패 (Sequelize):', error);
            throw error;
        }
    }
    /**
     * 데이터베이스 연결 종료 (Sequelize 사용)
     */
    async disconnect() {
        if (!this.isConnected)
            return;
        try {
            await this.sequelize.close();
            this.isConnected = false;
            logger_1.defaultLogger.eventInfo('DB연결 종료', 'DB연결 종료 성공 (Sequelize)');
        }
        catch (error) {
            logger_1.defaultLogger.error('DB연결 종료 실패 (Sequelize):', error);
        }
    }
}
exports.MySqlConnector = MySqlConnector;
//# sourceMappingURL=MySqlConnector.js.map