#!/bin/bash
# Backup Script for Redis (Linux/Bash)
# Usage: ./scripts/backup-redis.sh

DATE=$(date +%Y-%m-%d_%H-%m)
BACKUP_FOLDER="backups"
FILENAME="mmm_redis_$DATE.rdb"

# Create backup folder if not exists
mkdir -p $BACKUP_FOLDER

echo "Triggering Redis BGSAVE..."
redis-cli BGSAVE

echo "Waiting for Redis to finish saving (simple 5s wait)..."
sleep 5

# Path to dump.rdb depends on Redis installation
# On Linux, usually /var/lib/redis/dump.rdb or current directory
REDIS_DUMP_PATH="dump.rdb"

if [ -f "$REDIS_DUMP_PATH" ]; then
    cp "$REDIS_DUMP_PATH" "$BACKUP_FOLDER/$FILENAME"
    echo "Success: $BACKUP_FOLDER/$FILENAME"
else
    echo "Error: Redis dump.rdb not found. Check redis config for dbfilename/dir."
    exit 1
fi
