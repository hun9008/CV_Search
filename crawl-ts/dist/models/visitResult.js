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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitResult = exports.VisitResultModel = exports.SubUrl = void 0;
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
            errors: this.errors
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
        }]
});
const VisitResultSchema = new mongoose_1.Schema({
    domain: { type: String, required: true, unique: true, index: true },
    suburl_list: [SubUrlSchema],
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
/**
 * VisitResult 클래스 구현 - Mongoose 모델을 사용
 */
class VisitResult {
    /**
     * VisitResult 생성자
     * @param data 초기 데이터
     */
    constructor(data = {}) {
        this.domain = data.domain || '';
        this.suburl_list = data.suburl_list || [];
        this.updated_at = data.updated_at || new Date();
        this.created_at = data.created_at || new Date();
    }
    /**
     * 저장 메서드
     */
    async save() {
        this.updated_at = new Date();
        await exports.VisitResultModel.findOneAndUpdate({ domain: this.domain }, {
            domain: this.domain,
            suburl_list: this.suburl_list.map(item => item.toObject()),
            updated_at: this.updated_at,
            $setOnInsert: { created_at: this.created_at }
        }, { upsert: true, new: true });
    }
    /**
     * 정적 메서드: 도메인으로 문서 찾기
     */
    static async findOne(query) {
        const doc = await exports.VisitResultModel.findOne(query);
        if (!doc)
            return null;
        return new VisitResult({
            domain: doc.domain,
            suburl_list: doc.suburl_list,
            updated_at: doc.updated_at,
            created_at: doc.created_at
        });
    }
    /**
     * 정적 메서드: 모든 문서 찾기
     */
    static async find(query, projection) {
        const docs = await exports.VisitResultModel.find(query, projection);
        return docs.map(doc => ({
            domain: doc.domain,
            _id: doc._id,
            ...(projection ? {} : {
                suburl_list: doc.suburl_list,
                updated_at: doc.updated_at,
                created_at: doc.created_at
            })
        }));
    }
    /**
     * 정적 메서드: 문서 개수 세기
     */
    static async countDocuments(query) {
        return await exports.VisitResultModel.countDocuments(query || {});
    }
}
exports.VisitResult = VisitResult;
//# sourceMappingURL=visitResult.js.map