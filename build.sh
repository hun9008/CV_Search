#!/bin/bash

# Docker Hub 사용자 이름 설정
DOCKER_USERNAME="sehyunsix"  # 본인의 Docker Hub 사용자 이름으로 변경하세요
IMAGE_NAME="crawl-server"
TAG="latest"

echo "Building and pushing Docker image for linux/amd64 platform..."
docker buildx build --platform linux/amd64 \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} \
  --push \
  .

echo "Process completed successfully!"