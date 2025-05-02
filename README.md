# Local Test

```
./gradlew bootJar
docker-compose up -d --build
```
bootJar로 build/libs/ 경로에 실행 가능한 .jar 생성 후 docker 실행. 

Dockerfile에 해당 Jar 파일을 app.jar로 복사해 컨테이너 구성.

docker-compose로 컨테이너를 background로 실행.
(docker ps로 실행됬는지 확인)

# Deploy

dev_spring branch에 push 하면 github Action이 자동으로 EC2 인스턴스에 접속해 아래 작업을 수행.

1. EC2 접속 (github repo secrets에 EC2 ip, password 정의)
2. .env 파일 생성 및 repo secrets에서 DB에 대한 변수 삽입
3. spring boot build
4. jar 파일 복사
5. docker build & run

Github action에 관한 파일은 ~/.github/workflows/deploy.yml 에 작성해서 수행할 작업을 정의.

# Prometheus Metric 탐색

상단 “Graph” 탭 → Expression에 아래 중 하나 입력 후 Execute.

```
http_server_requests_seconds_count
jvm_memory_used_bytes
hikaricp_connections_active
process_cpu_usage
```

# Redis
```
# 1. 네트워크 생성
docker network create redis-net

# 2. Redis 실행 
docker run -d \
  --name redis \
  --network redis-net \
  -p 6379:6379 \
  redis \
  redis-server --bind 0.0.0.0 --protected-mode no

# 3. Redis Exporter 실행 
docker run -d \
--name redis_exporter \
--network redis-net \
-p 9121:9121 \
oliver006/redis_exporter \
--redis.addr=redis://redis:6379
```