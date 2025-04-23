"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoRecruitInfoRepository = void 0;
class MongoRecruitInfoRepository {
    constructor(recruitInfoModel) {
        this.recruitInfoModel = recruitInfoModel;
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