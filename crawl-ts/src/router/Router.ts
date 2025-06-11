import { Router } from 'express';
import { startCrawler, stopCrawler, getCrawlerStatus } from '../controller/CrawlController';
import { startJobPipeLine, stopJobPipeLine, getParserStatus } from '../controller/ParserController';
import { updateJobEndDate, updateJobValidType, updateJobPublicType ,updateJobVector ,updateJobFavicon} from '../controller/JobUpdaterController';

const router = Router();

router.post('/crawl/start', startCrawler);

router.post('/crawl/stop', stopCrawler);

router.get('/crawl/status', getCrawlerStatus);

router.post('/parser/start', startJobPipeLine);

router.post('/parser/stop', stopJobPipeLine);

router.get('/parser/status', getParserStatus);

router.post('/updater/end-date', updateJobEndDate);

router.post('/updater/valid-type', updateJobValidType);

router.post('/updater/public-type', updateJobPublicType);

router.post('/updater/vectorize-job', updateJobVector);

router.post('/updater/favicon', updateJobFavicon);

export default router;
