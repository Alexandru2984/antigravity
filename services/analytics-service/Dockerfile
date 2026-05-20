# ── Build stage ──────────────────────────────────────────────
FROM python:3.12-slim AS builder
WORKDIR /app

RUN pip install poetry==1.8.4
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --no-dev --no-interaction

# ── Runtime stage ─────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

RUN useradd -r -s /bin/false app
COPY --from=builder /app/.venv /app/.venv
COPY app/ ./app/

ENV PATH="/app/.venv/bin:$PATH"
USER app
EXPOSE 4030

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4030/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4030"]
