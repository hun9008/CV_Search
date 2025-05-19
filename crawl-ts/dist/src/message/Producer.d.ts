import { IRawContent } from '@models/RawContentModel';
import { Messenger } from './Messenger';
export declare class Producer extends Messenger {
    constructor(queue: string);
    /**
     * RabbitMQ에 메시지를 전송합니다.
     * @param message 전송할 메시지
     */
    sendMessage(message: IRawContent): Promise<void>;
}
