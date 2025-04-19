import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GeminiParser } from './GeminiParser';
import { MongoDbConnector } from '../database/MongoDbConnector';
import { MySqlRecruitInfoService } from '../database/MySqlRecruitInfoService';
// Load environment variables
dotenv.config();

/**
 * Initialize and run the GeminiParser
 */
export async function runGeminiParser(): Promise<void> {
  let db: MongoDbConnector | null = null;
  let mysql: MySqlRecruitInfoService | null = null;

  try {
    // Connect to MongoDB
    db = new MongoDbConnector();
    mysql = new MySqlRecruitInfoService({});
    await db.connect();
    await mysql.connect();

    console.log('Starting GeminiParser...');

    // Create an instance of GeminiParser
    const parser = new GeminiParser({
      apiKey: process.env.GEMINI_API_KEY,
      apiKeys: process.env.GEMINI_API_KEYS?.split(','),
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
      dbConnector: db,
      mySqlService: mysql,
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

    // Wait a bit before disconnecting from the database
    setTimeout(async () => {
      if (db) await db.disconnect();
      if (mysql) await mysql.disconnect();
      console.log('Disconnected from databases');
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('Error in runGeminiParser function:', error);
    // Ensure connections are closed even if there's an error
    try {
      if (db) await db.disconnect();
      if (mysql) await mysql.disconnect();
      console.log('Disconnected from databases due to error');
    } catch (disconnectError) {
      console.error('Error disconnecting from databases:', disconnectError);
    }
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