# ── Test stage ───────────────────────────────────────────────
FROM python:3.12-slim AS test
WORKDIR /app
RUN pip install poetry==1.8.4
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --only main --no-root --no-interaction
COPY analytics_service/ ./analytics_service/
COPY tests/ ./tests/
RUN poetry install --only main --no-interaction \
    && .venv/bin/python -m pip install ruff mypy pytest pytest-asyncio pytest-cov \
    && .venv/bin/ruff check . \
    && .venv/bin/mypy --ignore-missing-imports analytics_service tests \
    && .venv/bin/pytest --cov=analytics_service --cov-report=term-missing -q \
    && touch /tmp/tests-passed

# ── Build stage ──────────────────────────────────────────────
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install poetry==1.8.4
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --only main --no-root --no-interaction
COPY analytics_service/ ./analytics_service/
COPY --from=test /tmp/tests-passed /tmp/tests-passed
RUN poetry install --only main --no-interaction \
    && .venv/bin/python -m pip install --upgrade pip==26.1.1

FROM python:3.12-slim
RUN useradd -r -s /bin/false app
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/analytics_service /app/analytics_service
ENV PATH="/app/.venv/bin:$PATH"
ENV PORT=4010
USER app
EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=5s \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/health' % os.getenv('PORT', '4010'), timeout=2)"
CMD ["sh", "-c", "uvicorn analytics_service.main:app --host 0.0.0.0 --port ${PORT:-4010}"]
