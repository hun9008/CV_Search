"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consumer = void 0;
const Messenger_1 = require("./Messenger");
const logger_1 = require("../utils/logger");
class Consumer extends Messenger_1.Messenger {
    constructor(queue) {
        super(queue);
    }
    async handleLiveMessage(onMessage, delay = 1000) {
        if (!this.channel) {
            logger_1.defaultLogger.error('[RabbitMQ] Channel is not initialized. Call connect() first.');
            throw new Error('[RabbitMQ] Channel is not initialized. Call connect() first.');
        }
        this.channel.prefetch(1);
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C");
        await this.channel.consume(this.queue, (msg) => {
            if (msg !== null) {
                onMessage(msg).then(() => new Promise(() => { setTimeout(() => { this.channel.ack(msg); }, delay); }))
                    .catch((err) => {
                    console.error('Error processing message:', err);
                    this.channel.nack(msg, false, false);
                });
            }
        }, { noAck: false });
    }
}
exports.Consumer = Consumer;
//# sourceMappingURL=Consumer.js.map