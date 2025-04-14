import {
  GoogleGenerativeAI,
  Schema,
  SchemaType,
  // Import relevant types for model, response, etc. Check SDK documentation for specifics.
  // These might vary slightly based on the exact version of @google/generative-ai
  GenerativeModel,
  GenerateContentResult, // Often needed for prompt construction if not just using strings
  // Potentially specific error types if the SDK exports them
} from '@google/generative-ai';
import { defaultLogger as logger } from '../utils/logger'; // Assuming logger is correctly
import { IGeminiResponse ,IRecruitInfo} from '../models/recruitinfo-model';



// Interface for constructor options
interface GeminiServiceOptions {
  apiKey?: string;
  model?: string;
  keyIndex?: number;
}



// Interface for the key status object
interface KeyStatusInfo {
    totalKeys: number;
    currentKeyIndex: number;
    currentApiKey: string; // Masked key
    isClientInitialized: boolean;
    model: string;
}


// --- Constants ---
const DEFAULT_MODEL_NAME = 'gemini-1.5-flash-latest';
const RATE_LIMIT_HTTP_STATUS = 429;
// Check Google's specific error codes/messages if available in SDK errors
const RATE_LIMIT_MESSAGE_FRAGMENT = 'Resource has been exhausted';
const JSON_MIME_TYPE = 'application/json';

/**
 * Gemini API 서비스 (TypeScript Version)
 */
class GeminiService {
  private apiKeys: string[] = [];
  private currentKeyIndex: number = -1; // Initialize as -1, set properly in constructor
  private apiKey: string | null = null;
  private readonly modelName: string;
  private genAI: GoogleGenerativeAI | null = null;

  /**
   * GeminiService 인스턴스 생성
   * @param options - 옵션
   * @param externalLogger - 외부 로거 인스턴스 (선택적)
   */
  constructor(options: GeminiServiceOptions = {},) {

    this._loadApiKeys(options.apiKey);

    // Validate and set the starting key index
    const initialKeyIndex = options.keyIndex ?? 0;
    if (this.apiKeys.length > 0) {
        if (typeof initialKeyIndex !== 'number' || initialKeyIndex < 0 || initialKeyIndex >= this.apiKeys.length) {
            this.currentKeyIndex = 0; // Default to 0 if keys exist but index is invalid
            if (options.keyIndex !== undefined) {
                logger.warn(`제공된 keyIndex (${options.keyIndex})가 유효하지 않거나 범위를 벗어났습니다. 인덱스 0으로 시작합니다.`);
            }
        } else {
            this.currentKeyIndex = initialKeyIndex;
        }
        this.apiKey = this.apiKeys[this.currentKeyIndex];
    } else {
        // No keys loaded
        this.currentKeyIndex = -1;
        this.apiKey = null;
    }

    this.modelName = options.model || DEFAULT_MODEL_NAME;

    if (this.apiKeys.length > 0) {
      logger.info(`Gemini API 키 ${this.apiKeys.length}개 로드됨. 시작 인덱스: ${this.currentKeyIndex}, 모델: ${this.modelName}`);
      this.initializeClient(); // Attempt initial client setup
    } else {
      logger.warn('설정된 Gemini API 키가 없습니다. API 호출이 실패할 수 있습니다.');
      this.genAI = null;
    }
  }

  /**
   * Loads API keys from options and environment variables with defined precedence.
   * @param optionsApiKey - API key passed via constructor options.
   * @private
   */
  private _loadApiKeys(optionsApiKey?: string): void {
    const keySet = new Set<string>();

    // 1. Highest priority: API key from options
    if (optionsApiKey) {
      keySet.add(optionsApiKey.trim());
    }

    // 2. Next priority: Comma-separated keys from environment variable
    const envKeys = process.env.GEMINI_API_KEYS;
    if (envKeys) {
      envKeys.split(',')
        .map(key => key.trim())
        .filter(key => !!key) // Ensure no empty strings
        .forEach(key => keySet.add(key));
    }

    // 3. Lowest priority: Single key from environment variable
    const singleEnvKey = process.env.GEMINI_API_KEY;
    if (singleEnvKey) {
      keySet.add(singleEnvKey.trim());
    }

    this.apiKeys = Array.from(keySet);
  }


