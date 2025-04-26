"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MysqlRecruitInfoRepository_1 = require("../../src/database/MysqlRecruitInfoRepository");
const MysqlRecruitInfoModel_1 = require("../../src/models/MysqlRecruitInfoModel");
const sequelize_1 = require("sequelize");
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
    let repository;
    let mockSequelize;
    let mockRecruitInfoModel;
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Set up mock for Sequelize
        mockSequelize = {
            query: jest.fn(),
        };
        // Set up mock for MysqlRecruitInfoSequelize
        mockRecruitInfoModel = {
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        };
        // Create instance of repository with mocked dependencies
        repository = new MysqlRecruitInfoRepository_1.MysqlRecruitInfoRepository(mockRecruitInfoModel, mockSequelize);
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
            expect(mockSequelize.query).toHaveBeenCalledWith('SELECT id FROM regions WHERE cd = :regionCd LIMIT 1', {
                replacements: { regionCd: '1000000000' },
                type: sequelize_1.QueryTypes.SELECT
            });
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
            const recruitInfo = {
                title: 'Software Engineer',
                company_name: 'Tech Corp',
                url: 'https://example.com/job/123',
                text: 'Job description',
                is_public: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Mock findOne to return null (not found)
            MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findOne.mockResolvedValue(null);
            // Mock create to return the created object
            const createdRecord = { ...recruitInfo, id: 1 };
            MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.create.mockResolvedValue(createdRecord);
            // Call the method
            const result = await repository.createRecruitInfo(recruitInfo);
            // Verify findOne was called with correct parameters
            expect(MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findOne).toHaveBeenCalledWith({
                where: { url: recruitInfo.url }
            });
            // Verify create was called with parameters that match the pattern (without exact Date comparison)
            expect(MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.create).toHaveBeenCalledWith(expect.objectContaining({
                title: recruitInfo.title,
                company_name: recruitInfo.company_name,
                url: recruitInfo.url,
                text: recruitInfo.text,
                is_public: recruitInfo.is_public,
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            }));
            // Verify the result
            expect(result).toEqual(createdRecord);
        });
        test('should update existing recruit info when it exists', async () => {
            // Mock data
            const recruitInfo = {
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
                update: jest.fn().mockImplementation(function (data) {
                    return { ...existingRecord, ...data, updated_at: new Date() };
                })
            };
            // Mock findOne to return the existing record
            MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findOne.mockResolvedValue(existingRecord);
            // Call the method
            const result = await repository.createRecruitInfo(recruitInfo);
            // Verify findOne was called with correct parameters
            expect(MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findOne).toHaveBeenCalledWith({
                where: { url: recruitInfo.url }
            });
            // Verify update was called with parameters that match the pattern (without exact Date comparison)
            expect(existingRecord.update).toHaveBeenCalledWith(expect.objectContaining({
                title: recruitInfo.title,
                company_name: recruitInfo.company_name,
                url: recruitInfo.url,
                text: recruitInfo.text,
                is_public: recruitInfo.is_public,
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            }));
            // Verify the result has the updated data
            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('title', recruitInfo.title);
        });
        test('should throw error when database operation fails', async () => {
            // Mock data
            const recruitInfo = {
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
            MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.findOne.mockRejectedValue(dbError);
            // Call the method and expect it to throw
            await expect(repository.createRecruitInfo(recruitInfo)).rejects.toThrow(dbError);
        });
    });
    describe('updateRecruitInfo', () => {
        test('should update recruit info successfully', async () => {
            // Mock data
            const recruitInfo = {
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
            MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.update.mockResolvedValue([1, [updatedRecord]]);
            // Call the method
            const result = await repository.updateRecruitInfo(recruitInfo);
            // Verify update was called with correct parameters, using objectContaining to avoid Date comparison issues
            expect(MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.update).toHaveBeenCalledWith(expect.objectContaining({
                title: recruitInfo.title,
                company_name: recruitInfo.company_name,
                url: recruitInfo.url,
                text: recruitInfo.text,
                is_public: recruitInfo.is_public,
                updated_at: expect.any(Date)
            }), {
                where: { url: recruitInfo.url },
                returning: true
            });
            // Verify the result
            expect(result).toEqual(updatedRecord);
        });
        test('should return null when no records were updated', async () => {
            // Mock data
            const recruitInfo = {
                title: 'No Existing Title',
                company_name: 'Tech Corp',
                url: 'https://nonexistent.com/job/456',
                text: 'Description',
                is_public: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Mock update result with no affected rows
            MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.update.mockResolvedValue([0, []]);
            // Call the method
            const result = await repository.updateRecruitInfo(recruitInfo);
            // Verify the result
            expect(result).toBeNull();
        });
        test('should throw error when update operation fails', async () => {
            // Mock data
            const recruitInfo = {
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
            MysqlRecruitInfoModel_1.MysqlRecruitInfoSequelize.update.mockRejectedValue(dbError);
            // Call the method and expect it to throw
            await expect(repository.updateRecruitInfo(recruitInfo)).rejects.toThrow(dbError);
        });
    });
});
//# sourceMappingURL=MySqlRecruitInfoRepository.test.js.map