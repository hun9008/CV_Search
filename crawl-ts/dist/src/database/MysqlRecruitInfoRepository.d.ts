import { CreateDBRecruitInfoDTO, RecruitInfoUrlDto } from '../models/RecruitInfoModel';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
/**
 * MySQL 데이터베이스 서비스 클래스
 * 채용 정보를 MySQL 데이터베이스에 저장하고 관리하는 서비스
 */
export declare class MysqlRecruitInfoRepository implements IRecruitInfoRepository {
    /**
     * 채용 정보 저장
     * @param recruitInfo 저장할 채용 정보 객체
     * @returns 저장된 채용 정보 객체
     */
    createRecruitInfo(recruitInfo: CreateDBRecruitInfoDTO): Promise<CreateDBRecruitInfoDTO>;
    /**
     * 채용 정보 업데이트
     * @param recruitInfo 업데이트할 채용 정보 객체
     * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
     */
    updateRecruitInfo(recruitInfo: CreateDBRecruitInfoDTO): Promise<CreateDBRecruitInfoDTO | null>;
    /**
   * 채용 정보 업데이트
   * @param recruitInfo 업데이트할 채용 정보 객체
   * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
   */
    getAllRecruitInfoUrl(): Promise<RecruitInfoUrlDto[] | []>;
    /**
     * 채용 정보 업데이트
     * @param recruitInfo 업데이트할 채용 정보 객체
     * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
     */
    deleteRecruitInfoById(id: number): Promise<void>;
}
