import RabbitMQManager from './rabbitMQManager';

/**
 * Queue names used in the application
 */
export enum QueueNames {
  VISIT_RESULTS = 'visit_results',
  RECRUIT_INFO = 'recruit_info',
}

/**
 * MessageService for handling RabbitMQ message operations
 */
export class MessageService {
  private rabbitMQManager: RabbitMQManager;
  private static instance: MessageService;

  /**
   * Create a new MessageService instance
   * @param rabbitMQManager RabbitMQManager instance
   */
  constructor(rabbitMQManager?: RabbitMQManager) {
    this.rabbitMQManager = rabbitMQManager || RabbitMQManager.getInstance();
  }

  /**
   * Get singleton instance of MessageService
   * @returns MessageService instance
   */
  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Send visit result to RabbitMQ queue
   * @param visitResult Visit result data
   * @returns Promise resolving to boolean indicating success
   */
  public async sendVisitResult(visitResult: any): Promise<boolean> {
    try {
      const result = await this.rabbitMQManager.sendToQueue(
        QueueNames.VISIT_RESULTS,
        visitResult,
        { persistent: true } // Make message persistent to survive broker restarts
      );

      return result;
    } catch (error) {
      console.error('Failed to send visit result to queue:', error);
      return false;
    }
  }

  /**
   * Send recruit info to RabbitMQ queue
   * @param recruitInfo Recruit info data
   * @returns Promise resolving to boolean indicating success
   */
  public async sendRecruitInfo(recruitInfo: any): Promise<boolean> {
    try {
      const result = await this.rabbitMQManager.sendToQueue(
        QueueNames.RECRUIT_INFO,
        recruitInfo,
        { persistent: true } // Make message persistent to survive broker restarts
      );

      return result;
    } catch (error) {
      console.error('Failed to send recruit info to queue:', error);
      return false;
    }
  }

  /**
   * Connect to RabbitMQ
   */
  public async connect(): Promise<void> {
    await this.rabbitMQManager.connect();
  }

  /**
   * Close RabbitMQ connection
   */
  public async close(): Promise<void> {
    await this.rabbitMQManager.close();
  }
}

export default MessageService;