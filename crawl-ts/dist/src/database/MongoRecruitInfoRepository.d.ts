import { ICacheDbRecruitInfo } from '@models/RecruitInfoModel';
import { MongoRecruitInfoModel } from '@models/MongoRecruitInfoModel';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
export declare class MongoRecruitInfoRepository implements IRecruitInfoRepository {
    private recruitInfoModel;
    constructor(recruitInfoModel: typeof MongoRecruitInfoModel);
    createRecruitInfo(recruitInfo: ICacheDbRecruitInfo): Promise<ICacheDbRecruitInfo>;
    updateRecruitInfo(recruitInfo: ICacheDbRecruitInfo): Promise<ICacheDbRecruitInfo>;
    findByUrl(url: string): Promise<ICacheDbRecruitInfo | null>;
}
