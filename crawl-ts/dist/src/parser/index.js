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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGeminiParser = runGeminiParser;
const dotenv = __importStar(require("dotenv"));
const GeminiParser_1 = require("./GeminiParser");
const MongoDbConnector_1 = require("@database/MongoDbConnector");
const MysqlRecruitInfoRepository_1 = require("@database/MysqlRecruitInfoRepository");
const MongoRecruitInfoModel_1 = require("@models/MongoRecruitInfoModel");
const MysqlRecruitInfoModel_1 = require("@models/MysqlRecruitInfoModel");
const MessageService_1 = __importDefault(require("@message/MessageService"));
const RedisUrlManager_1 = require("@url/RedisUrlManager");
const MongoRecruitInfoRepository_1 = require("@database/MongoRecruitInfoRepository");
const MySqlConnector_1 = require("@database/MySqlConnector");
// Load environment variables
dotenv.config();
/**
 * Initialize and run the GeminiParser
 */
async function runGeminiParser() {
    try {
        // Create an instance of GeminiParser
        const parser = new GeminiParser_1.GeminiParser({
            apiKey: process.env.GEMINI_API_KEY,
            apiKeys: process.env.GEMINI_API_KEYS?.split(','),
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
            dbConnector: new MySqlConnector_1.MySqlConnector(),
            cacheDbConnector: new MongoDbConnector_1.MongoDbConnector(),
            cacheRecruitInfoRepository: new MongoRecruitInfoRepository_1.MongoRecruitInfoRepository(MongoRecruitInfoModel_1.MongoRecruitInfoModel),
            recruitInfoRepository: new MysqlRecruitInfoRepository_1.MysqlRecruitInfoRepository(MysqlRecruitInfoModel_1.mysqlRecruitInfoModel, MysqlRecruitInfoModel_1.mysqlRecruitInfoSequelize),
            urlManager: new RedisUrlManager_1.RedisUrlManager(),
            messageService: new MessageService_1.default(),
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