import { IDbConnector } from './IDbConnector';
/**
 * MongoDB 데이터베이스 연결 구현체
 */
export declare class MongoDbConnector implements IDbConnector {
    private dbUri;
    isConnected: boolean;
    constructor({ dbUri }?: {
        dbUri?: string;
    });
    /**
     * 데이터베이스 연결
     */
    connect(): Promise<void>;
    /**
     * 데이터베이스 연결 종료
     */
    disconnect(): Promise<void>;
}
