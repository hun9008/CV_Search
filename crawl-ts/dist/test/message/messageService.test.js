"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MessageService_1 = __importDefault(require("../../src/message/MessageService"));
const RabbitMQManager_1 = __importDefault(require("../../src/message/RabbitMQManager"));
// Mock RabbitMQManager
jest.mock('../../src/message/rabbitMQManager', () => {
    // Create a mock implementation
    const mockInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
        getInstance: jest.fn().mockResolvedValue({}),
        getChannel: jest.fn().mockReturnValue({
            assertQueue: jest.fn().mockResolvedValue({}),
            sendToQueue: jest.fn().mockReturnValue(true),
            get: jest.fn().mockResolvedValue(null),
            ack: jest.fn(),
            nack: jest.fn()
        }),
        assertQueue: jest.fn().mockResolvedValue({}),
        sendToQueue: jest.fn().mockResolvedValue(true),
        close: jest.fn().mockResolvedValue(undefined)
    };
    // Mock constructor and static getInstance method
    const MockRabbitMQManager = jest.fn().mockImplementation(() => mockInstance);
    // Add the getInstance static method with proper typing
    return {
        __esModule: true,
        default: MockRabbitMQManager
    };
});
describe('MessageService', () => {
    let messageService;
    const mockRabbitMQManager = {
        connect: jest.fn().mockResolvedValue(undefined),
        getInstance: jest.fn().mockResolvedValue({}),
        getChannel: jest.fn().mockReturnValue({
            assertQueue: jest.fn().mockResolvedValue({}),
            sendToQueue: jest.fn().mockReturnValue(true),
            get: jest.fn().mockResolvedValue(null),
            ack: jest.fn(),
            nack: jest.fn()
        }),
        assertQueue: jest.fn().mockResolvedValue({}),
        sendToQueue: jest.fn().mockResolvedValue(true),
        close: jest.fn().mockResolvedValue(undefined)
    };
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        RabbitMQManager_1.default.getInstance = jest.fn().mockResolvedValue(mockRabbitMQManager);
        // Access the mocked module directly to get the getInstance method
        // Create a new MessageService instance with the mock
        messageService = new MessageService_1.default(mockRabbitMQManager);
    });
    describe('getInstance', () => {
        it('should return the same instance when called multiple times', () => {
            // Reset the singleton instance
            MessageService_1.default.instance = undefined;
            const instance1 = MessageService_1.default.getInstance();
            const instance2 = MessageService_1.default.getInstance();
            expect(instance1).toBe(instance2);
        });
        it('should create the instance with the RabbitMQManager', () => {
            // Reset the singleton instance
            MessageService_1.default.instance = undefined;
            MessageService_1.default.getInstance();
            expect(RabbitMQManager_1.default.getInstance).toHaveBeenCalled();
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
            expect(mockRabbitMQManager.sendToQueue).toHaveBeenCalledWith('visit_results', visitResult, { persistent: true });
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
//# sourceMappingURL=messageService.test.js.map