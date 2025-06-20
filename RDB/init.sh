#!/bin/bash
set -e

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
  echo "MYSQL_ROOT_PASSWORD가 설정되지 않았습니다."
  exit 1
fi

echo "Waiting for MySQL to be ready..."

until docker exec mysql-goodjob sh -c "export MYSQL_PWD='$MYSQL_ROOT_PASSWORD'; mysqladmin ping -uroot --silent"; do
  echo "Waiting for MySQL..."
  sleep 2
done

echo "Applying schema.sql..."
docker exec -i mysql-goodjob sh -c "export MYSQL_PWD='$MYSQL_ROOT_PASSWORD'; mysql -uroot" < schema.sql
echo "[Success] schema.sql applied."