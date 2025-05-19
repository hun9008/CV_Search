"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const mysql = __importStar(require("mysql2/promise"));
const ioredis_1 = __importDefault(require("ioredis"));
const url_1 = require("url");
const logger_1 = require("../utils/logger");
// 환경 변수 로드
dotenv.config();
// MySQL 설정
const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'cv_search',
    connectionLimit: 10,
};
// Redis 설정
const redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0')
});
// 도메인 추출 함수
function extractDomain(url) {
    try {
        const parsedUrl = new url_1.URL(url);
        return parsedUrl.hostname;
    }
    catch (error) {
        // URL이 유효하지 않은 경우 원래 값 반환
        return url;
    }
}
// 배치 크기 설정
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 500; // ms
async function main() {
    logger_1.defaultLogger.info('시작: MySQL 레코드에 Redis에서 가져온 파비콘 추가하기');
    let mysqlConnection = null;
    try {
        // MySQL 연결
        logger_1.defaultLogger.info('MySQL 연결 중...');
        mysqlConnection = await mysql.createConnection(mysqlConfig);
        logger_1.defaultLogger.info('MySQL 연결 성공');
        // Redis 연결 테스트
        try {
            await redisClient.ping();
            logger_1.defaultLogger.info('Redis 연결 성공');
        }
        catch (redisError) {
            logger_1.defaultLogger.error('Redis 연결 실패:', redisError);
            return;
        }
        // 총 레코드 수 확인
        const [countRows] = await mysqlConnection.execute('SELECT COUNT(*) as total FROM jobs WHERE favicon IS NULL OR favicon = ""');
        const totalRecords = countRows[0].total;
        if (totalRecords === 0) {
            logger_1.defaultLogger.info('파비콘이 필요한 레코드가 없습니다.');
            return;
        }
        logger_1.defaultLogger.info(`총 ${totalRecords}개의 레코드를 처리합니다.`);
        // 통계 변수
        let processedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        // 배치 처리
        for (let offset = 0; offset < totalRecords; offset += BATCH_SIZE) {
            logger_1.defaultLogger.info(`배치 처리 중: ${offset + 1} ~ ${Math.min(offset + BATCH_SIZE, totalRecords)}/${totalRecords}`);
            const [rows] = await mysqlConnection.query(`SELECT id, url FROM jobs WHERE favicon IS NULL OR favicon = "" LIMIT ${BATCH_SIZE} OFFSET ${offset}`);
            const records = rows;
            for (const record of records) {
                processedCount++;
                const jobId = record.id;
                const url = record.url;
                try {
                    // URL에서 도메인 추출
                    const domain = extractDomain(url);
                    if (!domain) {
                        logger_1.defaultLogger.warn(`[Job ${jobId}] 유효한 도메인을 추출할 수 없습니다: ${url}`);
                        skippedCount++;
                        continue;
                    }
                    // Redis에서 파비콘 가져오기
                    const redisKey = `favicon:${domain}`;
                    const favicon = await redisClient.get(redisKey);
                    if (!favicon) {
                        logger_1.defaultLogger.warn(`[Job ${jobId}] Redis에서 도메인 ${domain}의 파비콘을 찾을 수 없습니다`);
                        skippedCount++;
                        continue;
                    }
                    // MySQL 레코드 업데이트
                    await mysqlConnection.execute('UPDATE jobs SET favicon = ? WHERE id = ?', [favicon, jobId]);
                    logger_1.defaultLogger.debug(`[Job ${jobId}] 파비콘 업데이트 완료 (도메인: ${domain})`);
                    updatedCount++;
                }
                catch (error) {
                    logger_1.defaultLogger.error(`[Job ${jobId}] 처리 중 오류 발생:`, error);
                    errorCount++;
                }
            }
            // 배치 간 지연 처리
            if (offset + BATCH_SIZE < totalRecords) {
                logger_1.defaultLogger.debug(`다음 배치 처리 전 ${DELAY_BETWEEN_BATCHES}ms 대기 중...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }
        // 결과 출력
        logger_1.defaultLogger.info('=== 파비콘 처리 결과 ===');
        logger_1.defaultLogger.info(`총 처리된 레코드: ${processedCount}`);
        logger_1.defaultLogger.info(`파비콘 업데이트 성공: ${updatedCount}`);
        logger_1.defaultLogger.info(`파비콘 없음/건너뜀: ${skippedCount}`);
        logger_1.defaultLogger.info(`오류 발생: ${errorCount}`);
        logger_1.defaultLogger.info('=======================');
    }
    catch (error) {
        logger_1.defaultLogger.error('실행 중 오류 발생:', error);
    }
    finally {
        // 연결 종료
        if (mysqlConnection) {
            logger_1.defaultLogger.info('MySQL 연결 종료');
            await mysqlConnection.end();
        }
        logger_1.defaultLogger.info('Redis 연결 종료');
        await redisClient.quit();
    }
}
// 실행
main().catch(error => {
    logger_1.defaultLogger.error('치명적인 오류 발생:', error);
    process.exit(1);
});
//# sourceMappingURL=makeFaviconMysql.js.map