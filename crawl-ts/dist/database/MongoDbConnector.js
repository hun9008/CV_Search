"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDbConnector = void 0;
const logger_1 = require("../utils/logger");
const visitResult_1 = require("../models/visitResult");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * MongoDB 데이터베이스 연결 구현체
 */
class MongoDbConnector {
    /**
     * MongoDB 연결 관리자 생성자
     * @param dbUri MongoDB 연결 URI
     */
    constructor(dbUri) {
        this.isConnected = false;
        this.dbUri = dbUri;
    }
    /**
     * 데이터베이스 연결
     */
    async connect() {
        if (this.isConnected)
            return;
        logger_1.defaultLogger.debug("MongoDB 연결 시도 중...");
        try {
            const startTime = Date.now();
            // Mongoose를 사용하여 MongoDB 연결
            await mongoose_1.default.connect(this.dbUri, {
                dbName: process.env.MONGODB_DB_NAME,
            });
            this.isConnected = true;
            const runtime = Date.now() - startTime;
            logger_1.defaultLogger.eventInfo('db_connect', { runtime });
            logger_1.defaultLogger.debug("MongoDB 연결 성공");
        }
        catch (error) {
            logger_1.defaultLogger.error('MongoDB 연결 실패:', error);
            throw error;
        }
    }
    /**
     * 데이터베이스 연결 종료
     */
    async disconnect() {
        if (!this.isConnected)
            return;
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            logger_1.defaultLogger.eventInfo('DB연결 종료', 'DB연결 종료 성공');
        }
        catch (error) {
            logger_1.defaultLogger.error('DB연결 종료 실패:', error);
        }
    }
    /**
     * 방문 결과 저장
     * @param subUrlResult 저장할 방문 결과 객체
     * @returns 저장 성공 여부
     */
    async saveVisitResult(subUrlResult) {
        const startTime = Date.now();
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            const domain = subUrlResult.domain;
            const url = subUrlResult.url;
            logger_1.defaultLogger.debug(`도메인 ${domain}의 URL ${url} 방문 결과 저장 중...`);
            // 도메인 문서 찾기 (없으면 생성)
            let domainDoc = await visitResult_1.VisitResult.findOne({ domain });
            if (!domainDoc) {
                domainDoc = new visitResult_1.VisitResult({
                    domain,
                    suburl_list: [],
                });
                logger_1.defaultLogger.debug(`도메인 ${domain}에 대한 새 문서 생성`);
            }
            // suburl_list 배열이 없으면 초기화
            if (!domainDoc.suburl_list) {
                domainDoc.suburl_list = [];
            }
            // 해당 URL 찾기
            let existingUrlIndex = domainDoc.suburl_list.findIndex(item => item.url === url);
            if (existingUrlIndex >= 0) {
                domainDoc.suburl_list[existingUrlIndex] = subUrlResult.toObject();
                logger_1.defaultLogger.debug(`기존 URL ${url} 정보 업데이트`);
            }
            else {
                domainDoc.suburl_list.push(subUrlResult.toObject());
                logger_1.defaultLogger.debug(`새 URL ${url} 정보 추가`);
            }
            // 방금 저장한 URL 항목에 대한 요약 정보 표시
            const savedUrlEntry = domainDoc.suburl_list.find(item => item.url === url);
            if (savedUrlEntry) {
                // 로깅만 수행
                logger_1.defaultLogger.debug(`URL ${url} 저장 완료`);
            }
            logger_1.defaultLogger.debug(`도메인 ${domain} 문서 저장 완료`);
            // 발견된 URL을 데이터베이스에 추가
            const urlsToAdd = subUrlResult.crawledUrls || [];
            // 각 URL 처리
            for (const newUrl of urlsToAdd) {
                try {
                    // suburl_list 배열에 이미 URL이 있는지 확인
                    const urlExists = domainDoc.suburl_list.some(item => item.url === newUrl);
                    if (!urlExists) {
                        // 새 URL을 suburl_list에 추가 - SubUrl 모델 사용
                        const newSubUrl = new visitResult_1.SubUrl({
                            url: newUrl,
                            domain: domain,
                            visited: false,
                            discoveredAt: new Date(),
                            created_at: new Date()
                        });
                        logger_1.defaultLogger.debug(`추가 url ${newUrl} 추가 완료`);
                        // toObject()로 변환하여 추가
                        domainDoc.suburl_list.push(newSubUrl.toObject());
                    }
                }
                catch (urlError) {
                    logger_1.defaultLogger.error(`URL 추가 중 오류 (${newUrl}):`, urlError);
                }
            }
            // 도메인 문서 저장
            domainDoc.updated_at = new Date();
            await domainDoc.save();
            const runtime = Date.now() - startTime;
            logger_1.defaultLogger.eventInfo('save_visit_result', { runtime });
            return true;
        }
        catch (error) {
            logger_1.defaultLogger.error(`방문 결과 저장 중 오류:`, error);
            const runtime = Date.now() - startTime;
            logger_1.defaultLogger.eventInfo('save_visit_result', {
                runtime,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
}
exports.MongoDbConnector = MongoDbConnector;
//# sourceMappingURL=MongoDbConnector.js.map