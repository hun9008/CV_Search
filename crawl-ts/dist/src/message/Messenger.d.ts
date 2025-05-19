import { ChannelModel, Channel } from 'amqplib';
export declare class Messenger {
    protected connection?: ChannelModel;
    protected channel?: Channel;
    protected queue: string;
    constructor(queue: string);
    connect(): Promise<void>;
    close(): Promise<void>;
}
