#!/bin/bash
# CyberOps AIO SOC Database Backup Script
set -e

# Configurable variables (defaults with env fallback)
DB_HOST=${PG_HOST:-"localhost"}
DB_PORT=${PG_PORT:-5432}
DB_USER=${PG_USER:-"postgres"}
DB_NAME=${PG_DATABASE:-"cyberops_db"}
PGPASSWORD=${PG_PASSWORD:-"postgres"}
export PGPASSWORD

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql"
GZIP_FILE="${BACKUP_FILE}.gz"

# S3 configurations (Optional)
S3_BUCKET=${AWS_S3_BUCKET:-""}

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "=== [$(date)] Starting Database Backup for database: ${DB_NAME} ==="

# Execute pg_dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

# Compress backup file
gzip -f "$BACKUP_FILE"

echo "Backup successful: ${GZIP_FILE}"

# Upload to AWS S3 if bucket is configured
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading backup to AWS S3: s3://${S3_BUCKET}/db_backups/"
    aws s3 cp "$GZIP_FILE" "s3://${S3_BUCKET}/db_backups/$(basename "$GZIP_FILE")"
    echo "S3 Upload completed successfully."
else
    echo "AWS_S3_BUCKET not set. Keeping backup file locally only: ${GZIP_FILE}"
fi

echo "=== Backup Process Complete ==="
