import 'dotenv/config'
import {
  GoogleGenerativeAI,
  Schema,
  SchemaType,
} from '@google/generative-ai';
import { IParser } from './IParser';
import {  GeminiResponseRecruitInfoDTO ,CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';
import { IRawContent } from '../models/RawContentModel';
import { VisitResultModel } from '../models/VisitResult';
import { defaultLogger as logger } from '../utils/logger';
import { cd2RegionId, OTHER_REGION_ID, regionText2RegionIds } from '../trasnform/Transform';



const JSON_MIME_TYPE = 'application/json';


const geminiRegionCdScema = {
  type: SchemaType.OBJECT,
  properties: {
    regionCdList: {
      type: SchemaType.ARRAY,
      minItems: 0,
      maxItems: 4,
      items: {
        type: SchemaType.STRING,
      },
    }
  }
 } as Schema

 const geminiRecruitInfoSechma ={
      type: SchemaType.OBJECT,
      properties: {
        is_recruit_info: {
          type: SchemaType.BOOLEAN,
          description: "분석된 텍스트가 채용공고인지 여부 (true=채용공고, false=채용공고 아님)",
        },
        is_it_recruit_info: {
          type: SchemaType.BOOLEAN,
          description: "분석된 텍스트가 IT 채용공고인지 여부 (true=IT채용공고, false=IT채용공고 아님)",
        },
        title: {
          type: SchemaType.STRING,
          description: "채용 공고 제목",
          nullable: true
        },
        company_name: {
          type: SchemaType.STRING,
          description: "회사명",
          nullable: true
        },
        department: {
          type: SchemaType.STRING,
          description: "채용하는 부서 또는 팀 이름",
          nullable: true
        },
        region_text: {
          type: SchemaType.STRING,
          description: "근무 지역 또는 회사 위치 (예: 서울시 강남구)",
          nullable: true
        },
        region_id: {
          type: SchemaType.ARRAY,
          description: "근무 지역 또는 회사 위치의 대한민국 법정동 코드(예 서울시 강남구=1168000000 )",
          minItems: 0,
          maxItems: 4,
          items: {
            type: SchemaType.STRING,
          },
          nullable: false
        },
        require_experience: {
          type: SchemaType.STRING,
          enum: ['경력무관', '신입', '경력'],
          format: "enum",
          description: "요구되는 경력 수준 (경력무관, 신입, 경력)",
          nullable: false
        },
        job_description: {
          type: SchemaType.STRING,
          description: "주요 업무 내용 및 직무에 대한 상세 설명",
          nullable: true
        },
        job_type: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ['정규직', '계약직', '인턴', '아르바이트', '프리랜서', '파견직'],
          description: "고용 형태 (정규직, 계약직, 인턴, 아르바이트, 프리랜서, 파견직)",
          nullable: true
        },
        apply_start_date: {
          type: SchemaType.STRING,
          description: "채용 공고 게시 시작일 또는 지원 접수 시작일 (YYYY-MM-DD 형식)",
          format : "date-time",
          nullable: true
        },
        apply_end_date: {
          type: SchemaType.STRING,
          description: "채용 공고 마감일 또는 지원 접수 마감일 (YYYY-MM-DD 형식, '상시채용', '채용시 마감' 등이라면 null)",
          format : "date-time",
          nullable: true
        },
        requirements: {
          type: SchemaType.STRING,
          description: "지원하기 위한 필수 자격 요건",
          nullable: true
        },
        preferred_qualifications: {
          type: SchemaType.STRING,
          description: "필수는 아니지만 우대하는 자격 요건이나 기술 스택",
          nullable: true
        },
        ideal_candidate: {
          type: SchemaType.STRING,
          description: "회사가 원하는 인재상",
          nullable: true
        }
      },
      required: ["is_recruit_info" ,"is_it_recruit_info"]
 } as Schema;

 const geminiRecruitInfoValidationSechma = {
  type: SchemaType.OBJECT,
  properties: {
    result: {
      type: SchemaType.STRING,
      nullable: false,
      enum: ['적합', '부적합'],
      format: "enum",
      description: "채용 공고가 적합한지 여부 (적합, 부적합)",
    },
    reason: {
      type: SchemaType.STRING,
      nullable: false,
      description: "채용 공고가 적합하지 않은 이유",
    }
  }
 } as Schema

 function geminiRegionTextPrompt(content : string) {
      return `
당신은 행정동코드를 정확히 지역에 따라 전환해야합니다.
다음과같은 주의사항을 지켜주세요

1.지역정보가 명확할경우 행정코드로 변환해주세요
regionText : 서울시 강남구 => [1168000000]

2.같이 지역이 여러개로 들어오면 여러개의 행정동코드를 넣어서 리스트로 반환해주세요.
regionText :  경기 안산시, 안산시 상록구 => [4127000000 ,4127100000]

3.발음이 비슷한 지역은 비슷한 지역의 한국어지역으로 맵핑해서 행정동코드를 반환해주세요
예)seoul -> 서울 ,bundang -> 경기도 성남시 분당 ,Seocho-> 서울시 서초구

4.만약 불확실한 경우나, 서울시, 경기 등 시도만 나와있다면 두 자리까지만 코드를 출력해주세요
에 서울 -> [1100000000] , 경기->[4100000000]

5.다른 나라의 지역은 빈배열로 반환해주세요
예 베이징 -> [] , 파리 -> []

6.코너 케이스를 주의해주세요, 다른 시설과 지역이 붙어있다면 그 지역의 이름만 분석해서
행정동 코드를반환해주세요
예 신세계백화점 서울점 -> 서울, 매장천안점 ->천안, 천안 공장 -> 천안

${content}
`;
 }
