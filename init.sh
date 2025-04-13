#!/bin/bash
set -e

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Waiting for MySQL to be ready..."

until docker exec mysql-goodjob mysqladmin ping -uroot -p"$MYSQL_ROOT_PASSWORD" --silent; do
  echo "Waiting for MySQL..."
  sleep 2
done

echo "Applying schema.sql..."
docker exec -i mysql-goodjob mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < schema.sql
echo "Schema applied."