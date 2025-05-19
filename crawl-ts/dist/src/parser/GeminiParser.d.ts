import { IParser } from './IParser';
import { GeminiResponseRecruitInfoDTO, CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';
import { IRawContent } from '../models/RawContentModel';
export declare class ParseError extends Error {
    cause: unknown;
    constructor(message: string, cause?: unknown);
}
/**
 * GeminiParser - Google의 Gemini API를 사용하는 파서
 */
export declare class GeminiParser implements IParser {
    private apiKeys;
    private readonly modelName;
    private apiKeyGenerator;
    constructor();
    private cycleKeyGenerator;
    loadMongoRawContent(batchSize: number): Promise<IRawContent[]>;
    ParseRegionText(rawContent: string, retryNumber: number, retryDelay?: number): Promise<string[] | undefined>;
    parseDateOrNull(dateStr: any): Date | undefined;
    /**x
    * 원본 콘텐츠 파싱
    * @param rawContent 원본 콘텐츠
    */
    parseRawContentRetry(rawContent: IRawContent, retryNumber: number, retryDelay?: number): Promise<GeminiResponseRecruitInfoDTO | undefined>;
    /**
     * DB 저장용 모델로 변환
     * @param botRecruitInfo 봇 파싱 결과
     * @param rawContent 원본 콘텐츠
     */
    makeDbRecruitInfo(botRecruitInfo: GeminiResponseRecruitInfoDTO, rawContent: IRawContent, favicon: string | null): CreateDBRecruitInfoDTO;
}
