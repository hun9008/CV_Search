"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitInfoRepository = void 0;
const MysqlRecruitInfoRepository_1 = require("./MysqlRecruitInfoRepository");
const RedisUrlManager_1 = require("../url/RedisUrlManager");
class RecruitInfoRepository {
    constructor() {
        this.mysqlRepository = new MysqlRecruitInfoRepository_1.MysqlRecruitInfoRepository();
        this.urlManager = new RedisUrlManager_1.RedisUrlManager();
    }
    async initialize() {
        await this.urlManager.connect();
    }
    async createRecruitInfo(recruitInfo) {
        return await this.mysqlRepository.createRecruitInfo(recruitInfo).then((result) => {
            if (!result) {
                throw new Error('Failed to create recruit info');
            }
            return this.urlManager.setURLStatus(result.url, "hasRecruitInfo" /* URLSTAUS.HAS_RECRUITINFO */);
        })
            .catch((error) => {
            console.error('Error creating recruit info:', error);
            throw error;
        })
            .then(() => {
            return true;
        })
            .catch((error) => {
            console.error('Error setting URL status:', error);
            throw error;
        });
    }
}
exports.RecruitInfoRepository = RecruitInfoRepository;
//# sourceMappingURL=RecruitInfoRepository.js.map