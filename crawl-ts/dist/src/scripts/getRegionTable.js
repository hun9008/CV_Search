"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function exportTableToJSON() {
    const connection = await promise_1.default.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: 3306,
    });
    const [rows] = await connection.execute('SELECT * FROM regions');
    const outputPath = path_1.default.join(__dirname, 'output.json');
    fs_1.default.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf-8');
    console.log(`✅ JSON 파일 저장 완료: ${outputPath}`);
    await connection.end();
}
exportTableToJSON().catch(console.error);
//# sourceMappingURL=getRegionTable.js.map