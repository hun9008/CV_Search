import { MySqlRecruitInfoService } from '../../../src/database/MySqlRecruitInfoService';
import { MysqlDbRecruitInfo, RecruitInfoSequelize, initRecruitInfoModel } from '../../../src/models/recruitinfoModel';
import * as dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import '@types/jest';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('MySqlRecruitInfoService Integration Tests', () => {
  let mysqlService: MySqlRecruitInfoService;

  beforeAll(async () => {
    // Create a real connection to the test database
    mysqlService = new MySqlRecruitInfoService({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test_db'
    });

    // Connect to the database
    await mysqlService.connect();

    // // Make sure the model is initialized
    // if (!RecruitInfoSequelize.sequelize) {
    //   initRecruitInfoModel(mysqlService.getSequelizeInstance());
    // }

    // Sync the model with the database (this will create the table if it doesn't exist)
    // await RecruitInfoSequelize.sync({ alter: true });
  }, 50000); // Increase timeout for database connection

  afterAll(async () => {
    // Close database connection
    await mysqlService.disconnect();
  });

  describe('saveRecruitInfo', () => {
    it('should create a new recruit info if it does not exist', async () => {
      // Generate a unique URL to ensure we're creating a new record
      const uniqueUrl = `https://example.com/job/${uuidv4()}`;

      // Create test data
      const recruitInfoData: Omit<MysqlDbRecruitInfo, 'id' | 'created_at' | 'updated_at'> = {
        title: 'Integration Test - Software Engineer',
        company_name: 'Test Company',
        url: uniqueUrl,
        domain: 'example.com',
        job_description: 'Integration test job description',
        job_type: '정규직',
        region_text: 'Seoul',
        region_id: '1168000000', // 서울 강남구
        apply_start_date: '2025-04-21', // Current date
        apply_end_date: '2025-05-21',
        require_experience: '경력',
        requirements: 'TypeScript, Node.js, MySQL',
        preferred_qualifications: 'Jest, Docker',
        ideal_candidate: '열정적인 개발자',
        is_public: true,
        raw_text: 'Original job posting text for integration test',
        department: 'Engineering',
        favicon: 'https://example.com/favicon.ico'
      };

      // Call the method being tested
      const result = await mysqlService.saveRecruitInfo(recruitInfoData);

      // Verify the result has the expected properties
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(recruitInfoData.title);
      expect(result.company_name).toBe(recruitInfoData.company_name);
      expect(result.url).toBe(recruitInfoData.url);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();

      // Clean up - delete the test record
      await result.destroy();
    }, 10000); // Increase timeout for database operations

    it('should update an existing recruit info if it exists', async () => {
      // Generate a unique URL
      const uniqueUrl = `https://example.com/job/${uuidv4()}`;

      // Create initial test data
      const initialData: Omit<MysqlDbRecruitInfo, 'id' | 'created_at' | 'updated_at'> = {
        title: 'Initial Job Title',
        company_name: 'Test Company',
        url: uniqueUrl,
        domain: 'example.com',
        job_description: 'Initial job description',
        job_type: '정규직',
        region_text: 'Seoul',
        region_id: '1168000000',
        is_public: true,
        raw_text: 'Initial raw text'
      };

      // Create the initial record
      const initialResult = await mysqlService.saveRecruitInfo(initialData);
      const initialCreatedAt = initialResult.created_at;

      // Wait a moment to ensure updated_at will be different
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Updated data with the same URL but different title
      const updatedData: Omit<MysqlDbRecruitInfo, 'id' | 'created_at' | 'updated_at'> = {
        ...initialData,
        title: 'Updated Job Title',
        job_description: 'Updated job description',
        requirements: 'Added requirements'
      };

      // Call the method being tested for update
      const updatedResult = await mysqlService.saveRecruitInfo(updatedData);

      // Verify the result has the expected properties
      expect(updatedResult).toBeDefined();
      expect(updatedResult.id).toBe(initialResult.id); // Should be the same record
      expect(updatedResult.title).toBe(updatedData.title); // Should have updated title
      expect(updatedResult.job_description).toBe(updatedData.job_description);
      expect(updatedResult.requirements).toBe(updatedData.requirements);
      expect(updatedResult.created_at.getTime()).toBe(initialCreatedAt.getTime()); // created_at should remain the same
      expect(updatedResult.updated_at.getTime()).toBeGreaterThan(initialResult.updated_at.getTime()); // updated_at should be newer

      // Clean up - delete the test record
      await updatedResult.destroy();
    }, 10000);

    it('should handle case where region_id exists', async () => {
      // Generate a unique URL
      const uniqueUrl = `https://example.com/job/${uuidv4()}`;

      // Create test data with region_id
      const recruitInfoData: Omit<MysqlDbRecruitInfo, 'id' | 'created_at' | 'updated_at'> = {
        title: 'Job with Region ID',
        company_name: 'Test Company',
        url: uniqueUrl,
        domain: 'example.com',
        job_description: 'Job with region ID',
        region_id: '1168000000', // 서울 강남구
        is_public: true,
        raw_text: 'Raw text for job with region ID'
      };

      // Call the method being tested
      const result = await mysqlService.saveRecruitInfo(recruitInfoData);

      // Verify the result has the expected properties
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.region_id).toBe(recruitInfoData.region_id);

      // Clean up - delete the test record
      await result.destroy();
    }, 10000);

    it('should handle error cases gracefully', async () => {
      // Test with invalid data to trigger an error
      // For example, try to save with a null URL which should be a required field

      const invalidData = {
        title: 'Invalid Job',
        company_name: 'Test Company',
        url: null, // URL is required, this should cause an error
        domain: 'example.com',
        is_public: true,
        raw_text: 'Raw text for invalid job'
      } as any;

      // Expect the method to reject with an error
      await expect(mysqlService.saveRecruitInfo(invalidData)).rejects.toThrow();
    }, 10000);
  });
});