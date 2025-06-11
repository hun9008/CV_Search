import 'dotenv/config';
import { RedisClientType, createClient } from 'redis';
import { RedisKey } from '../models/ReidsModel';
import { defaultLogger as logger } from '../../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

logger.debug(`env config ... ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  legacyMode: false, // 반드시 설정 !!
});

export interface DomainData {

  domain: string;
  allowed_prefix_url: string;
  seed_url: string;

}


/**
 * Reads a CSV file and returns its contents as an array of objects
 * @param filePath Path to the CSV file
 * @returns Promise resolving to an array of objects where keys are CSV headers
 */
async function readCsvFile(filePath: string): Promise<DomainData[]> {
  return new Promise((resolve, reject) => {
    const results: DomainData[] = [];

    fs.createReadStream(path.resolve(filePath), { encoding: 'utf-8' })
      .pipe(parse({
        columns: ['domain', 'allowed_prefix_url', 'seed_url', '비고'],
        skip_empty_lines: true
      }))
      .on('data', (data: any) => {
        const domainData: DomainData = {
          domain: data.domain,
          allowed_prefix_url: data.allowed_prefix_url,
          seed_url: data.seed_url
        };
        if (domainData.domain !== 'domain') {
          results.push(domainData)
        }
      }
      )

      .on('end', () => resolve(results))
      .on('error', (error:any) => reject(error));
  });
}




/**
 * Redis에 저장된 도메인 목록을 가져와서 각 도메인에 대한 허용된 URL 접두사를 설정합니다.
 * 'allowed_url_prefix' 키에 URL 접두사를 설정합니다.
 */
async function setAllowedUrlPrefix() {
  try {
    // Redis 클라이언트 연결
    await redisClient.connect();
    logger.info('Connected to Redis');

    // 'allowed_url_prefix' 키에 URL 접두사 설정
    const domains = await redisClient.sMembers('domains');
    for (const domain of domains) {
      console.log(`${domain}`);
      await redisClient.sAdd(RedisKey.ALLOWED_URL_PREFIX_KEY_BY_DOMAIN(domain), 'domain');
    }

  } catch (error) {
    logger.error('Error setting allowed URL prefixes:', error);
  } finally {
    // Redis 클라이언트 연결 종료
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

(async () => {
  await redisClient.connect();
  const data = await readCsvFile('static/domains.csv');
  try{``
      // CSV 데이터를 처리하는 로직을 여기에 추가할 수 있습니다.
      await Promise.all(data.map(async (domainData) => {
        const { domain, allowed_prefix_url, seed_url } = domainData;
        logger.info(`Setting allowed URL prefix for domain: ${domain}, prefix: ${allowed_prefix_url}, seed URL: ${seed_url}`)
        await redisClient.sAdd(RedisKey.DOMAINS_KEY(), domain);
        await redisClient.sAdd(RedisKey.ALLOWED_URL_PREFIX_KEY_BY_DOMAIN(domain),allowed_prefix_url);
        await redisClient.sAdd(RedisKey.SEED_URL_KEY_BY_DOMAIN(domain), seed_url);
        return;
      }));
    }
  catch(error) {
    console.error('Error reading CSV file:', error);
  }
})()





// setAllowedUrlPrefix()