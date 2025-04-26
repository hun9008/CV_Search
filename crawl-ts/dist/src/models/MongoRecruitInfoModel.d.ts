import { ICacheDbRecruitInfo } from '@models/RecruitInfoModel';
import mongoose from 'mongoose';
export declare const MongoRecruitInfoModel: mongoose.Model<ICacheDbRecruitInfo, {}, {}, {}, mongoose.Document<unknown, {}, ICacheDbRecruitInfo> & ICacheDbRecruitInfo & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