function geminiRecruitInfoPrompt(content : string) {
      return `
당신은 전문적인 채용 정보 분석가입니다. 다음 텍스트가 채용 공고인지 분석하세요.

지시사항:
1. 텍스트가 채용 공고인지 여부를 판단하세요.(회사 소개 글은 채용공고가 아님을 유의해서 판단하세요)
2. 채용 공고가 맞다면:
   - "is_recruit_info" 필드를 true로 설정하세요.
   - 다음 정보를 추출하여 해당 필드에 입력하세요. 정보가 없다면 null이나 빈 문자열로 설정하세요.
     - is_it_recruit_info: it 직군의 채용정보 이라면 true , 아니라면 false 로 설정하세요 (채용공고인 동시에 IT직군이여야합니다.)
     - title: 적절한 채용 공고 제목을 작성하세요. (예: "토스 프론트엔드 개발자 채용") 회사명과 직무를 포함하세요.
     - company_name: 채용하는 회사명
     - department: 채용하는 부서 또는 팀
     - region_text: 근무 지역 또는 회사 위치 시도구 기준으로 한국어로 작성하세요. 여러 지역이 있다면 쉼표로 구분하세요. 예) 서울시 강남구, 경기도 성남시 분당구
     - region_id: region_text의 값을 대한민국 법정동 코드로 변환하세요 경기 안산시, 안산시 상록구 => [4127000000 ,4127100000]
     - require_experience: 요구되는 경력 수준 ("경력무관", "신입", "경력"). 가능하면 이 세 가지 카테고리로 매핑해주세요.
     - job_description: 주요 업무 내용이나 직무기술서에 대한 내용을 기술하세요.
     - job_type: 고용 형태. 표준 용어를 사용하세요 (정규직, 계약직, 인턴, 아르바이트, 프리랜서, 파견직) 중 하나를 선택하세요.
       나와있지 않은 고용형태는 "무관"으로 설정하세요.
     - apply_start_date: 지원 시작일 또는 게시일 (가능한 YYYY-MM-DD 형식으로 맞추어주세요)
     - apply_end_date: 지원 마감일 (가능한 YYYY-MM-DD 형식으로 맞추어주세요)
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

function geminiRecruitInfoValidationPrompt(content: string): string {
return  `프롬프트 제목: 채용 공고 필터링: 국내 IT 기업 식별

역할: 당신은 채용 공고 분석 전문가입니다. 주어진 채용 공고 텍스트를 분석하여, 다음 두 가지 핵심 조건에 따라 필터링하고 결과를 제시해야 합니다.

입력 (Input):
채용 공고 웹사이트에서 추출된 원본 텍스트 (string)

출력 (Output):
결과는 다음 형식으로 엄격하게 제한되며, result와 reason 필드는 반드시 값을 가져야 합니다 (NOT NULL).
result : reason

필터링 조건:

국내 기업 여부: 회사는 외국계 기업이 아니어야 합니다. (즉, 대한민국에 법인 또는 본사를 둔 국내 기업이어야 합니다.)
IT 산업군 여부: 회사는 IT 관련 산업군의 회사여야 합니다. (예: 소프트웨어 개발, 정보통신, 데이터 분석/처리, AI, 클라우드 서비스, 플랫폼 운영, 시스템 통합(SI), 게임 개발, IT 컨설팅 등)
처리 규칙 및 출력 예시:

조건 1과 조건 2를 모두 충족하는 경우:

result: 적합
reason: 국내 IT 기업으로 판단됩니다.
조건 1을 충족하지 못하는 경우 (외국계 기업으로 판단될 시):

result: 부적합
reason: 외국계 기업으로 판단됩니다. (IT 기업 여부와 관계없이 우선적으로 이 사유를 적용합니다.)
조건 1은 충족하지만 조건 2를 충족하지 못하는 경우 (국내 기업이지만 IT 기업이 아닐 시):

result: 부적합
reason: IT 관련 산업군 기업이 아닌 것으로 판단됩니다.
두 조건 모두 충족하지 못하는 경우 (외국계 기업이면서 IT 기업도 아닐 시):

result: 부적합
reason: 외국계 기업이며 IT 관련 산업군 기업이 아닌 것으로 판단됩니다. (또는 "외국계 기업으로 판단됩니다."로 외국계 기업임을 우선 명시해도 됩니다.)
지시사항:
주어진 텍스트 내에서 회사명, 회사 소개, 사업 분야, 본사 위치, 기업 국적 관련 언급(예: "글로벌", "외국계", "OO지사" 등) 등을 종합적으로 분석하여 위 조건에 따라 판단하십시오. 판단 근거가 명확하지 않을 경우, 텍스트에서 가장 유력하게 추론할 수 있는 내용을 바탕으로 결정하고, reason에 간략하게라도 그 뉘앙스를 포함할 수 있습니다.
반드시 result와 reason 필드를 포함한 JSON 형식으로 결과를 출력해야 합니다. 예시 출력 형식은 다음과 같습니다:
{
  "result": "적합",
  "reason": "국내 IT 기업으로 판단됩니다."
}
입력 :${content}

`;
}

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
export class GeminiParser implements IParser {
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
  async parseRawContentRetry(rawContent: IRawContent, retryNumber: number ,retryDelay: number=1000 ): Promise<GeminiResponseRecruitInfoDTO | undefined> {
    for (let attempt = 1; attempt <= retryNumber; attempt++) {
      try {
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




