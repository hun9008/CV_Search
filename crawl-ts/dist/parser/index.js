"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGeminiParser = runGeminiParser;
const dotenv = __importStar(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const GeminiParser_1 = require("./GeminiParser");
// Load environment variables
dotenv.config();
// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_ADMIN_URI || 'mongodb://localhost:27017/cv_search';
/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
    try {
        await mongoose_1.default.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME,
        });
        console.log('Connected to MongoDB');
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}
/**
 * Initialize and run the GeminiParser
 */
async function runGeminiParser() {
    try {
        // Connect to MongoDB
        await connectToDatabase();
        console.log('Starting GeminiParser...');
        // Create an instance of GeminiParser
        const parser = new GeminiParser_1.GeminiParser({
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
            mongoose_1.default.disconnect();
            console.log('Disconnected from MongoDB');
            process.exit(0);
        }, 3000);
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map