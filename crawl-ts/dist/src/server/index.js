"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const api_1 = __importDefault(require("./routes/api"));
const MongoDbConnector_1 = require("../database/MongoDbConnector");
// 환경 변수 로드
dotenv_1.default.config();
// 서버 시작 함수
async function startServer() {
    const app = (0, express_1.default)();
    const db = new MongoDbConnector_1.MongoDbConnector();
    try {
        await db.connect(); // ✅ 비동기 초기화 가능
        // 미들웨어
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        app.use((0, morgan_1.default)('dev'));
        // 정적 파일
        app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
        // 라우트 등록
        app.use('/api', api_1.default);
        // 에러 핸들링
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({
                success: false,
                message: 'Server Error',
                error: process.env.NODE_ENV === 'development' ? err.message : {}
            });
        });
        const PORT = process.env.SERVER_PORT || 3000;
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    }
    catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}
startServer(); // 🚀 서버 실행
exports.default = startServer;
//# sourceMappingURL=index.js.map