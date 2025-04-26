"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiParser = exports.ParseError = void 0;
const generative_ai_1 = require("@google/generative-ai");
const VisitResult_1 = require("../models/VisitResult");
const url_1 = require("url");
const MessageService_1 = require("../message/MessageService");
const logger_1 = require("../utils/logger");
// --- 상수 ---
const DEFAULT_MODEL_NAME = 'gemini-2.0-flash-latest';
const RATE_LIMIT_HTTP_STATUS = 429;
const RATE_LIMIT_MESSAGE_FRAGMENT = 'Resource has been exhausted';
const JSON_MIME_TYPE = 'application/json';
class ParseError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = 'ParseError';
        this.cause = cause;
        // Stack trace 유지 (V8 기반 환경에서만 동작)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ParseError);
        }
    }
}
exports.ParseError = ParseError;
/**
 * GeminiParser - Google의 Gemini API를 사용하는 파서
 */
class GeminiParser {
    /**
     * GeminiParser 생성자
     * @param options 파서 옵션
     */
    constructor(options) {
        this.apiKeys = [];
        this.currentKeyIndex = -1;
        this.apiKey = null;
        this.genAI = null;
        this.initialized = false;
        // 기본 설정
        this.modelName = options.model || DEFAULT_MODEL_NAME;
        this.dbConnector = options.dbConnector;
        this.cacheDbConnector = options.cacheDbConnector;
        this.recruitInfoRepository = options.recruitInfoRepository;
        this.cacheRecruitInfoRepository = options.cacheRecruitInfoRepository;
        this.messageService = options.messageService;
        this.urlManager = options.urlManager;
        // API 키 설정은 initialize 메서드에서 수행
    }
    /**
     * 파서 초기화
     * @param options 초기화 옵션
     */
    async initialize(options = {}) {
        try {
            await this.dbConnector.connect();
            if (this.cacheDbConnector) {
                await this.cacheDbConnector.connect();
            }
            await this.urlManager.connect();
            await this.messageService.connect();
            // API 키 로드 및 초기화
            const keyInitialized = this._initializeKey(options.apiKey || process.env.GEMINI_API_KEY, options.apiKeys || process.env.GEMINI_API_KEYS?.split(','), options.keyIndex);
            if (!keyInitialized) {
                return false;
            }
            // 클라이언트 초기화
            this._initializeClient();
            if (!this.genAI) {
                logger_1.defaultLogger.error('Gemini API 클라이언트 초기화 실패');
                return false;
            }
            this.initialized = true;
            logger_1.defaultLogger.info(`GeminiParser 초기화 완료 (모델: ${this.modelName})`);
            return true;
        }
        catch (error) {
            logger_1.defaultLogger.error(`GeminiParser 초기화 중 오류: ${error.message}`);
            return false;
        }
    }
    /**
     * API 키 초기화
     * @param singleKey 단일 API 키
     * @param keyArray API 키 배열
     * @param initialKeyIndex 시작할 키 인덱스
     * @returns 초기화 성공 여부
     * @private
     */
    _initializeKey(singleKey, keyArray, initialKeyIndex) {
        // API 키 로드
        this._loadApiKeys(singleKey, keyArray);
        // 키 인덱스 검증 및 설정
        const keyIndex = initialKeyIndex ?? 0;
        if (this.apiKeys.length > 0) {
            if (typeof keyIndex !== 'number' || keyIndex < 0 || keyIndex >= this.apiKeys.length) {
                this.currentKeyIndex = 0;
                if (initialKeyIndex !== undefined) {
                    logger_1.defaultLogger.warn(`제공된 keyIndex (${initialKeyIndex})가 유효하지 않습니다. 인덱스 0으로 시작합니다.`);
                }
            }
            else {
                this.currentKeyIndex = keyIndex;
            }
            this.apiKey = this.apiKeys[this.currentKeyIndex];
            return true;
        }
        else {
            this.currentKeyIndex = -1;
            this.apiKey = null;
            logger_1.defaultLogger.warn('API 키가 설정되지 않았습니다. Gemini API를 사용할 수 없습니다.');
            return false;
        }
    }
    /**
     * 파서 이름 반환
     */
    getName() {
        return 'GeminiParser';
    }
    /**
     * API 키 로드
     * @param singleKey 단일 API 키
     * @param keyArray API 키 배열
     * @private
     */
    _loadApiKeys(singleKey, keyArray) {
        const keySet = new Set();
        // 옵션에서 제공한 단일 키
        if (singleKey) {
            keySet.add(singleKey.trim());
        }
        // 옵션에서 제공한 키 배열
        if (keyArray && Array.isArray(keyArray)) {
            keyArray.forEach(key => {
                if (key && typeof key === 'string') {
                    keySet.add(key.trim());
                }
            });
        }
        this.apiKeys = Array.from(keySet);
        logger_1.defaultLogger.info(`API 키 ${this.apiKeys.length}개 로드됨`);
    }
    /**
     * Gemini API 클라이언트 초기화
     * @private
     */
    _initializeClient() {
        if (!this.apiKey) {
            logger_1.defaultLogger.error('Gemini API 클라이언트 초기화 실패: API 키가 없습니다.');
            this.genAI = null;
            return;
        }
        try {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
            logger_1.defaultLogger.info(`Gemini API 클라이언트 초기화 성공 (키 인덱스: ${this.currentKeyIndex})`);
        }
        catch (error) {
            logger_1.defaultLogger.error(`Gemini API 클라이언트 초기화 실패: ${error.message}`);
            this.genAI = null;
        }
    }
    /**
     * 다음 API 키로 전환
     * @returns 성공 여부
     * @private
     */
    _rotateApiKey() {
        if (this.apiKeys.length <= 1) {
            logger_1.defaultLogger.warn('사용 가능한 대체 API 키가 없습니다.');
            return false;
        }
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        this.apiKey = this.apiKeys[this.currentKeyIndex];
        logger_1.defaultLogger.info(`API 키 변경 중. 새 인덱스: ${this.currentKeyIndex}`);
        this._initializeClient();
        return !!this.genAI;
    }
    /**
     * API 호출 실행 (재시도 및 키 순환 로직 포함)
     * @param apiCallFunction API 호출 함수
     * @param retryCount 재시도 횟수
     * @returns API 호출 결과
     * @private
     */
    async _executeApiCallWithRetries(apiCallFunction, retryCount = 0) {
        if (!this.genAI) {
            if (this.apiKey && this.currentKeyIndex !== -1) {
                logger_1.defaultLogger.warn('Gemini 클라이언트가 초기화되지 않았습니다. 재초기화를 시도합니다.');
                this._initializeClient();
                if (!this.genAI) {
                    throw new Error('Gemini API 클라이언트 재초기화 실패');
                }
            }
            else {
                throw new Error('Gemini API 키가 설정되지 않아 API를 호출할 수 없습니다.');
            }
        }
        try {
            return await apiCallFunction();
        }
        catch (error) {
            const statusCode = error?.status || error?.code;
            const message = error?.message || '';
            const isRateLimitError = (statusCode === RATE_LIMIT_HTTP_STATUS) ||
                (typeof message === 'string' && message.includes(RATE_LIMIT_MESSAGE_FRAGMENT));
            if (isRateLimitError && this.apiKeys.length > 1 && retryCount < this.apiKeys.length) {
                logger_1.defaultLogger.warn(`API 속도 제한 감지됨 (시도 ${retryCount + 1}/${this.apiKeys.length}). 에러: ${message}`);
                const rotated = this._rotateApiKey();
                if (rotated) {
                    logger_1.defaultLogger.info(`새 API 키(인덱스: ${this.currentKeyIndex})로 재시도 중...`);
                    return this._executeApiCallWithRetries(apiCallFunction, retryCount + 1);
                }
                else {
                    logger_1.defaultLogger.error('API 키 변경 실패. 더 이상 재시도할 수 없습니다.');
                    throw error;
                }
            }
            if (error instanceof SyntaxError) {
                logger_1.defaultLogger.error(`API 응답 JSON 파싱 오류: ${error.message}`);
                throw new Error(`Gemini API 응답 파싱 실패: ${error.message}`);
            }
            logger_1.defaultLogger.error(`Gemini API 요청 중 오류 발생: ${message}`);
            throw new Error(`Gemini API 요청 실패: ${message || '알 수 없는 오류'}`);
        }
    }
    /**
     * 원본 콘텐츠 로드
     * @param options 로드 옵션
     */
    async loadRawContent(batchSize) {
        try {
            // 초기화 확인
            if (!this.initialized) {
                await this.initialize();
            }
            if (!this.messageService) {
                throw new Error('RabbitMQManager 또는 MessageService가 초기화되지 않았습니다.');
            }
            const rawContents = await this.messageService.consumeMessages(MessageService_1.QueueNames.VISIT_RESULTS, batchSize);
            if (rawContents.length === 0) {
                logger_1.defaultLogger.warn('조건에 맞는 원본 콘텐츠가 없습니다.');
            }
            return rawContents;
        }
        catch (error) {
            logger_1.defaultLogger.error(`원본 콘텐츠 로드 중 오류: ${error.message}`);
            return [];
        }
    }
    async loadMongoRawContent(batchSize) {
        try {
            // 초기화 확인
            if (!this.initialized) {
                await this.initialize();
            }
            const pipeline = [
                { $unwind: '$suburl_list' },
                {
                    $match: {
                        'suburl_list.visited': true,
                        'suburl_list.success': true,
                        $and: [
                            { 'suburl_list.isRecruit': true },
                            { 'suburl_list.isRecruit': { $exists: true } }
                        ]
                    }
                },
                { $limit: batchSize },
                {
                    $project: {
                        _id: 0,
                        domain: 1,
                        favicon: 1, // favicon 필드 추가
                        url: '$suburl_list.url',
                        text: '$suburl_list.text',
                        title: '$suburl_list.title',
                        visitedAt: '$suburl_list.visitedAt'
                    }
                }
            ];
            const rawContents = await VisitResult_1.VisitResultModel.aggregate(pipeline);
            if (rawContents.length === 0) {
                logger_1.defaultLogger.warn('조건에 맞는 원본 콘텐츠가 없습니다.');
            }
            return rawContents;
        }
        catch (error) {
            logger_1.defaultLogger.error(`원본 콘텐츠 로드 중 오류: ${error.message}`);
            return [];
        }
    }
    /**
     * URL에서 도메인 추출
     * @param urlString URL 문자열
     * @private
     */
    _extractDomain(urlString) {
        try {
            const url = new url_1.URL(urlString);
            return url.hostname;
        }
        catch (error) {
            logger_1.defaultLogger.warn(`URL에서 도메인 추출 실패: ${urlString}`);
            return '';
        }
    }
    /**
     * 원본 콘텐츠 파싱
     * @param rawContent 원본 콘텐츠
     */
    async parseRawContent(rawContent) {
        try {
            // 초기화 확인
            if (!this.initialized) {
                await this.initialize();
            }
            // 추가 컨텍스트 정보 생성
            const contextHeader = this._createContextHeader(rawContent);
            const textToAnalyze = `${contextHeader}\n\n${rawContent.text}`;
            // 파싱 시작 시간
            const startTime = Date.now();
            // API 호출로 채용 정보 파싱
            return await this._parseRecruitment(textToAnalyze);
        }
        catch (error) {
            throw new ParseError("Failed to parse recruitment info", error);
        }
    }
    /**
     * DB 저장용 모델로 변환
     * @param botRecruitInfo 봇 파싱 결과
     * @param rawContent 원본 콘텐츠
     */
    makeDbRecruitInfo(botRecruitInfo, rawContent) {
        const now = new Date();
        return {
            ...botRecruitInfo,
            is_parse_success: true,
            ...rawContent,
            created_at: now,
            updated_at: now,
            is_public: true, // 채용 정보인 경우에만 공개
        };
    }
    /**
     * 컨텍스트 헤더 생성
     * @param rawContent 원본 콘텐츠
     * @private
     */
    _createContextHeader(rawContent) {
        const parts = [];
        if (rawContent.title) {
            parts.push(`제목: ${rawContent.title}`);
        }
        if (rawContent.url) {
            parts.push(`URL: ${rawContent.url}`);
        }
        if (rawContent.domain) {
            parts.push(`도메인: ${rawContent.domain}`);
        }
        return parts.join('\n');
    }
    /**
     * 채용 정보 스키마 정의
     * @private
     */
    _getRecruitmentSchema() {
        return {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                is_recruit_info: {
                    type: generative_ai_1.SchemaType.BOOLEAN,
                    description: "분석된 텍스트가 채용공고인지 여부 (true=채용공고, false=채용공고 아님)",
                },
                is_it_recruit_info: {
                    type: generative_ai_1.SchemaType.BOOLEAN,
                    description: "분석된 텍스트가 IT 채용공고인지 여부 (true=IT채용공고, false=IT채용공고 아님)",
                },
                company_name: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "회사명",
                    nullable: true
                },
                department: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "채용하는 부서 또는 팀 이름",
                    nullable: true
                },
                region_text: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "근무 지역 또는 회사 위치",
                    nullable: true
                },
                region_id: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "근무 지역 또는 회사 위치의 대한민국 법정동 코드(예 서울시 강남구=1168000000 )",
                    nullable: true
                },
                require_experience: {
                    type: generative_ai_1.SchemaType.STRING,
                    enum: ['경력무관', '신입', '경력'],
                    format: "enum",
                    description: "요구되는 경력 수준 (경력무관, 신입, 경력)",
                    nullable: true
                },
                job_description: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "주요 업무 내용 및 직무에 대한 상세 설명",
                    nullable: true
                },
                job_type: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "고용 형태 (정규직, 계약직, 인턴, 아르바이트, 프리랜서, 파견직)",
                    nullable: true
                },
                apply_start_date: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "채용 공고 게시 시작일 또는 지원 접수 시작일 (YYYY-MM-DD 형식)",
                    format: "date-time",
                    nullable: true
                },
                apply_end_date: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "채용 공고 마감일 또는 지원 접수 마감일 (YYYY-MM-DD 형식, '상시채용', '채용시 마감' 등이라면 null)",
                    format: "date-time",
                    nullable: true
                },
                requirements: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "지원하기 위한 필수 자격 요건",
                    nullable: true
                },
                preferred_qualifications: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "필수는 아니지만 우대하는 자격 요건이나 기술 스택",
                    nullable: true
                },
                ideal_candidate: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "회사가 원하는 인재상",
                    nullable: true
                }
            },
            required: ["is_recruit_info", "is_it_recruit_info"]
        };
    }
    /**
     * 채용 정보 프롬프트 생성
     * @param content 분석할 텍스트
     * @private
     */
    _getRecruitmentPrompt(content) {
        return `
당신은 전문적인 채용 정보 분석가입니다. 다음 텍스트가 채용 공고인지 분석하세요.

지시사항:
1. 텍스트가 채용 공고인지 여부를 판단하세요.(회사 소개 글은 채용공고가 아님을 유의해서 판단하세요)
2. 채용 공고가 맞다면:
   - "is_recruit_info" 필드를 true로 설정하세요.
   - 다음 정보를 추출하여 해당 필드에 입력하세요. 정보가 없다면 null이나 빈 문자열로 설정하세요.
     - is_it_recruit_info: it 직군의 채용정보 이라면 true , 아니라면 false 로 설정하세요 (채용공고인 동시에 IT직군이여야합니다.)
     - company_name: 채용하는 회사명
     - department: 채용하는 부서 또는 팀
     - region_text: 근무 지역 또는 회사 위치
     - region_id: region_text의 값을 대한민국 법정동 코드 (예)서울시 강남구일 경우 1168000000)로 정규화해서 넣어줘.
     - require_experience: 요구되는 경력 수준 ("경력무관", "신입", "경력"). 가능하면 이 세 가지 카테고리로 매핑해주세요.
     - job_description: 주요 업무 내용이나 직무기술서에 대한 내용을 기술하세요.
     - job_type: 고용 형태. 표준 용어를 사용하세요 (정규직, 계약직, 인턴, 아르바이트, 프리랜서, 파견직).만약 여러가지라면 /로 구분해서 작성해주세요(예 정규직/피견직)
     - apply_start_date: 지원 시작일 또는 게시일 (가능한 YYYY-MM-DD 형식)
     - apply_end_date: 지원 마감일 (가능한 YYYY-MM-DD 형식, 또는 "상시채용", "채용시 마감" 등)
     - requirements: 필수 자격 요건
     - preferred_qualifications: 우대 사항
     - ideal_candidate: 회사가 찾는 인재상
3. 채용 공고가 아니라면:
   - "is_recruit_info" 필드를 false로 설정하세요.
   - 나머지 필드는 null로 설정하세요.
4. 결과는 한국어로 작성하세요.

다음 텍스트를 분석하세요:
---
${content}
---

지정된 스키마 속성에 따라 JSON 형식으로 결과를 출력하세요.
`;
    }
    /**
     * Gemini API를 사용하여 채용 정보 파싱
     * @param content 분석할 텍스트
     * @private
     */
    async _parseRecruitment(content) {
        // 초기화 확인
        if (!this.genAI) {
            throw new Error('Gemini API 클라이언트가 초기화되지 않았습니다.');
        }
        const schema = this._getRecruitmentSchema();
        const promptText = this._getRecruitmentPrompt(content);
        const apiCall = async () => {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    responseMimeType: JSON_MIME_TYPE,
                    responseSchema: schema,
                },
            });
            logger_1.defaultLogger.debug('Gemini API 요청 시작...');
            const genAIResult = await model.generateContent(promptText);
            const responseText = genAIResult.response?.text();
            if (typeof responseText !== 'string') {
                logger_1.defaultLogger.error('Gemini API에서 텍스트 응답을 받지 못했습니다.');
                throw new Error('Gemini API 응답에서 텍스트를 추출할 수 없습니다.');
            }
            try {
                logger_1.defaultLogger.debug(responseText);
                const parsedResponse = JSON.parse(responseText);
                if (typeof parsedResponse.is_recruit_info === 'boolean') {
                    return parsedResponse;
                }
                throw new Error('API 응답의 구조가 예상과 다릅니다 (success 필드 누락).');
            }
            catch (parseError) {
                logger_1.defaultLogger.error(`Gemini API 응답 JSON 파싱 실패: ${parseError.message}`);
                throw new Error(`Gemini API가 유효한 JSON을 반환하지 않았습니다.`);
            }
        };
        return this._executeApiCallWithRetries(apiCall);
    }
    /**
     * 현재 API 키 상태 조회
     */
    getKeyStatus() {
        return {
            totalKeys: this.apiKeys.length,
            currentKeyIndex: this.currentKeyIndex,
            // 보안을 위해 API 키 마스킹 (마지막 4자리만 표시)
            currentApiKey: this.apiKey ? `***${this.apiKey.slice(-4)}` : 'None',
            isClientInitialized: !!this.genAI,
            model: this.modelName,
        };
    }
    /**
     * VisitResult의 domain document에서, suburl_list에서 맞는 url을 찾아서 isRecruit를
     * 업데이트합니다.
     * @param rawContent 원본 콘텐츠
     * @param parsedContent 파싱된 채용 정보
     * @returns 업데이트 성공 여부
     */
    async updateRecruitStatus(rawContent, parsedContent) {
        try {
            if (parsedContent.is_recruit_info === true) {
                await this.urlManager.setURLStatus(rawContent.url, "hasRecruitInfo" /* URLSTAUS.HAS_RECRUITINFO */);
            }
            else {
                await this.urlManager.setURLStatus(rawContent.url, "noRecruitInfo" /* URLSTAUS.NO_RECRUITINFO */);
            }
            return true;
        }
        catch (error) {
            logger_1.defaultLogger.error(`URL의 isRecruit 상태 업데이트 중 오류: ${error.message}`);
            return false;
        }
    }
    /**
     * Parser 몽고 DB와 연동해서 시작
     * 원본 콘텐츠를 로드하고 파싱한 후 결과를 저장합니다.
     */
    async run() {
        try {
            // 초기화 확인
            if (!this.initialized) {
                await this.initialize();
            }
            logger_1.defaultLogger.info(`${this.getName()} 파서 실행 시작`);
            // 배치 크기 설정
            const batchSize = 100000;
            // 원본 콘텐츠 로드
            //loadRawContent
            const rawContents = await this.loadMongoRawContent(batchSize);
            if (rawContents.length === 0) {
                logger_1.defaultLogger.warn('처리할 원본 콘텐츠가 없습니다.');
                return () => { };
            }
            logger_1.defaultLogger.info(`원본 콘텐츠 ${rawContents.length}개 로드 완료`);
            // 각 콘텐츠에 대해 파싱 및 저장 수행
            let successCount = 0;
            let failureCount = 0;
            for (let i = 0; i < rawContents.length; i++) {
                const rawContent = rawContents[i];
                try {
                    logger_1.defaultLogger.info(`[${i + 1}/${rawContents.length}] 파싱 시작: ${rawContent.url.substring(0, 50)}...`);
                    // 파싱 수행
                    const parsedContent = await this.parseRawContent(rawContent);
                    if (parsedContent.is_recruit_info === true && parsedContent.job_description) {
                        // 파싱 결과 저장
                        const dbRecruitInfo = this.makeDbRecruitInfo(parsedContent, rawContent);
                        if (dbRecruitInfo.region_id) {
                            const region_id = await this.recruitInfoRepository.getRegionIdByCode(dbRecruitInfo.region_id);
                            if (region_id) {
                                dbRecruitInfo.region_id = region_id.toString();
                            }
                        }
                        if (this.cacheRecruitInfoRepository) {
                            logger_1.defaultLogger.debug(`캐쉬 DB 응용`);
                            const createCacheResult = await this.cacheRecruitInfoRepository?.createRecruitInfo(dbRecruitInfo);
                            logger_1.defaultLogger.debug(`캐쉬 DB 저장 성공 ${createCacheResult.url}`);
                        }
                        const createResult = await this.recruitInfoRepository.createRecruitInfo(dbRecruitInfo);
                        logger_1.defaultLogger.debug(`파싱 성공 ${createResult.requirements}`);
                        logger_1.defaultLogger.debug(`DB 저장 성공 ${createResult.url}`);
                        logger_1.defaultLogger.info(`[${i + 1}/${rawContents.length}] 파싱 및 저장 성공: ${rawContent.url.substring(0, 50)}...`);
                        successCount++;
                    }
                    // isRecruit 상태 업데이트
                    const updated = await this.updateRecruitStatus(rawContent, parsedContent);
                    if (updated) {
                        logger_1.defaultLogger.info(`[${i + 1}/${rawContents.length}] isRecruit 상태 업데이트 성공: ${rawContent.url.substring(0, 50)}...`);
                    }
                }
                catch (error) {
                    failureCount++;
                    const prefix = `[${i + 1}/${rawContents.length}]`;
                    if (error instanceof ParseError) {
                        logger_1.defaultLogger.error(`${prefix} ParserError 발생: ${error.message}`);
                    }
                    else {
                        logger_1.defaultLogger.error(`${prefix} 일반 오류 발생: ${error.message}`);
                    }
                }
            }
            logger_1.defaultLogger.info(`파싱 처리 완료 - 성공: ${successCount}, 실패: ${failureCount}`);
            return () => { };
        }
        catch (error) {
            logger_1.defaultLogger.error(`파서 실행 중 오류 발생: ${error.message}`);
            return () => { };
        }
    }
}
exports.GeminiParser = GeminiParser;
//# sourceMappingURL=GeminiParser.js.map