import { ConsumeMessage } from 'amqplib';
export interface IConsumer {
    consume(msg: ConsumeMessage): Promise<void>;
}
