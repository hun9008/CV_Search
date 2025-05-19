import { Sequelize, Model } from 'sequelize';
import { CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';
export declare const mysqlRecruitInfoSequelize: Sequelize;
export declare class MysqlRecruitInfoSequelize extends Model<CreateDBRecruitInfoDTO, CreateDBRecruitInfoDTO> {
    id: number;
    title: string;
    url: string;
    text: string;
    created_at: Date;
    updated_at: Date;
    is_public: boolean;
    favicon?: string;
    company_name?: string;
    department?: string;
    region_text?: string;
    require_experience?: string;
    job_description?: string;
    job_type?: string;
    apply_start_date?: Date;
    apply_end_date?: Date;
    requirements?: string;
    preferred_qualifications?: string;
    ideal_candidate?: string;
}
export declare class MysqlJobRegionSequelize extends Model {
    id: number;
    job_id: number;
    region_id: number;
}
