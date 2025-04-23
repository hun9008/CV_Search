"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = exports.QueueNames = void 0;
const RabbitMQManager_1 = __importDefault(require("./RabbitMQManager"));
/**
 * Queue names used in the application
 */
var QueueNames;
(function (QueueNames) {
    QueueNames["VISIT_RESULTS"] = "visit_results";
    QueueNames["RECRUIT_INFO"] = "recruit_info";
    QueueNames["URL_SEED"] = "url_seed";
})(QueueNames || (exports.QueueNames = QueueNames = {}));
/**
 * MessageService for handling RabbitMQ message operations
 */
class MessageService {
    /**
     * Create a new MessageService instance
     * @param rabbitMQManager RabbitMQManager instance
     */
    constructor(rabbitMQManager) {
        this.rabbitMQManager = rabbitMQManager || RabbitMQManager_1.default.getInstance();
    }
    /**
     * Get singleton instance of MessageService
     * @returns MessageService instance
     */
    static getInstance() {
        if (!MessageService.instance) {
            MessageService.instance = new MessageService();
        }
        return MessageService.instance;
    }
    /**
     * Send visit result to RabbitMQ queue
     * @param visitResult Visit result data
     * @returns Promise resolving to boolean indicating success
     */
    async sendVisitResult(visitResult) {
        try {
            const result = await this.rabbitMQManager.sendToQueue(QueueNames.VISIT_RESULTS, visitResult, { persistent: true } // Make message persistent to survive broker restarts
            );
            return result;
        }
        catch (error) {
            console.error('Failed to send visit result to queue:', error);
            return false;
        }
    }
    /**
     * Send recruit info to RabbitMQ queue
     * @param recruitInfo Recruit info data
     * @returns Promise resolving to boolean indicating success
     */
    async sendRecruitInfo(recruitInfo) {
        try {
            const result = await this.rabbitMQManager.sendToQueue(QueueNames.RECRUIT_INFO, recruitInfo, { persistent: true } // Make message persistent to survive broker restarts
            );
            return result;
        }
        catch (error) {
            console.error('Failed to send recruit info to queue:', error);
            return false;
        }
    }
    /**
     * Send raw content to RabbitMQ queue for processing
     * @param rawContent Raw content data to be processed
     * @returns Promise resolving to boolean indicating success
     */
    async sendRawContent(rawContent) {
        try {
            const result = await this.rabbitMQManager.sendToQueue(QueueNames.VISIT_RESULTS, rawContent, { persistent: true } // Make message persistent to survive broker restarts
            );
            return result;
        }
        catch (error) {
            console.error('Failed to send raw content to queue:', error);
            return false;
        }
    }
    /**
     * Consume messages from a queue with specified batch size
     * @param queueName Name of the queue to consume messages from
     * @param batchSize Maximum number of messages to consume
     * @returns Promise resolving to array of consumed messages
     */
    async consumeMessages(queueName, batchSize) {
        try {
            await this.rabbitMQManager.connect();
            await this.rabbitMQManager.assertQueue(queueName);
            const messages = [];
            for (let i = 0; i < batchSize; i++) {
                const message = await this.getOneMessage(queueName);
                if (!message) {
                    console.log(`No more messages in queue ${queueName} after fetching ${messages.length} messages`);
                    break;
                }
                messages.push(message);
            }
            return messages;
        }
        catch (error) {
            console.error(`Error consuming messages from queue ${queueName}:`, error);
            return [];
        }
    }
    /**
     * Get a single message from the specified queue
     * @param queueName Name of the queue to get message from
     * @returns Promise resolving to message content or null if no message available
     */
    async getOneMessage(queueName) {
        if (!this.rabbitMQManager.getChannel()) {
            await this.rabbitMQManager.connect();
        }
        const channel = this.rabbitMQManager.getChannel();
        if (!channel) {
            throw new Error('Failed to create RabbitMQ channel');
        }
        const message = await channel.get(queueName, { noAck: false });
        if (!message) {
            return null;
        }
        try {
            // Convert buffer to string and parse JSON
            const content = message.content.toString();
            const parsedContent = JSON.parse(content);
            // Acknowledge the message
            channel.ack(message);
            return parsedContent;
        }
        catch (error) {
            // Reject the message if parsing fails
            channel.nack(message, false, false);
            console.error(`Failed to parse message from queue ${queueName}:`, error);
            return null;
        }
    }
    async handleLiveMessage(queueName, onMessage, options = {}) {
        try {
            const channel = this.rabbitMQManager.getChannel();
            // 큐가 존재하는지 확인
            await channel.assertQueue(queueName, { durable: true });
            // 프리패치 설정 (옵션으로 제공된 경우)
            if (options.prefetch !== undefined) {
                await channel.prefetch(options.prefetch);
            }
            // 메시지 소비 설정
            await channel.consume(queueName, async (msg) => {
                if (!msg) {
                    console.warn('Received null message');
                    return;
                }
                try {
                    await onMessage(msg);
                    // noAck가 false일 경우에만 메시지 확인(ack) 처리
                    if (!options.noAck) {
                        channel.ack(msg);
                    }
                }
                catch (error) {
                    console.error(`Error processing message from queue ${queueName}:`, error);
                    // 메시지 재큐잉 또는 DLQ(Dead Letter Queue)로 이동
                    channel.nack(msg, false, false); // 재큐잉하지 않음
                }
            }, { noAck: options.noAck ?? false });
            console.log(`Started consuming messages from queue: ${queueName}`);
        }
        catch (error) {
            console.error(`Failed to consume messages from queue ${queueName}:`, error);
            throw error; // 상위 호출자에게 에러 전파
        }
    }
    /**
     * Connect to RabbitMQ
     */
    async connect() {
        await this.rabbitMQManager.connect();
    }
    /**
     * Close RabbitMQ connection
     */
    async close() {
        await this.rabbitMQManager.close();
    }
    /**
     * Send acknowledge
     */
    async sendAck(msg) {
        const channel = this.rabbitMQManager.getChannel();
        if (!channel) {
            throw new Error("channel이 존재하지 않습니다.");
        }
        await channel.ack(msg);
    }
}
exports.MessageService = MessageService;
exports.default = MessageService;
//# sourceMappingURL=MessageService.js.map