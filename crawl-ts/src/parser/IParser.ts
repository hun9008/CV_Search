import { Page } from 'puppeteer';
import { IDbConnector } from '../database';
import { IBotRecruitInfo, IDbRecruitInfo, IRawContent } from '../models/recruitinfoModel';

/**
 * 파싱 결과 저장 옵션
 */
export interface SaveParsedContentOptions {
  /**
   * 저장할 ID
   */
  id?: string;

  /**
   * 저장 대상 (cache, file, db)
   */
  destination?: 'cache' | 'file' | 'db';

  /**
   * 추가 옵션
   */
  options?: Record<string, any>;
}

/**
 * 파서 인터페이스
 * 모든 파서 구현체가 구현해야 하는 인터페이스
 */
export interface IParser {
  /**
   * 파서 초기화
   * @param options 초기화 옵션
   */



  dbConnector: IDbConnector;

  initialize(options?: Record<string, any>): Promise<boolean>;
  /**
   * Parser 시작
   *
   */
  run(): Promise<() => void>;
  /**
   * 파서 이름 반환
   */
  getName(): string;

  /**
   * 원본 콘텐츠 로드
   * @param options 로드 옵션
   */
  loadRawContent(batchSize : number ):Promise<IRawContent[]>;

  /**
   * 파싱 결과 저장
   * @param parsedContent 파싱된 콘텐츠
   * @param options 저장 옵션
   */
  saveParsedContent(dbRecruitInfo : IDbRecruitInfo, options?: SaveParsedContentOptions): Promise<boolean>;

  /**
   * 원본 콘텐츠를 파싱하여 채용 정보 추출
   * @param rawContent 원본 콘텐츠
   */
  parseRawContent(rawContent: IRawContent): Promise<IBotRecruitInfo>;


  /**
   * DB 저장용 모델로 변환
   * @param botRecruitInfo 봇 파싱 결과
   * @param rawContent 원본 콘텐츠
   */
  makeDbRecruitInfo(botRecruitInfo: IBotRecruitInfo, rawContent: IRawContent): IDbRecruitInfo;
}