import { IDbConnector } from './IDbConnector';
/**
 * MySQL 데이터베이스 연결 구현체 (Sequelize 사용)
 */
export declare class MySqlConnector implements IDbConnector {
    private sequelize;
    isConnected: boolean;
    /**
     * MySqlConnector 생성자
     * @param config 데이터베이스 연결 설정
     */
    constructor();
    /**
     * 데이터베이스 연결 (Sequelize 사용)
     */
    connect(): Promise<void>;
    /**
     * 데이터베이스 연결 종료 (Sequelize 사용)
     */
    disconnect(): Promise<void>;
}
