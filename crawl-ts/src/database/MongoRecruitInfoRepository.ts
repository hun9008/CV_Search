// repositories/MongoRecruitInfoRepository.ts
import { Logger, defaultLogger as logger } from '../utils/logger';
import config from '../config/config';
import { MongoRecruitInfoModel, } from '@models/MongoRecruitInfoModel';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
import mongoose from 'mongoose';

export class MongoRecruitInfoRepository implements IRecruitInfoRepository {
  private recruitInfoModel: typeof MongoRecruitInfoModel;
  constructor() {
    this.recruitInfoModel = MongoRecruitInfoModel;
  }

  async connect() {
    await mongoose.connect( config.DATABASE.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME, })
      .then(() => {
        logger.debug('[DB]몽고 디비에 연결 성공했습니다.')
      })
      .catch((error) => {
        logger.error('[DB]몽고 디비에 연결 실패했습니다.')
      })
  }

  async createRecruitInfo(recruitInfo: ICacheDbRecruitInfo): Promise<ICacheDbRecruitInfo> {
    return this.recruitInfoModel.create(recruitInfo);
  }

  async updateRecruitInfo(recruitInfo: ICacheDbRecruitInfo): Promise<ICacheDbRecruitInfo> {
    return this.recruitInfoModel.findByIdAndUpdate(recruitInfo._id, recruitInfo, { new: true }).exec() as Promise<ICacheDbRecruitInfo>;
  }

  async findByUrl(url: string): Promise<ICacheDbRecruitInfo | null> {
    return this.recruitInfoModel.findOne({ url }).exec();
  }

}
