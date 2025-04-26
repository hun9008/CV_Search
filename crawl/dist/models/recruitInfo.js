"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// 채용 공고 스키마 정의
var RecruitInfoSchema = new Schema({
    // URL을 유니크 키로 사용
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // 회사명
    company_name: {
        type: String,
        required: true,
        index: true
    },
    // 모집 부서
    department: {
        type: String,
        required: true
    },
    // 모집 경력 (신입, 중급, 고급, 인턴)
    experience: {
        type: String,
        required: true
    },
    // 업무 내용 (상세 직무 설명)
    description: {
        type: String,
        required: true
    },
    // 근로 조건 (정규직, 계약직, 인턴)
    job_type: {
        type: String,
        required: true
    },
    // 공고 시작일
    start_date: {
        type: Date,
        required: true
    },
    // 공고 마감일
    end_date: {
        type: Date,
        required: true
    },
    // 지원 조건 (필수 역량 및 요구 사항)
    requirements: {
        type: String,
        required: true
    },
    // 우대 사항 (선택, 선호 역량)
    preferred_qualifications: {
        type: String
    },
    // 인재상 (선택, 원하는 인재상)
    ideal_candidate: {
        type: String
    },
    // 모집공고 전체 원본 텍스트 (크롤링 데이터 원본)
    raw_text: {
        type: String,
        required: true
    },
    // 공고 등록 날짜
    posted_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    // 공고 만료 날짜
    expires_at: {
        type: Date,
        index: true
    },
    // 파싱이 성공했는지 확인하는 필드
    success: {
        type: Boolean,
        required: true,
        default: false,
        index: true
    },
    // 파싱 실패 시 이유
    reason: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'recruitInfos'
});
// 텍스트 검색을 위한 인덱스 설정
RecruitInfoSchema.index({
    company_name: 'text',
    department: 'text',
    description: 'text',
    requirements: 'text',
    preferred_qualifications: 'text',
    raw_text: 'text'
});
// 메서드: URL로 채용 공고 조회
RecruitInfoSchema.statics.findByUrl = function (url) {
    return this.findOne({ url: url });
};
// 메서드: 키워드로 채용 공고 검색
RecruitInfoSchema.statics.searchByKeywords = function (keywords, options) {
    if (options === void 0) { options = {}; }
    var _a = options.limit, limit = _a === void 0 ? 10 : _a, _b = options.page, page = _b === void 0 ? 1 : _b, _c = options.sort, sort = _c === void 0 ? { posted_at: -1 } : _c;
    var skip = (page - 1) * limit;
    // 키워드를 공백으로 구분된 문자열로 변환
    var searchText = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    return this.find({ $text: { $search: searchText } }, { score: { $meta: 'textScore' } })
        .sort(__assign({ score: { $meta: 'textScore' } }, sort))
        .skip(skip)
        .limit(limit)
        .exec();
};
// 메서드: 만료된 채용 공고 조회
RecruitInfoSchema.statics.findExpired = function (options) {
    if (options === void 0) { options = {}; }
    var _a = options.limit, limit = _a === void 0 ? 10 : _a, _b = options.page, page = _b === void 0 ? 1 : _b;
    var skip = (page - 1) * limit;
    var now = new Date();
    return this.find({ expires_at: { $lte: now } })
        .sort({ expires_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
};
// 메서드: 곧 만료되는 채용 공고 조회
RecruitInfoSchema.statics.findExpiringIn = function (days, options) {
    if (days === void 0) { days = 7; }
    if (options === void 0) { options = {}; }
    var _a = options.limit, limit = _a === void 0 ? 10 : _a, _b = options.page, page = _b === void 0 ? 1 : _b;
    var skip = (page - 1) * limit;
    var now = new Date();
    var future = new Date();
    future.setDate(now.getDate() + days);
    return this.find({
        expires_at: {
            $gte: now,
            $lte: future
        }
    })
        .sort({ expires_at: 1 })
        .skip(skip)
        .limit(limit)
        .exec();
};
var RecruitInfo = mongoose.model('RecruitInfo', RecruitInfoSchema);
module.exports = RecruitInfo;
