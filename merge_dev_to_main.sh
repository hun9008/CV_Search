#!/bin/bash

SERVICES=("spring" "crawl" "front" "RDB" "ES")

print_usage() {
  echo ""
  echo "Available services:"
  for service in "${SERVICES[@]}"; do
    echo "  - $service (from dev_${service} → main/${service}/)"
  done
  echo ""
  echo "Usage examples:"
  echo "  ./merge_dev_to_main.sh spring"
  echo "  ./merge_dev_to_main.sh all"
  echo ""
}

if [ -z "$1" ]; then
  echo "No service specified."
  print_usage
  read -p "Enter a service to merge (or 'all'): " INPUT
else
  INPUT=$1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Error: This script must be run from the 'main' branch. Current: '$CURRENT_BRANCH'"
  exit 1
fi

merge_service() {
  DEV_BRANCH="dev_$1"
  TARGET_DIR="$1/"

  echo "Merging $DEV_BRANCH into $TARGET_DIR..."

  # 기존 파일 제거
  if [ -d "$TARGET_DIR" ]; then
    echo "Cleaning up $TARGET_DIR before merging..."
    git rm -r --cached "$TARGET_DIR" || true
    rm -rf "$TARGET_DIR"
  fi

  echo "Merging $DEV_BRANCH into $TARGET_DIR..."

  # 기존 디렉토리 제거
  if [ -d "$TARGET_DIR" ]; then
    echo "Cleaning up $TARGET_DIR before merging..."
    git rm -r --cached "$TARGET_DIR" || true
    rm -rf "$TARGET_DIR"
  fi

  git read-tree --prefix="$TARGET_DIR" -u "$DEV_BRANCH"
  git add "$TARGET_DIR"  # ✅ 이거 추가!
  git commit -m "merge ${DEV_BRANCH} into ${TARGET_DIR}" || echo "Nothing to commit for $1"
}

if [ "$INPUT" == "all" ]; then
  for service in "${SERVICES[@]}"; do
    merge_service "$service"
  done
else
  if [[ ! " ${SERVICES[*]} " =~ " ${INPUT} " ]]; then
    echo "Invalid service: '${INPUT}'"
    print_usage
    exit 1
  fi
  merge_service "$INPUT"
fi

echo "Pushing to main..."
git push origin main
echo "Done."