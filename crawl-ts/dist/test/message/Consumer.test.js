"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Producer_1 = require("@message/Producer");
const Consumer_1 = require("../../src/message/Consumer");
const RawContentModel_1 = require("@models/RawContentModel");
describe('Consumer', () => {
    let consumer;
    let producer;
    beforeAll(async () => {
        consumer = new Consumer_1.Consumer('test_queue');
        producer = new Producer_1.Producer('test_queue');
        await producer.connect();
        await consumer.connect();
    });
    test('handleLiveMessage() should recive a message to the queue', async () => {
        const message = { url: 'message', title: 'test title', domain: 'test content', text: 'test content' };
        await producer.sendMessage(message);
        await producer.sendMessage(message);
        await consumer.handleLiveMessage(async (msg) => {
            const content = msg?.content.toString();
            console.log(content);
            if (content) {
                expect(content).toContain('message');
                expect(RawContentModel_1.RawContentSchema.safeParse(JSON.parse(content))).toBeTruthy(); // 어떤 내용이든 검증
            }
        }, 3000);
        await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait for the message to be processed
    });
    afterAll(async () => {
        await producer.close();
        await consumer.close();
    });
});
//# sourceMappingURL=Consumer.test.js.map