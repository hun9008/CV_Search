#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 명령어 확인
if [ "$1" = "start" ]; then
    echo -e "${BLUE}서비스를 시작합니다...${NC}"
    docker-compose pull
    docker-compose up -d
    echo -e "${GREEN}서비스가 시작되었습니다.${NC}"

    # 서비스 상태 표시
    echo -e "\n${YELLOW}실행 중인 컨테이너:${NC}"
    docker-compose ps

elif [ "$1" = "stop" ]; then
    echo -e "${BLUE}서비스를 중지합니다...${NC}"
    docker-compose down
    echo -e "${GREEN}서비스가 중지되었습니다.${NC}"

elif [ "$1" = "restart" ]; then
    echo -e "${BLUE}서비스를 재시작합니다...${NC}"
    docker-compose down
    docker-compose up -d
    echo -e "${GREEN}서비스가 재시작되었습니다.${NC}"

    # 서비스 상태 표시
    echo -e "\n${YELLOW}실행 중인 컨테이너:${NC}"
    docker-compose ps

elif [ "$1" = "logs" ]; then
    # 두 번째 인자가 있으면 해당 서비스의 로그를 표시
    if [ -n "$2" ]; then
        echo -e "${BLUE}${2} 서비스의 로그를 표시합니다...${NC}"
        docker-compose logs -f "$2"
    else
        echo -e "${BLUE}모든 서비스의 로그를 표시합니다...${NC}"
        docker-compose logs -f
    fi

elif [ "$1" = "status" ]; then
    echo -e "${YELLOW}서비스 상태:${NC}"
    docker-compose ps

elif [ "$1" = "update" ]; then
    echo -e "${BLUE}서비스를 업데이트합니다...${NC}"
    docker-compose pull
    docker-compose up -d
    echo -e "${GREEN}서비스가 업데이트되었습니다.${NC}"

else
    echo -e "${YELLOW}사용법: $0 {start|stop|restart|logs|status|update}${NC}"
    echo -e "  start   - 서비스 시작"
    echo -e "  stop    - 서비스 중지"
    echo -e "  restart - 서비스 재시작"
    echo -e "  logs    - 로그 표시 (옵션: 서비스 이름)"
    echo -e "  status  - 서비스 상태 확인"
    echo -e "  update  - 서비스 업데이트"
fi