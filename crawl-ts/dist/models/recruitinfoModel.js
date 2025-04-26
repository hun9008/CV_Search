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
exports.RecruitInfoModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RecruitInfoSchema = new mongoose_1.Schema({
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
    is_it_recruit_info: { type: Boolean, required: true },
    company_name: { type: String },
    department: { type: String },
    region_text: { type: String },
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
RecruitInfoSchema.statics.findByUrl = function (url) {
    return this.findOne({ url });
};
// 메서드: 키워드로 채용 공고 검색
RecruitInfoSchema.statics.searchByKeywords = function (keywords, options = {}) {
    const { limit = 10, page = 1, sort = { posted_at: -1 } } = options;
    const skip = (page - 1) * limit;
    // 키워드를 공백으로 구분된 문자열로 변환
    const searchText = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    return this.find({ $text: { $search: searchText } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, ...sort })
        .skip(skip)
        .limit(limit)
        .exec();
};
// 메서드: 만료된 채용 공고 조회
RecruitInfoSchema.statics.findExpired = function (options = {}) {
    const { limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;
    const now = new Date();
    return this.find({ apply_end_date: { $lte: now } })
        .sort({ apply_end_date: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
};
// 메서드: 곧 만료되는 채용 공고 조회
RecruitInfoSchema.statics.findExpiringIn = function (days = 7, options = {}) {
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
        .sort({ apply_end_date: 1 })
        .skip(skip)
        .limit(limit)
        .exec();
};
exports.RecruitInfoModel = mongoose_1.default.model('recruitInfos', RecruitInfoSchema);
//# sourceMappingURL=recruitinfoModel.js.map