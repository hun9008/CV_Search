import {  CreateDBRecruitInfoDTO ,RecruitInfoUrlDto ,RecruitInfoVaildDto} from '../models/RecruitInfoModel';
import { MysqlRecruitInfoSequelize  ,MysqlJobRegionSequelize} from '../models/MysqlRecruitInfoModel';
import { defaultLogger as logger } from '../utils/logger';
import { IRecruitInfoRepository } from './IRecruitInfoRepository';
import axios from 'axios';




/**
 * MySQL 데이터베이스 서비스 클래스
 * 채용 정보를 MySQL 데이터베이스에 저장하고 관리하는 서비스
 */
export class MysqlRecruitInfoRepository implements IRecruitInfoRepository {


  /**
   * 채용 정보 저장
   * @param recruitInfo 저장할 채용 정보 객체
   * @returns 저장된 채용 정보 객체
   */
  async createRecruitInfo(recruitInfo: CreateDBRecruitInfoDTO ): Promise<CreateDBRecruitInfoDTO> {
      // 현재 시간
    const transaction = await MysqlRecruitInfoSequelize.sequelize!.transaction();
    try {
      let record: CreateDBRecruitInfoDTO|null;
      let created: boolean|null;
      [record, created] = await MysqlRecruitInfoSequelize.upsert(recruitInfo, { transaction ,returning: true });
      record = await MysqlRecruitInfoSequelize.findOne({ where: { url: recruitInfo.url }, transaction });
      if (!record) {
        throw new Error('[MysqlRecruitInfoRepository][createRecruitInfo] 채용 정보 저장 실패: 레코드가 존재하지 않음');
      }
      if (recruitInfo.region_id) {
        for (const region_id of recruitInfo.region_id) {
         await MysqlJobRegionSequelize.upsert(
                    {
                      job_id: record.id,
                      region_id: region_id
                    },{
                    transaction
                  });
        }
      }
      await transaction.commit();
      logger.debug('[MysqlRecruitInfoRepository][createRecruitInfo] 채용 정보 저장 성공:', recruitInfo.url);
      return recruitInfo;

    } catch (error) {
      await transaction.rollback();
      logger.error('[MysqlRecruitInfoRepository][createRecruitInfo] 채용 정보 저장 중 오류:', error);
      throw error;
    }
  }



  /**
   * 채용 정보 업데이트
   * @param recruitInfo 업데이트할 채용 정보 객체
   * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
   */
  async updateRecruitInfo(recruitInfo: CreateDBRecruitInfoDTO): Promise<CreateDBRecruitInfoDTO | null> {

    try {
      const now = new Date();
      const [affectedCount, updatedRecords] = await MysqlRecruitInfoSequelize.update(
        {
          ...recruitInfo,
          updated_at: now
        },
        {
          where: { url: recruitInfo.url },
          returning: true
        }
      );

      if (affectedCount > 0 && updatedRecords.length > 0) {
        return updatedRecords[0];
      } else {
        return null;
      }
    } catch (error) {
      logger.error('채용 정보 업데이트 중 오류:', error);
      throw error;
    }
  }


    /**
   * 채용 정보 업데이트
   * @param recruitInfo 업데이트할 채용 정보 객체
   * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
   */
  async getAllRecruitInfoUrl(): Promise<RecruitInfoUrlDto[] | []> {

    try {
      const now = new Date();
      const result: RecruitInfoUrlDto[] = await MysqlRecruitInfoSequelize.findAll({ attributes: ['id','url'] },);
      return result
    } catch (error) {
      logger.error('채용 정보 업데이트 중 오류:', error);
      throw error;
    }
  }


   /**
   * 채용 정보 업데이트
   * @param recruitInfo 업데이트할 채용 정보 객체
   * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
   */
   async getAllVaildRecruitInfoUrl(): Promise<RecruitInfoVaildDto[] | []> {

    try {
      const now = new Date();
      const result: RecruitInfoVaildDto[] = await MysqlRecruitInfoSequelize.findAll({ where: { 'is_public': true } ,attributes: ['id','url','is_public'] });
      return result
    } catch (error) {
      logger.error('채용 정보 업데이트 중 오류:', error);
      throw error;
    }
  }



/**
 * 채용 정보 업데이트
 * @param recruitInfo 업데이트할 채용 정보 객체
 * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
 */
  async deleteRecruitInfoById(id: number, token : string ): Promise<void> {
  try {
    const response = await axios.delete(
      `${process.env.SPRING_API_DOMAIN}/jobs/delete-one-job?jobId=${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ 토큰 추가
        },
      }
    );

    if (response.status === 200) {
      console.log(`✅ Job ${id} 삭제 성공`);
    } else {
      console.warn(`⚠️ Job ${id} 삭제 응답 코드: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Job ${id} 삭제 실패`, error);
    throw error;
  }
  }

  /**
 * 채용 정보 업데이트
 * @param recruitInfo 업데이트할 채용 정보 객체
 * @returns 업데이트된 채용 정보 객체 또는 null (업데이트 실패 시)
 */
  async deleteRecruitInfoByIdValidType(id: number, validType:number ,token : string ): Promise<void> {
    try {
      const response = await axios.delete(
        `${process.env.SPRING_API_DOMAIN}/admin/dashboard/delete-one-job-valid-type?jobId=${id}&validType=${validType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ 토큰 추가
          },
        }
      );

      if (response.status === 200) {
        console.log(`✅ Job ${id} 삭제 성공`);
      } else {
        console.warn(`⚠️ Job ${id} 삭제 응답 코드: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Job ${id} 삭제 실패`, error);
      throw error;
    }
    }


}




