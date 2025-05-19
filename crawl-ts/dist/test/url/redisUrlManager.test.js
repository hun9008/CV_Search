"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RedisUrlManager_1 = require("../../src/url/RedisUrlManager");
const RedisConnector_1 = require("../../src/database/RedisConnector");
// Redis 클라이언트 모킹
jest.mock('../../src/database/RedisConnector', () => {
    const redisMock = {
        connect: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue('PONG'),
        hGet: jest.fn(),
        hSet: jest.fn().mockResolvedValue(undefined),
        sAdd: jest.fn().mockResolvedValue(undefined),
        sRem: jest.fn().mockResolvedValue(undefined),
        sPop: jest.fn(),
        sMembers: jest.fn(),
        sRandMember: jest.fn(),
        exists: jest.fn(),
        set: jest.fn().mockResolvedValue(undefined)
    };
    return {
        redis: redisMock
    };
});
describe('RedisUrlManager', () => {
    let urlManager;
    const testDomain = 'example.com';
    const testUrl = 'https://example.com/test';
    const notVisitedStatus = "notvisited" /* URLSTAUS.NOT_VISITED */;
    const visitedStatus = "visited" /* URLSTAUS.VISITED */;
    beforeEach(async () => {
        jest.clearAllMocks();
        urlManager = new RedisUrlManager_1.RedisUrlManager();
        await urlManager.connect();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    test('should connect to Redis successfully', async () => {
        expect(RedisConnector_1.redis.connect).toHaveBeenCalled();
        expect(RedisConnector_1.redis.ping).toHaveBeenCalled();
    });
    test('should add URL with correct status', async () => {
        await urlManager.addUrl(testUrl, testDomain, notVisitedStatus);
        expect(RedisConnector_1.redis.sAdd).toHaveBeenCalledWith(`urls:${testDomain}:${notVisitedStatus}`, testUrl);
        expect(RedisConnector_1.redis.sAdd).toHaveBeenCalledWith(notVisitedStatus, testUrl);
        expect(RedisConnector_1.redis.hSet).toHaveBeenCalledWith(`status:${testDomain}`, testUrl, notVisitedStatus);
        expect(RedisConnector_1.redis.sAdd).toHaveBeenCalledWith('domains', testDomain);
    });
    test('should get URL status correctly', async () => {
        RedisConnector_1.redis.hGet.mockResolvedValue(notVisitedStatus);
        const status = await urlManager.getUrlStatus(testUrl);
        expect(RedisConnector_1.redis.hGet).toHaveBeenCalledWith(`status:${testDomain}`, testUrl);
        expect(status).toBe(notVisitedStatus);
    });
    test('should return null for non-existent URL status', async () => {
        RedisConnector_1.redis.hGet.mockResolvedValue(null);
        const status = await urlManager.getUrlStatus(testUrl);
        expect(status).toBeNull();
    });
    test('should update URL status correctly', async () => {
        RedisConnector_1.redis.hGet.mockResolvedValue(notVisitedStatus);
        await urlManager.setURLStatus(testUrl, visitedStatus);
        expect(RedisConnector_1.redis.hGet).toHaveBeenCalledWith(`status:${testDomain}`, testUrl);
        expect(RedisConnector_1.redis.sRem).toHaveBeenCalledWith(`urls:${testDomain}:${notVisitedStatus}`, testUrl);
        expect(RedisConnector_1.redis.sRem).toHaveBeenCalledWith(notVisitedStatus, testUrl);
        expect(RedisConnector_1.redis.hSet).toHaveBeenCalledWith(`status:${testDomain}`, testUrl, visitedStatus);
        expect(RedisConnector_1.redis.sAdd).toHaveBeenCalledWith(`urls:${testDomain}:${visitedStatus}`, testUrl);
        expect(RedisConnector_1.redis.sAdd).toHaveBeenCalledWith(visitedStatus, testUrl);
    });
    test('should get URLs by status', async () => {
        const urls = [testUrl, 'https://example.com/another'];
        RedisConnector_1.redis.sMembers.mockResolvedValue(urls);
        const result = await urlManager.getURLsByStatus(notVisitedStatus);
        expect(RedisConnector_1.redis.sMembers).toHaveBeenCalledWith(notVisitedStatus);
        expect(result).toEqual(urls);
    });
    test('should get URLs by domain and status', async () => {
        const urls = [testUrl, 'https://example.com/another'];
        RedisConnector_1.redis.sMembers.mockResolvedValue(urls);
        const result = await urlManager.getURLsByDomainAndStatus(testDomain, notVisitedStatus);
        expect(RedisConnector_1.redis.sMembers).toHaveBeenCalledWith(`urls:${testDomain}:${notVisitedStatus}`);
        expect(result).toEqual(urls);
    });
    test('should get all domains', async () => {
        const domains = [testDomain, 'another-example.com'];
        RedisConnector_1.redis.sMembers.mockResolvedValue(domains);
        const result = await urlManager.getAllDomains();
        expect(RedisConnector_1.redis.sMembers).toHaveBeenCalledWith('domains');
        expect(result).toEqual(domains);
    });
    test('should initialize available domains', async () => {
        const domains = [testDomain, 'another-example.com'];
        RedisConnector_1.redis.sMembers.mockResolvedValue(domains);
        await urlManager.initAvailableDomains();
        expect(RedisConnector_1.redis.sMembers).toHaveBeenCalledWith('domains');
        expect(urlManager.availableDomains).toEqual(domains);
    });
    test('should add domain', async () => {
        await urlManager.addDomain(testDomain);
        expect(RedisConnector_1.redis.sAdd).toHaveBeenCalledWith('domains', testDomain);
        expect(urlManager.availableDomains).toContain(testDomain);
    });
    test('should get next URL from domain', async () => {
        RedisConnector_1.redis.sPop.mockResolvedValue([testUrl]);
        const result = await urlManager.getNextUrlFromDomain(testDomain);
        expect(RedisConnector_1.redis.sPop).toHaveBeenCalledWith(`urls:${testDomain}:${notVisitedStatus}`, 1);
        expect(result).toEqual({ url: testUrl, domain: testDomain });
    });
    test('should return null when no next URL is available from domain', async () => {
        RedisConnector_1.redis.sPop.mockResolvedValue(null);
        const result = await urlManager.getNextUrlFromDomain(testDomain);
        expect(result).toBeNull();
    });
    test('should check if text exists by SHA256 hash', async () => {
        RedisConnector_1.redis.exists.mockResolvedValue(1);
        const result = await urlManager.textExists('test content');
        expect(RedisConnector_1.redis.exists).toHaveBeenCalled();
        expect(result).toBe(true);
    });
    test('should save text hash if it does not exist', async () => {
        RedisConnector_1.redis.exists.mockResolvedValue(0);
        const result = await urlManager.saveTextHash('test content');
        expect(RedisConnector_1.redis.exists).toHaveBeenCalled();
        expect(RedisConnector_1.redis.set).toHaveBeenCalled();
        expect(result).toBe(true);
    });
    test('should not save text hash if it already exists', async () => {
        RedisConnector_1.redis.exists.mockResolvedValue(1);
        const result = await urlManager.saveTextHash('test content');
        expect(RedisConnector_1.redis.exists).toHaveBeenCalled();
        expect(RedisConnector_1.redis.set).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });
    test('should get random URL by status', async () => {
        RedisConnector_1.redis.sRandMember.mockResolvedValue(testUrl);
        const result = await urlManager.getRandomUrlByStatus(notVisitedStatus);
        expect(RedisConnector_1.redis.sRandMember).toHaveBeenCalledWith(`status:${notVisitedStatus}`);
        expect(result).toBe(testUrl);
    });
    test('should get next URL sequentially from available domains', async () => {
        // Set up available domains
        const availableDomains = ['domain1.com', 'domain2.com', 'domain3.com'];
        urlManager.availableDomains = availableDomains;
        urlManager.currentDomainIndex = 0;
        // Mock first domain call - successful
        RedisConnector_1.redis.sPop.mockResolvedValueOnce(['https://domain1.com/page1']);
        // First call should return URL from first domain
        const result1 = await urlManager.getNextUrl();
        expect(result1).toEqual({ url: 'https://domain1.com/page1', domain: 'domain1.com' });
        expect(urlManager.currentDomainIndex).toBe(1); // Index should advance
        // Mock second domain call - no URLs available
        RedisConnector_1.redis.sPop.mockResolvedValueOnce(null);
        await urlManager.getNextUrl();
        // Mock third domain call - successful
        RedisConnector_1.redis.sPop.mockResolvedValueOnce(['https://domain3.com/page1']);
        // Second call should skip domain2 (no URLs) and return URL from domain3
        const result2 = await urlManager.getNextUrl();
        expect(result2).toEqual({ url: 'https://domain3.com/page1', domain: 'domain3.com' });
        expect(urlManager.currentDomainIndex).toBe(0); // Should wrap around to beginning
        // Test with no available URLs in any domain
        RedisConnector_1.redis.sRandMember.mockResolvedValue(null);
        // Should return null after trying all domains
        const result3 = await urlManager.getNextUrl();
        expect(result3).toBeNull();
    });
    test('should handle domain error after too many errors', async () => {
        urlManager.errorCount = 3;
        const result = await urlManager.handleDomainError();
        expect(result).toBeNull();
        expect(urlManager.errorCount).toBe(0);
    });
});
//# sourceMappingURL=redisUrlManager.test.js.map