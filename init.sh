#!/bin/bash
set -e

echo "Waiting for MySQL to be ready..."

until mysqladmin ping -u root -p"$MYSQL_ROOT_PASSWORD" --silent; do
    sleep 1
done

echo "Running schema.sql..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" < /schema.sql
echo "schema.sql applied."

exec docker-entrypoint.sh "$@"