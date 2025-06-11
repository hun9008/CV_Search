import { defaultLogger as logger } from '../utils/logger';
import { Consumer } from '../message/Consumer';
import { QueueNames } from '../message/enums';
import { IRawContent } from '../models/RawContentModel';
import { GeminiParser,ParseError } from '../parser/GeminiParser';
import { redisUrlManager,RedisUrlManager } from '../url/RedisUrlManager';
import { RecruitInfoRepository } from '../database/RecruitInfoRepository';


export class JobPipeLine  {
  private parser: GeminiParser;
  private consumer: Consumer;
  private urlManager: RedisUrlManager;
  private recruitInfoRepository: RecruitInfoRepository;

  private running: boolean = false;
  constructor() {
    this.parser = new GeminiParser();
    this.consumer = new Consumer(QueueNames.VISIT_RESULTS);
    this.urlManager = redisUrlManager;
    this.recruitInfoRepository = new RecruitInfoRepository();
    this.running = false;
  }

  async run(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info('JobPipeLine 연결 성공');
      this.running = true;
      await this.consumer.handleLiveMessage(
          async (msg) => {
            if (msg) {
              const rawContent = JSON.parse(msg.content.toString()) as IRawContent;
              // verify
              await this.parser.parseRawContentRetry(rawContent, 100, 2000)
                .then(
                  (parseContent) => {
                    if (!parseContent) {
                      throw new ParseError(" ParseContent가 존재하지 않습니다.");
                    }
                    if (this.parser.verifyRecruitInfo(parseContent) === false) {
                      throw new ParseError("ParseContent가 RecruitInfo가 아닙니다.");
                    }
                    return this.urlManager.getFavicon(rawContent.url).then((favicon) => ({ favicon, parseContent }))
                  }
                )
                .then(
                  (context) => this.parser.makeDbRecruitInfo(context.parseContent, rawContent, context.favicon)
                )
                .then(
                  (recruitInfo) => {
                    if (!recruitInfo) { throw new ParseError("RecruitInfo가 존재하지 않습니다.") }
                    return this.recruitInfoRepository.createRecruitInfo(recruitInfo)
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
        ,1000);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`JobPipeLine 연결 실패: ${error.message}`);
      }
    }
    console.log('JobPipeLine 실행 중...');
  }

  async stop(): Promise<void> {
    this.running = false
    await this.consumer.close();
    // 여기에 파이프라인 중지 로직을 추가합니다.
    // 예시로, 데이터베이스 연결 해제, 크롤러 중지 등을 수행할 수 있습니다.
    console.log('JobPipeLine 중지 중...');
  }

  getStatus(): boolean {
    return this.running;
  }



}