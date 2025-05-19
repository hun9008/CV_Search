import { CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';
export interface IRecruitInfoRepository {
    /**
     * RecruitInfo를  DB에 저장하는 함수
     * @param recruitInfo
     */
    createRecruitInfo(recruitInfo: CreateDBRecruitInfoDTO): Promise<CreateDBRecruitInfoDTO | Boolean>;
}
