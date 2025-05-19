"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisUrlManager = void 0;
const urlUtils_1 = require("./urlUtils");
const logger_1 = require("../utils/logger");
const url_1 = require("url");
const redis_1 = require("redis");
const redis = (0, redis_1.createClient)({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
    legacyMode: false, // 반드시 설정 !!
});
/**
 * Redis를 사용한 URL 관리자 구현
 */
class RedisUrlManager {
    /**
     * RedisUrlManager 생성자
     * @param redisClient Redis 커넥터 인스턴스
     */
    constructor(availableDomains) {
        /**
         * robots.txt 캐시
         */
        this.robotsCache = {};
        /**
         * 현재 도메인 인덱스
         */
        this.currentDomainIndex = 0;
        /**
         * 사용 가능한 도메인 목록
         */
        this.availableDomains = [];
        /**
         * 재귀 횟수 제한을 위한 카운터
         */
        this.recursionCount = 0;
        /**
         * 오류 횟수 제한을 위한 카운터
         */
        this.errorCount = 0;
        this.redisClient = redis;
        if (availableDomains) {
            this.availableDomains = availableDomains;
        }
    }
    /**
      * Connects to the Redis server.
      * Attempts to establish a connection to the Redis server and checks the connection by sending a ping.
      */
    async connect() {
        try {
            await this.redisClient.connect();
            const pong = await this.redisClient.ping(); // 연결 확인
            if (pong === 'PONG') {
                logger_1.defaultLogger.debug('REDIS 연결 성공 및 응답 확인 (PONG)');
            }
            else {
                logger_1.defaultLogger.warn(`REDIS 연결되었지만 PING 응답이 예상과 다릅니다: ${pong}`);
            }
        }
        catch (error) {
            logger_1.defaultLogger.error('REDIS 연결 실패:', error);
            throw error;
        }
    }
    /**
     * URL 상태 설정
     * @param url URL
     * @param newStatus 새 상태
     */
    async setURLStatus(url, newStatus) {
        const domian = this.extractDomain(url);
        try {
            const oldStatus = await this.redisClient.hGet(`status:${domian}`, url);
            if (oldStatus) {
                await this.redisClient.sRem(`urls:${this.extractDomain(url)}:${oldStatus}`, url);
                await this.redisClient.sRem(`${oldStatus}`, url);
            }
            await this.redisClient.hSet(`status:${domian}`, url, newStatus);
            await this.redisClient.sAdd(`urls:${this.extractDomain(url)}:${newStatus}`, url);
            await this.redisClient.sAdd(newStatus, url);
        }
        catch (error) {
            logger_1.defaultLogger.error(`URL 상태 설정 중 오류 (${url}):`, error);
            throw error;
        }
    }
    /**
     * URL 상태 가져오기
     * @param url URL
     * @returns URL 상태 또는 null
     */
    async getUrlStatus(url) {
        const redisKey = `status:${this.extractDomain(url)}`;
        try {
            const status = await this.redisClient.hGet(redisKey, url);
            if (status) {
                return status;
            }
            return null;
        }
        catch (error) {
            logger_1.defaultLogger.error(`URL 상태 가져오기 중 오류 (${url}):`, error);
            return null;
        }
    }
    /**
   * favicon 가져오기
   * @param domain URL
   * @returns URL 상태 또는 null
   */
    async getFavicon(domain) {
        const redisKey = `favicon:${domain}`;
        try {
            const favicon = await this.redisClient.get(redisKey);
            return favicon;
        }
        catch (error) {
            logger_1.defaultLogger.error(`[RedisUrlManager][getFavicon] URL 상태 가져오기 중 오류 (${domain}):`, error);
            return null;
        }
    }
    /**
     * URL에서 도메인 추출
     * @param url URL 문자열
     * @returns 도메인 또는 null
     */
    extractDomain(url) {
        try {
            const urlObj = new url_1.URL(url);
            return urlObj.hostname;
        }
        catch (error) {
            logger_1.defaultLogger.debug(`URL에서 도메인 추출 중 오류: ${url}`, error);
            return null;
        }
    }
    /**
     * 특정 상태의 모든 URL 가져오기
     * @param status 상태
     * @param limit 최대 개수
     * @returns URL 배열
     */
    async getURLsByStatus(status, limit = 10) {
        try {
            return await this.redisClient.sMembers(status);
        }
        catch (error) {
            logger_1.defaultLogger.error(`상태별 URL 가져오기 중 오류 (${status}):`, error);
            return [];
        }
    }
    /**
     * 특정 도메인의 특정 상태 URL 가져오기
     * @param domain 도메인
     * @param status URL 상태
     * @param limit 최대 개수
     * @returns URL 배열
     */
    async getURLsByDomainAndStatus(domain, status, limit = 10) {
        try {
            return await this.redisClient.sMembers(`urls:${domain}:${status}`);
        }
        catch (error) {
            logger_1.defaultLogger.error(`도메인별 URL 가져오기 중 오류 (${domain}, ${status}):`, error);
            return [];
        }
    }
    /**
     * Gets all available domains.
     * Retrieves all domains stored in Redis.
     * @returns A promise that resolves to an array of domain strings.
     */
    async getAllDomains() {
        try {
            return await this.redisClient.sMembers('domains');
        }
        catch (error) {
            logger_1.defaultLogger.error('도메인 목록 가져오기 중 오류:', error);
            throw error;
        }
    }
    /**
     * 사용 가능한 도메인 목록 초기화
     */
    async initAvailableDomains() {
        try {
            // Redis에서 도메인 목록 가져오기
            this.availableDomains = await this.redisClient.sMembers('domains');
            if (this.availableDomains.length > 0) {
                logger_1.defaultLogger.info(`${this.availableDomains.length}개의 도메인을 Redis에서 로드했습니다.`);
            }
            else {
                logger_1.defaultLogger.warn('Redis에서 사용 가능한 도메인 목록을 찾을 수 없습니다.');
            }
        }
        catch (error) {
            const err = error;
            logger_1.defaultLogger.error('도메인 목록 초기화 중 오류:', err.message || err);
            this.availableDomains = [];
        }
    }
    /**
     * 도메인 목록에 도메인 추가
     * @param domain 도메인
     */
    async addDomain(domain) {
        try {
            await this.redisClient.sAdd('domains', domain);
            // 로컬 캐시 업데이트
            if (!this.availableDomains.includes(domain)) {
                this.availableDomains.push(domain);
            }
            logger_1.defaultLogger.info(`도메인 추가됨: ${domain}`);
        }
        catch (error) {
            logger_1.defaultLogger.error(`도메인 추가 중 오류 (${domain}):`, error);
            throw error;
        }
    }
    /**
    * Redis transection을 사용해서 원자적으로 업데이트함
    *
    * @param domain 검색할 도메인
    * @returns URL과 도메인 정보가 포함된 객체 또는 URL이 없을 경우 null
    */
    async getNextUrlFromDomain(domain) {
        const result = await this.redisClient.sPop(`urls:${domain}:${"notvisited" /* URLSTAUS.NOT_VISITED */}`, 1);
        try {
            if (result.length > 0) {
                this.setURLStatus(result[0], "visited" /* URLSTAUS.VISITED */);
                return { url: result[0], domain };
            }
            return null;
        }
        catch (error) {
            await this.redisClient.sAdd(`urls:${domain}:${"visited" /* URLSTAUS.VISITED */}`, result);
            return null;
        }
    }
    /**
     * 다음에 방문할 URL 가져오기
     * @returns URL 및 도메인 정보 객체 또는 null
     */
    async getNextUrl() {
        try {
            // 도메인 목록이 없으면 초기화
            if (this.availableDomains.length === 0) {
                await this.initAvailableDomains();
            }
            // 도메인 순회 반복 제한
            if (this.recursionCount > this.availableDomains.length * 2) {
                logger_1.defaultLogger.warn('모든 도메인에 방문할 URL이 없습니다.');
                this.recursionCount = 0;
                return null;
            }
            // 순차적으로 도메인 선택
            const domain = this.availableDomains[this.currentDomainIndex];
            this.currentDomainIndex = (this.currentDomainIndex + 1) % this.availableDomains.length;
            const result = await this.getNextUrlFromDomain(domain);
            if (result && await (0, urlUtils_1.isUrlAllowedWithRobots)(result.url, [domain]) === false) {
                logger_1.defaultLogger.debug(`[getNextUrl] 사용할 수 없는 url 입니다. ${result?.url}`);
                // robots.txt에 의해 차단된 경우, 해당 URL을 visited 상태로 변경
                await this.setURLStatus(result.url, "noRecruitInfo" /* URLSTAUS.NO_RECRUITINFO */);
                return null;
            }
            return result;
        }
        catch (error) {
            const err = error;
            logger_1.defaultLogger.error('다음 URL 가져오기 중 오류:', err.message || err);
            return this.handleDomainError();
        }
    }
    /**
     * 주어진 텍스트의 sha256 해시를 생성하여, 해당 해시값을 포함하는 Redis 키(text:{sha256})가 존재하는지 확인
     * @param text 확인할 텍스트
     * @returns 키가 존재하면 true, 그렇지 않으면 false
     */
    async textExists(text) {
        try {
            const { createHash } = await Promise.resolve().then(() => __importStar(require('crypto')));
            const sha256 = createHash('sha256').update(text).digest('hex');
            const key = `text:${sha256}`;
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        }
        catch (error) {
            logger_1.defaultLogger.error(`텍스트 키 존재 확인 중 오류 (${text}):`, error);
            throw error;
        }
    }
    /**
     * 주어진 텍스트의 sha256 해시를 생성하고, 해당 해시가 Redis에 없으면 텍스트를 저장합니다.
     * @param text 저장할 텍스트
     * @returns 텍스트가 새로 저장되었으면 true, 이미 존재하면 false
     */
    async saveTextHash(text) {
        try {
            const { createHash } = await Promise.resolve().then(() => __importStar(require('crypto')));
            const sha256 = createHash('sha256').update(text).digest('hex');
            const key = `text:${sha256}`;
            const exists = await this.redisClient.exists(key);
            if (exists === 1) {
                return false;
            }
            await this.redisClient.set(key, text);
            return true;
        }
        catch (error) {
            logger_1.defaultLogger.error(`텍스트 키 저장 중 오류 (${text}):`, error);
            throw error;
        }
    }
    /**
     * 특정 상태의 랜덤 URL 가져오기
     * @param status URL 상태
     * @returns 랜덤 URL 또는 null
     */
    async getRandomUrlByStatus(status) {
        return await redis.sRandMember(`status:${status}`);
    }
    /**
     * 방문하지 않은 URL 추가하기
     * @param url URL 문자열
     * @param domain 도메인 이름
     * @param status 초기 상태 (기본값: not_visited)
     */
    async addUrl(url, domain, urlStatus) {
        try {
            const urlOriginStatus = await redis.hGet(`status:${domain}`, url);
            // logger.debug(`add URL ${urlOriginStatus}`);
            if (!urlOriginStatus) {
                logger_1.defaultLogger.debug(`[RedisUrlManger] add URL ${url}`);
                // URL을 도메인 세트에 추가
                await redis.sAdd(`urls:${domain}:${urlStatus}`, url);
                // status set에 추가
                await redis.sAdd("notvisited" /* URLSTAUS.NOT_VISITED */, url);
                // URL 상태 설정
                await redis.hSet(`status:${domain}`, url, urlStatus);
                // 도메인을 전체 도메인 세트에 추가
                await redis.sAdd('domains', domain);
            }
        }
        catch (error) {
            console.error(`Error adding URL ${url} to Redis:`, error);
            throw error;
        }
    }
    /**
     * 도메인 오류 처리
     * @returns URL 및 도메인 정보 객체 또는 null
     */
    async handleDomainError() {
        this.errorCount++;
        if (this.errorCount > 3) {
            logger_1.defaultLogger.warn('너무 많은 오류가 발생했습니다.');
            this.errorCount = 0;
            return null;
        }
        logger_1.defaultLogger.info('오류 발생 후 다른 도메인에서 URL 가져오기 시도...');
        return this.getNextUrl();
    }
}
exports.RedisUrlManager = RedisUrlManager;
//# sourceMappingURL=RedisUrlManager.js.map