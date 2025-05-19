"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitResultModel = exports.SubUrl = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * SubUrl 구현 클래스
 */
class SubUrl {
    /**
     * SubUrl 생성자
     * @param data 초기 데이터
     */
    constructor(data = {}) {
        this.visited = true;
        this.herfUrls = [];
        this.onclickUrls = [];
        this.crawledUrls = [];
        this.crawlStats = {
            total: 0,
            href: 0,
            onclick: 0,
            blocked_by_robots: 0,
            allowed_after_robots: 0
        };
        this.success = false;
        this.errors = [];
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
    toObject() {
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
exports.SubUrl = SubUrl;
// Mongoose 스키마 정의
const SubUrlSchema = new mongoose_1.Schema({
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
const VisitResultSchema = new mongoose_1.Schema({
    domain: { type: String, required: true, unique: true, index: true },
    suburl_list: [SubUrlSchema],
    favicon: String,
    updated_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'domains'
});
// 저장 전 updated_at 필드 자동 업데이트
VisitResultSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});
// 모델 생성 및 내보내기
exports.VisitResultModel = mongoose_1.default.model('domains', VisitResultSchema);
//# sourceMappingURL=VisitResult.js.map