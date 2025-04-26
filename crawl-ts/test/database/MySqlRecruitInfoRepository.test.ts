import { MysqlRecruitInfoRepository } from '../../src/database/MysqlRecruitInfoRepository';
import { MysqlRecruitInfoSequelize } from '../../src/models/MysqlRecruitInfoModel';
import { IDbRecruitInfo } from '../../src/models/RecruitInfoModel';
import { Sequelize, Model, QueryTypes } from 'sequelize';

// Mock Sequelize and MysqlRecruitInfoSequelize
jest.mock('sequelize');
jest.mock('../../src/models/MysqlRecruitInfoModel');
jest.mock('../../src/utils/logger', () => {
  return {
    defaultLogger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      eventInfo: jest.fn()
    }
  };
});

describe('MysqlRecruitInfoRepository', () => {
  let repository: MysqlRecruitInfoRepository;
  let mockSequelize: jest.Mocked<Sequelize>;
  let mockRecruitInfoModel: jest.Mocked<typeof MysqlRecruitInfoSequelize>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up mock for Sequelize
    mockSequelize = {
      query: jest.fn(),
    } as unknown as jest.Mocked<Sequelize>;

    // Set up mock for MysqlRecruitInfoSequelize
    mockRecruitInfoModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<typeof MysqlRecruitInfoSequelize>;

    // Create instance of repository with mocked dependencies
    repository = new MysqlRecruitInfoRepository(
      mockRecruitInfoModel as unknown as Model,
      mockSequelize
    );
  });

  describe('getRegionIdByCode', () => {
    test('should return region id when region code exists', async () => {
      // Mock the result from sequelize query with the format expected by the updated method
      const mockRegionResult = [{
        id: 123
      }];
      mockSequelize.query.mockResolvedValue([mockRegionResult, []]);

      // Call the method
      const result = await repository.getRegionIdByCode('1000000000');

      // Verify the query was called with correct parameters
      expect(mockSequelize.query).toHaveBeenCalledWith(
        'SELECT id FROM regions WHERE cd = :regionCd LIMIT 1',
        {
          replacements: { regionCd: '1000000000' },
          type: QueryTypes.SELECT
        }
      );

      // Verify the result
      expect(result).toBe(123);
    });

    test('should return null when region code does not exist', async () => {
      // Mock empty result from sequelize query
      mockSequelize.query.mockResolvedValue([[], []]);

      // Call the method
      const result = await repository.getRegionIdByCode('9999999999');

      // Verify the result
      expect(result).toBeNull();
    });

    test('should return null when query throws an error', async () => {
      // Mock error from sequelize query
      mockSequelize.query.mockRejectedValue(new Error('Database error'));

      // Call the method
      const result = await repository.getRegionIdByCode('1000000000');

      // Verify the result
      expect(result).toBeNull();
    });
  });

  describe('createRecruitInfo', () => {
    test('should create new recruit info when it does not exist', async () => {
      // Mock data
      const recruitInfo: IDbRecruitInfo = {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        url: 'https://example.com/job/123',
        text: 'Job description',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock findOne to return null (not found)
      (MysqlRecruitInfoSequelize.findOne as jest.Mock).mockResolvedValue(null);

      // Mock create to return the created object
      const createdRecord = { ...recruitInfo, id: 1 };
      (MysqlRecruitInfoSequelize.create as jest.Mock).mockResolvedValue(createdRecord);

      // Call the method
      const result = await repository.createRecruitInfo(recruitInfo);

      // Verify findOne was called with correct parameters
      expect(MysqlRecruitInfoSequelize.findOne).toHaveBeenCalledWith({
        where: { url: recruitInfo.url }
      });

      // Verify create was called with parameters that match the pattern (without exact Date comparison)
      expect(MysqlRecruitInfoSequelize.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: recruitInfo.title,
          company_name: recruitInfo.company_name,
          url: recruitInfo.url,
          text: recruitInfo.text,
          is_public: recruitInfo.is_public,
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        })
      );

      // Verify the result
      expect(result).toEqual(createdRecord);
    });

    test('should update existing recruit info when it exists', async () => {
      // Mock data
      const recruitInfo: IDbRecruitInfo = {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        url: 'https://example.com/job/123',
        text: 'Job description',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock existing record with update method
      const existingRecord = {
        ...recruitInfo,
        id: 1,
        update: jest.fn().mockImplementation(function(data) {
          return { ...existingRecord, ...data, updated_at: new Date() };
        })
      };

      // Mock findOne to return the existing record
      (MysqlRecruitInfoSequelize.findOne as jest.Mock).mockResolvedValue(existingRecord);

      // Call the method
      const result = await repository.createRecruitInfo(recruitInfo);

      // Verify findOne was called with correct parameters
      expect(MysqlRecruitInfoSequelize.findOne).toHaveBeenCalledWith({
        where: { url: recruitInfo.url }
      });

      // Verify update was called with parameters that match the pattern (without exact Date comparison)
      expect(existingRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: recruitInfo.title,
          company_name: recruitInfo.company_name,
          url: recruitInfo.url,
          text: recruitInfo.text,
          is_public: recruitInfo.is_public,
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        })
      );

      // Verify the result has the updated data
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('title', recruitInfo.title);
    });

    test('should throw error when database operation fails', async () => {
      // Mock data
      const recruitInfo: IDbRecruitInfo = {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        url: 'https://example.com/job/123',
        text: 'Job description',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock findOne to throw error
      const dbError = new Error('Database error');
      (MysqlRecruitInfoSequelize.findOne as jest.Mock).mockRejectedValue(dbError);

      // Call the method and expect it to throw
      await expect(repository.createRecruitInfo(recruitInfo)).rejects.toThrow(dbError);
    });
  });

  describe('updateRecruitInfo', () => {
    test('should update recruit info successfully', async () => {
      // Mock data
      const recruitInfo: IDbRecruitInfo = {
        title: 'Updated Title',
        company_name: 'Tech Corp',
        url: 'https://example.com/job/123',
        text: 'Updated description',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock update result
      const updatedRecord = { ...recruitInfo, id: 1 };
      (MysqlRecruitInfoSequelize.update as jest.Mock).mockResolvedValue([1, [updatedRecord]]);

      // Call the method
      const result = await repository.updateRecruitInfo(recruitInfo);

      // Verify update was called with correct parameters, using objectContaining to avoid Date comparison issues
      expect(MysqlRecruitInfoSequelize.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: recruitInfo.title,
          company_name: recruitInfo.company_name,
          url: recruitInfo.url,
          text: recruitInfo.text,
          is_public: recruitInfo.is_public,
          updated_at: expect.any(Date)
        }),
        {
          where: { url: recruitInfo.url },
          returning: true
        }
      );

      // Verify the result
      expect(result).toEqual(updatedRecord);
    });

    test('should return null when no records were updated', async () => {
      // Mock data
      const recruitInfo: IDbRecruitInfo = {
        title: 'No Existing Title',
        company_name: 'Tech Corp',
        url: 'https://nonexistent.com/job/456',
        text: 'Description',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock update result with no affected rows
      (MysqlRecruitInfoSequelize.update as jest.Mock).mockResolvedValue([0, []]);

      // Call the method
      const result = await repository.updateRecruitInfo(recruitInfo);

      // Verify the result
      expect(result).toBeNull();
    });

    test('should throw error when update operation fails', async () => {
      // Mock data
      const recruitInfo: IDbRecruitInfo = {
        title: 'Error Title',
        company_name: 'Tech Corp',
        url: 'https://example.com/job/error',
        text: 'Description',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock update to throw error
      const dbError = new Error('Update error');
      (MysqlRecruitInfoSequelize.update as jest.Mock).mockRejectedValue(dbError);

      // Call the method and expect it to throw
      await expect(repository.updateRecruitInfo(recruitInfo)).rejects.toThrow(dbError);
    });
  });
});