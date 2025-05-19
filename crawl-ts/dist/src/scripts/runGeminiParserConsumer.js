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
const dotenv = __importStar(require("dotenv"));
const GeminiParser_1 = require("../parser/GeminiParser");
const Consumer_1 = require("../message/Consumer");
const logger_1 = require("../utils/logger");
const enums_1 = require("@message/enums");
const RedisUrlManager_1 = require("../url/RedisUrlManager");
const RecruitInfoRepository_1 = require("@database/RecruitInfoRepository");
// Load environment variables
dotenv.config();
(async () => {
    const parser = new GeminiParser_1.GeminiParser();
    const consumer = new Consumer_1.Consumer(enums_1.QueueNames.VISIT_RESULTS);
    const urlManager = new RedisUrlManager_1.RedisUrlManager();
    const recruitInfoRepository = new RecruitInfoRepository_1.RecruitInfoRepository();
    recruitInfoRepository.initialize();
    await consumer.connect();
    await urlManager.connect();
    consumer.handleLiveMessage(async (msg) => {
        if (msg) {
            const rawContent = JSON.parse(msg.content.toString());
            // verify
            await parser.parseRawContentRetry(rawContent, 100, 2000)
                .then((parseContent) => {
                if (!parseContent) {
                    throw new GeminiParser_1.ParseError("parsesContent가 존재하지 않습니다.");
                }
                return urlManager.getFavicon(rawContent.url).then((favicon) => ({ favicon, parseContent }));
            })
                .then((context) => parser.makeDbRecruitInfo(context.parseContent, rawContent, context.favicon))
                .then((recruitInfo) => {
                if (!recruitInfo) {
                    throw new GeminiParser_1.ParseError("RecruitInfo가 존재하지 않습니다.");
                }
                return recruitInfoRepository.createRecruitInfo(recruitInfo);
            })
                .catch((error) => {
                if (error instanceof GeminiParser_1.ParseError) {
                    logger_1.defaultLogger.error(`[consumer] Parse  중 에러 : ${error.message}`);
                }
                else {
                    logger_1.defaultLogger.error(`[consumer] 저장 중 에러 ${error}`);
                }
                throw error;
            });
        }
    }, 1000);
})();
/**
 * Initialize and start the GeminiParser as a RabbitMQ consumer
 */
//# sourceMappingURL=runGeminiParserConsumer.js.map