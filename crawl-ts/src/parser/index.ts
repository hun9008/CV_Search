import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GeminiParser } from './GeminiParser';

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_ADMIN_URI || 'mongodb://localhost:27017/cv_search';

/**
 * Connect to MongoDB
 */
async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI ,{
        dbName: process.env.MONGODB_DB_NAME,
      });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Initialize and run the GeminiParser
 */
export async function runGeminiParser(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    console.log('Starting GeminiParser...');

    // Create an instance of GeminiParser
    const parser = new GeminiParser({
      
      apiKey: process.env.GEMINI_API_KEY,
      apiKeys: process.env.GEMINI_API_KEYS?.split(','),
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
      useCache: true
    });

    // Initialize the parser
    const initialized = await parser.initialize();
    if (!initialized) {
      console.error('Failed to initialize GeminiParser');
      process.exit(1);
    }

    // Run the parser to process raw content
    const runFunction = await parser.run();

    // Wait a bit before disconnecting from the database
    setTimeout(() => {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      process.exit(0);
    }, 3000);

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