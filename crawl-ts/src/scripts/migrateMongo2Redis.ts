import 'dotenv/config';
import { MongoRecruitInfoModel ,MongoDomainModel} from '../models/MongoRecruitInfoModel';
import { RedisClientType, createClient } from 'redis';
import { defaultLogger as logger } from '../../src/utils/logger';
import mongoose from 'mongoose';


async function migrateMongoToRedis() {
  // Initialize Redis client
  const redisClient: RedisClientType = createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  try {
    // Connect to Redis
    await redisClient.connect();
    await mongoose.connect(process.env.MONGODB_ADMIN_URI || 'mongodb://localhost:27017/cv_search' ,{dbName: process.env.MONGODB_DB_NAME || 'cv_search'});
    logger.info('Connected to Redis');

    // Fetch all documents from MongoDB
    const documents = await MongoDomainModel.find({});
    logger.info(`Found ${documents.length} documents in MongoDB`);

    // Extract unique domains and add them to Redis set
    const domains = new Set<string>();
    documents.forEach(doc => {
      if (doc.url) {
        try {
          const url = new URL(doc.url);
          domains.add(url.hostname);
        } catch (e) {
          logger.error(`Invalid URL: ${doc.url}`, e);
        }
      }
    });

    // Add domains to Redis set
    if (domains.size > 0) {
      const domainArray = Array.from(domains);
      await redisClient.sAdd('domains', domainArray);
      logger.info(`Added ${domains.size} unique domains to Redis set`);
    } else {
      logger.warn('No valid domains found');
    }
  } catch (error) {
    logger.error('Migration failed', error);
    throw error;
  } finally {
    // Close Redis connection
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

// Execute the migration
migrateMongoToRedis().catch(err => {
  logger.error('Unhandled error in migration', err);
  process.exit(1);
});