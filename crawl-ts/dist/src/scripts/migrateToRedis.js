#!/usr/bin/env node
"use strict";
/**
 * MongoDB(VisitResult) -> Redis 마이그레이션 스크립트
 *
 * VisitResult 컬렉션의 suburl_list를 Redis로 마이그레이션합니다.
 * 모든 URL은 기본적으로 'not_visited' 상태로 설정됩니다.
 */
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
const MongoDbConnector_1 = require("@database/MongoDbConnector");
const RedisConnector_1 = require("@database/RedisConnector");
const RedisUrlManager_1 = require("@url/RedisUrlManager");
const VisitResult_1 = require("@models/VisitResult");
const dotenv = __importStar(require("dotenv"));
// 환경 변수 로드
dotenv.config();
const stats = {
    totalDomains: 0,
    totalUrls: 0,
    processedUrls: 0,
    skippedUrls: 0,
    errors: 0,
};
/**
 * MongoDB에서 Redis로 URL 데이터 마이그레이션
 */
async function migrateSubUrlsToRedis() {
    const mongoDb = new MongoDbConnector_1.MongoDbConnector();
    try {
        console.log('MongoDB 연결 중...');
        await mongoDb.connect();
        console.log('MongoDB 연결 성공');
        console.log('Redis 연결 확인 중...');
        await RedisConnector_1.redis.connect();
        console.log('Redis 연결 성공');
        // RedisUrlManager 인스턴스 가져오기
        const redisUrlManager = new RedisUrlManager_1.RedisUrlManager();
        // Redis 초기화 여부 확인
        const shouldReset = process.argv.includes('--reset');
        if (shouldReset) {
            console.log('Redis 데이터 초기화 중...');
            const keys = await RedisConnector_1.redis.keys('domain:*:urls');
            keys.push(...await RedisConnector_1.redis.keys('status:*:urls'));
            keys.push('url:status', 'url:domain', 'domains'); // domains 세트도 초기화
            if (keys.length > 0) {
                await RedisConnector_1.redis.del(keys);
                console.log(`${keys.length}개의 키가 초기화되었습니다.`);
            }
        }
        // MongoDB에서 도메인 목록 조회
        const domains = await VisitResult_1.VisitResultModel.find({}, { domain: 1 });
        stats.totalDomains = domains.length;
        console.log(`총 ${stats.totalDomains}개의 도메인을 발견했습니다.`);
        // 각 도메인에 대해 처리
        for (let i = 0; i < domains.length; i++) {
            const domainDoc = domains[i];
            console.log(`[${i + 1}/${domains.length}] 도메인 '${domainDoc.domain}' 처리 중...`);
            if (!domainDoc.domain) {
                continue;
            }
            // 도메인을 'domains' 세트에 추가
            await redisUrlManager.addDomain(domainDoc.domain);
            // 도메인에 대한 모든 suburl_list 가져오기
            const result = await VisitResult_1.VisitResultModel.findOne({ domain: domainDoc.domain }, { suburl_list: 1 });
            if (!result || !result.suburl_list || result.suburl_list.length === 0) {
                console.log(`  도메인 '${domainDoc.domain}'에 URL이 없습니다.`);
                continue;
            }
            const urlCount = result.suburl_list.length;
            stats.totalUrls += urlCount;
            console.log(`  총 ${urlCount}개의 URL을 발견했습니다.`);
            // 각 URL을 Redis에 추가
            for (const subUrl of result.suburl_list) {
                if (subUrl.url == null || subUrl.domain == null || domainDoc.domain == null) {
                    stats.skippedUrls++;
                    continue;
                }
                try {
                    // URL 상태를 not_visited로 초기화하여 Redis에 추가
                    await redisUrlManager.addUrl(subUrl.url, domainDoc.domain, "notvisited" /* URLSTAUS.NOT_VISITED */);
                    stats.processedUrls++;
                    if (stats.processedUrls % 1000 === 0) {
                        console.log(`  ${stats.processedUrls}개의 URL이 처리되었습니다.`);
                    }
                }
                catch (error) {
                    console.error(`  URL '${subUrl.url}' 처리 중 오류:`, error);
                    stats.errors++;
                }
            }
            console.log(`  도메인 '${domainDoc.domain}'의 ${urlCount}개 URL 처리 완료`);
        }
        // 전체 도메인 목록 가져오기
        const allDomains = await redisUrlManager.getAllDomains();
        console.log(`\n총 ${allDomains.length}개 도메인이 Redis에 저장되었습니다.`);
        // 전체 통계 출력
        console.log('\n===== 마이그레이션 결과 =====');
        console.log(`총 도메인 수: ${stats.totalDomains}개`);
        console.log(`총 URL 수: ${stats.totalUrls}개`);
        console.log(`처리된 URL 수: ${stats.processedUrls}개`);
        console.log(`건너뛴 URL 수: ${stats.skippedUrls}개`);
        console.log(`오류 발생 URL 수: ${stats.errors}개`);
        console.log('===========================');
    }
    catch (error) {
        console.error('마이그레이션 중 오류 발생:', error);
    }
    finally {
        // 연결 종료
        try {
            await mongoDb.disconnect();
            console.log('MongoDB 연결 종료');
            await RedisConnector_1.redis.disconnect();
            console.log('Redis 연결 종료');
        }
        catch (err) {
            console.error('연결 종료 중 오류:', err);
        }
    }
}
// 스크립트 실행
if (require.main === module) {
    migrateSubUrlsToRedis()
        .then(() => {
        console.log('마이그레이션이 완료되었습니다.');
        process.exit(0);
    })
        .catch(error => {
        console.error('마이그레이션 중 예상치 못한 오류 발생:', error);
        process.exit(1);
    });
}
exports.default = migrateSubUrlsToRedis;
//# sourceMappingURL=migrateToRedis.js.map