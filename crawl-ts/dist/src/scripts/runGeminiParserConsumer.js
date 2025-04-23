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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGeminiParserConsumer = startGeminiParserConsumer;
const dotenv = __importStar(require("dotenv"));
const GeminiParser_1 = require("../parser/GeminiParser");
const MongoDbConnector_1 = require("../database/MongoDbConnector");
const MysqlRecruitInfoRepository_1 = require("../database/MysqlRecruitInfoRepository");
const MongoRecruitInfoRepository_1 = require("../database/MongoRecruitInfoRepository");
const MessageService_1 = __importStar(require("../message/MessageService"));
const RedisUrlManager_1 = require("../url/RedisUrlManager");
const logger_1 = require("../utils/logger");
const MySqlConnector_1 = require("../database/MySqlConnector");
const MongoRecruitInfoModel_1 = require("../models/MongoRecruitInfoModel");
const MysqlRecruitInfoModel_1 = require("../models/MysqlRecruitInfoModel");
// Load environment variables
dotenv.config();
/**
 * Initialize and start the GeminiParser as a RabbitMQ consumer
 */
async function startGeminiParserConsumer() {
    try {
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
        const initialized = await parser.initialize();
        if (!initialized) {
            console.error('Failed to initialize GeminiParser');
            process.exit(1);
        }
        parser.messageService.handleLiveMessage(MessageService_1.QueueNames.VISIT_RESULTS, async (msg) => {
            if (msg) {
                const result = JSON.parse(msg.content.toString());
                logger_1.defaultLogger.debug(result.url);
                const parsedContent = await parser.parseRawContent(result);
                const dbRecruitInfo = parser.makeDbRecruitInfo(parsedContent, result);
                // const saved = await this.saveParsedContent(dbRecruitInfo, { destination: 'db' });
                await parser.recruitInfoRepository.createRecruitInfo(dbRecruitInfo);
                if (parser.cacheRecruitInfoRepository) {
                    await parser.cacheRecruitInfoRepository.createRecruitInfo(dbRecruitInfo);
                }
            }
        });
        console.log('Starting GeminiParser as consumer...');
        console.log('GeminiParser consumer is now active and listening for messages');
        // Setup graceful shutdown
    }
    catch (error) {
        console.error('Error in startGeminiParserConsumer function:', error);
        // Ensure connections are closed even if there's an error
        try {
            console.log('Disconnected from services due to error');
        }
        catch (disconnectError) {
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
//# sourceMappingURL=runGeminiParserConsumer.js.map