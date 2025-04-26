#!/bin/bash

# 이미지 이름 설정
IMAGE_NAME="sehyunsix/crawl-server"
TAG="latest"

echo "Building Docker image locally for Mac (arm64/aarch64)..."

# Mac의 경우 기본적으로 arm64 아키텍처 사용 (Apple Silicon)
docker build \
  -t ${IMAGE_NAME}:${TAG} \
  .

docker push ${IMAGE_NAME}:${TAG}


echo "Local build completed successfully!"
echo "You can run the image with: docker run -p 8080:8080 ${IMAGE_NAME}:${TAG}"

# 빌드된 이미지 정보 표시
echo -e "\nBuilt images:"
docker images | grep ${IMAGE_NAME}