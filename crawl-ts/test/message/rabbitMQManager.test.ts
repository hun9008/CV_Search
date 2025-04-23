import amqp from 'amqplib';
import RabbitMQManager from '../../src/message/RabbitMQManager';
import { QueueNames } from '@message/MessageService';
// Mock amqplib

jest.mock('amqplib', () => {
  // Mock Channel
  const mockChannel = {
    assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
    sendToQueue: jest.fn().mockReturnValue(true),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
  };

  // Mock Connection
  const mockConnection = {
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
  };

  return {
    connect: jest.fn().mockResolvedValue(mockConnection)
  };
});

describe('RabbitMQManager', () => {
  let rabbitMQManager: RabbitMQManager;
  const testUri = 'amqp://test-host:5672';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Create a new instance of RabbitMQManager
    rabbitMQManager = new RabbitMQManager(testUri);
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      // Reset the singleton instance
      (RabbitMQManager as any).instance = undefined;

      const instance1 = RabbitMQManager.getInstance();
      const instance2 = RabbitMQManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create a new instance with the provided URI', () => {
      // Reset the singleton instance
      (RabbitMQManager as any).instance = undefined;

      const customUri = 'amqp://custom-host:5672';
      const instance = RabbitMQManager.getInstance(customUri);

      expect((instance as any).uri).toBe(customUri);
    });
  });

  describe('connect', () => {
    it('should connect to RabbitMQ server', async () => {
      await rabbitMQManager.connect();

      expect(amqp.connect).toHaveBeenCalledWith(testUri);
    });

    it('should reuse existing connection if available', async () => {
      // Connect once
      await rabbitMQManager.connect();
      // Connect again
      await rabbitMQManager.connect();

      // Should only connect once
      expect(amqp.connect).toHaveBeenCalledTimes(1);
    });

    it('should create a new channel if not available', async () => {
      await rabbitMQManager.connect();

      const mockConnection = await (amqp.connect as jest.Mock).mock.results[0].value;
      expect(mockConnection.createChannel).toHaveBeenCalledTimes(1);
    });

    it('should set up event listeners for connection and channel', async () => {
      await rabbitMQManager.connect();

      const mockConnection = await (amqp.connect as jest.Mock).mock.results[0].value;
      const mockChannel = await mockConnection.createChannel.mock.results[0].value;

      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockChannel.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockChannel.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('assertQueue', () => {
    it('should assert a queue with default options', async () => {
      await rabbitMQManager.assertQueue(QueueNames.VISIT_RESULTS);

      // Get the channel from the mock
      const mockConnection = await (amqp.connect as jest.Mock).mock.results[0].value;
      const mockChannel = await mockConnection.createChannel.mock.results[0].value;

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(QueueNames.VISIT_RESULTS, { durable: true });
    });

    it('should assert a queue with custom options', async () => {
      const options = { durable: false, autoDelete: true };
      await rabbitMQManager.assertQueue(QueueNames.VISIT_RESULTS, options as any);

      // Get the channel from the mock
      const mockConnection = await (amqp.connect as jest.Mock).mock.results[0].value;
      const mockChannel = await mockConnection.createChannel.mock.results[0].value;

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(QueueNames.VISIT_RESULTS, options);
    });

    it('should connect if not already connected', async () => {
      await rabbitMQManager.assertQueue(QueueNames.VISIT_RESULTS);

      expect(amqp.connect).toHaveBeenCalledWith(testUri);
    });
  });

  describe('sendToQueue', () => {
    it('should send a message to the queue', async () => {
      const message = { test: 'message' };
      const options = { persistent: true };

      await rabbitMQManager.sendToQueue(QueueNames.VISIT_RESULTS, message, options);

      // Get the channel from the mock
      const mockConnection = await (amqp.connect as jest.Mock).mock.results[0].value;
      const mockChannel = await mockConnection.createChannel.mock.results[0].value;

      // Check that assertQueue was called first
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(QueueNames.VISIT_RESULTS, { durable: true });

      // Check that sendToQueue was called with the right parameters
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        QueueNames.VISIT_RESULTS,
        Buffer.from(JSON.stringify(message)),
        options
      );
    });

    it('should connect if not already connected', async () => {
      await rabbitMQManager.sendToQueue(QueueNames.VISIT_RESULTS, { test: 'message' });

      expect(amqp.connect).toHaveBeenCalledWith(testUri);
    });

    it('should handle Buffer messages', async () => {
      const messageBuffer = Buffer.from('test message');

      await rabbitMQManager.sendToQueue(QueueNames.VISIT_RESULTS, messageBuffer);

      // Get the channel from the mock
      const mockConnection = await (amqp.connect as jest.Mock).mock.results[0].value;
      const mockChannel = await mockConnection.createChannel.mock.results[0].value;

      // Check that sendToQueue was called with the buffer directly
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        QueueNames.VISIT_RESULTS,
        messageBuffer,
        {}
      );
    });
  });

  describe('close', () => {
    it('should close the channel and connection', async () => {
      // Connect first
      await rabbitMQManager.connect();

      // Then close
      await rabbitMQManager.close();

      // Get the mocks
      const mockConnection = await (amqp.connect as jest.Mock).mock.results[0].value;
      const mockChannel = await mockConnection.createChannel.mock.results[0].value;

      // Check that close was called on both channel and connection
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle case when nothing is connected', async () => {
      // Just call close without connecting first
      await expect(rabbitMQManager.close()).resolves.not.toThrow();
    });
  });
});