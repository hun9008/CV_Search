import MessageService, { QueueNames } from '../../src/message/messageService';
import RabbitMQManager from '../../src/message/rabbitMQManager';

// Mock the RabbitMQManager
jest.mock('../../src/message/rabbitMQManager', () => {
  const mockRabbitMQManager = {
    connect: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
    sendToQueue: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined)
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockRabbitMQManager),
    getInstance: jest.fn(() => mockRabbitMQManager)
  };
});

describe('MessageService', () => {
  let messageService: MessageService;
  let mockRabbitMQManager: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Get the mock instance
    mockRabbitMQManager = (RabbitMQManager.getInstance as jest.Mock)();

    // Create a new MessageService instance with the mock
    messageService = new MessageService(mockRabbitMQManager);
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      // Reset the singleton instance
      (MessageService as any).instance = undefined;

      const instance1 = MessageService.getInstance();
      const instance2 = MessageService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create the instance with the RabbitMQManager', () => {
      // Reset the singleton instance
      (MessageService as any).instance = undefined;

      MessageService.getInstance();

      expect(RabbitMQManager.getInstance).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should connect to RabbitMQ', async () => {
      await messageService.connect();

      expect(mockRabbitMQManager.connect).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close the RabbitMQ connection', async () => {
      await messageService.close();

      expect(mockRabbitMQManager.close).toHaveBeenCalled();
    });
  });

  describe('sendVisitResult', () => {
    it('should send visit result to the correct queue', async () => {
      const visitResult = {
        url: 'https://example.com',
        domain: 'example.com',
        visited: true
      };

      await messageService.sendVisitResult(visitResult);

      expect(mockRabbitMQManager.sendToQueue).toHaveBeenCalledWith(
        QueueNames.VISIT_RESULTS,
        visitResult,
        { persistent: true }
      );
    });

    it('should return true when message is sent successfully', async () => {
      mockRabbitMQManager.sendToQueue.mockResolvedValue(true);

      const result = await messageService.sendVisitResult({ url: 'test' });

      expect(result).toBe(true);
    });

    it('should return false when message sending fails', async () => {
      mockRabbitMQManager.sendToQueue.mockResolvedValue(false);

      const result = await messageService.sendVisitResult({ url: 'test' });

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      mockRabbitMQManager.sendToQueue.mockRejectedValue(new Error('Test error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await messageService.sendVisitResult({ url: 'test' });

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendRecruitInfo', () => {
    it('should send recruit info to the correct queue', async () => {
      const recruitInfo = {
        title: 'Software Engineer',
        company: 'Example Corp',
        location: 'Remote'
      };

      await messageService.sendRecruitInfo(recruitInfo);

      expect(mockRabbitMQManager.sendToQueue).toHaveBeenCalledWith(
        QueueNames.RECRUIT_INFO,
        recruitInfo,
        { persistent: true }
      );
    });

    it('should return true when message is sent successfully', async () => {
      mockRabbitMQManager.sendToQueue.mockResolvedValue(true);

      const result = await messageService.sendRecruitInfo({ title: 'test' });

      expect(result).toBe(true);
    });

    it('should return false when message sending fails', async () => {
      mockRabbitMQManager.sendToQueue.mockResolvedValue(false);

      const result = await messageService.sendRecruitInfo({ title: 'test' });

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      mockRabbitMQManager.sendToQueue.mockRejectedValue(new Error('Test error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await messageService.sendRecruitInfo({ title: 'test' });

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});