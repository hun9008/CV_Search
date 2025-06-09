import 'dotenv/config';
import { RedisUrlManager ,URLSTAUS } from '../url/RedisUrlManager';
import { all } from 'axios';
const redisUrlManager = new RedisUrlManager();
async function makeNotVisitedUrl() {

  await redisUrlManager.connect();

  // Get all URLs from Redis
  const allUrls = await redisUrlManager.getAllDomains();

  // Save not visited URLs back to Redis
  for (const url of allUrls) {
    await redisUrlManager.setURLStatus("http://"+url, URLSTAUS.NOT_VISITED);
  }

  const notVisitedUrls = await redisUrlManager.getURLsByStatus(URLSTAUS.NOT_VISITED);
  console.log(`Total not visited URLs: ${notVisitedUrls.length}`);
}

makeNotVisitedUrl()