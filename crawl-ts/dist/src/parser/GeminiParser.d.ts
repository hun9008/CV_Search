import { IParser } from './IParser';
import { IBotRecruitInfo, ICacheDbRecruitInfo, IRawContent } from '../models/RecruitInfoModel';
import { IDbConnector } from '../database';
import { IMessageService } from '../message/IMessageService';
import { IUrlManager } from '../url/IUrlManager';
import { IRecruitInfoRepository } from '../database/IRecruitInfoRepository';
import { MysqlRecruitInfoRepository } from '@database/MysqlRecruitInfoRepository';
export interface GeminiParserOptions {
    /**
     * API 키
     */
    apiKey?: string;
    /**
     * API 키 배열
     */
    apiKeys?: string[];
    /**
     * 모델 이름
     */
    model?: string;
    /**
     * DB 커넥터
     */
    dbConnector: IDbConnector;
    /**
    * cacheDB 커넥터
    */
    cacheDbConnector: IDbConnector;
    /**
     * DB 서비스
     */
    recruitInfoRepository: MysqlRecruitInfoRepository;
    /**
    * 캐쉬 DB 서비스
    */
    cacheRecruitInfoRepository: IRecruitInfoRepository;
    /**
     * 최대 재시도 횟수
     */
    maxRetries?: number;
    /**
     * API 요청 타임아웃
     */
    timeout?: number;
    /**
      * URL Mannager
      */
    urlManager: IUrlManager;
    /**
     * Message Service
     */
    messageService: IMessageService;
    /**
     * 기타 옵션
     */
    [key: string]: any;
}
/**
 * 키 상태 정보 인터페이스
 */
interface KeyStatusInfo {
    totalKeys: number;
    currentKeyIndex: number;
    currentApiKey: string;
    isClientInitialized: boolean;
    model: string;
}
export declare class ParseError extends Error {
    cause: unknown;
    constructor(message: string, cause?: unknown);
}
/**
 * GeminiParser - Google의 Gemini API를 사용하는 파서
 */
export declare class GeminiParser implements IParser {
    private apiKeys;
    private currentKeyIndex;
    private apiKey;
    private readonly modelName;
    private genAI;
    private initialized;
    dbConnector: IDbConnector;
    cacheDbConnector?: IDbConnector;
    recruitInfoRepository: MysqlRecruitInfoRepository;
    cacheRecruitInfoRepository?: IRecruitInfoRepository;
    urlManager: IUrlManager;
    messageService: IMessageService;
    /**
     * GeminiParser 생성자
     * @param options 파서 옵션
     */
    constructor(options: GeminiParserOptions);
    /**
     * 파서 초기화
     * @param options 초기화 옵션
     */
    initialize(options?: Record<string, any>): Promise<boolean>;
    /**
     * API 키 초기화
     * @param singleKey 단일 API 키
     * @param keyArray API 키 배열
     * @param initialKeyIndex 시작할 키 인덱스
     * @returns 초기화 성공 여부
     * @private
     */
    private _initializeKey;
    /**
     * 파서 이름 반환
     */
    getName(): string;
    /**
     * API 키 로드
     * @param singleKey 단일 API 키
     * @param keyArray API 키 배열
     * @private
     */
    private _loadApiKeys;
    /**
     * Gemini API 클라이언트 초기화
     * @private
     */
    private _initializeClient;
    /**
     * 다음 API 키로 전환
     * @returns 성공 여부
     * @private
     */
    private _rotateApiKey;
    /**
     * API 호출 실행 (재시도 및 키 순환 로직 포함)
     * @param apiCallFunction API 호출 함수
     * @param retryCount 재시도 횟수
     * @returns API 호출 결과
     * @private
     */
    private _executeApiCallWithRetries;
    /**
     * 원본 콘텐츠 로드
     * @param options 로드 옵션
     */
    loadRawContent(batchSize: number): Promise<IRawContent[]>;
    loadMongoRawContent(batchSize: number): Promise<IRawContent[]>;
    /**
     * URL에서 도메인 추출
     * @param urlString URL 문자열
     * @private
     */
    private _extractDomain;
    /**
     * 원본 콘텐츠 파싱
     * @param rawContent 원본 콘텐츠
     */
    parseRawContent(rawContent: IRawContent): Promise<IBotRecruitInfo>;
    /**
     * DB 저장용 모델로 변환
     * @param botRecruitInfo 봇 파싱 결과
     * @param rawContent 원본 콘텐츠
     */
    makeDbRecruitInfo(botRecruitInfo: IBotRecruitInfo, rawContent: IRawContent): ICacheDbRecruitInfo;
    /**
     * 컨텍스트 헤더 생성
     * @param rawContent 원본 콘텐츠
     * @private
     */
    private _createContextHeader;
    /**
     * 채용 정보 스키마 정의
     * @private
     */
    private _getRecruitmentSchema;
    /**
     * 채용 정보 프롬프트 생성
     * @param content 분석할 텍스트
     * @private
     */
    private _getRecruitmentPrompt;
    /**
     * Gemini API를 사용하여 채용 정보 파싱
     * @param content 분석할 텍스트
     * @private
     */
    private _parseRecruitment;
    /**
     * 현재 API 키 상태 조회
     */
    getKeyStatus(): KeyStatusInfo;
    /**
     * VisitResult의 domain document에서, suburl_list에서 맞는 url을 찾아서 isRecruit를
     * 업데이트합니다.
     * @param rawContent 원본 콘텐츠
     * @param parsedContent 파싱된 채용 정보
     * @returns 업데이트 성공 여부
     */
    updateRecruitStatus(rawContent: IRawContent, parsedContent: IBotRecruitInfo): Promise<boolean>;
    /**
     * Parser 몽고 DB와 연동해서 시작
     * 원본 콘텐츠를 로드하고 파싱한 후 결과를 저장합니다.
     */
    run(): Promise<() => void>;
}
export {};
