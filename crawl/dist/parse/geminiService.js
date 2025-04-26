"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
var generative_ai_1 = require("@google/generative-ai");
var logger_1 = require("../utils/logger"); // Assuming logger is correctly
// --- Constants ---
var DEFAULT_MODEL_NAME = 'gemini-1.5-flash-latest';
var RATE_LIMIT_HTTP_STATUS = 429;
// Check Google's specific error codes/messages if available in SDK errors
var RATE_LIMIT_MESSAGE_FRAGMENT = 'Resource has been exhausted';
var JSON_MIME_TYPE = 'application/json';
/**
 * Gemini API 서비스 (TypeScript Version)
 */
var GeminiService = /** @class */ (function () {
    /**
     * GeminiService 인스턴스 생성
     * @param options - 옵션
     * @param externalLogger - 외부 로거 인스턴스 (선택적)
     */
    function GeminiService(options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.apiKeys = [];
        this.currentKeyIndex = -1; // Initialize as -1, set properly in constructor
        this.apiKey = null;
        this.genAI = null;
        this._loadApiKeys(options.apiKey);
        // Validate and set the starting key index
        var initialKeyIndex = (_a = options.keyIndex) !== null && _a !== void 0 ? _a : 0;
        if (this.apiKeys.length > 0) {
            if (typeof initialKeyIndex !== 'number' || initialKeyIndex < 0 || initialKeyIndex >= this.apiKeys.length) {
                this.currentKeyIndex = 0; // Default to 0 if keys exist but index is invalid
                if (options.keyIndex !== undefined) {
                    logger_1.defaultLogger.warn("\uC81C\uACF5\uB41C keyIndex (".concat(options.keyIndex, ")\uAC00 \uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uBC94\uC704\uB97C \uBC97\uC5B4\uB0AC\uC2B5\uB2C8\uB2E4. \uC778\uB371\uC2A4 0\uC73C\uB85C \uC2DC\uC791\uD569\uB2C8\uB2E4."));
                }
            }
            else {
                this.currentKeyIndex = initialKeyIndex;
            }
            this.apiKey = this.apiKeys[this.currentKeyIndex];
        }
        else {
            // No keys loaded
            this.currentKeyIndex = -1;
            this.apiKey = null;
        }
        this.modelName = options.model || DEFAULT_MODEL_NAME;
        if (this.apiKeys.length > 0) {
            logger_1.defaultLogger.info("Gemini API \uD0A4 ".concat(this.apiKeys.length, "\uAC1C \uB85C\uB4DC\uB428. \uC2DC\uC791 \uC778\uB371\uC2A4: ").concat(this.currentKeyIndex, ", \uBAA8\uB378: ").concat(this.modelName));
            this.initializeClient(); // Attempt initial client setup
        }
        else {
            logger_1.defaultLogger.warn('설정된 Gemini API 키가 없습니다. API 호출이 실패할 수 있습니다.');
            this.genAI = null;
        }
    }
    /**
     * Loads API keys from options and environment variables with defined precedence.
     * @param optionsApiKey - API key passed via constructor options.
     * @private
     */
    GeminiService.prototype._loadApiKeys = function (optionsApiKey) {
        var keySet = new Set();
        // 1. Highest priority: API key from options
        if (optionsApiKey) {
            keySet.add(optionsApiKey.trim());
        }
        // 2. Next priority: Comma-separated keys from environment variable
        var envKeys = process.env.GEMINI_API_KEYS;
        if (envKeys) {
            envKeys.split(',')
                .map(function (key) { return key.trim(); })
                .filter(function (key) { return !!key; }) // Ensure no empty strings
                .forEach(function (key) { return keySet.add(key); });
        }
        // 3. Lowest priority: Single key from environment variable
        var singleEnvKey = process.env.GEMINI_API_KEY;
        if (singleEnvKey) {
            keySet.add(singleEnvKey.trim());
        }
        this.apiKeys = Array.from(keySet);
    };
    /**
     * Gemini API 클라이언트 초기화
     * @private
     */
    GeminiService.prototype.initializeClient = function () {
        if (!this.apiKey) {
            logger_1.defaultLogger.error('Gemini API 클라이언트 초기화 시도 실패: API 키가 없습니다.');
            this.genAI = null;
            return;
        }
        try {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
            logger_1.defaultLogger.info("Gemini API \uD074\uB77C\uC774\uC5B8\uD2B8 \uCD08\uAE30\uD654 \uC131\uACF5 (\uD0A4 \uC778\uB371\uC2A4: ".concat(this.currentKeyIndex, ")"));
        }
        catch (error) {
            logger_1.defaultLogger.eventError("Gemini API \uD074\uB77C\uC774\uC5B8\uD2B8 \uCD08\uAE30\uD654 \uC2E4\uD328 (\uD0A4 \uC778\uB371\uC2A4: ".concat(this.currentKeyIndex, "): ").concat(error === null || error === void 0 ? void 0 : error.message), { error: error });
            this.genAI = null;
        }
    };
    /**
     * 다음 API 키로 전환하고 클라이언트를 다시 초기화합니다.
     * @returns {boolean} 키 전환 및 클라이언트 재초기화 성공 여부
     * @private
     */
    GeminiService.prototype.rotateApiKey = function () {
        if (this.apiKeys.length <= 1) {
            logger_1.defaultLogger.warn('사용 가능한 대체 API 키가 없습니다. 키를 변경할 수 없습니다.');
            return false;
        }
        // 다음 키 인덱스로 이동 (순환)
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        this.apiKey = this.apiKeys[this.currentKeyIndex];
        logger_1.defaultLogger.info("API \uD0A4 \uBCC0\uACBD \uC2DC\uB3C4 \uC911. \uC0C8 \uC778\uB371\uC2A4: ".concat(this.currentKeyIndex));
        this.initializeClient(); // Attempt to initialize with the new key
        // Return true if initialization was successful (genAI is not null)
        return !!this.genAI;
    };
    /**
     * API 호출을 실행하고 재시도 로직 (키 순환 포함)을 처리하는 내부 헬퍼 메소드.
     * @param apiCallFunction - 실행할 실제 API 호출 로직 (async 함수).
     * @param retryCount - 현재 재시도 횟수 (내부용).
     * @returns API 호출 결과 Promise.
     * @private
     */
    GeminiService.prototype._executeApiCallWithRetries = function (apiCallFunction_1) {
        return __awaiter(this, arguments, void 0, function (apiCallFunction, retryCount) {
            var error_1, statusCode, message, isRateLimitError, rotated;
            if (retryCount === void 0) { retryCount = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.genAI) {
                            // Attempt re-initialization if a key exists but client is null
                            if (this.apiKey && this.currentKeyIndex !== -1) {
                                logger_1.defaultLogger.warn('Gemini 클라이언트가 초기화되지 않았습니다. 재초기화를 시도합니다.');
                                this.initializeClient();
                                if (!this.genAI) {
                                    // Throw error if re-initialization also fails
                                    throw new Error('Gemini API 클라이언트 재초기화 실패. API 호출을 진행할 수 없습니다.');
                                }
                            }
                            else {
                                // No key available, cannot proceed
                                throw new Error('Gemini API 키가 설정되지 않아 API를 호출할 수 없습니다.');
                            }
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, apiCallFunction()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        statusCode = (error_1 === null || error_1 === void 0 ? void 0 : error_1.status) || (error_1 === null || error_1 === void 0 ? void 0 : error_1.code);
                        message = (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || '';
                        isRateLimitError = (statusCode === RATE_LIMIT_HTTP_STATUS) ||
                            (typeof message === 'string' && message.includes(RATE_LIMIT_MESSAGE_FRAGMENT));
                        // Add more specific Google error code checks if available, e.g., error.code === 'RESOURCE_EXHAUSTED'
                        // Retry condition
                        if (isRateLimitError && this.apiKeys.length > 1 && retryCount < this.apiKeys.length) {
                            logger_1.defaultLogger.warn("API \uC18D\uB3C4 \uC81C\uD55C \uB610\uB294 \uB9AC\uC18C\uC2A4 \uC18C\uC9C4 \uAC10\uC9C0\uB428 (\uC2DC\uB3C4 ".concat(retryCount + 1, "/").concat(this.apiKeys.length, "). \uC5D0\uB7EC: ").concat(message));
                            rotated = this.rotateApiKey();
                            if (rotated) {
                                logger_1.defaultLogger.info("\uC0C8 API \uD0A4(\uC778\uB371\uC2A4: ".concat(this.currentKeyIndex, ")\uB85C \uC7AC\uC2DC\uB3C4 \uC911..."));
                                // Recursively retry with the new key/client
                                return [2 /*return*/, this._executeApiCallWithRetries(apiCallFunction, retryCount + 1)];
                            }
                            else {
                                logger_1.defaultLogger.error('API 키 변경 실패 또는 새 클라이언트 초기화 실패. 더 이상 재시도할 수 없습니다.');
                                // Throw the original error if rotation/re-initialization failed
                                throw error_1;
                            }
                        }
                        // Handle JSON parsing errors specifically (if they occur after API call but before return)
                        // This is typically handled within the apiCallFunction itself for parseRecruitment
                        if (error_1 instanceof SyntaxError) {
                            logger_1.defaultLogger.eventError("API \uC751\uB2F5 JSON \uD30C\uC2F1 \uC624\uB958 \uBC1C\uC0DD: ".concat(error_1.message), { error: error_1 });
                            throw new Error("Gemini API \uC751\uB2F5 \uD30C\uC2F1 \uC2E4\uD328: ".concat(error_1.message));
                        }
                        // For other errors or if retries exhausted/not possible
                        logger_1.defaultLogger.eventError("Gemini API \uC694\uCCAD \uC911 \uCC98\uB9AC\uB418\uC9C0 \uC54A\uC740 \uC624\uB958 \uBC1C\uC0DD: ".concat(message), { error: error_1, retryCount: retryCount });
                        // Re-throw the original error or wrap it
                        throw new Error("Gemini API \uC694\uCCAD \uC2E4\uD328: ".concat(message || '알 수 없는 오류'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 콘텐츠 생성 메서드 (키 순환 로직 포함)
     * @param prompt - 프롬프트
     * @param content - 추가 컨텍스트 (선택적)
     * @returns 생성된 콘텐츠 Promise
     */
    GeminiService.prototype.generateContent = function (prompt_1) {
        return __awaiter(this, arguments, void 0, function (prompt, content) {
            var fullPrompt, apiCall;
            var _this = this;
            if (content === void 0) { content = ''; }
            return __generator(this, function (_a) {
                fullPrompt = content ? "".concat(prompt, "\n\n").concat(content) : prompt;
                apiCall = function () { return __awaiter(_this, void 0, void 0, function () {
                    var model, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                // Re-check genAI inside the closure, as it might have changed due to rotation
                                if (!this.genAI)
                                    throw new Error("Gemini 클라이언트가 유효하지 않습니다 (generateContent 내부).");
                                model = this.genAI.getGenerativeModel({ model: this.modelName });
                                return [4 /*yield*/, model.generateContent(fullPrompt)];
                            case 1:
                                result = _a.sent();
                                // Accessing text() might differ slightly based on SDK version/response structure
                                // Ensure result.response exists and has the text method/property
                                if ((result === null || result === void 0 ? void 0 : result.response) && typeof result.response.text === 'function') {
                                    return [2 /*return*/, result.response.text()];
                                }
                                else {
                                    logger_1.defaultLogger.eventError('Gemini API 응답 구조가 예상과 다릅니다.', { response: result === null || result === void 0 ? void 0 : result.response });
                                    throw new Error('Gemini API에서 유효한 텍스트 응답을 받지 못했습니다.');
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                return [2 /*return*/, this._executeApiCallWithRetries(apiCall)];
            });
        });
    };
    /**
     * 채용공고 파싱을 위한 스키마 정의
     * @returns 채용공고 정보를 위한 스키마 객체
     * @private
     */
    GeminiService.prototype.getRecruitmentSchema = function () {
        // Using 'as Schema' for type assertion, assuming the structure matches SDK's Schema definition
        return {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                success: {
                    type: generative_ai_1.SchemaType.BOOLEAN,
                    description: "분석된 텍스트가 채용공고인지 여부 (true=채용공고, false=채용공고 아님)",
                },
                reason: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "채용공고가 아닌 경우(success=false), 그 이유",
                    nullable: true // Mark as nullable if it might be omitted when success=true
                },
                company_name: { type: generative_ai_1.SchemaType.STRING, description: "회사명", nullable: true },
                department: { type: generative_ai_1.SchemaType.STRING, description: "채용하는 부서 또는 팀 이름", nullable: true },
                location: { type: generative_ai_1.SchemaType.STRING, description: "근무 지역 또는 회사 위치", nullable: true },
                job_experience: {
                    type: generative_ai_1.SchemaType.STRING,
                    format: "enum",
                    enum: ["경력무관", "신입", "경력"],
                    description: "요구되는 경력 수준 (경력무관, 신입, 경력)",
                    nullable: true
                },
                job_description: { type: generative_ai_1.SchemaType.STRING, description: "주요 업무 내용 및 직무에 대한 상세 설명", nullable: true },
                job_type: { type: generative_ai_1.SchemaType.STRING, description: "고용 형태 (예: 정규직, 계약직, 인턴)", nullable: true },
                apply_start_date: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "채용 공고 게시 시작일 또는 지원 접수 시작일 (YYYY-MM-DD 형식 권장)",
                    nullable: true,
                    format: 'date-time'
                },
                apply_end_date: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "채용 공고 마감일 또는 지원 접수 마감일 (YYYY-MM-DD 형식 권장, '상시채용', '채용시 마감' 등 포함 가능)",
                    nullable: true,
                    format: 'date-time'
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
            },
            required: ["success"] // Only success is strictly required by the schema logic itself
        }; // Use type assertion if the structure matches the SDK's Schema interface
    };
    /**
     * 채용공고 분석을 위한 프롬프트 생성
     * @param textContent - 분석할 텍스트 내용
     * @returns 프롬프트 텍스트
     * @private
     */
    GeminiService.prototype.getRecruitmentPrompt = function (textContent) {
        // Prompt remains the same as JS version
        return "\nYou are an expert recruitment analyst. Analyze the following text to determine if it is a job posting.\n\nInstructions:\n1. Determine if the text describes a job opening.\n2. If it IS a job posting:\n   - Set the \"success\" field to true.\n   - Extract the following information and populate the corresponding fields. If information for a field is not present, set its value to null or an empty string.\n     - company_name: The name of the company hiring.\n     - department: The specific department or team hiring.\n     - location: The work location or region.\n     - job_experience: The required experience level (\"\uACBD\uB825\uBB34\uAD00\", \"\uC2E0\uC785\", \"\uACBD\uB825\"). Map variations to these categories if possible.\n     - job_description: A summary of the main responsibilities and tasks.\n     - job_type: The type of employment (e.g., Full-time, Contract, Internship). Use standard Korean terms if appropriate (\uC815\uADDC\uC9C1, \uACC4\uC57D\uC9C1, \uC778\uD134).\n     - apply_start_date: The start date for applications or posting date (preferably YYYY-MM-DD).\n     - apply_end_date: The application deadline (preferably YYYY-MM-DD, or terms like if \"\uC0C1\uC2DC\uCC44\uC6A9\", \"\uCC44\uC6A9\uC2DC \uB9C8\uAC10\" make null).\n     - requirements: Essential qualifications needed for the role.\n     - preferred_qualifications: Qualifications that are desired but not mandatory.\n3. If it IS NOT a job posting:\n   - Set the \"success\" field to false.\n   - Provide a brief explanation in the \"reason\" field why it's not a job posting (e.g., \"\uB274\uC2A4 \uAE30\uC0AC\", \"\uD68C\uC0AC \uC18C\uAC1C\", \"\uAD50\uC721 \uACFC\uC815 \uC548\uB0B4\").\n   - Set all other fields to null.\n4. Use Korean at the result\n\nAnalyze the following text:\n---\n".concat(textContent, "\n---\n\nOutput the result strictly in JSON format according to the specified schema properties. Ensure the output is a single, valid JSON object.\n");
    };
    /**
     * 채용공고 분석 메서드 (스키마 사용 및 키 순환 로직 포함)
     * @param content - 분석할 텍스트 내용
     * @returns 분석 결과 객체 Promise (RecruitmentInfo 준수)
     */
    GeminiService.prototype.parseRecruitment = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, promptText, apiCall;
            var _this = this;
            return __generator(this, function (_a) {
                schema = this.getRecruitmentSchema();
                promptText = this.getRecruitmentPrompt(content);
                apiCall = function () { return __awaiter(_this, void 0, void 0, function () {
                    var model, genAIResult, responseText, parsedResponse;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                // Re-check genAI inside the closure
                                if (!this.genAI)
                                    throw new Error("Gemini 클라이언트가 유효하지 않습니다 (parseRecruitment 내부).");
                                model = this.genAI.getGenerativeModel({
                                    model: this.modelName,
                                    generationConfig: {
                                        responseMimeType: JSON_MIME_TYPE,
                                        responseSchema: schema,
                                    },
                                });
                                logger_1.defaultLogger.debug('Gemini 채용공고 분석 요청 시작...');
                                return [4 /*yield*/, model.generateContent(promptText)];
                            case 1:
                                genAIResult = _b.sent();
                                responseText = (_a = genAIResult.response) === null || _a === void 0 ? void 0 : _a.text();
                                if (typeof responseText !== 'string') {
                                    logger_1.defaultLogger.eventError('Gemini API에서 텍스트 응답을 받지 못했습니다.', { response: genAIResult.response });
                                    throw new Error('Gemini API 응답에서 텍스트를 추출할 수 없습니다.');
                                }
                                logger_1.defaultLogger.debug("Gemini API \uC6D0\uBCF8 \uC751\uB2F5 \uD14D\uC2A4\uD2B8 ".concat(responseText));
                                try {
                                    parsedResponse = JSON.parse(responseText);
                                    // Type Guard/Validation
                                    if (typeof parsedResponse.success === 'boolean') {
                                        // It looks like a valid RecruitmentInfo structure, cast it
                                        return [2 /*return*/, parsedResponse];
                                    }
                                    throw new Error('API 응답의 구조가 예상과 다릅니다 (필수 "success" 필드 누락 또는 타입 오류).');
                                }
                                catch (parseError) {
                                    logger_1.defaultLogger.eventError("Gemini API \uC751\uB2F5 JSON \uD30C\uC2F1 \uC2E4\uD328: ".concat(parseError.message), { responseText: responseText });
                                    // Include the raw text in the error for debugging
                                    throw new Error("Gemini\uAC00 \uC720\uD6A8\uD55C JSON\uC744 \uBC18\uD658\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC751\uB2F5: ".concat(responseText));
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                return [2 /*return*/, this._executeApiCallWithRetries(apiCall)];
            });
        });
    };
    /**
     * 현재 API 키 상태 조회
     * @returns API 키 상태 정보 객체
     */
    GeminiService.prototype.getKeyStatus = function () {
        return {
            totalKeys: this.apiKeys.length,
            currentKeyIndex: this.currentKeyIndex,
            // Mask API key for security - show only last 4 chars
            currentApiKey: this.apiKey ? "***".concat(this.apiKey.slice(-4)) : 'None',
            isClientInitialized: !!this.genAI,
            model: this.modelName,
        };
    };
    return GeminiService;
}());
exports.GeminiService = GeminiService;
