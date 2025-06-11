import 'dotenv/config';
import { RedisClientType, createClient } from 'redis';
import { defaultLogger as logger } from '../../src/utils/logger';
const fs = require('fs');
const path = require('path');

logger.debug(`env config ... ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

const redisClient: RedisClientType = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  legacyMode: false, // 반드시 설정 !!
});

async function deleteBadDomains() {
  try {
    // Redis 클라이언트 연결
    await redisClient.connect();
    logger.info('Connected to Redis');

    // 'bad_domains' 키에서 모든 도메인 가져오기
    // const badDomains = await redisClient.sMembers('bad_domains');
    // Read bad domains from file
    const badDomainsPath = path.resolve(__dirname, 'badDomains.txt');
    const badDomainsContent = fs.readFileSync(badDomainsPath, 'utf-8');
    const badDomains = badDomainsContent
      .split('\n')
      .map( (line: String )=> line.trim())
      .filter((line: String)  => line.length > 0);
    logger.info(`Found ${badDomains.length} bad domains`);

    // 각 도메인에 대해 삭제 작업 수행
    for (const domain of badDomains) {
      redisClient.sRem('domains', domain);
    }

  } catch (error) {
    logger.error('Error deleting bad domains:', error);
  } finally {
    // Redis 클라이언트 연결 종료
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

deleteBadDomains();