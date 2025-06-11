import { GeminiParser } from '../parser/GeminiParser';
import { MysqlRecruitInfoSequelize } from '../models/MysqlRecruitInfoModel';
import { defaultLogger as logger } from '../utils/logger';
const parser = new GeminiParser();

async function makeJobEndDate() {

  const rawContents = await MysqlRecruitInfoSequelize.findAll({
    attributes: ['id', 'text']
  })

  for (const rawContent of rawContents) {
    try {
      const jobEndDate = await parser.findJobEndDate(rawContent.text, 2000,2000);
      if (jobEndDate) {
        logger.info(`Job end date for ID ${rawContent.id}: ${jobEndDate}`);
        await MysqlRecruitInfoSequelize.update({ apply_end_date : jobEndDate}, {where: { id: rawContent.id }})
      } else {
        logger.info(`No job end date found for ID ${rawContent.id}`);
      }
    } catch (error) {
      console.error(`Error processing ID ${rawContent.id}:`, error);
    }
  }
}


makeJobEndDate();