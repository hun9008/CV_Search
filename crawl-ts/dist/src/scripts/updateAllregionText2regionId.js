"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const Transform_1 = require("../trasnform/Transform");
const MysqlRecruitInfoModel_1 = require("../models/MysqlRecruitInfoModel");
const MysqlRecruitInfoModel_2 = require("../models/MysqlRecruitInfoModel");
const GeminiParser_1 = require("../parser/GeminiParser");
(async () => {
    const paser = new GeminiParser_1.GeminiParser();
    MysqlRecruitInfoModel_2.MysqlRecruitInfoSequelize.findAll({ attributes: ['id', 'region_text'] })
        .then(async (results) => {
        for (const result of results) {
            const region_text = result.region_text;
            const region_id = await (0, Transform_1.regionText2RegionIdsAi)(paser, region_text);
            if (region_id.length > 0) {
                for (const id of region_id) {
                    await MysqlRecruitInfoModel_1.MysqlJobRegionSequelize.upsert({
                        job_id: result.id,
                        region_id: id,
                    });
                }
            }
        }
    });
})();
//# sourceMappingURL=updateAllregionText2regionId.js.map