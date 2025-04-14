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
var Anthropic = require('@anthropic-ai/sdk').Anthropic;
var logger = require('@utils/logger').defaultLogger;
/**
 * Claude API 서비스
 */
var ClaudeService = /** @class */ (function () {
    /**
     * ClaudeService 인스턴스 생성
     * @param {Object} options - 옵션
     * @param {string} options.apiKey - Claude API 키 (기본값은 환경변수)
     * @param {string} options.model - 사용할 모델 (기본값: claude-3-5-sonnet-20240620)
     * @param {number} options.maxTokens - 최대 토큰 수 (기본값: 4096)
     */
    function ClaudeService(options) {
        if (options === void 0) { options = {}; }
        // API 키 설정 (옵션 > 환경변수 순서로 우선순위)
        this.apiKey = options.apiKey || process.env.CLAUDE_API_KEY;
        // 모델 설정 (기본값: claude-3-5-sonnet-20240620)
        this.modelName = options.model || 'claude-3-7-sonnet-20250219';
        // 최대 토큰 설정
        this.maxTokens = options.maxTokens || 4096;
        // API 키 정보 로깅
        if (this.apiKey) {
            logger.info("Claude API \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 (\uBAA8\uB378: ".concat(this.modelName, ")"));
        }
        else {
            logger.warn('Claude API 키가 설정되지 않았습니다. 서비스를 사용할 수 없습니다.');
        }
        // API 키가 있는 경우에만 클라이언트 초기화
        if (this.apiKey) {
            this.initializeClient();
        }
    }
    /**
     * Claude API 클라이언트 초기화
     */
    ClaudeService.prototype.initializeClient = function () {
        try {
            this.anthropic = new Anthropic({
                apiKey: this.apiKey,
            });
            logger.info("Claude API \uD074\uB77C\uC774\uC5B8\uD2B8 \uCD08\uAE30\uD654 \uC131\uACF5 (\uBAA8\uB378: ".concat(this.modelName, ")"));
        }
        catch (error) {
            logger.error("Claude API \uD074\uB77C\uC774\uC5B8\uD2B8 \uCD08\uAE30\uD654 \uC2E4\uD328: ".concat(error.message));
            this.anthropic = null;
        }
    };
    /**
     * 콘텐츠 생성 메서드
     * @param {string} prompt - 프롬프트
     * @param {string} content - 추가 컨텍스트 (선택적)
     * @returns {Promise<string>} 생성된 콘텐츠
     */
    ClaudeService.prototype.generateContent = function (prompt_1) {
        return __awaiter(this, arguments, void 0, function (prompt, content) {
            var fullPrompt, message, error_1;
            if (content === void 0) { content = ''; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.anthropic) {
                            throw new Error('Claude API 키가 설정되지 않았습니다.');
                        }
                        fullPrompt = content ? "".concat(prompt, "\n\n").concat(content) : prompt;
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: this.modelName,
                                max_tokens: this.maxTokens,
                                messages: [
                                    { role: 'user', content: fullPrompt }
                                ],
                            })];
                    case 1:
                        message = _a.sent();
                        return [2 /*return*/, message.content[0].text];
                    case 2:
                        error_1 = _a.sent();
                        logger.error('Claude API 요청 오류:', error_1);
                        throw new Error("Claude API \uC694\uCCAD \uC2E4\uD328: ".concat(error_1.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 채용공고 분석을 위한 프롬프트 생성
     * @param {string} content - 분석할 텍스트 내용
     * @returns {string} 프롬프트 텍스트
     */
    ClaudeService.prototype.getRecruitmentPrompt = function (content) {
        return "\n\uB2F9\uC2E0\uC740 \uCC44\uC6A9\uACF5\uACE0 \uBD84\uC11D \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. \uB2E4\uC74C \uD14D\uC2A4\uD2B8\uB97C \uBD84\uC11D\uD558\uC5EC \uCC44\uC6A9\uACF5\uACE0\uC778\uC9C0 \uD310\uB2E8\uD558\uC138\uC694.\n\n\uB9CC\uC57D \uCC44\uC6A9\uACF5\uACE0\uB77C\uBA74, \uB2E4\uC74C \uC815\uBCF4\uB97C \uCD94\uCD9C\uD558\uC138\uC694:\n- company_name: \uD68C\uC0AC\uBA85\n- department: \uBD80\uC11C\n- experience: \uACBD\uB825 \uC694\uAD6C\uC0AC\uD56D\n- description: \uC9C1\uBB34 \uC124\uBA85\n- job_type: \uACE0\uC6A9 \uD615\uD0DC (\uC815\uADDC\uC9C1, \uACC4\uC57D\uC9C1 \uB4F1)\n- posted_period: \uAC8C\uC2DC \uAE30\uAC04\n- requirements: \uD544\uC218 \uC694\uAC74\n- preferred_qualifications: \uC6B0\uB300 \uC0AC\uD56D\n- ideal_candidate: \uC774\uC0C1\uC801\uC778 \uD6C4\uBCF4\uC790\n\n\uCC44\uC6A9\uACF5\uACE0\uAC00 \uB9DE\uC73C\uBA74 success\uB97C true\uB85C, \uC544\uB2C8\uBA74 false\uB85C \uC124\uC815\uD558\uACE0 \uC774\uC720\uB97C reason \uD544\uB4DC\uC5D0 \uC81C\uACF5\uD558\uC138\uC694.\n\n\uC751\uB2F5\uC740 \uB2E4\uC74C JSON \uD615\uC2DD\uC73C\uB85C\uB9CC \uC81C\uACF5\uD558\uC138\uC694:\n{\n  \"success\": boolean,\n  \"reason\": string,\n  \"company_name\": string,\n  \"department\": string,\n  \"experience\": string,\n  \"description\": string,\n  \"job_type\": string,\n  \"posted_period\": string,\n  \"requirements\": string,\n  \"preferred_qualifications\": string,\n  \"ideal_candidate\": string\n}\n\n\uD14D\uC2A4\uD2B8\uB294 \uB2E4\uC74C\uACFC \uAC19\uC2B5\uB2C8\uB2E4:\n\n".concat(content, "\n");
    };
    ClaudeService.prototype.parseRecruitment = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var promptText, message, responseText, parsedResponse, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.anthropic) {
                            throw new Error('Claude API 키가 설정되지 않았습니다.');
                        }
                        promptText = this.getRecruitmentPrompt(content);
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: this.modelName,
                                max_tokens: this.maxTokens,
                                messages: [
                                    { role: 'user', content: promptText }
                                ],
                                system: "응답은 항상 올바른 JSON 형식으로만 제공하세요. 추가 설명이나 마크다운 포맷팅을 사용하지 마세요."
                            })];
                    case 1:
                        message = _a.sent();
                        responseText = message.content[0].text;
                        logger.info('Claude API 응답 받음');
                        parsedResponse = JSON.parse(responseText);
                        return [2 /*return*/, parsedResponse];
                    case 2:
                        error_2 = _a.sent();
                        // JSON 파싱 오류 특별 처리
                        if (error_2 instanceof SyntaxError) {
                            logger.error('JSON 파싱 오류:', error_2);
                            throw new Error('Claude API 응답을 JSON으로 파싱할 수 없습니다');
                        }
                        // 일반 오류
                        logger.error('채용공고 분석 오류:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * API 키 상태 조회
     * @returns {Object} API 키 상태 정보
     */
    ClaudeService.prototype.getStatus = function () {
        return {
            hasValidKey: !!this.apiKey,
            model: this.modelName,
            maxTokens: this.maxTokens,
            clientInitialized: !!this.anthropic
        };
    };
    return ClaudeService;
}());
module.exports = {
    ClaudeService: ClaudeService
};
