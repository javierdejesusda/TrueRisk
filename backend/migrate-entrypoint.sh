#!/bin/sh
set -e
export PYTHONPATH=/app
cd /app
echo "[migrate] Running database migrations..."
alembic upgrade head
echo "[migrate] Migrations complete."
