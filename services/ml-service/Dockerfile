# ── Test stage ───────────────────────────────────────────────
FROM python:3.12-slim AS test
WORKDIR /app
RUN pip install poetry==1.8.4
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --only main --no-root --no-interaction
COPY ml_service/ ./ml_service/
COPY tests/ ./tests/
RUN poetry install --only main --no-interaction \
    && .venv/bin/python -m pip install ruff mypy pytest pytest-cov \
    && .venv/bin/ruff check . \
    && .venv/bin/mypy --ignore-missing-imports ml_service tests \
    && .venv/bin/pytest --cov=ml_service -q \
    && touch /tmp/tests-passed

# ── Build stage ──────────────────────────────────────────────
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install poetry==1.8.4
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --only main --no-root --no-interaction
COPY ml_service/ ./ml_service/
COPY --from=test /tmp/tests-passed /tmp/tests-passed
RUN poetry install --only main --no-interaction \
    && .venv/bin/python -m pip install --upgrade pip==26.1.1

FROM python:3.12-slim
RUN useradd -r -s /bin/false app
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/ml_service /app/ml_service
ENV PATH="/app/.venv/bin:$PATH"
ENV PORT=4012
USER app
EXPOSE 4012
HEALTHCHECK --interval=30s --timeout=5s \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/health' % os.getenv('PORT', '4012'), timeout=2)"
CMD ["sh", "-c", "uvicorn ml_service.main:app --host 0.0.0.0 --port ${PORT:-4012}"]
