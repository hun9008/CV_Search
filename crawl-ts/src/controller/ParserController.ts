import { Request, Response } from 'express';
import { JobPipeLine } from '../pipeline/JobPipeLine';
import { defaultLogger as logger } from '../utils/logger';
const jobPipeLine = new JobPipeLine();

/**
 * @swagger
 * /api/parser/start:
 *   post:
 *     summary: Start the parser
 *     description: Initiates the parser pipeline.
 *     tags:
 *       - Parser
 *     responses:
 *       200:
 *         description: Parser started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parser started successfully
 *       500:
 *         description: Server error while starting parseRawContentRetry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to start parser
 */
export async function startJobPipeLine(req: Request, res: Response): Promise<void> {
  try {
    if (jobPipeLine.getStatus()===true) {
      console.log('Parser is already running');
      res.status(400).json({ error: 'Parser is already running' });
      return;
    }
    await jobPipeLine.run();
    res.status(200).json({ message: 'Parser started successfully' });
  } catch (error) {
    console.error('Error starting parser:', error);
    res.status(500).json({ error: 'Failed to start parser' });
  }
}

/**
 * @swagger
 * /api/parser/stop:
 *   post:
 *     summary: Stop the parser
 *     description: Stops the parser pipeline.
 *     tags:
 *       - Parser
 *     responses:
 *       200:
 *         description: Parser stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parser stopped successfully
 *       500:
 *         description: Server error while stopping parser
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to stop parser
 */
export async function stopJobPipeLine(req: Request, res: Response): Promise<void> {
  try {
    if (jobPipeLine.getStatus() === false) {
     logger.info('[ParserController] Parser is not running');
      res.status(400).json({ error: 'Parser is not running' });
      return;
    }
    await jobPipeLine.stop();
    res.status(200).json({ message: 'Parser stopped successfully' });
  } catch (error) {
   logger.error('Error stopping parser:', error);
    res.status(500).json({ error: 'Failed to stop parser' });
  }
}

/**
 * @swagger
 * /api/parser/status:
 *   get:
 *     summary: Get the status of the parser
 *     description: Returns the current status of the parser pipeline (running or stopped).
 *     tags:
 *       - Parser
 *     responses:
 *       200:
 *         description: Current status of the parser pipeline
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: running
 */
export async function getParserStatus(req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json({ status: jobPipeLine.getStatus() ? 'running' : 'stopped' });
  } catch (error) {
    logger.error('[ParserController] Error fetching parser status:', error);
    res.status(500).json({ error: 'Failed to fetch parser status' });
  }
}
