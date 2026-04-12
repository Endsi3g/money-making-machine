#!/bin/bash
# Backup Script for PostgreSQL (Linux/Bash)
# Usage: ./scripts/backup-postgres.sh

DATE=$(date +%Y-%m-%d_%H-%m)
BACKUP_FOLDER="backups"
FILENAME="mmm_postgres_$DATE.sql"
COMPRESSED_FILE="$FILENAME.gz"

# Create backup folder if not exists
mkdir -p $BACKUP_FOLDER

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is missing"
    exit 1
fi

echo "Starting backup to $BACKUP_FOLDER/$FILENAME..."

# pg_dump requires postgresql-client
pg_dump "$DATABASE_URL" --no-owner --no-privileges > "$BACKUP_FOLDER/$FILENAME"

if [ $? -eq 0 ]; then
    echo "Backup successful. Compressing..."
    gzip "$BACKUP_FOLDER/$FILENAME"
    echo "Success: $BACKUP_FOLDER/$COMPRESSED_FILE"
else
    echo "Error: Backup failed"
    exit 1
fi
