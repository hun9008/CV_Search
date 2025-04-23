import { Sequelize, Model } from 'sequelize';
import { IDbRecruitInfo } from '../models/RecruitInfoModel';
/**
 * Sequelize 모델 정의를 위한 인터페이스
 * (creationAttributes에 사용됨)
 */
/**
 * Sequelize용 RecruitInfo 모델 클래스
 *
 *
 *
 */
export declare class MysqlRecruitInfoSequelize extends Model<IDbRecruitInfo> implements IDbRecruitInfo {
    title: string;
    url: string;
    text: string;
    domain?: string;
    created_at: Date;
    updated_at: Date;
    is_public: boolean;
    favicon?: string;
    company_name?: string;
    department?: string;
    region_text?: string;
    region_id?: string;
    require_experience?: string;
    job_description?: string;
    job_type?: string;
    apply_start_date?: string;
    apply_end_date?: string;
    requirements?: string;
    preferred_qualifications?: string;
    ideal_candidate?: string;
}
/**
 * Sequelize 모델 초기화 함수
 * @param sequelize Sequelize 인스턴스
 * @returns 초기화된 RecruitInfo 모델
 */
export declare function initRecruitInfoModel(sequelize: Sequelize): typeof MysqlRecruitInfoSequelize;
export declare const mysqlRecruitInfoSequelize: Sequelize;
export declare const MysqlRecruitInfoModel: typeof MysqlRecruitInfoSequelize;
export declare const mysqlRecruitInfoModel: MysqlRecruitInfoSequelize;
