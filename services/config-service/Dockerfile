# ── Test stage ───────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS test
WORKDIR /app
COPY ConfigService.fsproj ./
COPY tests/ConfigService.Tests/ConfigService.Tests.fsproj tests/ConfigService.Tests/
RUN dotnet restore tests/ConfigService.Tests/ConfigService.Tests.fsproj
COPY . .
RUN dotnet test tests/ConfigService.Tests/ConfigService.Tests.fsproj --no-restore --filter "Category!=Integration" \
    && touch /tmp/tests-passed

# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app
COPY ConfigService.fsproj .
RUN dotnet restore
COPY *.fs ./
COPY --from=test /tmp/tests-passed /tmp/tests-passed
RUN dotnet publish -c Release -o /publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
RUN id -u app >/dev/null 2>&1 || (useradd -r -s /bin/false app && chown app:app /app)
USER app
COPY --from=builder --chown=app:app /publish .
ENV PORT=4014
EXPOSE 4014
HEALTHCHECK --interval=30s --timeout=5s \
    CMD curl -fsS "http://127.0.0.1:${PORT:-4014}/health" || exit 1
ENTRYPOINT ["dotnet", "ConfigService.dll"]
