// redisClient.ts
import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';
import { IDbConnector } from './IDbConnector';
import { defaultLogger as logger } from '../utils/logger';

// 환경 변수 로드
dotenv.config();

const redis :RedisClientType = createClient({
   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
   legacyMode: false, // 반드시 설정 !!
});


export { redis };
