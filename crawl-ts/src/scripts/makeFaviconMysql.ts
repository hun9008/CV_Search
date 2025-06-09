import 'dotenv/config';
import {   defaultLogger as logger } from '../../src/utils/logger';
import { MysqlFaviconSequelize, MysqlRecruitInfoSequelize } from '../models/MysqlRecruitInfoModel';
import { RedisUrlManager } from '../url/RedisUrlManager';
import { Op } from 'sequelize';

async function main() {

  const redisUrlManager = new RedisUrlManager();
  await redisUrlManager.connect();
  const faviconList = await redisUrlManager.getAllFavicon();

  for (const data of faviconList) {
    try {
      const result = await MysqlFaviconSequelize.upsert({ domain: data.domain, logo: data.logo }, { returning: true });
      logger.debug('[MysqlRecruitInfoRepository][createRecruitInfo] 파비콘 저장 성공:', result[0].id);
      logger.debug('[MysqlRecruitInfoRepository][createRecruitInfo] 파비콘 저장 성공:', data.domain);
    } catch (error) {
      logger.error(`Error checking URL in MySQL: ${data.domain}`, error);
    }
  }

  const favicon_ids = await MysqlFaviconSequelize.findAll({
    attributes: ['id', 'domain', 'logo'],
    raw: true,
  });

  for (const favicon of favicon_ids) {
    try {
        await MysqlRecruitInfoSequelize.update({favicon_id : favicon.id}, {where :{ url: {
          [Op.like]: `%${favicon.domain}%`
        }
        }
        })
      logger.debug('[MysqlRecruitInfoRepository][createRecruitInfo] 파비콘 ID 업데이트 성공:', favicon.id);
    }
    catch (error) { }
  }

}

main()
  .then(() => {
    logger.info('Favicon data migration completed successfully.');
  })
  .catch((error) => {
    logger.error('Error during favicon data migration:', error);
  });