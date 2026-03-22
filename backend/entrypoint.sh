#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
alembic upgrade head

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
