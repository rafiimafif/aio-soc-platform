#!/bin/bash
# CyberOps AIO SOC Database Restore Script
set -e

# Configurable variables
DB_HOST=${PG_HOST:-"localhost"}
DB_PORT=${PG_PORT:-5432}
DB_USER=${PG_USER:-"postgres"}
DB_NAME=${PG_DATABASE:-"cyberops_db"}
PGPASSWORD=${PG_PASSWORD:-"postgres"}
export PGPASSWORD

BACKUP_FILE=$1
S3_BUCKET=${AWS_S3_BUCKET:-""}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <path_to_backup_file_or_s3_url>"
    echo "Example: $0 ./backups/cyberops_db_backup_20260727.sql.gz"
    echo "Example: $0 s3://my-bucket/db_backups/cyberops_db_backup_20260727.sql.gz"
    exit 1
fi

echo "=== [$(date)] Starting Database Restore ==="

# Download from S3 if file starts with s3://
if [[ "$BACKUP_FILE" =~ ^s3:// ]]; then
    TEMP_DIR="./backups/temp_restore"
    mkdir -p "$TEMP_DIR"
    S3_FILE=$(basename "$BACKUP_FILE")
    LOCAL_FILE="${TEMP_DIR}/${S3_FILE}"
    echo "Downloading backup from S3: $BACKUP_FILE -> $LOCAL_FILE"
    aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"
    BACKUP_FILE="$LOCAL_FILE"
fi

# Ensure backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Decompress backup file if zipped
if [[ "$BACKUP_FILE" =~ \.gz$ ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    RESTORE_TARGET="${BACKUP_FILE%.gz}"
else
    RESTORE_TARGET="$BACKUP_FILE"
fi

# Execute psql restore
echo "Restoring database ${DB_NAME} from ${RESTORE_TARGET}..."
# Drop existing tables to avoid conflict
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DROP TABLE IF EXISTS incidents CASCADE;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$RESTORE_TARGET"

# Cleanup decompressed temp file if we decompressed it
if [[ "$BACKUP_FILE" =~ \.gz$ ]]; then
    rm -f "$RESTORE_TARGET"
fi

# Cleanup temp S3 download folder
if [[ "$1" =~ ^s3:// ]]; then
    rm -rf "./backups/temp_restore"
fi

echo "=== Database Restore Complete ==="
