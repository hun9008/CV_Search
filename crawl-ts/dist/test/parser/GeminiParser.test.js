"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const GeminiParser_1 = require("../../src/parser/GeminiParser");
const logger_1 = require("../../src/utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
describe("Gemini Parser Test", () => {
    const geminiParser = new GeminiParser_1.GeminiParser();
    beforeAll(async () => {
        await mongoose_1.default.connect(process.env.MONGODB_ADMIN_URI || '', {
            dbName: process.env.MONGODB_DB_NAME,
        });
    });
    test('loadMongoRawContent에서 배치 개수 만큼 Rawcontent를 가져갈 올 수 있어야 한다.', async () => {
        const results = await geminiParser.loadMongoRawContent(10);
        expect(results.length).toEqual(10);
    }, 2000);
    test('loadMongoRawContent에서 가져온 Rawcontent는 모두 text,title ,url, domain 이 null 아니여야한다..', async () => {
        const results = await geminiParser.loadMongoRawContent(10);
        results.map((content) => {
            if (content.title) {
                logger_1.defaultLogger.info(content.title);
            }
        });
        expect(results.some((content) => !content.domain || !content.url || !content.text || !content.title))
            .toEqual(false);
    }, 2000);
    test('parseRawContent는 rawContent를 파싱했을때,is_recruit_info가 null 없이 반환해야한다.', async () => {
        const botRespone = await geminiParser.loadMongoRawContent(1).then((results) => geminiParser.parseRawContentRetry(results[0], 4));
        expect(botRespone?.is_recruit_info).toBeDefined();
    }, 20000);
    test('parseRawContent는 rawContent를 파싱할때, 비동기 처리가 가능해야한다.', async () => {
        // 먼저 rawContent를 로드합니다
        const rawContents = await geminiParser.loadMongoRawContent(10);
        // Promise.all을 사용하여 모든 rawContent를 병렬로 처리합니다
        const botResponses = await Promise.all(rawContents.map(rawContent => geminiParser.parseRawContentRetry(rawContent, 4)));
        // 모든 응답이 올바르게 파싱되었는지 확인합니다
        botResponses.forEach(response => {
            console.log(response);
            expect(response?.is_recruit_info).toBeDefined();
        });
    }, 30000);
});
//# sourceMappingURL=GeminiParser.test.js.map