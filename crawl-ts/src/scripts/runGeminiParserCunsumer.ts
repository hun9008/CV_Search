import * as dotenv from 'dotenv';
import { GeminiParser } from '@parser/GeminiParser';
import { MongoDbConnector } from '@database/MongoDbConnector';
import { MysqlRecruitInfoRepository } from '@database/MysqlRecruitInfoRepository';
import { MongoRecruitInfoRepository } from '@database/MongoRecruitInfoRepository';
import MessageService, { QueueNames } from '@message/messageService';
import { RedisUrlManager } from '@url/RedisUrlManager';
import { ConsumeMessage } from 'amqplib';
import { defaultLogger as logger } from '@utils/logger';
import { IRawContent } from '@models/RecruitInfoModel';
import { MySqlConnector } from '@database/MySqlConnector';
import { MongoRecruitInfoModel } from '@models/MongoRecruitInfoModel';
import { mysqlRecruitInfoModel, mysqlRecruitInfoSequelize } from '@models/MysqlRecruitInfoModel';

// Load environment variables
dotenv.config();

/**
 * Initialize and start the GeminiParser as a RabbitMQ consumer
 */
export async function startGeminiParserConsumer(): Promise<void> {

  try {

       const parser = new GeminiParser({
          apiKey: process.env.GEMINI_API_KEY,
          apiKeys: process.env.GEMINI_API_KEYS?.split(','),
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
          dbConnector: new MySqlConnector(),
          cacheDbConnector: new MongoDbConnector(),
          cacheRecruitInfoRepository: new MongoRecruitInfoRepository(MongoRecruitInfoModel),
          recruitInfoRepository: new MysqlRecruitInfoRepository(mysqlRecruitInfoModel ,mysqlRecruitInfoSequelize),
          urlManager: new RedisUrlManager(),
          messageService: new MessageService(),
          useCache: true
        });
     const initialized = await parser.initialize();
    if (!initialized) {
      console.error('Failed to initialize GeminiParser');
      process.exit(1);
    }

    parser.messageService.handleLiveMessage(QueueNames.VISIT_RESULTS, async (msg : ConsumeMessage | null) => {
      if (msg) {
        const result = JSON.parse(msg.content.toString()) as IRawContent;
        logger.debug(result.url);
        const parsedContent = await parser.parseRawContent(result);
        const dbRecruitInfo = parser.makeDbRecruitInfo( parsedContent,result);
        // const saved = await this.saveParsedContent(dbRecruitInfo, { destination: 'db' });
        await parser.recruitInfoRepository.createRecruitInfo(dbRecruitInfo);
        if (parser.cacheRecruitInfoRepository) {
          await parser.cacheRecruitInfoRepository.createRecruitInfo(dbRecruitInfo);
        }
        await parser.messageService.sendAck(msg);
      }
    });

    console.log('Starting GeminiParser as consumer...');
    console.log('GeminiParser consumer is now active and listening for messages');
    // Setup graceful shutdown

  } catch (error) {
    console.error('Error in startGeminiParserConsumer function:', error);
    // Ensure connections are closed even if there's an error
    try {
      console.log('Disconnected from services due to error');
    } catch (disconnectError) {
      console.error('Error disconnecting from services:', disconnectError);
    }
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  startGeminiParserConsumer().catch(error => {
    console.error('Uncaught error:', error);
    process.exit(1);
  });
}