"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawContentSchema = void 0;
const zod_1 = require("zod");
exports.RawContentSchema = zod_1.z.object({
    title: zod_1.z.string(),
    text: zod_1.z.string(),
    url: zod_1.z.string(),
    domain: zod_1.z.string().optional(),
    favicon: zod_1.z.string().optional(),
    crawledAt: zod_1.z.coerce.date().optional(), // 문자열/숫자도 date로 변환 가능
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
//# sourceMappingURL=RawContentModel.js.map