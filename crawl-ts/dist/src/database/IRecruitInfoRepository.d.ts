import { IBaseRecruitInfo } from '@models/RecruitInfoModel';
export interface IRecruitInfoRepository {
    /**
     * RecruitInfo를  DB에 저장하는 함수
     * @param recruitInfo
     */
    createRecruitInfo(recruitInfo: IBaseRecruitInfo): Promise<IBaseRecruitInfo | null>;
    /**
     * RecruitInfo를 DB에 업데이트 하는 함수
     * @param recruitInfo
     */
    updateRecruitInfo(recruitInfo: IBaseRecruitInfo): Promise<IBaseRecruitInfo | null>;
}
