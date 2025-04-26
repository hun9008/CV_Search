# Node.js 베이스 이미지 사용
FROM node:20-slim

# Chrome 및 Puppeteer에 필요한 모든 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libgtk2.0-0 \
  libnotify-dev \
  libgconf-2-4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  libnspr4 \
  libu2f-udev \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libxshmfence1 \
  libglu1-mesa \
  xauth \
  xvfb \
  chromium \
  wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 소스 코드 복사
COPY . .

# 패키지 설치
WORKDIR /app/crawl

RUN npm install

# Chrome 실행 환경변수 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 포트 노출 (API 서버용)
EXPOSE 8080

# 서버 실행 명령
CMD ["npm", "run", "crawl"]