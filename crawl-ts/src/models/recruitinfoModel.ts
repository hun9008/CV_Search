
import mongoose, { Schema } from 'mongoose';

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

/**
 * Gemini API 응답 인터페이스
 * Gemini API가 반환하는 파싱 결과를 나타냅니다.
 */
export interface IGeminiResponse {
  /**
   * 채용 공고인지 여부
   */
  is_recruit_info: boolean;

   /**
   * IT 채용 공고인지 여부
   */
  is_it_recruit_info: boolean;

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
 * 봇이 파싱한 채용 정보 인터페이스
 * (Gemini 응답을 확장)
 */
export interface IBotRecruitInfo extends IGeminiResponse {
  // IGeminiResponse의 모든 필드를 상속받음
  // 추가 필드가 필요하면 여기에 정의
}

/**
 * DB에 저장되는 채용 정보 인터페이스
 */
export interface IDbRecruitInfo extends IBotRecruitInfo {

  /**
   * 채용공고 제목
   */
  title: string;

  /**
   * 채용공고 URL
   */
  url: string;

  is_parse_success: boolean;

  favicon?: String;

  /**
   * 원본 텍스트
   */
  raw_text: string;

  /**
   * 도메인 (회사 웹사이트 호스트명)
   */
  domain?: string;

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


  /**
   * 메타데이터
   */
  metadata?: Record<string, any>;
}


const RecruitInfoSchema = new Schema<IDbRecruitInfo>({
  title: { type: String, required: true },
  url: { type: String, required: true, unique: true, index: true },
  raw_text: { type: String, required: true },
  domain: { type: String },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
  is_public: { type: Boolean, required: true, default: false },
  favicon: { type: String },
  is_parse_success: { type: Boolean, required: true },

  // 👇 IGeminiResponse 필드들도 명시해야 함
  is_recruit_info: { type: Boolean, required: true },
  is_it_recruit_info : { type: Boolean, required: true },
  company_name: { type: String },
  department: { type: String },
  region_text: { type: String },
  region_id:{type:String},
  require_experience: { type: String },
  job_description: { type: String },
  job_type: { type: String },
  apply_start_date: { type: String },
  apply_end_date: { type: String },
  requirements: { type: String },
  preferred_qualifications: { type: String },
  ideal_candidate: { type: String }
}, {
  timestamps: false,
  collection: 'recruitInfos0418'
});

// 메서드: URL로 채용 공고 조회
RecruitInfoSchema.statics.findByUrl = function(url) {
  return this.findOne({ url });
};

// 메서드: 키워드로 채용 공고 검색
RecruitInfoSchema.statics.searchByKeywords = function(keywords, options = {}) {
  const { limit = 10, page = 1, sort = { posted_at: -1 } } = options;
  const skip = (page - 1) * limit;

  // 키워드를 공백으로 구분된 문자열로 변환
  const searchText = Array.isArray(keywords) ? keywords.join(' ') : keywords;

  return this.find(
    { $text: { $search: searchText } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' }, ...sort })
    .skip(skip)
    .limit(limit)
    .exec();
};

// 메서드: 만료된 채용 공고 조회
RecruitInfoSchema.statics.findExpired = function(options = {}) {
  const { limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const now = new Date();
  return this.find({apply_end_date: { $lte: now } })
    .sort({apply_end_date: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

// 메서드: 곧 만료되는 채용 공고 조회
RecruitInfoSchema.statics.findExpiringIn = function(days = 7, options = {}) {
  const { limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);

  return this.find({
  apply_end_date: {
      $gte: now,
      $lte: future
    }
  })
    .sort({apply_end_date: 1 })
    .skip(skip)
    .limit(limit)
    .exec();
};



export const RecruitInfoModel = mongoose.model<IDbRecruitInfo>('recruitInfos', RecruitInfoSchema);
