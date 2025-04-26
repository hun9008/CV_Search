"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MongoRecruitInfoRepository_1 = require("../../src/database/MongoRecruitInfoRepository");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock the MongoDB model
jest.mock('../../src/models/MongoRecruitInfoModel');
describe('MongoRecruitInfoRepository', () => {
    let repository;
    let mockRecruitInfoModel;
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Set up mock for RecruitInfoModel
        mockRecruitInfoModel = {
            create: jest.fn(),
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
        };
        // Create instance of repository with mocked model
        repository = new MongoRecruitInfoRepository_1.MongoRecruitInfoRepository(mockRecruitInfoModel);
    });
    describe('createRecruitInfo', () => {
        test('should create new recruit info successfully', async () => {
            // Mock data
            const recruitInfo = {
                title: 'MongoDB Developer',
                company_name: 'NoSQL Inc',
                url: 'https://example.com/job/456',
                text: 'MongoDB job description',
                is_public: true,
                is_parse_success: true,
                is_it_recruit_info: true,
                is_recruit_info: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Mock the created record
            const createdRecord = {
                ...recruitInfo,
                _id: new mongoose_1.default.Types.ObjectId().toString()
            };
            // Mock the create method
            mockRecruitInfoModel.create.mockResolvedValue(createdRecord);
            // Call the method
            const result = await repository.createRecruitInfo(recruitInfo);
            // Verify create was called with correct parameters
            expect(mockRecruitInfoModel.create).toHaveBeenCalledWith(recruitInfo);
            // Verify the result
            expect(result).toEqual(createdRecord);
        });
        test('should throw error when create operation fails', async () => {
            // Mock data
            const recruitInfo = {
                title: 'MongoDB Developer',
                company_name: 'NoSQL Inc',
                url: 'https://example.com/job/456',
                text: 'MongoDB job description',
                is_public: true,
                is_parse_success: true,
                is_it_recruit_info: true,
                is_recruit_info: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Mock create to throw error
            const dbError = new Error('Create error');
            mockRecruitInfoModel.create.mockRejectedValue(dbError);
            // Call the method and expect it to throw
            await expect(repository.createRecruitInfo(recruitInfo)).rejects.toThrow(dbError);
        });
    });
    describe('updateRecruitInfo', () => {
        test('should update recruit info successfully', async () => {
            // Mock data with _id
            const id = new mongoose_1.default.Types.ObjectId().toString();
            const recruitInfo = {
                _id: id,
                title: 'Updated MongoDB Developer',
                company_name: 'NoSQL Inc',
                url: 'https://example.com/job/456',
                text: 'Updated MongoDB job description',
                is_public: true,
                is_parse_success: true,
                is_it_recruit_info: true,
                is_recruit_info: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Set up mock exec function
            const mockExec = jest.fn().mockResolvedValue(recruitInfo);
            // Mock findByIdAndUpdate to return object with exec method
            mockRecruitInfoModel.findByIdAndUpdate.mockReturnValue({
                exec: mockExec
            });
            // Call the method
            const result = await repository.updateRecruitInfo(recruitInfo);
            // Verify findByIdAndUpdate was called with correct parameters
            expect(mockRecruitInfoModel.findByIdAndUpdate).toHaveBeenCalledWith(id, recruitInfo, { new: true });
            // Verify exec was called
            expect(mockExec).toHaveBeenCalled();
            // Verify the result
            expect(result).toEqual(recruitInfo);
        });
        test('should throw error when update operation fails', async () => {
            // Mock data with _id
            const id = new mongoose_1.default.Types.ObjectId().toString();
            const recruitInfo = {
                _id: id,
                title: 'Error MongoDB Developer',
                company_name: 'NoSQL Inc',
                url: 'https://example.com/job/error',
                text: 'Error description',
                is_public: true,
                is_parse_success: true,
                is_it_recruit_info: true,
                is_recruit_info: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Set up mock exec function that rejects
            const dbError = new Error('Update error');
            const mockExec = jest.fn().mockRejectedValue(dbError);
            // Mock findByIdAndUpdate to return object with exec method
            mockRecruitInfoModel.findByIdAndUpdate.mockReturnValue({
                exec: mockExec
            });
            // Call the method and expect it to throw
            await expect(repository.updateRecruitInfo(recruitInfo)).rejects.toThrow(dbError);
        });
    });
    describe('findByUrl', () => {
        test('should return recruit info when url exists', async () => {
            // Mock data
            const url = 'https://example.com/job/456';
            const recruitInfo = {
                _id: new mongoose_1.default.Types.ObjectId().toString(),
                title: 'MongoDB Developer',
                company_name: 'NoSQL Inc',
                url: url,
                text: 'MongoDB job description',
                is_public: true,
                is_parse_success: true,
                is_it_recruit_info: true,
                is_recruit_info: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Set up mock exec function
            const mockExec = jest.fn().mockResolvedValue(recruitInfo);
            // Mock findOne to return object with exec method
            mockRecruitInfoModel.findOne.mockReturnValue({
                exec: mockExec
            });
            // Call the method
            const result = await repository.findByUrl(url);
            // Verify findOne was called with correct parameters
            expect(mockRecruitInfoModel.findOne).toHaveBeenCalledWith({ url });
            // Verify exec was called
            expect(mockExec).toHaveBeenCalled();
            // Verify the result
            expect(result).toEqual(recruitInfo);
        });
        test('should return null when url does not exist', async () => {
            // Mock url
            const url = 'https://nonexistent.com/job/789';
            // Set up mock exec function
            const mockExec = jest.fn().mockResolvedValue(null);
            // Mock findOne to return object with exec method
            mockRecruitInfoModel.findOne.mockReturnValue({
                exec: mockExec
            });
            // Call the method
            const result = await repository.findByUrl(url);
            // Verify the result
            expect(result).toBeNull();
        });
        test('should throw error when find operation fails', async () => {
            // Mock url
            const url = 'https://example.com/job/error';
            // Set up mock exec function that rejects
            const dbError = new Error('Find error');
            const mockExec = jest.fn().mockRejectedValue(dbError);
            // Mock findOne to return object with exec method
            mockRecruitInfoModel.findOne.mockReturnValue({
                exec: mockExec
            });
            // Call the method and expect it to throw
            await expect(repository.findByUrl(url)).rejects.toThrow(dbError);
        });
    });
});
//# sourceMappingURL=MongoRecruitInfoRepository.test.js.map