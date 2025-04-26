import mongoose, { Document } from 'mongoose';
/**
 * SubUrl 모델 - 방문할 URL과 방문 결과를 저장하는 구조
 */
export interface ISubUrl {
    url: string;
    domain: string;
    visited: boolean;
    visitedAt?: Date;
    discoveredAt?: Date;
    created_at?: Date;
    updated_at?: Date;
    finalUrl?: string;
    finalDomain?: string;
    title?: string;
    text?: string;
    pageContent?: {
        title?: string;
        meta?: Record<string, string>;
        text?: string;
    };
    herfUrls?: string[];
    onclickUrls?: string[];
    crawledUrls?: string[];
    crawlStats?: {
        total?: number;
        href?: number;
        onclick?: number;
        blocked_by_robots?: number;
        allowed_after_robots?: number;
    };
    success?: boolean;
    error?: string;
    errors?: Array<{
        type: string;
        message: string;
        stack?: string;
        url?: string;
    }>;
    isRecruit?: boolean;
    /**
     * 객체 형태로 변환
     */
    toObject(): Record<string, any>;
}
/**
 * VisitResult 모델 - 도메인별 방문 URL 목록 저장
 */
export interface IVisitResult extends Document {
    domain: string;
    suburl_list: ISubUrl[];
    favicon?: string;
    updated_at?: Date;
    created_at?: Date;
}
/**
 * SubUrl 구현 클래스
 */
export declare class SubUrl implements ISubUrl {
    url: string;
    domain: string;
    visited: boolean;
    visitedAt?: Date;
    discoveredAt?: Date;
    created_at: Date;
    updated_at: Date;
    finalUrl?: string;
    finalDomain?: string;
    title?: string;
    text?: string;
    pageContent?: {
        title?: string;
        meta?: Record<string, string>;
        text?: string;
    };
    herfUrls: string[];
    onclickUrls: string[];
    crawledUrls: string[];
    crawlStats: {
        total: number;
        href: number;
        onclick: number;
        blocked_by_robots: number;
        allowed_after_robots: number;
    };
    success: boolean;
    error?: string;
    errors: Array<{
        type: string;
        message: string;
        stack?: string;
        url?: string;
    }>;
    isRecruit?: boolean;
    /**
     * SubUrl 생성자
     * @param data 초기 데이터
     */
    constructor(data?: Partial<ISubUrl>);
    /**
     * 일반 객체로 변환
     */
    toObject(): Record<string, any>;
}
export declare const VisitResultModel: mongoose.Model<IVisitResult, {}, {}, {}, mongoose.Document<unknown, {}, IVisitResult> & IVisitResult & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
