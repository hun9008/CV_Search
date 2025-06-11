import 'dotenv/config'
import {GoogleGenerativeAI,} from '@google/generative-ai';
import { GeminiResponseRecruitInfoDTO, CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';
import { geminiRecruitInfoPrompt, geminiRegionTextPrompt, geminiRecruitInfoValidationPrompt ,geminiJobEndDatePrompt} from './prompt';
import { geminiRecruitInfoSechma, geminiRegionCdScema ,geminiRecruitInfoValidationSechma ,geminiJobEndDateSchema} from './Schema';
import { IRawContent } from '../models/RawContentModel';
import { VisitResultModel } from '../models/VisitResult';
import { defaultLogger as logger } from '../utils/logger';
import { cd2RegionId, OTHER_REGION_ID, regionText2RegionIds } from '../trasnform/Transform';



const JSON_MIME_TYPE = 'application/json';




export class ParseError extends Error {
  public cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ParseError';
    this.cause = cause;
    // Stack trace 유지 (V8 기반 환경에서만 동작)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParseError);
    }
  }
}

/**
 * GeminiParser - Google의 Gemini API를 사용하는 파서
 */
export class GeminiParser {
  private apiKeys: string[] = [];
  private readonly modelName: string;

  private apiKeyGenerator: Generator<string, string, undefined>;
  constructor() {
    // 기본 설정
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    this.apiKeys = process.env.GEMINI_API_KEYS?.split(',') ?? [];
    if (this.apiKeys.some((value) => value.length !== 39)) {
      throw new Error("Gemini API KEY가 잘못되었습니다. 존재하지 않습니다. ");
    }
    this.apiKeyGenerator = this.cycleKeyGenerator();

    // API 키 설정은 initialize 메서드에서 수행
  }



  private * cycleKeyGenerator(): Generator<string, string, undefined> {
    let index = 0;
    while (true) {
      yield this.apiKeys[index];
      index = (index + 1) % this.apiKeys.length; // 배열 범위를 넘어가면 처음으로 돌아감
    }
  }



  async loadMongoRawContent(batchSize: number): Promise<IRawContent[]> {
    try {

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

      const rawContents: IRawContent[] = await VisitResultModel.aggregate(pipeline);

      if (rawContents.length === 0) {
        logger.warn('조건에 맞는 원본 콘텐츠가 없습니다.');
      }

      return rawContents;
    } catch (error) {
      logger.error(`원본 콘텐츠 로드 중 오류: ${(error as Error).message}`);
      return [];
    }
  }

  async findJobEndDate(rawText: string, retryNumber: number, retryDelay: number = 1000): Promise<Date | undefined> {
    for (let attempt = 1; attempt <= retryNumber; attempt++) {
      try {
        const model = new GoogleGenerativeAI(this.apiKeyGenerator.next().value).getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            responseMimeType: JSON_MIME_TYPE,
            responseSchema: geminiJobEndDateSchema
          },
        });
        logger.debug('[GeminiParser][validateRecruitInfo] Gemini API 요청 시작...');
        const result = await model.generateContent(geminiJobEndDatePrompt(rawText));
        if (!result) {
          throw new ParseError('Gemini API에서 빈 응답을 받았습니다.');
        }
        const responseText = await result.response?.text();
        logger.info(`[GeminiParser][validateRecruitInfo] Gemini API 응답: ${responseText}`);
        const data = JSON.parse(responseText) as { job_end_date: string }; // JSON 파싱

        if (!data.job_end_date) {
          return;
        }

        const jobEndDate = this.parseDateOrNull(data.job_end_date);
        if (!jobEndDate) {
          logger.error(`[GeminiParser][validateRecruitInfo] 유효하지 않은 날짜 형식입니다: ${data.job_end_date}`);
          throw new ParseError(`유효하지 않은 날짜 형식입니다: ${data.job_end_date}`);
        }

        return jobEndDate;

      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay)); // 1초 대기
        logger.error(`[GeminiParser][validateRecruitInfo] 재시도 횟수 ${attempt}/${retryNumber} 증 에러 발생`);
        if (retryNumber === attempt) {
          throw new ParseError("Failed to validate recruitment info ", error);
        }
      }
    }
  }


