import { GeminiParser } from '../parser/GeminiParser';
import { MysqlRecruitInfoSequelize ,MysqlFaviconSequelize } from '../models/MysqlRecruitInfoModel';
import { defaultLogger as logger } from '../utils/logger';
import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { VALID_TYPE } from '../models/MysqlRecruitInfoModel';
import { getSpringAuthToken } from '../utils/key';
import { MysqlRecruitInfoRepository } from '../database/MysqlRecruitInfoRepository';
const mysqlRecruitInfoRepository = new MysqlRecruitInfoRepository();
const parser = new GeminiParser();

/**
 * @swagger
 * /api/updater/end-date:
 *   post:
 *     summary: Extract and update job end dates from recruitment info.
 *     description: |
 *       Parses all stored job recruit info and tries to extract the job apply end date.
 *       If found, the date is saved to the database.
 *     tags:
 *       - Jobs
 *     responses:
 *       200:
 *         description: Job end date parsing completed successfully.
 *       500:
 *         description: An error occurred while parsing job end dates.
 */
export async function updateJobEndDate(req: Request, res: Response): Promise<void> {
  const rawContents = await MysqlRecruitInfoSequelize.findAll({
    attributes: ['id', 'text'],
    where: {
      job_valid_type: {
      [Op.ne]: VALID_TYPE.EXPIRED
      } // Only process active jobs
    }

  })
  for (const rawContent of rawContents) {
    try {
      const jobEndDate = await parser.findJobEndDate(rawContent.text, 2000,2000);
      if (jobEndDate) {
        logger.info(`[MysqlJobUpdaterController][findJobEndDate] ${rawContent.id}: ${jobEndDate}`);
        await MysqlRecruitInfoSequelize.update({ apply_end_date : jobEndDate}, {where: { id: rawContent.id }})
      } else {
        logger.info(`[MysqlJobUpdaterController][findJobEndDate] No job end date found for ID ${rawContent.id}`);
      }
    } catch (error) {
      logger.error(`[MysqlJobUpdaterController][findJobEndDate] Error processing ID ${rawContent.id}:`, error);
    }
  }

  res.status(200).json({ message: 'Job end date parsing completed successfully.' });
  logger.info('[MysqlJobUpdaterController][findJobEndDate] Job end date parsing completed successfully.');

}


/**
 * @swagger
 * /api/updater/valid-type:
 *   post:
 *     summary: Update job validity status based on apply end dates.
 *     description: |
 *       Updates the `job_valid_type` field in the recruitment info database.
 *       - If `apply_end_date` is today or in the future, sets `job_valid_type` to `ACTIVE`.
 *       - If `apply_end_date` is in the past, sets `job_valid_type` to `EXPIRED`.
 *     tags:
 *       - Jobs
 *     responses:
 *       200:
 *         description: Job valid types updated successfully.
 *       500:
 *         description: Failed to update job valid types.
 */
