import amqp, { Channel, ChannelModel } from 'amqplib';
import { QueueNames } from './messageService';

/**
 * RabbitMQ Connection Manager
 * Handles connections and operations with RabbitMQ message queue
 */
export class RabbitMQManager {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private uri: string;
  private static instance: RabbitMQManager;

  /**
   * Create a new RabbitMQ Manager instance
   * @param uri RabbitMQ connection URI
   */
  constructor(uri: string = process.env.RABBITMQ_URI || 'amqp://localhost:5672') {
    this.uri = uri;
  }

  /**
   * Get singleton instance of RabbitMQManager
   * @param uri RabbitMQ connection URI
   * @returns RabbitMQManager instance
   */
  public static getInstance(uri?: string): RabbitMQManager {
    if (!RabbitMQManager.instance) {
      RabbitMQManager.instance = new RabbitMQManager(uri);
    }
    return RabbitMQManager.instance;
  }

  /**
   * Connect to RabbitMQ server
   */
  public async connect(): Promise<void> {
    try {
      if (!this.connection) {
        // Connect to RabbitMQ server - returns a Connection object
        this.connection = await amqp.connect(this.uri);

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
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Get the current channel
   * @returns The current channel or null if not connected
   */
  public getChannel(): Channel  {
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
  public async assertQueue(queueName: QueueNames, options: amqp.Options.AssertQueue = { durable: true }): Promise<amqp.Replies.AssertQueue> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      return await this.channel.assertQueue(queueName, options);
    } catch (error) {
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
  public async sendToQueue(queueName: QueueNames, message: any, options: amqp.Options.Publish = {}): Promise<boolean> {
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
    } catch (error) {
      console.error(`Failed to send message to queue ${queueName}:`, error);
      return false;
    }
  }

  /**
   * Close RabbitMQ connection
   */
  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
}

export default RabbitMQManager;