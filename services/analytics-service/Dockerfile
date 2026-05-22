FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install poetry==1.8.4
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --only main --no-root --no-interaction
COPY analytics_service/ ./analytics_service/
RUN poetry install --only main --no-interaction \
    && .venv/bin/python -m pip install --upgrade pip==26.1.1

FROM python:3.12-slim
RUN useradd -r -s /bin/false app
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/analytics_service /app/analytics_service
ENV PATH="/app/.venv/bin:$PATH"
USER app
EXPOSE 4027
CMD ["uvicorn", "analytics_service.main:app", "--host", "0.0.0.0", "--port", "4027"]
