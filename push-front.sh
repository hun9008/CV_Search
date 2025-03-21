#!/bin/bash

# Docker Hub 사용자 이름 설정
DOCKER_USERNAME="sehyunsix"  # 본인의 Docker Hub 사용자 이름으로 변경하세요
IMAGE_NAME="crawl-client"
TAG="latest"

# 이미지 빌드
echo "Building Docker image ${IMAGE_NAME}:${TAG}..."
docker build -t ${IMAGE_NAME}:${TAG} public/

# 태그 추가
echo "Tagging image as ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}..."
docker tag ${IMAGE_NAME}:${TAG} ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}

# Docker Hub 로그인
echo "Logging in to Docker Hub..."
docker login

# 이미지 푸시
echo "Pushing image to Docker Hub..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}

echo "Process completed successfully!"