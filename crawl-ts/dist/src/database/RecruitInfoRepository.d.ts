import { CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
export declare class RecruitInfoRepository implements IRecruitInfoRepository {
    private mysqlRepository;
    private urlManager;
    constructor();
    initialize(): Promise<void>;
    createRecruitInfo(recruitInfo: CreateDBRecruitInfoDTO): Promise<Boolean>;
}