  /**
   * Gemini API 클라이언트 초기화
   * @private
   */
  private initializeClient(): void {
    if (!this.apiKey) {
      logger.error('Gemini API 클라이언트 초기화 시도 실패: API 키가 없습니다.');
      this.genAI = null;
      return;
    }
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      logger.info(`Gemini API 클라이언트 초기화 성공 (키 인덱스: ${this.currentKeyIndex})`);
    } catch (error: any) {
      logger.eventError(`Gemini API 클라이언트 초기화 실패 (키 인덱스: ${this.currentKeyIndex}): ${error?.message}`, { error });
      this.genAI = null;
    }
  }

  /**
   * 다음 API 키로 전환하고 클라이언트를 다시 초기화합니다.
   * @returns {boolean} 키 전환 및 클라이언트 재초기화 성공 여부
   * @private
   */
  private rotateApiKey(): boolean {
    if (this.apiKeys.length <= 1) {
      logger.warn('사용 가능한 대체 API 키가 없습니다. 키를 변경할 수 없습니다.');
      return false;
    }

    // 다음 키 인덱스로 이동 (순환)
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.apiKey = this.apiKeys[this.currentKeyIndex];

    logger.info(`API 키 변경 시도 중. 새 인덱스: ${this.currentKeyIndex}`);
    this.initializeClient(); // Attempt to initialize with the new key

    // Return true if initialization was successful (genAI is not null)
    return !!this.genAI;
  }

  /**
   * API 호출을 실행하고 재시도 로직 (키 순환 포함)을 처리하는 내부 헬퍼 메소드.
   * @param apiCallFunction - 실행할 실제 API 호출 로직 (async 함수).
   * @param retryCount - 현재 재시도 횟수 (내부용).
   * @returns API 호출 결과 Promise.
   * @private
   */
  private async _executeApiCallWithRetries<T>(
    apiCallFunction: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    if (!this.genAI) {
        // Attempt re-initialization if a key exists but client is null
        if (this.apiKey && this.currentKeyIndex !== -1) {
            logger.warn('Gemini 클라이언트가 초기화되지 않았습니다. 재초기화를 시도합니다.');
            this.initializeClient();
            if (!this.genAI) {
                // Throw error if re-initialization also fails
                throw new Error('Gemini API 클라이언트 재초기화 실패. API 호출을 진행할 수 없습니다.');
            }
        } else {
            // No key available, cannot proceed
            throw new Error('Gemini API 키가 설정되지 않아 API를 호출할 수 없습니다.');
        }
    }


    try {
      return await apiCallFunction();
    } catch (error: any) { // Using 'any' for broad error property access, refine if SDK provides specific types
      // Check for rate limit errors
      // Note: Accessing 'status' or 'code' might depend on the error structure from the SDK
      const statusCode = error?.status || error?.code; // Try common properties
      const message = error?.message || '';

      const isRateLimitError =
        (statusCode === RATE_LIMIT_HTTP_STATUS) ||
        (typeof message === 'string' && message.includes(RATE_LIMIT_MESSAGE_FRAGMENT));
        // Add more specific Google error code checks if available, e.g., error.code === 'RESOURCE_EXHAUSTED'

      // Retry condition
      if (isRateLimitError && this.apiKeys.length > 1 && retryCount < this.apiKeys.length) {
        logger.warn(`API 속도 제한 또는 리소스 소진 감지됨 (시도 ${retryCount + 1}/${this.apiKeys.length}). 에러: ${message}`);

        const rotated = this.rotateApiKey(); // Attempt to rotate key

        if (rotated) {
          logger.info(`새 API 키(인덱스: ${this.currentKeyIndex})로 재시도 중...`);
          // Recursively retry with the new key/client
          return this._executeApiCallWithRetries(apiCallFunction, retryCount + 1);
        } else {
          logger.error('API 키 변경 실패 또는 새 클라이언트 초기화 실패. 더 이상 재시도할 수 없습니다.');
           // Throw the original error if rotation/re-initialization failed
           throw error;
        }
      }

      // Handle JSON parsing errors specifically (if they occur after API call but before return)
      // This is typically handled within the apiCallFunction itself for parseRecruitment
      if (error instanceof SyntaxError) {
          logger.eventError(`API 응답 JSON 파싱 오류 발생: ${error.message}`, { error });
          throw new Error(`Gemini API 응답 파싱 실패: ${error.message}`);
      }

      // For other errors or if retries exhausted/not possible
      logger.eventError(`Gemini API 요청 중 처리되지 않은 오류 발생: ${message}`, { error, retryCount });
      // Re-throw the original error or wrap it
      throw new Error(`Gemini API 요청 실패: ${message || '알 수 없는 오류'}`);
    }
  }

  /**
   * 콘텐츠 생성 메서드 (키 순환 로직 포함)
   * @param prompt - 프롬프트
   * @param content - 추가 컨텍스트 (선택적)
   * @returns 생성된 콘텐츠 Promise
   */
  public async generateContent(prompt: string, content: string = ''): Promise<string> {
    const fullPrompt: string = content ? `${prompt}\n\n${content}` : prompt;

    const apiCall = async (): Promise<string> => {
       // Re-check genAI inside the closure, as it might have changed due to rotation
       if (!this.genAI) throw new Error("Gemini 클라이언트가 유효하지 않습니다 (generateContent 내부).");

      const model: GenerativeModel = this.genAI.getGenerativeModel({ model: this.modelName });
      // Use string directly or construct Part array if needed by the model/API version
      // const promptParts: Part[] = [{ text: fullPrompt }];
      const result: GenerateContentResult= await model.generateContent(fullPrompt); // or model.generateContent({contents: [{role: "user", parts: promptParts}]}) depending on API

      // Accessing text() might differ slightly based on SDK version/response structure
      // Ensure result.response exists and has the text method/property
      if (result?.response && typeof result.response.text === 'function') {
          return result.response.text();
      } else {
          logger.eventError('Gemini API 응답 구조가 예상과 다릅니다.', { response: result?.response });
          throw new Error('Gemini API에서 유효한 텍스트 응답을 받지 못했습니다.');
      }
    };

    return this._executeApiCallWithRetries(apiCall);
  }

  /**
   * 채용공고 파싱을 위한 스키마 정의
   * @returns 채용공고 정보를 위한 스키마 객체
   * @private
   */
  private getRecruitmentSchema(): Schema {
    // Using 'as Schema' for type assertion, assuming the structure matches SDK's Schema definition
    return {
      type: SchemaType.OBJECT,
      properties: {
        success: {
          type: SchemaType.BOOLEAN,
          description: "분석된 텍스트가 채용공고인지 여부 (true=채용공고, false=채용공고 아님)",
        },
        reason: {
          type: SchemaType.STRING,
          description: "채용공고가 아닌 경우(success=false), 그 이유",
          nullable: true // Mark as nullable if it might be omitted when success=true
        },
        company_name: { type: SchemaType.STRING, description: "회사명", nullable: true },
        department: { type: SchemaType.STRING, description: "채용하는 부서 또는 팀 이름", nullable: true },
        location: { type: SchemaType.STRING, description: "근무 지역 또는 회사 위치", nullable: true },
        job_experience: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["경력무관", "신입", "경력"],
          description: "요구되는 경력 수준 (경력무관, 신입, 경력)",
          nullable: true
        },
        job_description: { type: SchemaType.STRING, description: "주요 업무 내용 및 직무에 대한 상세 설명", nullable: true },
        job_type: { type: SchemaType.STRING, description: "고용 형태 (예: 정규직, 계약직, 인턴)", nullable: true },
        apply_start_date:
        {
          type: SchemaType.STRING,
          description: "채용 공고 게시 시작일 또는 지원 접수 시작일 (YYYY-MM-DD 형식 권장)",
          nullable: true,
          format : 'date-time'
        },
        apply_end_date: {
          type: SchemaType.STRING,
          description: "채용 공고 마감일 또는 지원 접수 마감일 (YYYY-MM-DD 형식 권장, '상시채용', '채용시 마감' 등 포함 가능)",
          nullable: true,
          format :'date-time'
        },
        requirements:
        {
          type: SchemaType.STRING,
          description: "지원하기 위한 필수 자격 요건",
          nullable: true
        },
        preferred_qualifications: {
          type: SchemaType.STRING,
          description: "필수는 아니지만 우대하는 자격 요건이나 기술 스택",
          nullable: true
        },
      },
      required: ["success"] // Only success is strictly required by the schema logic itself
    } as Schema; // Use type assertion if the structure matches the SDK's Schema interface
  }

  /**
   * 채용공고 분석을 위한 프롬프트 생성
   * @param textContent - 분석할 텍스트 내용
   * @returns 프롬프트 텍스트
   * @private
   */
  private getRecruitmentPrompt(textContent: string): string {
    // Prompt remains the same as JS version
    return `
You are an expert recruitment analyst. Analyze the following text to determine if it is a job posting.

Instructions:
1. Determine if the text describes a job opening.
2. If it IS a job posting:
   - Set the "success" field to true.
   - Extract the following information and populate the corresponding fields. If information for a field is not present, set its value to null or an empty string.
     - company_name: The name of the company hiring.
     - department: The specific department or team hiring.
     - location: The work location or region.
     - job_experience: The required experience level ("경력무관", "신입", "경력"). Map variations to these categories if possible.
     - job_description: A summary of the main responsibilities and tasks.
     - job_type: The type of employment (e.g., Full-time, Contract, Internship). Use standard Korean terms if appropriate (정규직, 계약직, 인턴).
     - apply_start_date: The start date for applications or posting date (preferably YYYY-MM-DD).
     - apply_end_date: The application deadline (preferably YYYY-MM-DD, or terms like if "상시채용", "채용시 마감" make null).
     - requirements: Essential qualifications needed for the role.
     - preferred_qualifications: Qualifications that are desired but not mandatory.
3. If it IS NOT a job posting:
   - Set the "success" field to false.
   - Provide a brief explanation in the "reason" field why it's not a job posting (e.g., "뉴스 기사", "회사 소개", "교육 과정 안내").
   - Set all other fields to null.
4. Use Korean at the result

Analyze the following text:
---
${textContent}
---

Output the result strictly in JSON format according to the specified schema properties. Ensure the output is a single, valid JSON object.
`;
  }

  /**
   * 채용공고 분석 메서드 (스키마 사용 및 키 순환 로직 포함)
   * @param content - 분석할 텍스트 내용
   * @returns 분석 결과 객체 Promise (RecruitmentInfo 준수)
   */
  public async parseRecruitment(content: string): Promise<IGeminiResponse> {
    const schema = this.getRecruitmentSchema();
    const promptText = this.getRecruitmentPrompt(content);

    const apiCall = async (): Promise<IGeminiResponse> => {
       // Re-check genAI inside the closure
       if (!this.genAI) throw new Error("Gemini 클라이언트가 유효하지 않습니다 (parseRecruitment 내부).");

      const model: GenerativeModel = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: JSON_MIME_TYPE,
          responseSchema: schema,
        },
      });

     logger.debug('Gemini 채용공고 분석 요청 시작...');
      const genAIResult: GenerateContentResult = await model.generateContent(promptText);
      // logger.debug('Gemini API 사용량 메타데이터:', genAIResult.response?.usageMetadata); // Optional logging

      const responseText = genAIResult.response?.text(); // Safely access text()

      if (typeof responseText !== 'string') {
          logger.eventError('Gemini API에서 텍스트 응답을 받지 못했습니다.', { response: genAIResult.response });
          throw new Error('Gemini API 응답에서 텍스트를 추출할 수 없습니다.');
      }

      logger.debug(`Gemini API 원본 응답 텍스트 ${ responseText }`);

       try {
         // Parse and validate the JSON response
         const parsedResponse = JSON.parse(responseText) as IGeminiResponse; // Parse as unknown first

         // Type Guard/Validation
         if (typeof (parsedResponse as IGeminiResponse).success === 'boolean') {
             // It looks like a valid RecruitmentInfo structure, cast it
             return parsedResponse as IGeminiResponse;
         }

         throw new Error('API 응답의 구조가 예상과 다릅니다 (필수 "success" 필드 누락 또는 타입 오류).');

       } catch (parseError: any) {
           logger.eventError(`Gemini API 응답 JSON 파싱 실패: ${parseError.message}`, { responseText });
            // Include the raw text in the error for debugging
            throw new Error(`Gemini가 유효한 JSON을 반환하지 않았습니다. 응답: ${responseText}`);
       }
    };

    return this._executeApiCallWithRetries(apiCall);
  }

  /**
   * 현재 API 키 상태 조회
   * @returns API 키 상태 정보 객체
   */
  public getKeyStatus(): KeyStatusInfo {
    return {
      totalKeys: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      // Mask API key for security - show only last 4 chars
      currentApiKey: this.apiKey ? `***${this.apiKey.slice(-4)}` : 'None',
      isClientInitialized: !!this.genAI,
      model: this.modelName,
    };
  }
}

export { GeminiService, GeminiServiceOptions,  KeyStatusInfo  };