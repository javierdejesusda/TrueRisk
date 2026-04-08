FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only torch first to keep image small (~200MB vs ~2.5GB CUDA)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY pyproject.toml .
RUN pip install --no-cache-dir .
RUN pip install --no-cache-dir ".[ml-extras]" || echo "Optional ml-extras not available"

COPY . .

RUN chmod +x entrypoint.sh migrate-entrypoint.sh

RUN useradd --create-home --shell /bin/bash appuser \
    && rm -rf /app/lightning_logs \
    && mkdir -p /tmp/lightning_logs \
    && ln -sf /tmp/lightning_logs /app/lightning_logs \
    && chown -R appuser:appuser /tmp/lightning_logs

ENV PL_TRAINER_DEFAULT_ROOT_DIR=/tmp/lightning_logs
ENV LIGHTNING_LOGS_DIR=/tmp/lightning_logs

USER appuser

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
