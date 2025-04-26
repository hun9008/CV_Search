"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlRecruitInfoRepository = void 0;
const sequelize_1 = require("sequelize");
const MysqlRecruitInfoModel_1 = require("../models/MysqlRecruitInfoModel");
const logger_1 = require("../utils/logger");
/**
 * MySQL 데이터베이스 서비스 클래스
 * 채용 정보를 MySQL 데이터베이스에 저장하고 관리하는 서비스
 */
class MysqlRecruitInfoRepository {
    /**
     * MySQL 서비스 생성자
     * @param recruitInfoModel 채용 정보 모델
     * @param sequelize Sequelize 인스턴스
     */
    constructor(recruitInfoModel, sequelize) {
        // 모델 초기화
        this.recruitInfoModel = recruitInfoModel;
        this.sequelize = sequelize;
    }
    /**
     * 지역 코드에 해당하는 ID 조회
     * @param regionCd 지역 코드
     * @returns 해당 지역 코드의 id 또는 null (찾을 수 없는 경우)
     */
    async getRegionIdByCode(regionCd) {
        if (!this.sequelize) {
            throw new Error('데이터베이스 연결이 초기화되지 않았습니다.');
        }
        try {
            const [regionResult] = await this.sequelize.query('SELECT id FROM regions WHERE cd = :regionCd LIMIT 1', {
                replacements: { regionCd },
                type: sequelize_1.QueryTypes.SELECT
            });
            if (regionResult && regionResult[0] && regionResult[0].id !== undefined) {
                const region = regionResult[0];
                logger_1.defaultLogger.info(`지역 코드 ${regionCd}에 해당하는 ID ${region.id}를 찾았습니다.`);
                return region.id;
            }
            else {
                logger_1.defaultLogger.warn(`지역 코드 ${regionCd}에 해당하는 지역 정보를 찾을 수 없습니다.`);
                return null;
            }
        }
        catch (error) {
            logger_1.defaultLogger.error(`지역 정보 조회 중 오류:`, error);
            return null;
        }
    }
    /**
     * 채용 정보 저장
     * @param recruitInfo 저장할 채용 정보 객체
     * @returns 저장된 채용 정보 객체
     */
    async createRecruitInfo(recruitInfo) {
        try {
            // 현재 시간
            const now = new Date();
            // 데이터 준비 (region_id는 아직 처리하지 않음)
            let recruitData = {
                ...recruitInfo,
                created_at: now,
                updated_at: now
            };
            // URL로 기존 데이터 확인
            const existingRecord = await MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findOne({
                where: { url: recruitInfo.url }
            });
            if (existingRecord) {
                // 기존 데이터 업데이트
                return await existingRecord.update({
                    ...recruitData,
                    updated_at: now
                });
            }
            else {
                // 새 데이터 생성
                return await MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.create(recruitData);
            }
        }
        catch (error) {
            logger_1.defaultLogger.error('채용 정보 저장 중 오류:', error);
            throw error;
        }
    }
    /**
     * 채용 정보 업데이트
     * @param recruitInfo 업데이트할 채용 정보 객체
     * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
     */
    async updateRecruitInfo(recruitInfo) {
        if (!this.recruitInfoModel) {
            throw new Error('데이터베이스 연결이 초기화되지 않았습니다.');
        }
        try {
            const now = new Date();
            const [affectedCount, updatedRecords] = await MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.update({
                ...recruitInfo,
                updated_at: now
            }, {
                where: { url: recruitInfo.url },
                returning: true
            });
            if (affectedCount > 0 && updatedRecords.length > 0) {
                return updatedRecords[0];
            }
            else {
                return null;
            }
        }
        catch (error) {
            logger_1.defaultLogger.error('채용 정보 업데이트 중 오류:', error);
            throw error;
        }
    }
}
exports.MysqlRecruitInfoRepository = MysqlRecruitInfoRepository;
//# sourceMappingURL=MysqlRecruitInfoRepository.js.map