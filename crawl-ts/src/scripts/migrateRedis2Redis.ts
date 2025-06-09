import 'dotenv/config';
import { RedisClientType, createClient } from 'redis';
import { defaultLogger as logger } from '../../src/utils/logger';

logger.debug(`env config ... ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

const sourceClient: RedisClientType = createClient({
   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
   legacyMode: false, // 반드시 설정 !!
});


// Define connection parameters for Redis B from environment variables
const targetClient: RedisClientType = createClient({
  url: `redis://${process.env.REDIS_B_USERNAME}:${process.env.REDIS_B_PASSWORD}@${process.env.REDIS_B_HOST}:${process.env.REDIS_B_PORT}/0`,
  legacyMode: false,
});

// Migrate data from Redis A to Redis B
async function migrateRedisData() {
  try {
    // Connect to both Redis instances
    await sourceClient.connect();
    await targetClient.connect();

    logger.info('Connected to Redis instances A and B');

    // Get all keys from Redis A
    const keys = await sourceClient.keys('*');
    logger.info(`Found ${keys.length} keys to migrate`);

    // Migrate each key and its value
    for (const key of keys) {
      const type = await sourceClient.type(key);

      // Handle different data types
      switch (type) {
        case 'string':
          const value = await sourceClient.get(key);
          if (value) await targetClient.set(key, value);
          break;
        case 'hash':
          const hashData = await sourceClient.hGetAll(key);
          if (Object.keys(hashData).length > 0) await targetClient.hSet(key, hashData);
          break;
        case 'list':
          const listData = await sourceClient.lRange(key, 0, -1);
          if (listData.length > 0) await targetClient.lPush(key, listData);
          break;
        case 'set':
          const setData = await sourceClient.sMembers(key);
          if (setData.length > 0) await targetClient.sAdd(key, setData);
          break;
        default:
          logger.warn(`Unsupported data type ${type} for key ${key}`);
      }
    }

    logger.info('Migration completed successfully');
  } catch (error) {
    logger.error('Migration failed', error);
  } finally {
    // Close Redis connections
    await sourceClient.quit();
    await targetClient.quit();
    logger.info('Redis connections closed');
  }
}

// Execute the migration
migrateRedisData();