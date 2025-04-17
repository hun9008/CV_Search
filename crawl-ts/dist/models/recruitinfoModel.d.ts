import mongoose from 'mongoose';
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
     * 파싱 성공 여부 (채용 공고인지 여부)
     */
    success: boolean;
    /**
     * 실패 이유 (success가 false인 경우)
     */
    reason?: string;
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
    location?: string;
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
    region_id?: String;
    /**
     * 메타데이터
     */
    metadata?: Record<string, any>;
}
export declare const RecruitInfoModel: mongoose.Model<IDbRecruitInfo, {}, {}, {}, mongoose.Document<unknown, {}, IDbRecruitInfo> & IDbRecruitInfo & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
