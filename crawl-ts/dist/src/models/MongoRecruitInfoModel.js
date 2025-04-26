"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoRecruitInfoModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const RecruitInfoSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
    is_public: { type: Boolean, required: true, default: false },
    favicon: { type: String },
    is_parse_success: { type: Boolean, required: true },
    is_recruit_info: { type: Boolean, required: true },
    is_it_recruit_info: { type: Boolean, required: true },
    company_name: { type: String },
    department: { type: String },
    region_text: { type: String },
    region_id: { type: String },
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
    collection: process.env.MONGODB_RECRUIT_COLLECTION,
});
exports.MongoRecruitInfoModel = mongoose_2.default.model('recruitInfos', RecruitInfoSchema);
//# sourceMappingURL=MongoRecruitInfoModel.js.map