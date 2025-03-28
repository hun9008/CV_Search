# Node.js 베이스 이미지 사용
FROM ghcr.io/puppeteer/puppeteer:latest

# 작업 디렉토리 설정
WORKDIR /app


COPY . .
# 패키지 파일 복사
WORKDIR /app/crawl

USER root
RUN chown -Rh pptruser:pptruser /app
USER pptruser
RUN npm install

# 포트 노출 (API 서버용)
EXPOSE 8080

# 서버 실행 명령
CMD ["npm", "run", "crawl"]


