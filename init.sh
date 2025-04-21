#!/bin/bash
set -e

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
  echo "MYSQL_ROOT_PASSWORD가 설정되지 않았습니다 (.env 또는 인자)."
  exit 1
fi

echo "Waiting for MySQL to be ready..."

until docker exec mysql-goodjob mysqladmin ping -uroot --password="$MYSQL_ROOT_PASSWORD" --silent; do
  echo "Waiting for MySQL..."
  sleep 2
done

echo "Applying schema.sql..."
docker exec -i mysql-goodjob mysql -uroot --password="$MYSQL_ROOT_PASSWORD" < schema.sql
echo "[Success] schema.sql applied."