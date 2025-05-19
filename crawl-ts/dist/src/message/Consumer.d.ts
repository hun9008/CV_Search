import { ConsumeMessage } from 'amqplib';
import { Messenger } from './Messenger';
export declare class Consumer extends Messenger {
    constructor(queue: string);
    handleLiveMessage(onMessage: (msg: ConsumeMessage | null) => Promise<void>, delay?: number): Promise<void>;
}
