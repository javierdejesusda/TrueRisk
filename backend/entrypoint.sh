#!/bin/sh
set -e
export PYTHONPATH=/app
cd /app

WORKERS=${WORKERS:-2}
echo "Starting gunicorn with $WORKERS uvicorn workers..."
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers "$WORKERS" \
  --bind 0.0.0.0:${PORT:-8000} \
  --timeout 120 \
  --graceful-timeout 30 \
  --keep-alive 5 \
  --access-logfile -
