import {Schema,
SchemaType,
} from '@google/generative-ai';

export const geminiRegionCdScema = {
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

 export const geminiRecruitInfoSechma ={
      type: SchemaType.OBJECT,
      properties: {
        is_recruit_info: {
          type: SchemaType.BOOLEAN,
          description: "분석된 텍스트가  IT 채용공고인지 여부 (true=채용공고, false=채용공고 아님)",
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
      required: ["is_recruit_info" ]
 } as Schema;


export  const geminiRecruitInfoValidationSechma = {
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



 /**
 * Gemini가 추출할 채용 공고 마감일의 JSON 스키마입니다.
 *
 * - job_end_date:
 *   - '상시채용', '채용시 마감' 등 특정 날짜가 없는 경우를 처리하기 위해 `nullable`을 `true`로 설정했습니다.
 *   - 날짜 형식은 'YYYY-MM-DD'로 명확하므로, `format`을 'date-time' 대신 'date'로 지정하여 더 정확하게 표현합니다.
 */
export const geminiJobEndDateSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    job_end_date: {
      type: SchemaType.STRING,
      description: `채용 공고의 마감일. '상시채용', '채용시 마감', '수시채용', '인재풀' 등 특정 날짜가 명시되지 않은 경우 'null'을 반환합니다. 날짜는 반드시 'YYYY-MM-DD' 형식으로 변환해야 합니다.
      초는 생략합니다. 예: '2023-10-0' 또는 2023-10-01T00:00:00Z와 같은 형식입니다.`,
      format: "date-time", // 'YYYY-MM-DD' 형식에 더 적합한 포맷입니다.
      nullable: true   // '상시채용' 등의 케이스를 위해 null을 허용해야 합니다.
    }
  },
  required: ['job_end_date']
};
