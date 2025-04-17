export enum JobType {
  정규직 = "정규직",
  계약직 = "계약직",
  인턴 = "인턴",
  아르바이트 = "아르바이트",
  프리랜서 = "프리랜서",
  파견직 = "파견직"
}

/**
 * 경력 타입을 정의하는 타입
 */
export type ExperienceType = "경력무관" | "신입" | "경력" | null;

/**
 * 원본 컨텐츠 인터페이스 - 파싱 전 원본 데이터 구조
 */
export interface IRawContent {
  /** 원본 제목 */
  title?: string;

  /** 원본 URL */
  url: string;

  /** 원본 텍스트 */
  text: string;

  /** 도메인 */
  domain?: string;

  /** 수집 일시 */
  crawledAt?: Date;

  /** 메타데이터 */
  metadata?: Record<string, any>;
}

/**
 * AI 봇 파싱 결과 인터페이스 - AI가 분석한 채용 정보
 */
export interface IBotRecruitInfo {
  /** 채용 정보 여부 */
  success: boolean;

  /** 채용 정보가 아닌 경우 이유 */
  reason?: string;

  /** 회사명 */
  company_name?: string;

  /** 부서/직무 */
  department?: string;

  /** 위치/지역 */
  location?: string;

  /** 경력 요구사항 */
  require_experience?: ExperienceType;

  /** 직무 설명 */
  job_description?: string;

  /** 고용 형태 */
  job_type?: JobType | JobType[];

  /** 우대 사항 */
  preferred_qualifications?: string;

  /** 인재상 */
  ideal_candidate?: string;

  /** 시작일 */
  apply_start_date?: Date | string;

  /** 마감일 */
  apply_end_date?: Date | string;

  /** 필수 요건 */
  requirements?: string;

  /** 파싱 메타데이터 */
  parsing_metadata?: {
    /** 파싱 시간 */
    parse_time?: number;
    /** 모델명 */
    model?: string;
    /** 기타 메타데이터 */
    [key: string]: any;
  };
}

/**
 * DB에 저장할 채용 정보 인터페이스 - IBotRecruitInfo를 확장하여 DB 저장에 필요한 추가 필드 포함
 */
export interface IDbRecruitInfo extends IBotRecruitInfo {
  /** 채용 공고 제목 */
  title: string;

  /** 채용 공고 URL */
  url: string;

  /** 원본 텍스트 */
  raw_text: string;

  /** 도메인 */
  domain?: string;

  /** 지역 ID */
  region_id?: number;

  /** 노출 여부 */
  is_public?: boolean;

  /** 생성 시간 */
  created_at?: Date;

  /** 만료 시간 */
  expired_at?: Date;

  /** 보관 처리 시간 */
  archived_at?: Date;

  /** 방문 시간 */
  visited_at?: Date;

  /** 업데이트 시간 */
  updated_at?: Date;

  /** 태그 */
  tags?: string[];

  /** 추가 메타데이터 */
  metadata?: Record<string, any>;
}

// 이전 인터페이스는 타입 호환성을 위해 유지
// @deprecated IDbRecruitInfo를 사용하세요
export interface IRecruitInfo extends IDbRecruitInfo {}

// @deprecated IBotRecruitInfo를 사용하세요
export interface IGeminiResponse extends IBotRecruitInfo {}





