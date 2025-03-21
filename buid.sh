docker build -t crawl-server .
docker run -p 8080:8080 --env-file crawl/.env sehyunsix/crawl-server
