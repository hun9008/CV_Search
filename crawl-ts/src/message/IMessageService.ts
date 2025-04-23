import { QueueNames } from './messageService';
import {  ConsumeMessage } from 'amqplib';



interface ConsumeOptions {
  prefetch?: number;
  noAck?: boolean;
}


/**
 * Interface defining the contract for message service implementations
 */
export interface IMessageService {
  /**
   * Send visit result to message queue
   * @param visitResult Visit result data
   * @returns Promise resolving to boolean indicating success
   */
  sendVisitResult(visitResult: any): Promise<boolean>;

  /**
   * Send recruit info to message queue
   * @param recruitInfo Recruit info data
   * @returns Promise resolving to boolean indicating success
   */
  sendRecruitInfo(recruitInfo: any): Promise<boolean>;

  /**
   * Send raw content to message queue for processing
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
   * Handle live messages with a callback function
   * @param queueName Name of the queue to consume messages from
   * @param onMessage Callback function for processing messages
   * @param options Consumption options
   */
  handleLiveMessage(
    queueName: QueueNames,
    onMessage: (msg: ConsumeMessage | null) => Promise<void>,
    options?: ConsumeOptions
  ): Promise<void>;

  /**
   * Connect to message broker
   */
  connect(): Promise<void>;

  /**
   * Close connection to message broker
   */
  close(): Promise<void>;

  /**
   * Send acknowledge for a message
   * @param msg Message to acknowledge
   */
  sendAck(msg: ConsumeMessage): Promise<void>;
}
