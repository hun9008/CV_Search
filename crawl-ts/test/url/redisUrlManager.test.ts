// __tests__/RedisUrlManager.test.ts
import { RedisUrlManager} from '../../src/url/RedisUrlManager';
import { createClient } from 'redis';
import { RedisKey, URLSTAUS } from '../../src/models/ReidsModel'; // Ensure RedisKey and URLSTAUS are imported

jest.mock('redis', () => {
  const multiMock = {
    hSet: jest.fn().mockReturnThis(),
    sAdd: jest.fn().mockReturnThis(),
    sRem: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  const mClient = {
    connect: jest.fn(),
    ping: jest.fn(),
    hGet: jest.fn(),
    hSet: jest.fn(),
    sAdd: jest.fn(),
    sRem: jest.fn(),
    multi: jest.fn(()=> multiMock),
    sIsMember: jest.fn(),
    sMembers : jest.fn(),
    sPop: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    exists: jest.fn(),
  };
  return {
    createClient: jest.fn(() => mClient),
  };
});

describe('RedisUrlManager', () => {
  let manager: RedisUrlManager;
  let mockClient: any;

  beforeEach(() => {
    manager = new RedisUrlManager(['www.example.com']);
    // @ts-ignore
    mockClient = createClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to Redis and return PONG', async () => {
    mockClient.ping.mockResolvedValue('PONG');
    await expect(manager.connect()).resolves.toBeUndefined();
    expect(mockClient.connect).toHaveBeenCalled();
    expect(mockClient.ping).toHaveBeenCalled();
  });

  it('should set URL status correctly', async () => {
    const url = 'https://example.com/test';
    mockClient.hGet.mockResolvedValue('notvisited');

    await manager.setURLStatusByOldStatus(url, URLSTAUS.NOT_VISITED, URLSTAUS.VISITED);
    expect(mockClient.multi().sRem).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN('example.com', URLSTAUS.NOT_VISITED), url);
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN('example.com', URLSTAUS.VISITED), url);
    expect(mockClient.multi().exec).toHaveBeenCalled();
  });

  it('should add URL correctly if not already stored', async () => {
    const url = 'https://example.com/test';
    mockClient.hGet.mockResolvedValue(null);
    mockClient.sIsMember.mockResolvedValue(false);
    await manager.addUrl(url, 'example.com', URLSTAUS.NOT_VISITED);
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN('example.com', URLSTAUS.NOT_VISITED), url);

  });

  it('should set URL status correctly with old and new status', async () => {
    const url = 'https://example.com/test';
    mockClient.hGet.mockResolvedValue('notvisited');

    await manager.setURLStatusByOldStatus(url, URLSTAUS.NOT_VISITED, URLSTAUS.VISITED);
    expect(mockClient.multi().sRem).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN('example.com', URLSTAUS.NOT_VISITED), url);
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN('example.com', URLSTAUS.VISITED), url);
    expect(mockClient.multi().exec).toHaveBeenCalled();
  });

  it('should get URL status', async () => {
    const url = 'https://example.com/test';
    mockClient.hGet.mockResolvedValue('visited');

    const result = await manager.getUrlStatus(url);
    expect(result).toBe('visited');
    expect(mockClient.hGet).toHaveBeenCalledWith('status:example.com', url);
  });


  it('should get next URL from domain', async () => {
    const url = 'https://example.com/test/resource';
    mockClient.sPop.mockResolvedValue([url]);

    const result = await manager.getNextUrlFromDomain('example.com');
    expect(result).toEqual({ url, domain: 'example.com' });
    expect(mockClient.sPop).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN('example.com', URLSTAUS.NOT_VISITED), 1);
  });

  it('should handle domain error and return null after retries', async () => {
    mockClient.sPop.mockResolvedValue([]);
    const result = await manager.handleDomainError();
    expect(result).toBeNull();
  });

  it('should save URL links correctly', async () => {
    const domain = 'example.com';
    const urls = ['https://example.com/page1', 'https://example.com/page2'];
    mockClient.sMembers.mockResolvedValue(['https://example.com']);

    await manager.saveUrlLinks(domain, urls);
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, URLSTAUS.NOT_VISITED), urls[0]);
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith(RedisKey.URLSTATUS_KEY_BY_DOMAIN(domain, URLSTAUS.NOT_VISITED), urls[1]);
    expect(mockClient.multi().exec).toHaveBeenCalled();
  });

  it('should check if text exists in Redis', async () => {
    const text = 'sample text';
    mockClient.exists.mockResolvedValue(1);

    const result = await manager.textExists(text);
    expect(result).toBe(true);
  });

  it('should save text hash if not exists', async () => {
    const text = 'sample text';
    mockClient.exists.mockResolvedValue(0);

    const result = await manager.saveTextHash(text);
    expect(result).toBe(true);
    expect(mockClient.set).toHaveBeenCalled();
  });
});