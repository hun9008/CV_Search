import 'dotenv/config';
import { defaultLogger as logger } from '../../src/utils/logger';
import axios from 'axios';
import { writeFileSync } from 'fs';
import { MysqlRecruitInfoRepository } from '../database/MysqlRecruitInfoRepository';
import { getSpringAuthToken } from '../utils/key';
import { MysqlRecruitInfoSequelize } from '../models/MysqlRecruitInfoModel';


const mysqlRecruitInfoRepository = new MysqlRecruitInfoRepository();



if (require.main === module) {
  (async () => {
    const token = await getSpringAuthToken()
    await MysqlRecruitInfoSequelize.findAll({'attributes': ['id', 'url'], 'where': { job_valid_type: 2 }, raw: true })
      .then(async (datas) => {
        const deleteCount = datas.length;
        logger.debug(`삭제할 URL 갯수: ${deleteCount}`);
        for (const data of datas) {
           await mysqlRecruitInfoRepository.deleteRecruitInfoByIdValidType(data.id, 2, token)
             .then(() => {
                return   MysqlRecruitInfoSequelize.destroy({ where: { id: data.id } })
              })
              .catch((error) => {
                logger.debug(`삭제 실패: ${data.id} - ${data.url}`, error);
                return false;
              })
             .then(()=>{logger.debug(`삭제 성공: ${data.id} - ${data.url}`)})
        }
        logger.debug(`삭제한 URL 갯수: ${datas.length}`);
      }
      )
  })();
}