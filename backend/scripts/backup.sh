#!/usr/bin/env bash
# backend/scripts/backup.sh — Automated PostgreSQL backup with retention
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_NAME="${POSTGRES_DB:-truerisk}"
DB_USER="${POSTGRES_USER:-truerisk}"
DB_HOST="${DB_HOST:-db}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting backup of ${DB_NAME} at $(date -Iseconds)"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" | gzip > "$FILENAME"
echo "[backup] Written: ${FILENAME} ($(du -h "$FILENAME" | cut -f1))"

# Prune old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[backup] Pruned backups older than ${RETENTION_DAYS} days"
