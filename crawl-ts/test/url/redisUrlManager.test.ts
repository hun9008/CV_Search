// __tests__/RedisUrlManager.test.ts
import { RedisUrlManager} from '../../src/url/RedisUrlManager';
import { createClient } from 'redis';

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
    sMembers: jest.fn(),
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
    manager = new RedisUrlManager(['example.com']);
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

    await manager.setURLStatus(url, 'visited');
    expect(mockClient.multi().hSet).toHaveBeenCalledWith('status:example.com', url, 'visited');
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith('urls:example.com:visited', url);
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith('visited', url);
  });

  it('should add URL correctly if not already stored', async () => {
    const url = 'https://example.com/test';
    mockClient.hGet.mockResolvedValue(null);

    await manager.addUrl(url, 'example.com', 'notvisited');
    expect(mockClient.multi().hSet).toHaveBeenCalledWith('status:example.com', url, 'notvisited');
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith('urls:example.com:notvisited', url);
    expect(mockClient.multi().sAdd).toHaveBeenCalledWith('notvisited', url);
  });

  it('should get URL status', async () => {
    const url = 'https://example.com/test';
    mockClient.hGet.mockResolvedValue('visited');

    const result = await manager.getUrlStatus(url);
    expect(result).toBe('visited');
    expect(mockClient.hGet).toHaveBeenCalledWith('status:example.com', url);
  });

  it('should return null for malformed URL', async () => {
    mockClient.hGet.mockResolvedValue(null);
    const result = await manager.getUrlStatus('not a url');
    expect(result).toBeNull();
  });

  it('should get next URL', async () => {
    const url = 'https://example.com/test/resource';
    mockClient.sPop.mockResolvedValue([url]);
    const result = await manager.getNextUrl();
    if (!result) {
      fail('Expected a URL to be returned');
    }
    expect(result.url).toBe(url);
    // expect(mockClient.sPop).toHaveBeenCalledWith('urls:example.com:notvisited');
  });


  it('should get next URL', async () => {
    const url = 'https://example.com/test/resource.zip';
    mockClient.sPop.mockResolvedValue([url]);
    const result = await manager.getNextUrl();
    expect(result).toBe(null);
    // expect(mockClient.sPop).toHaveBeenCalledWith('urls:example.com:notvisited');
  });
});