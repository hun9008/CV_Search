import { IParser, SaveParsedContentOptions } from './IParser';
import { IBotRecruitInfo, IDbRecruitInfo, IRawContent } from '../models/recruitinfoModel';
import { IDbConnector } from '../database';
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
     * 캐시 디렉토리 경로
     */
    cacheDir?: string;
    /**
     * 캐시 사용 여부
     */
    useCache?: boolean;
    /**
     * 최대 재시도 횟수
     */
    maxRetries?: number;
    /**
     * API 요청 타임아웃
     */
    timeout?: number;
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
    private readonly maxRetries;
    private readonly timeout;
    private readonly cacheDir;
    private readonly rawContentDir;
    private readonly parsedContentDir;
    private readonly useCache;
    private initialized;
    dbConnector: IDbConnector;
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
     * 캐시 디렉토리 확인 및 생성
     * @private
     */
    private _ensureCacheDirs;
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
    /**
     * URL에서 도메인 추출
     * @param urlString URL 문자열
     * @private
     */
    private _extractDomain;
    /**
     * 원본 콘텐츠를 캐시에서 로드
     * @param id 콘텐츠 ID
     * @private
     */
    private _loadRawContentFromCache;
    /**
     * 원본 콘텐츠를 캐시에 저장
     * @param id 콘텐츠 ID
     * @param content 원본 콘텐츠
     * @private
     */
    private _saveRawContentToCache;
    /**
     * 파싱 결과 저장
     * @param rawContent 파싱전 콘탠츠
     * @param parsedContent 파싱된 콘텐츠
     * @param options 저장 옵션
     */
    saveParsedContent(rawContent: IRawContent, parsedContent: IBotRecruitInfo, options?: SaveParsedContentOptions): Promise<boolean>;
    /**
     * 파싱 결과를 캐시에 저장
     * @param id 결과 ID
     * @param content 파싱 결과
     * @private
     */
    private _saveParsedContentToCache;
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
    makeDbRecruitInfo(botRecruitInfo: IBotRecruitInfo, rawContent: IRawContent): IDbRecruitInfo;
    /**
     * 파싱 결과를 캐시에서 로드
     * @param cacheKey 캐시 키
     * @private
     */
    private _loadParsedContentFromCache;
    /**
     * 캐시 키 생성
     * @param text 텍스트
     * @private
     */
    private _generateCacheKey;
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
     * Parser 시작
     * 원본 콘텐츠를 로드하고 파싱한 후 결과를 저장합니다.
     */
    run(): Promise<() => void>;
}
export {};
