import { RedisClientType , createClient } from 'redis';
import 'dotenv/config';
import { defaultLogger as logger } from '../utils/logger';
import { MysqlRecruitInfoSequelize } from '../models/MysqlRecruitInfoModel';

const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  legacyMode: false, // 반드시 설정 !!
});






async function deleteNotValidUrlWithRedis() {

  try {
    await redisClient.connect();
    logger.info('Connected to Redis successfully');

    const keys = await redisClient.hKeys('validated_job:fail');
    logger.info(`Found ${keys.length} keys in 'validated_job:fail'`);
    for (const key of keys) {
      await MysqlRecruitInfoSequelize.destroy( { where: { id: key } });
      logger.info(`delete ID: ${key}`);
    }
  }
  catch (error) {
    if (error instanceof Error) {
      logger.error(`Error connecting to Redis or updating database: ${error.message}`);
      throw new Error("Failed to connect to Redis or update database");
    }
  }
}

if(require.main === module) {
  deleteNotValidUrlWithRedis()
    .then(() => {
      logger.info('Process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Error in updateNotValidUrlWithRedis: ${error.message}`);
      process.exit(1);
    });
}
