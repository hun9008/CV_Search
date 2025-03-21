# Node.js 베이스 이미지 사용
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /app

COPY . .
# 패키지 파일 복사
WORKDIR /app/crawl

# 의존성 설치
RUN npm install

# Puppeteer 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable



# 환경 변수 설정
ENV NODE_ENV=production

# 작업 디렉토리를 crawl 폴더로 이동
WORKDIR /app/crawl

# 포트 노출 (API 서버용)
EXPOSE 8080

# 서버 실행 명령
CMD ["npm", "run", "server"]

