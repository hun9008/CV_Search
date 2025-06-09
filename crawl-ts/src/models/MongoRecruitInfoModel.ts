// models/recruitinfoModel.ts
import { Schema } from 'mongoose';
import mongoose  from 'mongoose';

interface IRecruitInfo {
  title: string;
  url: string;
  text: string;
  created_at: Date;
  updated_at: Date;
  is_public: boolean;
  favicon?: string;
  is_parse_success: boolean;
  is_recruit_info: boolean;
  is_it_recruit_info: boolean;
  company_name?: string;
  department?: string;
  region_text?: string;
  region_id?: string;
  require_experience?: string;

  job_description?: string;
  job_type?: string;
  apply_start_date?: string;
  apply_end_date?: string;
  requirements?: string;
  preferred_qualifications?: string;
  ideal_candidate?: string;
}

interface Domain {
  url?: string;
  domain : string;
}

const DomainSchema = new Schema<Domain>({
  domain: { type: String, required: true, unique: true, index: true },
  url: { type: String, required: true }
}, {
  timestamps: false,
  collection: process.env.MONGODB_DOMAIN_COLLECTION,
});

const RecruitInfoSchema = new Schema<IRecruitInfo>({
  title: { type: String, required: true },
  url: { type: String, required: true, unique: true, index: true },
  text: { type: String, required: true },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
  is_public: { type: Boolean, required: true, default: false },
  favicon: { type: String },
  is_parse_success: { type: Boolean, required: true },
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
  collection: process.env.MONGODB_RECRUIT_COLLECTION,
});


export const MongoDomainModel = mongoose.model<Domain>('domains', DomainSchema);
export const MongoRecruitInfoModel = mongoose.model<IRecruitInfo>('recruitInfos', RecruitInfoSchema);
