#!/bin/bash

# ========================================
# Merge dev_<service> into main/<service>/
# 덮어쓰기 방식: 기존 디렉토리 삭제 → 브랜치 내용 복사
# ========================================

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
  SERVICE=$1
  DEV_BRANCH="dev_${SERVICE}"
  TARGET_DIR="${SERVICE}"
  TMP_DIR="tmp_merge_${SERVICE}"

  echo ""
  echo "=== Merging $DEV_BRANCH → $TARGET_DIR ==="

  echo "Deleting old $TARGET_DIR..."
  git rm -r --cached "$TARGET_DIR" 2>/dev/null || true
  [ -d "$TARGET_DIR" ] && rm -rf "$TARGET_DIR"

  echo "Fetching latest dev branch..."
  git fetch origin "dev_${SERVICE}":"dev_${SERVICE}" --update-head-ok 

  echo "Checking out $DEV_BRANCH to $TMP_DIR..."
  git worktree add "$TMP_DIR" "$DEV_BRANCH"

  echo "Copying files from $DEV_BRANCH to $TARGET_DIR..."
  mkdir -p "$TARGET_DIR"
  rsync -a --delete --exclude='.git' "$TMP_DIR"/ "$TARGET_DIR"/

  echo "Cleaning up worktree..."
  git worktree remove "$TMP_DIR" --force
  rm -rf ".git/worktrees/tmp_merge_${SERVICE}" 
  
  echo "Staging and committing $TARGET_DIR..."
  git add "$TARGET_DIR"
  git commit -m "Reset $TARGET_DIR with $DEV_BRANCH" || echo "Nothing to commit for $SERVICE"
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

echo ""
echo "Previewing changes before pushing:"
git status

read -p "Proceed with git push to origin/main? (y/N): " CONFIRM
if [[ "$CONFIRM" == "y" || "$CONFIRM" == "Y" ]]; then
  echo "Pushing to main branch..."
  git push origin main
  echo "Done."
else
  echo "Push cancelled."
fi