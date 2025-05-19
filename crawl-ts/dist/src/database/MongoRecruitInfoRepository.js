"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoRecruitInfoRepository = void 0;
// repositories/MongoRecruitInfoRepository.ts
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config/config"));
const MongoRecruitInfoModel_1 = require("@models/MongoRecruitInfoModel");
const mongoose_1 = __importDefault(require("mongoose"));
class MongoRecruitInfoRepository {
    constructor() {
        this.recruitInfoModel = MongoRecruitInfoModel_1.MongoRecruitInfoModel;
    }
    async connect() {
        await mongoose_1.default.connect(config_1.default.DATABASE.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME, })
            .then(() => {
            logger_1.defaultLogger.debug('[DB]몽고 디비에 연결 성공했습니다.');
        })
            .catch((error) => {
            logger_1.defaultLogger.error('[DB]몽고 디비에 연결 실패했습니다.');
        });
    }
    async createRecruitInfo(recruitInfo) {
        return this.recruitInfoModel.create(recruitInfo);
    }
    async updateRecruitInfo(recruitInfo) {
        return this.recruitInfoModel.findByIdAndUpdate(recruitInfo._id, recruitInfo, { new: true }).exec();
    }
    async findByUrl(url) {
        return this.recruitInfoModel.findOne({ url }).exec();
    }
}
exports.MongoRecruitInfoRepository = MongoRecruitInfoRepository;
//# sourceMappingURL=MongoRecruitInfoRepository.js.map