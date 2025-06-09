import express, { Request, Response, Router } from 'express';
import { MysqlRecruitInfoSequelize, MysqlJobValidTypeSequelize } from '../../models/MysqlRecruitInfoModel'; // 경로는 실제 모델 위치로 조정
import { MysqlRecruitInfoRepository } from '../../database/MysqlRecruitInfoRepository';
import { getSpringAuthToken } from '../../utils/key';
// 라우터 인스턴스 생성
const router: Router = express.Router();
const mysqlRecruitInfoRepository = new MysqlRecruitInfoRepository();

const enum VALID_TYPE  {
  VALID = 0,
  EXPIRED = 1,
  INVALID = 2
}
// 라우터 정의
router.get('/job', async (req: Request ,res: Response): Promise<any> => {
  try {
    const recruitInfo = await MysqlRecruitInfoSequelize.findAll({
      include: [
        {
          model: MysqlJobValidTypeSequelize,
          as: 'jobValidTypes',
          attributes: ['valid_type'],
          // where: {
          //   valid_type: {
          //     [Op.is]: null
          //   }
          // },
          required: false
        }
      ]
    });

    if (!recruitInfo || recruitInfo.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json({ data: recruitInfo });
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// 라우터 정의
router.post('/job-valid-type', async (req: Request ,res: Response): Promise<any> => {
  try {
    if (!req.query.job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }
    if (!req.query.valid_type) {
      return res.status(400).json({ error: 'valid_type is required' });
    }
    const job_id = parseInt(req.query.job_id as string, 10);
    const valid_type = parseInt(req.query.valid_type as string, 10);

    // const transaction = await MysqlRecruitInfoSequelize.sequelize!.transaction();
    try {
      const token = await getSpringAuthToken();
      if (valid_type === VALID_TYPE.EXPIRED || valid_type === VALID_TYPE.INVALID) {
        await mysqlRecruitInfoRepository.deleteRecruitInfoById(job_id, token);
        await MysqlRecruitInfoSequelize.update( {is_public:  false }, { where: { id : job_id } });
      }
      if (valid_type === VALID_TYPE.VALID) {
        await MysqlRecruitInfoSequelize.update( {is_public:  true }, { where: { id : job_id } });
      }
      await MysqlJobValidTypeSequelize.update({valid_type }, { where: { job_id } });
      // await transaction.commit();
    }
    catch (error) {
      console.error('Error creating/updating job valid type:', error);
      // await transaction.rollback();
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.json({ message: 'Job valid type created/updated successfully' });
  } catch (error) {
    console.error('Error fetching job:', error);

    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 라우터 내보내기
export default router;