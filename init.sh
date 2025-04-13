#!/bin/bash
set -e

MYSQL_ROOT_PASSWORD="$1"

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
  echo "MYSQL_ROOT_PASSWORD가 전달되지 않았습니다."
  exit 1
fi

echo "Waiting for MySQL to be ready..."

until docker exec mysql-goodjob mysqladmin ping -uroot -p"$MYSQL_ROOT_PASSWORD" --silent; do
  echo "Waiting for MySQL..."
  sleep 2
done

echo "Applying schema.sql..."
docker exec -i mysql-goodjob mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < schema.sql
echo "[Success] schema.sql applied."