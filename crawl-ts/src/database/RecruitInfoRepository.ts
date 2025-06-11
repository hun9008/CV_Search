import { CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';
import { URLSTAUS } from '../models/ReidsModel';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
import { MysqlRecruitInfoRepository } from './MysqlRecruitInfoRepository';
import { RedisUrlManager } from '../url/RedisUrlManager';
import { defaultLogger as logger } from '../utils/logger';
export class RecruitInfoRepository implements IRecruitInfoRepository {

  private mysqlRepository: MysqlRecruitInfoRepository;
  private urlManager: RedisUrlManager;


  constructor() {

    this.mysqlRepository = new MysqlRecruitInfoRepository();
    this.urlManager = new RedisUrlManager();
  }

  async initialize() {
    await this.urlManager.connect();
  }

  async createRecruitInfo(recruitInfo: CreateDBRecruitInfoDTO): Promise<Boolean> {

    return await this.mysqlRepository.createRecruitInfo(recruitInfo).then(
      (result) => {
        if (!result) {
          logger.error('[RecruitInfoRepository][createRecruitInfo] Failed to create recruit info');
          throw new Error('Failed to create recruit info');
        }
        return this.urlManager.setURLStatusByOldStatus(result.url,URLSTAUS.VISITED ,URLSTAUS.HAS_RECRUITINFO)
      }
    )
    .catch((error) => {
      logger.error('[RecruitInfoRepository][createRecruitInfo] Error creating recruit info:', error);
      throw error;
    })
    .then(() => {
      return true;
    })
    .catch((error) => {
      logger.error('[RecruitInfoRepository][createRecruitInfo] Error setting URL status:', error);
      throw error;
    })

  }

}