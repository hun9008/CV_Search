"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Producer = void 0;
const logger_1 = require("../utils/logger");
const RawContentModel_1 = require("@models/RawContentModel");
const Messenger_1 = require("./Messenger");
class Producer extends Messenger_1.Messenger {
    constructor(queue) {
        super(queue);
    }
    /**
     * RabbitMQ에 메시지를 전송합니다.
     * @param message 전송할 메시지
     */
    async sendMessage(message) {
        if (RawContentModel_1.RawContentSchema.safeParse(message).success === false) {
            logger_1.defaultLogger.error('[RabbitMQ] Invalid message format:', message);
            throw new Error('[RabbitMQ] Invalid message format');
        }
        if (!this.channel) {
            logger_1.defaultLogger.error('[RabbitMQ] Channel is not initialized. Call connect() first.');
            throw new Error('[RabbitMQ] Channel is not initialized. Call connect() first.');
        }
        this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(message)));
        logger_1.defaultLogger.debug(`[RabbitMQ] Sent message to ${this.queue}: ${message}`);
    }
}
exports.Producer = Producer;
//# sourceMappingURL=Producer.js.map