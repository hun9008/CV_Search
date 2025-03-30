# Node.js 베이스 이미지 사용
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libu2f-udev \
  libxshmfence1 \
  libglu1-mesa \
  chromium \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/

# 작업 디렉토리 설정
WORKDIR /app


COPY . .
# 패키지 파일 복사
WORKDIR /app/crawl

RUN npm install

# 포트 노출 (API 서버용)
EXPOSE 8080

# 서버 실행 명령
CMD ["npm", "run", "crawl"]


