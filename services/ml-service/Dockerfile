FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install poetry==1.8.4
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --no-dev --no-interaction || true
COPY ml_service/ ./ml_service/
RUN poetry install --no-dev --no-interaction

FROM python:3.12-slim
RUN useradd -r -s /bin/false app
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/ml_service /app/ml_service
ENV PATH="/app/.venv/bin:$PATH"
USER app
EXPOSE 4028
CMD ["uvicorn", "ml_service.main:app", "--host", "0.0.0.0", "--port", "4028"]
