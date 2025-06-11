import 'dotenv/config';
import { MysqlRecruitInfoSequelize } from '../models/MysqlRecruitInfoModel';
import { defaultLogger as logger } from '../utils/logger';
import { VALID_TYPE } from '../models/MysqlRecruitInfoModel';
import { Op } from 'sequelize';


async function updateValidTypeByDate() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Update job_valid_type to 1 for records with apply_end_date >= today
    await MysqlRecruitInfoSequelize.update(
      { job_valid_type: VALID_TYPE.ACTIVE },
      { where: { apply_end_date: { [Op.gte]: startOfToday } } }
    );
    logger.info('Updated job_valid_type to 2 for records with apply_end_date >= today');

    // Update job_valid_type to 0 for records with apply_end_date < today
    await MysqlRecruitInfoSequelize.update(
      { job_valid_type: VALID_TYPE.EXPIRED },
      { where: { apply_end_date: { [Op.lt]: startOfToday } } }
    );
    logger.info('Updated job_valid_type to 1 for records with apply_end_date < today');

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error updating valid type by date: ${error.message}`);
    }
  }
}

updateValidTypeByDate();