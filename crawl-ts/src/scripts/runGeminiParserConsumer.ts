import * as dotenv from 'dotenv';
import { GeminiParser, ParseError } from '../parser/GeminiParser';
import { Consumer } from '../message/Consumer';
import { defaultLogger as logger } from '../utils/logger';
import { IRawContent } from '../models/RawContentModel';
import { QueueNames } from '../message/enums';
import { RedisUrlManager } from '../url/RedisUrlManager';
import { RecruitInfoRepository } from '../database/RecruitInfoRepository';



// Load environment variables
dotenv.config();


(async () => {

  const parser = new GeminiParser();
  const consumer = new Consumer(QueueNames.VISIT_RESULTS);
  const urlManager = new RedisUrlManager();
  const recruitInfoRepository = new RecruitInfoRepository();
  // recruitInfoRepository.initialize();
  await consumer.connect();
  await urlManager.connect();
  consumer.handleLiveMessage(
    async (msg) => {
      if (msg) {
        const rawContent = JSON.parse(msg.content.toString()) as IRawContent;
        // verify
        await parser.parseRawContentRetry(rawContent, 100, 2000)
          .then(
            (parseContent) => {
              if (!parseContent) {
                throw new ParseError(" ParseContent가 존재하지 않습니다.");
              }
              if (parser.verifyRecruitInfo(parseContent) === false) {
                throw new ParseError("ParseContent가 RecruitInfo가 아닙니다.");
              }
              return urlManager.getFavicon(rawContent.url).then((favicon) => ({ favicon, parseContent }))
            }
          )
          .then(
            (context) => parser.makeDbRecruitInfo(context.parseContent, rawContent, context.favicon)
          )
          .then(
            (recruitInfo) => {
              if (!recruitInfo) { throw new ParseError("RecruitInfo가 존재하지 않습니다.") }
              return recruitInfoRepository.createRecruitInfo(recruitInfo)
            }
        )
          .then(() => {
            logger.eventInfo('[consumer] 채용 공고 저장 성공');
          })
          .catch(
            (error) => {
              if (error instanceof ParseError) {
                logger.error(`[consumer] Parse  중 에러 : ${error.message}`);
              } else {
                logger.error(`[consumer] 저장 중 에러 ${error}`);
                throw error;
              }
            }
          )
      }
    }
  ,1000)
})()
/**
 * Initialize and start the GeminiParser as a RabbitMQ consumer
 */


