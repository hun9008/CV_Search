import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function exportTableToJSON() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: 3306,
  });

  const [rows] = await connection.execute('SELECT * FROM regions');

  const outputPath = path.join(__dirname, 'output.json');
  fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf-8');

  console.log(`✅ JSON 파일 저장 완료: ${outputPath}`);
  await connection.end();
}

exportTableToJSON().catch(console.error);