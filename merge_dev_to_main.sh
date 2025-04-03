#!/bin/bash

# ========================================
# Merge dev_<service> into main/<service>/
# Usage:
#   ./merge_dev_to_main.sh spring
#   ./merge_dev_to_main.sh all
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

if [ "$INPUT" == "all" ]; then
  for service in "${SERVICES[@]}"; do
    DEV_BRANCH="dev_${service}"
    TARGET_DIR="${service}/"

    echo "Merging $DEV_BRANCH into $TARGET_DIR..."
    git read-tree --prefix="$TARGET_DIR" -u "$DEV_BRANCH"
    git commit -m "merge ${DEV_BRANCH} into ${TARGET_DIR}"
  done
else
  if [[ ! " ${SERVICES[*]} " =~ " ${INPUT} " ]]; then
    echo "Invalid service: '${INPUT}'"
    print_usage
    exit 1
  fi

  DEV_BRANCH="dev_${INPUT}"
  TARGET_DIR="${INPUT}/"

  echo "Merging $DEV_BRANCH into $TARGET_DIR..."
  git read-tree --prefix="$TARGET_DIR" -u "$DEV_BRANCH"
  git commit -m "merge ${DEV_BRANCH} into ${TARGET_DIR}"
fi

echo "Pushing to main..."
git push origin main
echo "Done."