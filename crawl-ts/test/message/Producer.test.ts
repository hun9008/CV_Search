import {Producer } from '../../src/message/Producer';
import { IRawContent } from '@models/RawContentModel';

describe('Producer', () => {

  let producer: Producer;

  beforeAll(async () => {
    producer = new Producer('test_queue');
    await producer.connect();
  });

  test('connect() should establish a connection to RabbitMQ', async () => {
 ;
  });

  test('sendMessage() should send a message to the queue', async () => {
    const message : IRawContent  = { url: 'message' ,title: 'test title', domain: 'test content' ,text :'test content'};
    await producer.sendMessage(message);
  });

  test('sendMessage() should not send a message to the queue', async () => {
    const message: any = { url: 'message', title: 'test title' };
    try {
      await producer.sendMessage(message);
      fail('Expected error not thrown');
    }catch (error) {
      expect((error as Error).message).toContain('Invalid message format');
    }
  });

  afterAll( async () => {
    await producer.close();
  });

});