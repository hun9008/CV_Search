import { RecruitInfoRepository } from '../../src/database/RecruitInfoRepository';
import { MysqlRecruitInfoRepository } from '../../src/database/MysqlRecruitInfoRepository';
import { RedisUrlManager } from '../../src/url/RedisUrlManager';
import { CreateDBRecruitInfoDTO } from '../../src/models/RecruitInfoModel';
import { URLSTAUS } from '../../src/models/ReidsModel';
import { jest } from '@jest/globals'; // Replace ts-jest/utils with jest globals

jest.mock('../../src/database/MysqlRecruitInfoRepository');
jest.mock('../../src/url/RedisUrlManager');

describe('RecruitInfoRepository', () => {
  let repository: RecruitInfoRepository;
  let mysqlRepositoryMock: jest.Mocked<MysqlRecruitInfoRepository>;
  let redisUrlManagerMock: jest.Mocked<RedisUrlManager>;

  beforeEach(() => {
    mysqlRepositoryMock = new MysqlRecruitInfoRepository() as jest.Mocked<MysqlRecruitInfoRepository>;
    redisUrlManagerMock = new RedisUrlManager() as jest.Mocked<RedisUrlManager>;
    repository = new RecruitInfoRepository();
    repository['mysqlRepository'] = mysqlRepositoryMock;
    repository['urlManager'] = redisUrlManagerMock;
  });

  test('should create recruit info and update URL status in Redis', async () => {
    // Given
    const recruitInfo: CreateDBRecruitInfoDTO = {
      title: 'Test Job',
      company_name: 'Test Company',
      url: 'https://example.com/job/123',
      text: 'Job description',
      job_description: 'Job description',
      job_type: '정규직/파견직',
      is_public: true,
      region_id: [1, 2, 3],
    };

    mysqlRepositoryMock.createRecruitInfo.mockResolvedValue(recruitInfo);
    redisUrlManagerMock.setURLStatusByOldStatus.mockResolvedValue();

    // When
    const result = await repository.createRecruitInfo(recruitInfo);

    // Then
    expect(result).toBe(true);
    expect(mysqlRepositoryMock.createRecruitInfo).toHaveBeenCalledWith(recruitInfo);
    expect(redisUrlManagerMock.setURLStatusByOldStatus).toHaveBeenCalledWith(
      recruitInfo.url,
      URLSTAUS.VISITED,
      URLSTAUS.HAS_RECRUITINFO
    );
  });

  test('should throw an error if creating recruit info fails', async () => {
    // Given
    const recruitInfo: CreateDBRecruitInfoDTO = {
      title: 'Test Job',
      company_name: 'Test Company',
      url: 'https://example.com/job/123',
      text: 'Job description',
      job_description: 'Job description',
      job_type: '정규직/파견직',
      is_public: true,
      region_id: [1, 2, 3],
    };

    mysqlRepositoryMock.createRecruitInfo.mockImplementation(async () => {
      throw new Error('Failed to create recruit info');
    });

    // When & Then
    await expect(repository.createRecruitInfo(recruitInfo)).rejects.toThrow('Failed to create recruit info');
    expect(mysqlRepositoryMock.createRecruitInfo).toHaveBeenCalledWith(recruitInfo);
    expect(redisUrlManagerMock.setURLStatusByOldStatus).not.toHaveBeenCalled();
  });

  test('should throw an error if updating URL status fails', async () => {
    // Given
    const recruitInfo: CreateDBRecruitInfoDTO = {
      title: 'Test Job',
      company_name: 'Test Company',
      url: 'https://example.com/job/123',
      text: 'Job description',
      job_description: 'Job description',
      job_type: '정규직/파견직',
      is_public: true,
      region_id: [1, 2, 3],
    };

    mysqlRepositoryMock.createRecruitInfo.mockResolvedValue(recruitInfo);
    redisUrlManagerMock.setURLStatusByOldStatus.mockRejectedValue(new Error('Redis error'));

    // When & Then
    await expect(repository.createRecruitInfo(recruitInfo)).rejects.toThrow('Redis error');
    expect(mysqlRepositoryMock.createRecruitInfo).toHaveBeenCalledWith(recruitInfo);
    expect(redisUrlManagerMock.setURLStatusByOldStatus).toHaveBeenCalledWith(
      recruitInfo.url,
      URLSTAUS.VISITED,
      URLSTAUS.HAS_RECRUITINFO
    );
  });
});
