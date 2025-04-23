#!/usr/bin/env node
/**
 * MongoDB(VisitResult) -> Redis 마이그레이션 스크립트
 *
 * VisitResult 컬렉션의 suburl_list를 Redis로 마이그레이션합니다.
 * 모든 URL은 기본적으로 'not_visited' 상태로 설정됩니다.
 */
/**
 * MongoDB에서 Redis로 URL 데이터 마이그레이션
 */
declare function migrateSubUrlsToRedis(): Promise<void>;
export default migrateSubUrlsToRedis;
