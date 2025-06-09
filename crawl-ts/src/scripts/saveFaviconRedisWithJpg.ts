import 'dotenv/config';
import { RedisClientType, createClient } from 'redis';
import { defaultLogger as logger } from '../utils/logger';
const fs = require('fs');
const path = require('path');

const redisClient: RedisClientType = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  legacyMode: false, // 반드시 설정 !!
});

async function saveFaviconRedisWithJpg() {

  await redisClient.connect();
  logger.info('Connected to Redis successfully');

  const keys = await redisClient.keys('favicon:*');
  logger.info(`Found ${keys.length} favicon keys in Redis`);
  for (const key of keys) {
    const base64Favicon = await redisClient.get(key);
    if (!base64Favicon) {
      logger.warn(`No favicon found for key: ${key}`);
      continue;
    }
    try {
      // Extract domain from the key (assuming format is favicon:domain.com)
      const domain = key.replace('favicon:', '');

      // Remove data URL prefix if present
      let imageData = base64Favicon;

      // Convert base64 to buffer
      const buffer = Buffer.from(imageData, 'base64');

      // Create directory if it doesn't exist
      const outputDir = path.join(__dirname, './favicons');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `${domain}.jpg`);
      fs.writeFileSync(outputPath, buffer);

      logger.info(`Saved favicon for ${domain} to ${outputPath}`);
    } catch (error) {
      logger.error(`Error saving favicon for key ${key}: ${error}`);
    }

  }
}

saveFaviconRedisWithJpg()
  .then(() => {
    logger.info('Favicon saving completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error during favicon saving:', error);
    process.exit(1);
  });