/**
 * 원본 콘텐츠 인터페이스
 * 크롤링된 원본 데이터를 나타냅니다.
 */
export interface IRawContent {
  /**
   * 페이지 제목
   */
  title?: string;
  /**
   * 페이지 텍스트 내용
   */
  text: string;

  /**
   * 페이지 URL
   */
  url: string;

  /**
   * 페이지 도메인
   */
  domain?: string;

  /**
  *
  */
  favicon?: String;
  /**
   * 크롤링 시간
   */
  crawledAt?: Date;

  /**
   * 추가 메타데이터
   */
  metadata?: Record<string, any>;
}

export interface IBaseRecruitInfo{

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
  region_id?: string;

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
  apply_start_date?: string;

  /**
   * 지원 마감일
   */
  apply_end_date?: string;

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
/**
 * Gemini API 응답 인터페이스
 * Gemini API가 반환하는 파싱 결과를 나타냅니다.
 */
export interface IGeminiResponseRecruitInfo extends IBaseRecruitInfo {
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
 * 봇이 파싱한 채용 정보 인터페이스
 * (Gemini 응답을 확장)
 */
export interface IBotRecruitInfo extends IGeminiResponseRecruitInfo {
  // IGeminiResponse의 모든 필드를 상속받음
  // 추가 필드가 필요하면 여기에 정의
}

/**
 * DB에 저장되는 채용 정보 인터페이스
 */
export interface ICacheDbRecruitInfo extends IBotRecruitInfo , IRawContent{
  _id?: string;

  is_parse_success: boolean;
  /**
   * 생성 시간
   */
  created_at: Date;

  /**
   * 수정 시간
   */
  updated_at: Date;

  /**
   * 공개 여부
   */
  is_public: boolean;
}



/**
 * MySQL DB용 채용 정보 인터페이스
 * IDbRecruitInfo에서 일부 필드를 제외하고 상속받음
 */
export interface IDbRecruitInfo extends Omit<ICacheDbRecruitInfo, 'is_parse_success' | 'is_recruit_info' | 'is_it_recruit_info'> {
  // 특정 필드 재정의 (필요시)
  id? : string
}
