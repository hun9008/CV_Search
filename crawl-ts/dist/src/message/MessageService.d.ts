import RabbitMQManager from './RabbitMQManager';
import { ConsumeMessage } from 'amqplib';
import { IMessageService } from './IMessageService';
/**
 * Queue names used in the application
 */
export declare enum QueueNames {
    VISIT_RESULTS = "visit_results",
    RECRUIT_INFO = "recruit_info",
    URL_SEED = "url_seed"
}
interface ConsumeOptions {
    prefetch?: number;
    noAck?: boolean;
}
/**
 * MessageService for handling RabbitMQ message operations
 */
export declare class MessageService implements IMessageService {
    private rabbitMQManager;
    private static instance;
    /**
     * Create a new MessageService instance
     * @param rabbitMQManager RabbitMQManager instance
     */
    constructor(rabbitMQManager?: RabbitMQManager);
    /**
     * Get singleton instance of MessageService
     * @returns MessageService instance
     */
    static getInstance(): MessageService;
    /**
     * Send visit result to RabbitMQ queue
     * @param visitResult Visit result data
     * @returns Promise resolving to boolean indicating success
     */
    sendVisitResult(visitResult: any): Promise<boolean>;
    /**
     * Send recruit info to RabbitMQ queue
     * @param recruitInfo Recruit info data
     * @returns Promise resolving to boolean indicating success
     */
    sendRecruitInfo(recruitInfo: any): Promise<boolean>;
    /**
     * Send raw content to RabbitMQ queue for processing
     * @param rawContent Raw content data to be processed
     * @returns Promise resolving to boolean indicating success
     */
    sendRawContent(rawContent: any): Promise<boolean>;
    /**
     * Consume messages from a queue with specified batch size
     * @param queueName Name of the queue to consume messages from
     * @param batchSize Maximum number of messages to consume
     * @returns Promise resolving to array of consumed messages
     */
    consumeMessages<T>(queueName: QueueNames, batchSize: number): Promise<T[]>;
    /**
     * Get a single message from the specified queue
     * @param queueName Name of the queue to get message from
     * @returns Promise resolving to message content or null if no message available
     */
    private getOneMessage;
    handleLiveMessage(queueName: QueueNames, onMessage: (msg: ConsumeMessage | null) => Promise<void>, options?: ConsumeOptions): Promise<void>;
    /**
     * Connect to RabbitMQ
     */
    connect(): Promise<void>;
    /**
     * Close RabbitMQ connection
     */
    close(): Promise<void>;
    /**
     * Send acknowledge
     */
    sendAck(msg: ConsumeMessage): Promise<void>;
}
export default MessageService;
