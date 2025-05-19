import { z } from "zod";
/**
 * 원본 콘텐츠 인터페이스
 * 크롤링된 원본 데이터를 나타냅니다.
 */
export interface IRawContent {
    /**
     * 페이지 제목
     */
    title: string;
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
export declare const RawContentSchema: z.ZodObject<{
    title: z.ZodString;
    text: z.ZodString;
    url: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    favicon: z.ZodOptional<z.ZodString>;
    crawledAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    text: string;
    url: string;
    metadata?: Record<string, any> | undefined;
    domain?: string | undefined;
    favicon?: string | undefined;
    crawledAt?: Date | undefined;
}, {
    title: string;
    text: string;
    url: string;
    metadata?: Record<string, any> | undefined;
    domain?: string | undefined;
    favicon?: string | undefined;
    crawledAt?: Date | undefined;
}>;
