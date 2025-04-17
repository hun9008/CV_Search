import { IDbConnector } from './IDbConnector';
import { SubUrl } from '../models/visitResult';
/**
 * MongoDB 데이터베이스 연결 구현체
 */
export declare class MongoDbConnector implements IDbConnector {
    private dbUri;
    isConnected: boolean;
    /**
     * MongoDB 연결 관리자 생성자
     * @param dbUri MongoDB 연결 URI
     */
    constructor(dbUri: string);
    /**
     * 데이터베이스 연결
     */
    connect(): Promise<void>;
    /**
     * 데이터베이스 연결 종료
     */
    disconnect(): Promise<void>;
    /**
     * 방문 결과 저장
     * @param subUrlResult 저장할 방문 결과 객체
     * @returns 저장 성공 여부
     */
    saveVisitResult(subUrlResult: SubUrl): Promise<boolean>;
}
