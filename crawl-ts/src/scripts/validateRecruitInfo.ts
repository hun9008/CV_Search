import 'dotenv/config';
import { MysqlRecruitInfoSequelize } from '../models/MysqlRecruitInfoModel';
import { GeminiParser } from '../parser/GeminiParser';
import { RedisClientType, createClient } from 'redis';

import { defaultLogger as logger } from '../../src/utils/logger';
logger.debug(`env config ... ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const sourceClient: RedisClientType = createClient({
   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
   legacyMode: false, // 반드시 설정 !!
});

const CONCURRENCY_LIMIT = 1

async function validateRecruitInfo() {
  const parser = new GeminiParser();
  await sourceClient.connect().catch((err) => {
    logger.error(`Redis connection error: ${err.message}`);
    process.exit(1);
  });
  logger.info('Connected to Redis successfully');
  // Fetch all recruit info from the database
  const recruitInfos = await MysqlRecruitInfoSequelize.findAll({
    attributes: ['id', 'text'],
    raw: true,
  });

  const chunks = [];
  for (let i = 0; i < recruitInfos.length; i += CONCURRENCY_LIMIT) {
    chunks.push(recruitInfos.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const chunk of chunks) {
    // Process each chunk concurrently
    await Promise.all(chunk.map(async (info) => {
      try {
        // logger.info(` ${info.text}`);
        const result = await parser.validateRecruitInfo(info.text, 1000, 1000);
        if (result) {
          if (result.result === '적합') {
            await sourceClient.HSET('validated_job:success', info.id ,info.text);
          }
          else if (result.result === '부적합') {
            await sourceClient.HSET('validated_job:fail', info.id ,info.text);;
          }
          await sourceClient.HSET('validated_job:all', info.id ,info.text);;
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Validation failed for ID ${info.id}: ${error.message}`);
          await sourceClient.HSET('validated_job:all', info.id ,info.text);;
        }
      }
    }));
  }
}

if (require.main === module) {
  validateRecruitInfo();
}