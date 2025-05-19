import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import Redis from 'ioredis';
import { URL } from 'url';
import { defaultLogger as logger } from '../utils/logger';

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
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0')
});

// 도메인 추출 함수
function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    // URL이 유효하지 않은 경우 원래 값 반환
    return url;
  }
}

// 배치 크기 설정
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 500; // ms

async function main() {
  logger.info('시작: MySQL 레코드에 Redis에서 가져온 파비콘 추가하기');

  let mysqlConnection: mysql.Connection | null = null;

  try {
    // MySQL 연결
    logger.info('MySQL 연결 중...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    logger.info('MySQL 연결 성공');

    // Redis 연결 테스트
    try {
      await redisClient.ping();
      logger.info('Redis 연결 성공');
    } catch (redisError) {
      logger.error('Redis 연결 실패:', redisError);
      return;
    }

    // 총 레코드 수 확인
    const [countRows] = await mysqlConnection.execute(
      'SELECT COUNT(*) as total FROM jobs WHERE favicon IS NULL OR favicon = ""'
    );
    const totalRecords = (countRows as any)[0].total;

    if (totalRecords === 0) {
      logger.info('파비콘이 필요한 레코드가 없습니다.');
      return;
    }

    logger.info(`총 ${totalRecords}개의 레코드를 처리합니다.`);

    // 통계 변수
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 배치 처리
    for (let offset = 0; offset < totalRecords; offset += BATCH_SIZE) {
      logger.info(`배치 처리 중: ${offset + 1} ~ ${Math.min(offset + BATCH_SIZE, totalRecords)}/${totalRecords}`);

        const [rows] = await mysqlConnection.query(
    `SELECT id, url FROM jobs WHERE favicon IS NULL OR favicon = "" LIMIT ${BATCH_SIZE} OFFSET ${offset}`
  );

      const records = rows as any[];

      for (const record of records) {
        processedCount++;
        const jobId = record.id;
        const url = record.url;

        try {
          // URL에서 도메인 추출
          const domain = extractDomain(url);
          if (!domain) {
            logger.warn(`[Job ${jobId}] 유효한 도메인을 추출할 수 없습니다: ${url}`);
            skippedCount++;
            continue;
          }

          // Redis에서 파비콘 가져오기
          const redisKey = `favicon:${domain}`;
          const favicon = await redisClient.get(redisKey);

          if (!favicon) {
            logger.warn(`[Job ${jobId}] Redis에서 도메인 ${domain}의 파비콘을 찾을 수 없습니다`);
            skippedCount++;
            continue;
          }

          // MySQL 레코드 업데이트
          await mysqlConnection.execute(
            'UPDATE jobs SET favicon = ? WHERE id = ?',
            [favicon, jobId]
          );

          logger.debug(`[Job ${jobId}] 파비콘 업데이트 완료 (도메인: ${domain})`);
          updatedCount++;
        } catch (error) {
          logger.error(`[Job ${jobId}] 처리 중 오류 발생:`, error);
          errorCount++;
        }
      }

      // 배치 간 지연 처리
      if (offset + BATCH_SIZE < totalRecords) {
        logger.debug(`다음 배치 처리 전 ${DELAY_BETWEEN_BATCHES}ms 대기 중...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // 결과 출력
    logger.info('=== 파비콘 처리 결과 ===');
    logger.info(`총 처리된 레코드: ${processedCount}`);
    logger.info(`파비콘 업데이트 성공: ${updatedCount}`);
    logger.info(`파비콘 없음/건너뜀: ${skippedCount}`);
    logger.info(`오류 발생: ${errorCount}`);
    logger.info('=======================');

  } catch (error) {
    logger.error('실행 중 오류 발생:', error);
  } finally {
    // 연결 종료
    if (mysqlConnection) {
      logger.info('MySQL 연결 종료');
      await mysqlConnection.end();
    }

    logger.info('Redis 연결 종료');
    await redisClient.quit();
  }
}

// 실행
main().catch(error => {
  logger.error('치명적인 오류 발생:', error);
  process.exit(1);
});