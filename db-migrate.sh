#!/bin/bash

LATEST_FILE=$(ls -1t ALTER_*.sql | head -n 1)

if [ -n "$LATEST_FILE" ]; then
  echo "Applying migration: $LATEST_FILE"
  docker exec -i mysql-goodjob mysql -uroot -proot goodjob < "$LATEST_FILE"
  echo "Migration applied"
else
  echo "⚠️ No ALTER files found."
fi