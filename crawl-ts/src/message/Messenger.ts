import amqp from 'amqplib';
import config from '../config/config';
import { ChannelModel, Channel } from 'amqplib';
import { defaultLogger as logger } from '../utils/logger';


export class Messenger {
  protected connection?: ChannelModel;
  protected channel?: Channel;

  protected queue: string;

  constructor(queue: string) {
    this.queue = queue;
  }

  async connect() {
    try {
      logger.debug(`[RabbitMQ] Connecting to ${config.RABBITMQ_URL} with queue ${this.queue}`);
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });
      logger.debug(`[RabbitMQ] Connected to ${config.RABBITMQ_URL}`);
    }catch(error) {
      logger.error('[RabbitMQ] Connection error:', error);
      throw new Error('[RabbitMQ] Connection error');
    }
  }

  async close() {
      try {
        if (this.channel) {
          await this.channel.close();
        }
        if (this.connection) {
          await this.connection.close();
        }
        logger.debug(`[RabbitMQ] Close to ${config.RABBITMQ_URL}`);
      }
      catch (error) {
        if (error instanceof Error && /clos(ed|ing)/.test(error.message)) {
          logger.debug('[RabbitMQ] Closed already', error);
          return
        }
        logger.error('[RabbitMQ] Close error:', error);
        throw error
      }
  }

}
