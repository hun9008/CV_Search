import * as dotenv from 'dotenv';
import { GeminiParser } from './GeminiParser';
import { MongoDbConnector } from '@database/MongoDbConnector';
import { MysqlRecruitInfoRepository} from '@database/MysqlRecruitInfoRepository';
import { MongoRecruitInfoModel } from '@models/MongoRecruitInfoModel';
import { mysqlRecruitInfoModel, mysqlRecruitInfoSequelize } from '@models/MysqlRecruitInfoModel';
import MessageService from '@message/messageService';
import { RedisUrlManager } from '@url/RedisUrlManager';
import { MongoRecruitInfoRepository } from '@database/MongoRecruitInfoRepository';
import { MysqlRecruitInfoSequelize } from '@models/MysqlRecruitInfoModel';
import { MySqlConnector } from '@database/MySqlConnector';
// Load environment variables
dotenv.config();

/**
 * Initialize and run the GeminiParser
 */
export async function runGeminiParser(): Promise<void> {


  try {

    // Create an instance of GeminiParser
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

    // Initialize the parser
    const initialized = await parser.initialize();
    if (!initialized) {
      console.error('Failed to initialize GeminiParser');
      process.exit(1);
    }

    // Run the parser to process raw content
     await parser.run();


  } catch (error) {
    console.error('Error in runGeminiParser function:', error);
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  runGeminiParser().catch(error => {
    console.error('Uncaught error:', error);
    process.exit(1);
  });
}