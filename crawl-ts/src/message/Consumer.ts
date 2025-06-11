import  { ConsumeMessage } from 'amqplib';
import { Messenger } from './Messenger';
import { defaultLogger as logger } from '../utils/logger';
import { QueueNames } from './enums';


export class Consumer extends Messenger{

  constructor(queue: string) {
    super(queue);
  }



 async handleLiveMessage( onMessage: (msg : ConsumeMessage| null  )=> Promise<void> ,delay :number =1000): Promise<void> {

  if (!this.channel) {
    logger.error('[RabbitMQ] Channel is not initialized. Call connect() first.');
    throw new Error('[RabbitMQ] Channel is not initialized. Call connect() first.');
  }

   this.channel.prefetch(1);

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C",);
  await this.channel.consume(this.queue, (msg) => {
    if (msg !== null) {
      onMessage(msg).then(() =>
        new Promise(() => {
          setTimeout(() => {
            try {
              this.channel!.ack(msg)
            } catch (error) {
              logger.error('[Consumer][handleLiveMessage] Error acknowledging message:', error);
            }
          }, delay)
        })
        )
       .catch((err) => {
         logger.error('[Consumer][handleLiveMessage] Error processing message:', err);
         this.channel!.nack(msg, false, false);
      })
    }
  }, { noAck: false });

}

}