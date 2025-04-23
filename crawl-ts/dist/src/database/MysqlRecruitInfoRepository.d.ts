import { Sequelize, Model } from 'sequelize';
import { IDbRecruitInfo } from '../models/RecruitInfoModel';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
/**
 * MySQL 데이터베이스 서비스 클래스
 * 채용 정보를 MySQL 데이터베이스에 저장하고 관리하는 서비스
 */
export declare class MysqlRecruitInfoRepository implements IRecruitInfoRepository {
    private recruitInfoModel?;
    private sequelize?;
    /**
     * MySQL 서비스 생성자
     * @param recruitInfoModel 채용 정보 모델
     * @param sequelize Sequelize 인스턴스
     */
    constructor(recruitInfoModel: Model, sequelize: Sequelize);
    /**
     * 지역 코드에 해당하는 ID 조회
     * @param regionCd 지역 코드
     * @returns 해당 지역 코드의 id 또는 null (찾을 수 없는 경우)
     */
    getRegionIdByCode(regionCd: string): Promise<number | null>;
    /**
     * 채용 정보 저장
     * @param recruitInfo 저장할 채용 정보 객체
     * @returns 저장된 채용 정보 객체
     */
    createRecruitInfo(recruitInfo: IDbRecruitInfo): Promise<IDbRecruitInfo>;
    /**
     * 채용 정보 업데이트
     * @param recruitInfo 업데이트할 채용 정보 객체
     * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
     */
    updateRecruitInfo(recruitInfo: IDbRecruitInfo): Promise<IDbRecruitInfo | null>;
}
