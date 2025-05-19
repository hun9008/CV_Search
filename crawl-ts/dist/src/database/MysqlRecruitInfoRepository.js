"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlRecruitInfoRepository = void 0;
const MysqlRecruitInfoModel_1 = require("../models/MysqlRecruitInfoModel");
const logger_1 = require("../utils/logger");
const axios_1 = __importDefault(require("axios"));
/**
 * MySQL 데이터베이스 서비스 클래스
 * 채용 정보를 MySQL 데이터베이스에 저장하고 관리하는 서비스
 */
class MysqlRecruitInfoRepository {
    /**
     * 채용 정보 저장
     * @param recruitInfo 저장할 채용 정보 객체
     * @returns 저장된 채용 정보 객체
     */
    async createRecruitInfo(recruitInfo) {
        // 현재 시간
        const transaction = await MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.sequelize.transaction();
        try {
            let record;
            let created;
            [record, created] = await MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.upsert(recruitInfo, { transaction });
            record = await MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findOne({ where: { url: recruitInfo.url } });
            if (recruitInfo.region_id && record && record.id) {
                for (const region_id of recruitInfo.region_id) {
                    await MysqlRecruitInfoModel_1.MysqlJobRegionSequelize.upsert({
                        job_id: record.id,
                        region_id: region_id
                    }, {
                        transaction
                    });
                }
            }
            await transaction.commit();
            return record;
        }
        catch (error) {
            await transaction.rollback();
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
    /**
   * 채용 정보 업데이트
   * @param recruitInfo 업데이트할 채용 정보 객체
   * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
   */
    async getAllRecruitInfoUrl() {
        try {
            const now = new Date();
            const result = await MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findAll({ attributes: ['id', 'url'] });
            return result;
        }
        catch (error) {
            logger_1.defaultLogger.error('채용 정보 업데이트 중 오류:', error);
            throw error;
        }
    }
    /**
     * 채용 정보 업데이트
     * @param recruitInfo 업데이트할 채용 정보 객체
     * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
     */
    async deleteRecruitInfoById(id) {
        try {
            const response = await axios_1.default.delete(`${process.env.SPRING_API_DOMAIN}/jobs/delete-one-job?jobId=${id}`, {});
            if (response.status === 200) {
                console.log(`✅ Job ${id} 삭제 성공`);
            }
            else {
                console.warn(`⚠️ Job ${id} 삭제 응답 코드: ${response.status}`);
            }
        }
        catch (error) {
            console.error(`❌ Job ${id} 삭제 실패`, error);
            throw error;
        }
    }
}
exports.MysqlRecruitInfoRepository = MysqlRecruitInfoRepository;
//# sourceMappingURL=MysqlRecruitInfoRepository.js.map