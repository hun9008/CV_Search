
import { defaultLogger as logger } from '../utils/logger';
import { IRawContent, RawContentSchema } from '../models/RawContentModel';
import { Messenger } from './Messenger';

export class Producer extends Messenger {


  constructor(queue: string) {
    super(queue);
  }

  /**
   * RabbitMQ에 메시지를 전송합니다.
   * @param message 전송할 메시지
   */
  async sendMessage(message: IRawContent) {

    if (RawContentSchema.safeParse(message).success === false) {
      logger.error('[RabbitMQ] Invalid message format:', message);
      throw new Error('[RabbitMQ] Invalid message format');
    }

    if (!this.channel) {
      logger.error('[RabbitMQ] Channel is not initialized. Call connect() first.');
      throw new Error('[RabbitMQ] Channel is not initialized. Call connect() first.');
    }

    this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(message)));
    logger.debug(`[RabbitMQ] Sent message to ${this.queue}: ${message}`);
  }
}
