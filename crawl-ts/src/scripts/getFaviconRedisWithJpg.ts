import 'dotenv/config';
import { RedisClientType, createClient } from 'redis';
import { defaultLogger as logger } from '../utils/logger';
const { parse } = require('tldts');
import axios from 'axios';



const redisClient: RedisClientType = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  legacyMode: false, // 반드시 설정 !!
});
async function getFavcionRedsiWithJpg() {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis successfully');

    const domains = await redisClient.sMembers('domains');

    const baseDomains = domains.map(domain => {
      const parsed = parse(domain);
      if (typeof parsed === 'object' && parsed.domain) {
        return parsed.domain;
      } else {
        logger.warn(`Could not parse domain: ${domain}`);
        return null;
      }
    }).filter((d): d is string => d !== null);


    for (const baseDomain of baseDomains) {
      logger.info(`Base Domain: ${baseDomain}`);
      const response = await axios.get(`https://img.logo.dev/${baseDomain}?token=pk_b1VhcZ8ERzW8lBRwKPatPA&retina=true`, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      // Base64로 인코딩
      const base64Favicon = Buffer.from(response.data).toString('base64');
      redisClient.set(`favicon:${baseDomain}`, base64Favicon );
    }

    logger.info(`Extracted ${baseDomains.length} base domains from ${domains.length} total domains`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`get image ${error.message}`);
      throw error;
    }
  }
}

getFavcionRedsiWithJpg();