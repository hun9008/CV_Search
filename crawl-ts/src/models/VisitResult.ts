import mongoose, { Schema, Document } from 'mongoose';

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
export class SubUrl implements ISubUrl {
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
  herfUrls: string[] = [];
  onclickUrls: string[] = [];
  crawledUrls: string[] = [];
  crawlStats: {
    total: number;
    href: number;
    onclick: number;
    blocked_by_robots: number;
    allowed_after_robots: number;
  } = {
    total: 0,
    href: 0,
    onclick: 0,
    blocked_by_robots: 0,
    allowed_after_robots: 0
  };
  success: boolean = false;
  error?: string;
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    url?: string;
  }> = [];
  isRecruit?: boolean;

  /**
   * SubUrl 생성자
   * @param data 초기 데이터
   */
  constructor(data: Partial<ISubUrl> = {}) {
    this.url = data.url || '';
    this.domain = data.domain || '';
    this.visited = data.visited || false;
    this.visitedAt = data.visitedAt;
    this.discoveredAt = data.discoveredAt || new Date();
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.finalUrl = data.finalUrl;
    this.finalDomain = data.finalDomain;
    this.title = data.title;
    this.text = data.text;
    this.pageContent = data.pageContent;
    this.herfUrls = data.herfUrls || [];
    this.onclickUrls = data.onclickUrls || [];
    this.crawledUrls = data.crawledUrls || [];
    this.success = data.success || false;
    this.error = data.error;
    this.errors = data.errors || [];
    this.isRecruit = data.isRecruit;

    if (data.crawlStats) {
      this.crawlStats = {
        ...this.crawlStats,
        ...data.crawlStats
      };
    }
  }

  /**
   * 일반 객체로 변환
   */
  toObject(): Record<string, any> {
    return {
      url: this.url,
      domain: this.domain,
      visited: this.visited,
      visitedAt: this.visitedAt,
      discoveredAt: this.discoveredAt,
      created_at: this.created_at,
      updated_at: this.updated_at,
      finalUrl: this.finalUrl,
      finalDomain: this.finalDomain,
      title: this.title,
      text: this.text,
      pageContent: this.pageContent,
      herfUrls: this.herfUrls,
      onclickUrls: this.onclickUrls,
      crawledUrls: this.crawledUrls,
      crawlStats: this.crawlStats,
      success: this.success,
      error: this.error,
      errors: this.errors,
      isRecruit: this.isRecruit
    };
  }
}

// Mongoose 스키마 정의
const SubUrlSchema = new Schema({
  url: { type: String, required: true },
  domain: { type: String, required: true },
  visited: { type: Boolean, default: false },
  visitedAt: { type: Date },
  discoveredAt: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  finalUrl: { type: String },
  finalDomain: { type: String },
  title: { type: String },
  text: { type: String },
  pageContent: {
    title: { type: String },
    meta: { type: Map, of: String },
    text: { type: String }
  },
  herfUrls: [{ type: String }],
  onclickUrls: [{ type: String }],
  crawledUrls: [{ type: String }],
  crawlStats: {
    total: { type: Number, default: 0 },
    href: { type: Number, default: 0 },
    onclick: { type: Number, default: 0 },
    blocked_by_robots: { type: Number, default: 0 },
    allowed_after_robots: { type: Number, default: 0 }
  },
  success: { type: Boolean, default: false },
  error: { type: String },
  errors: [{
    type: { type: String },
    message: { type: String },
    stack: { type: String },
    url: { type: String }
  }],
  isRecruit: { type: Boolean }
});

const VisitResultSchema = new Schema({
  domain: { type: String, required: true, unique: true, index: true },
  suburl_list: [SubUrlSchema],
  favicon : String,
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
}, {
  timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
  collection : 'domains'
  });

// 저장 전 updated_at 필드 자동 업데이트
VisitResultSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// 모델 생성 및 내보내기
export const VisitResultModel = mongoose.model<IVisitResult>('domains', VisitResultSchema);
