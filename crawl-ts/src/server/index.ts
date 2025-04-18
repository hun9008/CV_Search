import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import routes from './routes/api';
import { MongoDbConnector } from '../database/MongoDbConnector';

// 환경 변수 로드
dotenv.config();

// 서버 시작 함수
async function startServer() {
  const app = express();
  const db = new MongoDbConnector();

  try {
    await db.connect(); // ✅ 비동기 초기화 가능

    // 미들웨어
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    // 정적 파일
    app.use(express.static(path.join(__dirname, '../../public')));

    // 라우트 등록
    app.use('/api', routes);

    // 에러 핸들링
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer(); // 🚀 서버 실행

export default startServer;