async validateRecruitInfo(rawText: string, retryNumber: number ,retryDelay: number=1000): Promise<{ result: string, reason: string } | undefined> {
    for (let attempt = 1; attempt <= retryNumber; attempt++) {
      try {
        const model = new GoogleGenerativeAI(this.apiKeyGenerator.next().value).getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            responseMimeType: JSON_MIME_TYPE,
            responseSchema: geminiRecruitInfoValidationSechma,
          },
        });
        // API 호출로 채용 정보 파싱
        logger.debug('[GeminiParser][validateRecruitInfo] Gemini API 요청 시작...');
        const result = await model.generateContent(geminiRecruitInfoValidationPrompt(rawText))
          .then((result) =>
            result.response?.text()
          )
          .catch(
            (error) => {
              logger.error(`[GeminiParser][validateRecruitInfo] Gemini API에서 텍스트 응답을 받지 못했습니다.${attempt}/${retryNumber}`);
              if (retryNumber === attempt) {
                throw error;
              }
            }
          )
          .then((responseText) => {
            logger.debug(`${responseText}`);
            if (!responseText) {
              logger.error(`[GeminiParser][validateRecruitInfo] Gemini API에서 빈 응답을 받았습니다.${attempt}/${retryNumber}`);
              throw new ParseError('Gemini API에서 빈 응답을 받았습니다.');
            }
            const data = JSON.parse(responseText) as { result: string, reason: string };
            // API 응답 유효성 처리
            if (!data.result) {
              logger.error(`[GeminiParser][validateRecruitInfo] Gemini API 응답이 유효하지 않습니다.${attempt}/${retryNumber}`);
              throw new ParseError('Gemini API 응답이 유효하지 않습니다.');
            }
            return data;
          })
          .catch(
            (error) => {
              logger.error(`[GeminiParser][validateRecruitInfo] 텍스트 응답에에서 json 파싱을을 실패했습니다. ${attempt}/${retryNumber}`);
              if (retryNumber === attempt) {
                throw error;
              }
            }
        )
        if (result) {
          if (result.result === '적합') {
            logger.debug(`[GeminiParser][validateRecruitInfo] 채용공고로 적합합니다. ${attempt}/${retryNumber}`);
            return result;
          }
          logger.debug(`[GeminiParser][validateRecruitInfo] 채용공고로 부적합합니다. ${attempt}/${retryNumber}`);
          return result;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay)); // 1초 대기
      } catch (error) {

        logger.error(`[GeminiParser][validateRecruitInfo] 재시도 횟수 ${attempt}/${retryNumber} 증 에러 발생`);
        if (retryNumber === attempt) {
          throw new ParseError("Failed to validate recruitment info ", error);
        }
      }
    }
    return undefined;
  }

  async ParseRegionText(rawContent: string, retryNumber: number ,retryDelay: number=1000): Promise<string[]|undefined> {
    for (let attempt = 1; attempt <= retryNumber; attempt++) {
      try {
        const model = new GoogleGenerativeAI(this.apiKeyGenerator.next().value).getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            responseMimeType: JSON_MIME_TYPE,
            responseSchema: geminiRegionCdScema,
          },
        });
        // API 호출로 채용 정보 파싱
        logger.debug('Gemini API 요청 시작...');
        const result = await model.generateContent(geminiRegionTextPrompt(rawContent))
          .then((result) => result.response?.text()
          )
          .catch(
            (error) => {
              logger.error(`Gemini API에서 텍스트 응답을 받지 못했습니다.${attempt}/${retryNumber}`);
               if (retryNumber === attempt) {
                 throw error;
                }
            }
          )
          .then((responseText) => {
            if (!responseText) {
              logger.error(`Gemini API에서 빈 응답을 받았습니다.${attempt}/${retryNumber}`);
              throw new ParseError('Gemini API에서 빈 응답을 받았습니다.');
            }
            logger.debug(responseText);
            const RegionResult = JSON.parse(responseText)
            return RegionResult.regionCdList;
          })
          .catch(
            (error) => {
              logger.error(`텍스트 응답에에서 json 파싱을을 실패했습니다. ${attempt}/${retryNumber}`);
               if (retryNumber === attempt) {
                 throw error;
                }
            }
        )
        if (result) {
          return result
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay)); // 1초 대기
      } catch (error) {
        logger.error(`재시도 횟수 ${attempt}/${retryNumber} 증 에러 발생`);
        if (retryNumber === attempt) {
          throw new ParseError("Failed to parse recruitment info ", error);
        }
      }
    }
    }
  parseDateOrNull(dateStr: any): Date | undefined {
    try {
      const parsed = new Date(dateStr);
      if (parsed < new Date('2000-01-01') || parsed > new Date('2100-12-31')) {
        return undefined;
      }
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }catch (error) {
      logger.error(`날짜 파싱 중 오류 발생: ${error}`);
      return undefined;
    }

  }
  /**x
  * 원본 콘텐츠 파싱
  * @param rawContent 원본 콘텐츠
  */
  async parseRawContentRetry(rawContent: IRawContent, retryNumber: number, retryDelay: number = 1000): Promise<GeminiResponseRecruitInfoDTO | undefined> {

    for (let attempt = 1; attempt <= retryNumber; attempt++) {
      try {

          // logger.debug(rawContent.text);
        const model = new GoogleGenerativeAI(this.apiKeyGenerator.next().value).getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            responseMimeType: JSON_MIME_TYPE,
            responseSchema: geminiRecruitInfoSechma,
          },
        });
        // API 호출로 채용 정보 파싱
        logger.debug('[GeminiParser][parseRawContentRetry] Gemini API 요청 시작...');
        const result =await model.generateContent(geminiRecruitInfoPrompt(rawContent.text))
          .then((result) => result.response?.text())
          .catch(
            (error) => {
              logger.error(`[GeminiParser][parseRawContentRetry] Gemini API에서 텍스트 응답을 받지 못했습니다.${attempt}/${retryNumber}`);
               if (retryNumber === attempt) {
                throw error;
              }
            }
          )
          .then((responseText) => {
            if (!responseText) {

              logger.error(`[GeminiParser][parseRawContentRetry] Gemini API에서 빈 응답을 받았습니다.${attempt}/${retryNumber}`);
              throw new ParseError('Gemini API에서 빈 응답을 받았습니다.');
            }
            logger.debug(`[GeminiParser][parseRawContentRetry] Gemini API 응답: ${responseText}`);

            const data = JSON.parse(responseText) as GeminiResponseRecruitInfoDTO
            // API 응답 유효성 처리
            data.apply_end_date = this.parseDateOrNull(data.apply_end_date);
            data.apply_start_date = this.parseDateOrNull(data.apply_start_date);
            if (!data.job_type) { data.job_type = "무관" }
            if (!data.require_experience) { data.require_experience = "경력무관" }
            if (!data.title) { data.title = rawContent.title }
            if (!data.region_id) { data.region_id = [] }
            if (rawContent.text && data.region_id) {
              data.region_id = data.region_id.map((regionCd) => cd2RegionId(regionCd)).filter((regionId) => regionId !== undefined);
            }
            if (data.region_text) {
              data.region_id.concat(regionText2RegionIds(data.region_text || ''));
            }
            if (data.region_id.length === 0) {
              data.region_id =[OTHER_REGION_ID]
            }
            return data
          })
          .catch(
            (error) => {
              logger.error(`텍스트 응답에에서 json 파싱을을 실패했습니다. ${attempt}/${retryNumber}`);
              if (retryNumber === attempt) {
                throw error;
              }
            }
        )
        if (result) {
          return result
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay)); // 1초 대기
      } catch (error) {
        logger.error(`재시도 횟수 ${attempt}/${retryNumber} 증 에러 발생`);
        if (retryNumber === attempt) {
          throw new ParseError("Failed to parse recruitment info ", error);
        }
      }
    }
  }




  verifyRecruitInfo( response :GeminiResponseRecruitInfoDTO): boolean {

    if (response.is_recruit_info === false) {
      logger.debug("[GeminiParser][verifyRecruitInfo] 채용공고가 아닙니다.");
      return false;
    }
    if (!response.title) {
      logger.debug("[GeminiParser][verifyRecruitInfo] 제목이 없습니다.");
      return false;
    }
    if (!response.company_name) {
      logger.debug("[GeminiParser][verifyRecruitInfo]회사명이 없습니다.");
      return false;
    }
    if (!response.job_description) {
      logger.debug("[GeminiParser][verifyRecruitInfo] 직무 설명이 없습니다.");
      return false;
    }

    logger.debug("[GeminiParser][verifyRecruitInfo] 채용공고 입니다.");
    return true;
  }
  /**
   * DB 저장용 모델로 변환
   * @param botRecruitInfo 봇 파싱 결과
   * @param rawContent 원본 콘텐츠
   */
  makeDbRecruitInfo(botRecruitInfo: GeminiResponseRecruitInfoDTO, rawContent: IRawContent , favicon : string | null ): CreateDBRecruitInfoDTO {
    const now = new Date();
    return {
      ...rawContent,
      ...botRecruitInfo,
      job_valid_type: 0,
      favicon: favicon?? undefined,
      created_at: now,
      updated_at: now,
      is_public: true, // 채용 정보인 경우에만 공개
    };
  }
}




