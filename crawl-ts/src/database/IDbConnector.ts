/**
 * 데이터베이스 연결 인터페이스
 * 데이터베이스 연결과 크롤링 결과 저장을 담당
 */
export interface IDbConnector {

  /**
   * 데이터베이스 연결
   */
  connect(): Promise<void>;

  /**
   * 데이터베이스 연결 종료z
   */
  disconnect(): Promise<void>;


}