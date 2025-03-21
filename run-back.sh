#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
DOCKER_USERNAME="sehyunsix"
IMAGE_NAME="crawl-server"
TAG="latest"
CONTAINER_NAME="backend-test"
PORT=8080  # 백엔드 서버 포트
API_TEST_ENDPOINT="/api/search?keywords=채용&limit=10&page=1"  # API 테스트 엔드포인트

echo -e "${YELLOW}=======================================================${NC}"
echo -e "${YELLOW}     백엔드 API 서버 테스트 실행 스크립트     ${NC}"
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
echo -e "\n${GREEN}[1/3] 백엔드 API 서버 컨테이너 실행 중...${NC}"
if docker run -d --name ${CONTAINER_NAME} -p ${PORT}:8080 ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}; then
    echo -e "${GREEN}✓ 컨테이너가 성공적으로 시작되었습니다.${NC}"
else
    echo -e "${RED}✗ 컨테이너 시작에 실패했습니다.${NC}"
    exit 1
fi

# 서버가 완전히 시작될 때까지 잠시 대기
echo -e "\n${GREEN}[2/3] 서버가 시작될 때까지 잠시 대기 중...${NC}"
echo -e "${BLUE}10초 동안 대기합니다...${NC}"
sleep 10

# API 테스트
echo -e "\n${GREEN}[3/3] API 테스트 중...${NC}"
API_URL="http://localhost:${PORT}${API_TEST_ENDPOINT}"
echo -e "${BLUE}API 테스트 URL: ${API_URL}${NC}"

# curl로 API 테스트 (출력 형식 정리)
echo -e "\n${YELLOW}API 응답:${NC}"
curl -s "${API_URL}" | python3 -m json.tool 2>/dev/null || curl -s "${API_URL}" | python -m json.tool 2>/dev/null || curl -s "${API_URL}"

# 브라우저에서 API 페이지 열기
echo -e "\n${BLUE}브라우저에서 API 테스트 페이지를 열겠습니까? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "${API_URL}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open > /dev/null; then
            xdg-open "${API_URL}"
        else
            echo -e "${YELLOW}! 자동으로 브라우저를 열 수 없습니다. 수동으로 ${API_URL} 에 접속해주세요.${NC}"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        start "${API_URL}"
    else
        echo -e "${YELLOW}! 지원되지 않는 OS입니다. 수동으로 ${API_URL} 에 접속해주세요.${NC}"
    fi
fi

# 컨테이너 상태 확인
echo -e "\n${GREEN}=======================================================${NC}"
echo -e "${GREEN}       백엔드 API 서버가 실행 중입니다       ${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo -e "\n컨테이너 상태:"
docker ps -f name=${CONTAINER_NAME}
echo -e "\n컨테이너 로그 확인:"
echo -e "${YELLOW}docker logs ${CONTAINER_NAME}${NC}"
echo -e "\n실시간 로그 확인:"
echo -e "${YELLOW}docker logs -f ${CONTAINER_NAME}${NC}"
echo -e "\n컨테이너 중지:"
echo -e "${YELLOW}docker stop ${CONTAINER_NAME}${NC}"
echo -e "\n컨테이너 제거:"
echo -e "${YELLOW}docker rm ${CONTAINER_NAME}${NC}"
echo -e "\nAPI 기본 URL:"
echo -e "${YELLOW}http://localhost:${PORT}/api${NC}"
echo -e "\n사용 가능한 API 엔드포인트:"
echo -e "${YELLOW}- GET /api/search - 검색 API${NC}"
echo -e "${YELLOW}- POST /api/parse-cv - 채용공고 분석 API${NC}"