export async function updateJobValidType(req: Request, res: Response): Promise<void> {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Update job_valid_type to ACTIVE for records with apply_end_date >= today
    await MysqlRecruitInfoSequelize.update(
      { job_valid_type: VALID_TYPE.ACTIVE },
      {
        where: {
          [Op.or]: [
            { apply_end_date: { [Op.gte]: startOfToday } } ,
            { apply_end_date: null }
          ]
        }
      }
    );
    logger.info('[MysqlJobUpdaterController][updateJobValidType] Updated job_valid_type to ACTIVE for records with apply_end_date >= today');

    // Update job_valid_type to EXPIRED for records with apply_end_date < today
    await MysqlRecruitInfoSequelize.update(
      { job_valid_type: VALID_TYPE.EXPIRED },
      { where: { apply_end_date: { [Op.lt]: startOfToday } } }
    );
    logger.info('[MysqlJobUpdaterController][updateJobValidType] Updated job_valid_type to EXPIRED for records with apply_end_date < today');

    logger.info('[MysqlJobUpdaterController][findJobEndDate] Job valid types updated successfully');
    res.status(200).json({ message: 'Job valid types updated successfully' });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[MysqlJobUpdaterController][updateJobValidType] Error updating valid type by date: ${error.message}`);
    }
    res.status(500).json({ error: 'Failed to update job valid types' });
  }
}

/**
 * @swagger
 * /api/updater/public-type:
 *   post:
 *     summary: Update job public types based on valid type.
 *     description: |
 *       Deletes all vecotrs with `job_valid_type` set to `EXPIRED`.
 *       This is used to clean up invalid job postings.
 *     tags:
 *       - Jobs
 *     responses:
 *       200:
 *         description: Job public types updated successfully.
 *       500:
 *         description: Failed to update job public types.
 */

export async function updateJobPublicType(req: Request, res: Response): Promise<void> {
  try {
    const token = await getSpringAuthToken();
    // Update is_public to true for all records with job_valid_type ACTIVE
    await MysqlRecruitInfoSequelize.findAll({
      'attributes': ['id', 'url'],
      where: {
        [Op.and]: [
          { job_valid_type: VALID_TYPE.EXPIRED },
          { is_public: true }
        ]
      },raw: true
    })
         .then(async (datas) => {
           const deleteCount = datas.length;
           logger.debug(`[MysqlJobUpdaterController][updateJobPublicType] 삭제할 URL 갯수: ${deleteCount}`);
           for (const data of datas) {
              await mysqlRecruitInfoRepository.deleteRecruitInfoByIdValidType(data.id,VALID_TYPE.EXPIRED, token)
                 .catch((error) => {
                   logger.debug(`[MysqlJobUpdaterController][updateJobPublicType] 삭제 실패: ${data.id} - ${data.url}`, error);
                   return false;
                 })
           }
           logger.debug(`삭제한 URL 갯수: ${datas.length}`);
         }
         )
    res.status(200).json({ message: 'Job public types updated successfully' });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[MysqlJobUpdaterController][updateJobPublicType] Error updating public type by valid type: ${error.message}`);
    }
    res.status(500).json({ error: 'Failed to update job public types' });
  }
}




/**
 * @swagger
 * /api/updater/favicon:
 *   post:
 *     summary: Update job favicons based on domain matching
 *     description: |
 *       Updates the `favicon_id` in the `MysqlRecruitInfoSequelize` table
 *       for job postings whose `url` contains a domain that matches the `domain` field
 *       in the `MysqlFaviconSequelize` table.
 *     tags:
 *       - Jobs
 *     responses:
 *       200:
 *         description: Job favicons updated successfully.
 *       500:
 *         description: Failed to update job favicons.
 */
export async function updateJobFavicon(req: Request, res: Response): Promise<void> {
  try {
    const favicon_ids = await MysqlFaviconSequelize.findAll({
      attributes: ['id', 'domain', 'logo'],
      raw: true,
    });


    for (const favicon of favicon_ids) {
      await MysqlRecruitInfoSequelize.update({ favicon_id: favicon.id }, {
        where: {
          url: {
            [Op.like]: `%${favicon.domain}%`
          }
        }
      })
      logger.debug('[MysqlJobUpdaterController][updateJobFavicon] Favicon ID updated successfully:', favicon.id);
    }

    res.status(200).json({ message: 'Job favicons updated successfully.' });
    logger.info('[MysqlJobUpdaterController][getFavicon] Job favicons updated successfully.');
  } catch (error) {
    logger.error('[MysqlJobUpdaterController][getFavicon] Error updating job favicons:', error);
    res.status(500).json({ error: 'Failed to update job favicons' });
  }
}


/**
 * @swagger
 * /api/updater/vectorize-job:
 *   post:
 *     summary: Vectorize job postings.
 *     description: |
 *       This endpoint triggers the vectorization of job postings.
 *       It processes all job postings to create or update their vector representations.
 *     tags:
 *       - Jobs
 *     responses:
 *       200:
 *         description: Job vectorization completed successfully.
 *       500:
 *         description: Failed to vectorize jobs.
 */
export async function updateJobVector(req: Request, res: Response): Promise<void> {
  try {
    await mysqlRecruitInfoRepository.vectorizeJob();
    res.status(200).json({ message: 'Job vectorization completed successfully' });
    logger.info('[MysqlJobUpdaterController][vectorizeJob] Job vectorization completed successfully');
  }
  catch (error) {
    if (error instanceof Error) {
      logger.error(`[MysqlJobUpdaterController][vectorizeJob] Error vectorizing jobs: ${error.message}`);
    }
    res.status(500).json({ error: 'Failed to vectorize jobs' });
  }
}




