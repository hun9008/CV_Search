"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Producer_1 = require("../../src/message/Producer");
describe('Producer', () => {
    let producer;
    beforeAll(async () => {
        producer = new Producer_1.Producer('test_queue');
        await producer.connect();
    });
    test('connect() should establish a connection to RabbitMQ', async () => {
        ;
    });
    test('sendMessage() should send a message to the queue', async () => {
        const message = { url: 'message', title: 'test title', domain: 'test content', text: 'test content' };
        await producer.sendMessage(message);
    });
    test('sendMessage() should not send a message to the queue', async () => {
        const message = { url: 'message', title: 'test title' };
        try {
            await producer.sendMessage(message);
            fail('Expected error not thrown');
        }
        catch (error) {
            expect(error.message).toContain('Invalid message format');
        }
    });
    afterAll(async () => {
        await producer.close();
    });
});
//# sourceMappingURL=Producer.test.js.map