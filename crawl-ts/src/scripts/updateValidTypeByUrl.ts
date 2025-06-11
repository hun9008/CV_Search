import { createClient } from 'redis';
import 'dotenv/config';
import { defaultLogger as logger } from '../utils/logger';
import { MysqlRecruitInfoSequelize, VALID_TYPE } from '../models/MysqlRecruitInfoModel';
import { RedisKey } from '../models/ReidsModel';
import { Op } from 'sequelize';

const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  legacyMode: false, // 반드시 설정 !!
});


async function updateValidTypeByUrl() {
  try {

    await redisClient.connect();
    logger.info('Connected to Redis successfully');

    // Fetch all keys from the 'validated_job:success' hash
    const domains = await redisClient.sMembers(RedisKey.DOMAINS_KEY());
    for (const domain of domains) {
      const allowedPrefixUrls = await redisClient.sMembers(RedisKey.ALLOWED_URL_PREFIX_KEY_BY_DOMAIN(domain));
      const datas = await MysqlRecruitInfoSequelize.findAll({
        attributes: ['id', 'url'],
        where: { url: { [Op.like]: `%${domain}%` } }
      });
      for (const data of datas) {
        const url = data.url;
        const isValid = allowedPrefixUrls.some(prefix => url.startsWith(prefix));
        if (isValid) {
          // Update the job_valid_type to 1 for valid URLs
          // await MysqlRecruitInfoSequelize.update(
          //   { job_valid_type: VALID_TYPE.ACTIVE },
          //   { where: { id: data.id } }
          // );
          logger.eventInfo(`Updated job_valid_type to 1 for ID: ${data.id}, URL: ${url}`);
        } else {
          // Update the job_valid_type to 0 for invalid URLs
          await MysqlRecruitInfoSequelize.update(
            { job_valid_type: VALID_TYPE.ERROR },
            { where: { id: data.id } }
          );
          logger.eventInfo(`Updated job_valid_type to 3 for ID: ${data.id}, URL: ${url}`);
        }

      }
    }

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error connecting to Redis or updating database: ${error.message}`);
      throw new Error("Failed to connect to Redis or update database");
    }
  }
}

updateValidTypeByUrl();