import amqp, { Channel } from 'amqplib';
import { QueueNames } from './MessageService';
/**
 * RabbitMQ Connection Manager
 * Handles connections and operations with RabbitMQ message queue
 */
export declare class RabbitMQManager {
    private connection?;
    private channel?;
    private uri?;
    private static instance?;
    /**
     * Create a new RabbitMQ Manager instance
     * @param uri RabbitMQ connection URI
     */
    constructor(uri?: string);
    /**
     * Get singleton instance of RabbitMQManager
     * @param uri RabbitMQ connection URI
     * @returns RabbitMQManager instance
     */
    static getInstance(uri?: string): RabbitMQManager;
    /**
     * Connect to RabbitMQ server
     */
    connect(): Promise<void>;
    /**
     * Get the current channel
     * @returns The current channel or null if not connected
     */
    getChannel(): Channel;
    /**
     * Create a queue if it doesn't exist
     * @param queueName Name of the queue to create or check
     * @param options Queue options
     */
    assertQueue(queueName: QueueNames, options?: amqp.Options.AssertQueue): Promise<amqp.Replies.AssertQueue>;
    /**
     * Send a message to the specified queue
     * @param queueName Name of the queue to send message to
     * @param message Message to send (will be converted to Buffer)
     * @param options Message options
     * @returns True if message was sent successfully, false otherwise
     */
    sendToQueue(queueName: QueueNames, message: any, options?: amqp.Options.Publish): Promise<boolean>;
    /**
     * Close RabbitMQ connection
     */
    close(): Promise<void>;
}
export default RabbitMQManager;
