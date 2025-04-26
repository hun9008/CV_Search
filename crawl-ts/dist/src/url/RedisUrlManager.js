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
const logger_1 = require("../utils/logger");
const url_1 = require("url");
const RedisConnector_1 = require("../database/RedisConnector");
/**
 * Redis를 사용한 URL 관리자 구현
 */
class RedisUrlManager {
    /**
     * RedisUrlManager 생성자
     * @param redisClient Redis 커넥터 인스턴스
     */
    constructor() {
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
        this.redisClient = RedisConnector_1.redis;
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
        const urlStatusKey = `status:${this.extractDomain(url)}`;
        const doaminUrlSetKey = `urls:${this.extractDomain(url)}:`;
        try {
            const oldStatus = await this.redisClient.hGet(urlStatusKey, url);
            if (oldStatus) {
                await this.redisClient.sRem(`urls:${this.extractDomain(url)}:${oldStatus}`, url);
                await this.redisClient.sRem(`${oldStatus}`, url);
            }
            await this.redisClient.hSet(urlStatusKey, url, newStatus);
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
            const domains = await this.redisClient.sMembers('domains');
            return domains;
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
    * Redis Lua 스크립트를 사용하여 특정 도메인에서 'not_visited' 상태인 URL을 가져오고
    * 상태를 'in_queue'로 원자적으로 업데이트합니다.
    * @param domain 검색할 도메인
    * @returns URL과 도메인 정보가 포함된 객체 또는 URL이 없을 경우 null
    */
    async getNextUrlFromDomain(domain) {
        // Lua 스크립트: URL 조회 및 상태 원자적 업데이트
        try {
            // node-redis v4+ 방식으로 스크립트 실행
            const result = await this.redisClient.sRandMember(`urls:${domain}:${"notvisited" /* URLSTAUS.NOT_VISITED */}`);
            // await this.redisClient.hSet('url:status',result,'')
            if (result) {
                await this.redisClient.sRem(`urls:${domain}:${"notvisited" /* URLSTAUS.NOT_VISITED */}`, result);
                await this.redisClient.sAdd(`urls:${domain}:${"visited" /* URLSTAUS.VISITED */}`, result);
                logger_1.defaultLogger.info(`다음 URL: ${result}, 도메인: ${domain}`);
                return { url: result, domain };
            }
            return null;
        }
        catch (error) {
            throw error;
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
            logger_1.defaultLogger.debug(result?.url ?? '');
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
        return await RedisConnector_1.redis.sRandMember(`status:${status}`);
    }
    /**
     * 방문하지 않은 URL 추가하기
     * @param url URL 문자열
     * @param domain 도메인 이름
     * @param status 초기 상태 (기본값: not_visited)
     */
    async addUrl(url, domain, urlStatus) {
        try {
            // URL을 도메인 세트에 추가
            await RedisConnector_1.redis.sAdd(`urls:${domain}:${urlStatus}`, url);
            // status set에 추가
            await RedisConnector_1.redis.sAdd("notvisited" /* URLSTAUS.NOT_VISITED */, url);
            // URL 상태 설정
            await RedisConnector_1.redis.hSet(`status:${domain}`, url, urlStatus);
            // 도메인을 전체 도메인 세트에 추가
            await RedisConnector_1.redis.sAdd('domains', domain);
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