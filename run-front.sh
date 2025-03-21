#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
DOCKER_USERNAME="sehyunsix"
IMAGE_NAME="crawl-client"
TAG="latest"
CONTAINER_NAME="frontend-test"
PORT=3000  # 호스트 포트 (원하는 포트로 변경할 수 있습니다)

echo -e "${YELLOW}=======================================================${NC}"
echo -e "${YELLOW}    프론트엔드 애플리케이션 테스트 실행 스크립트    ${NC}"
echo -e "${YELLOW}=======================================================${NC}"

# 이미 실행 중인 컨테이너가 있는지 확인하고 제거
if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo -e "\n${BLUE}기존에 실행 중인 컨테이너를 중지하고 제거합니다...${NC}"
    docker stop ${CONTAINER_NAME} >/dev/null 2>&1
    docker rm ${CONTAINER_NAME} >/dev/null 2>&1
fi

# 로컬에 이미지가 있는지 확인
if ! docker image inspect ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} >/dev/null 2>&1; then
    echo -e "\n${BLUE}이미지를 로컬에서 찾을 수 없습니다. Docker Hub에서 가져옵니다...${NC}"
    if ! docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}; then
        echo -e "${RED}✗ 이미지를 가져오지 못했습니다.${NC}"
        exit 1
    fi
fi

# 컨테이너 실행
echo -e "\n${GREEN}[1/2] 프론트엔드 컨테이너 실행 중...${NC}"
if docker run -d --name ${CONTAINER_NAME} -p ${PORT}:80  ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}; then
    echo -e "${GREEN}✓ 컨테이너가 성공적으로 시작되었습니다.${NC}"
else
    echo -e "${RED}✗ 컨테이너 시작에 실패했습니다.${NC}"
    exit 1
fi

# 웹 페이지 열기
echo -e "\n${GREEN}[2/2] 브라우저에서 웹 페이지 열기...${NC}"

# OS 확인 및 브라우저 열기
URL="http://localhost:${PORT}"
echo -e "${BLUE}접속 URL: ${URL}${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "${URL}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open "${URL}"
    else
        echo -e "${YELLOW}! 자동으로 브라우저를 열 수 없습니다. 수동으로 ${URL} 에 접속해주세요.${NC}"
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start "${URL}"
else
    echo -e "${YELLOW}! 지원되지 않는 OS입니다. 수동으로 ${URL} 에 접속해주세요.${NC}"
fi

echo -e "\n${GREEN}=======================================================${NC}"
echo -e "${GREEN}      프론트엔드 애플리케이션이 실행 중입니다      ${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo -e "\n컨테이너 로그 확인:"
echo -e "${YELLOW}docker logs ${CONTAINER_NAME}${NC}"
echo -e "\n컨테이너 중지:"
echo -e "${YELLOW}docker stop ${CONTAINER_NAME}${NC}"
echo -e "\n컨테이너 제거:"
echo -e "${YELLOW}docker rm ${CONTAINER_NAME}${NC}"