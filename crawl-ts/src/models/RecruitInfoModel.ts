

export interface BaseRecruitInfoDTO{

  /**
   * 공고 제목 :
   */
  title: string;
  /**
   * 회사명
   */
  company_name?: string;

  /**
   * 부서 또는 팀
   */
  department?: string;

  /**
   * 지역
   */
  region_text?: string;

  /**
   * 지역번호
   */
  region_id?: number[];

  /**
   * 경력 요구 사항
   */
  require_experience?: string;

  /**
   * 직무 설명
   */
  job_description?: string;

  /**
   * 고용 형태
   */
  job_type?: string;

  /**
   * 지원 시작일
   */
  apply_start_date?: Date;

  /**
   * 지원 마감일
   */
  apply_end_date?: Date;

  /**
   * 필수 요건
   */
  requirements?: string;

  /**
   * 우대 사항
   */
  preferred_qualifications?: string;

  /**
   * 인재상
   */
  ideal_candidate?: string;

}


export interface GeminiResponseResult  {
  /**
   * 채용 공고인지 여부
   */
  is_recruit_info: boolean;

   /**
   * IT 채용 공고인지 여부
   */
  is_it_recruit_info: boolean;

}

/**
 * Gemini API 응답 인터페이스
 * Gemini API가 반환하는 파싱 결과를 나타냅니다.
 */
export interface GeminiResponseRecruitInfoDTO extends BaseRecruitInfoDTO ,GeminiResponseResult {

}


/**
 * MySQL DB용 채용 정보 인터페이스
 * IDbRecruitInfo에서 일부 필드를 제외하고 상속받음
 */
export interface CreateDBRecruitInfoDTO extends BaseRecruitInfoDTO {
  // 특정 필드 재정의 (필요시)
  id?: number;

  url: string;

  text: string;

  title: string;

  created_at?: Date;

  updated_at?: Date;

  is_public: boolean;

  favicon?: string;

}
/**
 * DB에 저장되는 채용 정보 인터페이스
 */
export interface CreateCacheDBRecruitInfoDTO extends CreateDBRecruitInfoDTO, GeminiResponseResult {
  _id?: string;

  is_parse_success: boolean;
  /**
   * 공개 여부
   */
  is_public: boolean;
}



export interface RegionResult{
  id? : number
}



export interface RecruitInfoUrlDto {
  id: number;
  url: string;
}

export interface RecruitInfoVaildDto {
  id: number;

  url: string;

  is_public: boolean;
}