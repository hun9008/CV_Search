import { Producer } from '@message/Producer';
import {Consumer } from '../../src/message/Consumer';
import { IRawContent, RawContentSchema } from '@models/RawContentModel';

describe('Consumer', () => {

  let consumer: Consumer;
  let producer: Producer;

  beforeAll(async () => {
    consumer = new Consumer('test_queue');
    producer = new Producer('test_queue');
    await producer.connect();
    await consumer.connect();
  });


  test('handleLiveMessage() should recive a message to the queue', async () => {
    const message: IRawContent = { url: 'message', title: 'test title', domain: 'test content', text: 'test content' };

    await producer.sendMessage(message);
    await producer.sendMessage(message);

    await consumer.handleLiveMessage(async (msg) => {
      const content = msg?.content.toString();
      console.log(content);
      if (content) {
        expect(content).toContain('message');
        expect(RawContentSchema.safeParse(JSON.parse(content))).toBeTruthy()// 어떤 내용이든 검증

      }
    }, 3000);
    await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait for the message to be processed


  });


  afterAll(async () => {
    await producer.close();
    await consumer.close();
  });

});