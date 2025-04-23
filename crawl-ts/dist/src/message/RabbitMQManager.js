"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQManager = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
/**
 * RabbitMQ Connection Manager
 * Handles connections and operations with RabbitMQ message queue
 */
class RabbitMQManager {
    /**
     * Create a new RabbitMQ Manager instance
     * @param uri RabbitMQ connection URI
     */
    constructor(uri = process.env.RABBITMQ_URI || 'amqp://localhost:5672') {
        this.connection = null;
        this.channel = null;
        this.uri = uri;
    }
    /**
     * Get singleton instance of RabbitMQManager
     * @param uri RabbitMQ connection URI
     * @returns RabbitMQManager instance
     */
    static getInstance(uri) {
        if (!RabbitMQManager.instance) {
            RabbitMQManager.instance = new RabbitMQManager(uri);
        }
        return RabbitMQManager.instance;
    }
    /**
     * Connect to RabbitMQ server
     */
    async connect() {
        try {
            if (!this.connection) {
                // Connect to RabbitMQ server - returns a Connection object
                if (!this.uri) {
                    throw new Error("RabbitMQ uri가 존재하지 않습니다.");
                }
                this.connection = await amqplib_1.default.connect(this.uri);
                // Handle connection close event
                this.connection.on('close', () => {
                    console.error('RabbitMQ connection closed');
                    this.connection = null;
                    this.channel = null;
                });
                this.connection.on('error', (err) => {
                    console.error('RabbitMQ connection error:', err);
                    this.connection = null;
                    this.channel = null;
                });
            }
            if (!this.channel && this.connection) {
                // Create a channel from the connection
                this.channel = await this.connection.createChannel();
                // Handle channel close and error events
                this.channel.on('close', () => {
                    console.error('RabbitMQ channel closed');
                    this.channel = null;
                });
                this.channel.on('error', (err) => {
                    console.error('RabbitMQ channel error:', err);
                    this.channel = null;
                });
            }
        }
        catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }
    /**
     * Get the current channel
     * @returns The current channel or null if not connected
     */
    getChannel() {
        if (!this.channel) {
            throw new Error("channel이 존재하지 않습니다.");
        }
        return this.channel;
    }
    /**
     * Create a queue if it doesn't exist
     * @param queueName Name of the queue to create or check
     * @param options Queue options
     */
    async assertQueue(queueName, options = { durable: true }) {
        try {
            if (!this.channel) {
                await this.connect();
            }
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ channel');
            }
            return await this.channel.assertQueue(queueName, options);
        }
        catch (error) {
            console.error(`Failed to assert queue ${queueName}:`, error);
            throw error;
        }
    }
    /**
     * Send a message to the specified queue
     * @param queueName Name of the queue to send message to
     * @param message Message to send (will be converted to Buffer)
     * @param options Message options
     * @returns True if message was sent successfully, false otherwise
     */
    async sendToQueue(queueName, message, options = {}) {
        try {
            if (!this.channel) {
                await this.connect();
            }
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ channel');
            }
            // Ensure queue exists
            await this.assertQueue(queueName);
            // Convert message to buffer if it's not already
            const messageBuffer = Buffer.isBuffer(message)
                ? message
                : Buffer.from(JSON.stringify(message));
            // Send message to queue
            const sent = this.channel.sendToQueue(queueName, messageBuffer, options);
            return sent;
        }
        catch (error) {
            console.error(`Failed to send message to queue ${queueName}:`, error);
            return false;
        }
    }
    /**
     * Close RabbitMQ connection
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
        }
        catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
            throw error;
        }
    }
}
exports.RabbitMQManager = RabbitMQManager;
exports.default = RabbitMQManager;
//# sourceMappingURL=RabbitMQManager.js.map