"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messenger = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = require("../utils/logger");
class Messenger {
    constructor(queue) {
        this.queue = queue;
    }
    async connect() {
        try {
            this.connection = await amqplib_1.default.connect(config_1.default.RABBITMQ_URL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.queue, { durable: true });
            logger_1.defaultLogger.debug(`[RabbitMQ] Connected to ${config_1.default.RABBITMQ_URL}`);
        }
        catch (error) {
            logger_1.defaultLogger.error('[RabbitMQ] Connection error:', error);
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
            logger_1.defaultLogger.debug(`[RabbitMQ] Close to ${config_1.default.RABBITMQ_URL}`);
        }
        catch (error) {
            if (error instanceof Error && /clos(ed|ing)/.test(error.message)) {
                logger_1.defaultLogger.debug('[RabbitMQ] Closed already', error);
                return;
            }
            logger_1.defaultLogger.error('[RabbitMQ] Close error:', error);
            throw error;
        }
    }
}
exports.Messenger = Messenger;
//# sourceMappingURL=Messenger.js.map