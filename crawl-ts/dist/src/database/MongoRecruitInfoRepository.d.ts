import { ICacheDbRecruitInfo } from '@models/RecruitInfoModel';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
export declare class MongoRecruitInfoRepository implements IRecruitInfoRepository {
    private recruitInfoModel;
    constructor();
    connect(): Promise<void>;
    createRecruitInfo(recruitInfo: ICacheDbRecruitInfo): Promise<ICacheDbRecruitInfo>;
    updateRecruitInfo(recruitInfo: ICacheDbRecruitInfo): Promise<ICacheDbRecruitInfo>;
    findByUrl(url: string): Promise<ICacheDbRecruitInfo | null>;
}
