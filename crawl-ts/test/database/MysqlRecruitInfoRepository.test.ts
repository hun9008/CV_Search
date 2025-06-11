import { MysqlRecruitInfoRepository } from '../../src/database/MysqlRecruitInfoRepository';
import { MysqlRecruitInfoSequelize, MysqlJobRegionSequelize } from '../../src/models/MysqlRecruitInfoModel';
import axios from 'axios';
import { jest } from '@jest/globals';
import { Transaction } from 'sequelize';
import { Model } from 'sequelize';

describe('MysqlRecruitInfoRepository', () => {
  let repository: MysqlRecruitInfoRepository;

  beforeEach(() => {
    repository = new MysqlRecruitInfoRepository();
    jest.clearAllMocks();
  });

  describe('createRecruitInfo', () => {
    it('should create a recruit info and associate region IDs', async () => {
      // Given
      const recruitInfo = {
        id: 1,
        title: 'Test Job',
        company_name: 'Test Company',
        url: 'https://example.com/job/125',
        text: 'Job description',
        is_public: true,
        region_id: [1, 2, 3],
      };
      const mockTransaction: Partial<Transaction> = {
        commit: jest.fn(() => Promise.resolve()),
        rollback: jest.fn(() => Promise.resolve()),
      };
      const mockModel = { ...recruitInfo, save: jest.fn() } as unknown as Model;
      jest.spyOn(MysqlRecruitInfoSequelize.sequelize!, 'transaction').mockResolvedValue(mockTransaction as Transaction);
      jest.spyOn(MysqlRecruitInfoSequelize, 'upsert').mockResolvedValue([mockModel, true]);
      jest.spyOn(MysqlRecruitInfoSequelize, 'findOne').mockResolvedValue(mockModel);
      jest.spyOn(MysqlJobRegionSequelize, 'upsert').mockResolvedValue([mockModel, true]);

      // When
      const result = await repository.createRecruitInfo(recruitInfo);

      // Then
      expect(result).toEqual(recruitInfo);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Given
      const recruitInfo = {
        id: 1,
        title: 'Test Job',
        company_name: 'Test Company',
        url: 'https://example.com/job/125',
        text: 'Job description',
        is_public: true,
        region_id: [1, 2, 3],
      };
      const mockTransaction: Partial<Transaction> = {
        commit: jest.fn(() => Promise.resolve()),
        rollback: jest.fn(() => Promise.resolve()),
      };
      jest.spyOn(MysqlRecruitInfoSequelize.sequelize!, 'transaction').mockResolvedValue(mockTransaction as Transaction);
      jest.spyOn(MysqlRecruitInfoSequelize, 'upsert').mockRejectedValue(new Error('DB Error'));

      // When & Then
      await expect(repository.createRecruitInfo(recruitInfo)).rejects.toThrow('DB Error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('deleteRecruitInfoById', () => {
    it('should delete a recruit info by ID', async () => {
      // Given
      const id = 9999;
      const token = 'mock-token';
      jest.spyOn(axios, 'delete').mockResolvedValue({ status: 200 });

      // When
      await repository.deleteRecruitInfoById(id, token);

      // Then
      expect(axios.delete).toHaveBeenCalledWith(
        `${process.env.SPRING_API_DOMAIN}/jobs/delete-one-job?jobId=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    });

    it('should throw an error if delete fails', async () => {
      // Given
      const id = 9999;
      const token = 'mock-token';
      jest.spyOn(axios, 'delete').mockRejectedValue(new Error('Delete Error'));

      // When & Then
      await expect(repository.deleteRecruitInfoById(id, token)).rejects.toThrow('Delete Error');
    });
  });

  describe('vectorizeJob', () => {
    it('should call the vectorize job API', async () => {
      // Given
      jest.spyOn(axios, 'get').mockResolvedValue({ status: 200 });

      // When
      await repository.vectorizeJob();

      // Then
      expect(axios.get).toHaveBeenCalledWith(`${process.env.SPRING_API_DOMAIN}/job-update/start`);
    });

    it('should throw an error if vectorize job API fails', async () => {
      // Given
      jest.spyOn(axios, 'get').mockRejectedValue(new Error('Vectorize Error'));

      // When & Then
      await expect(repository.vectorizeJob()).rejects.toThrow('Vectorize Error');
    });
  });
});
