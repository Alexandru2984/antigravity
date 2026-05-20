# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app
COPY ConfigService.fsproj .
RUN dotnet restore
COPY *.fs ./
RUN dotnet publish -c Release -o /publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
RUN id -u app >/dev/null 2>&1 || (useradd -r -s /bin/false app && chown app:app /app)
USER app
COPY --from=builder /publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:4034
EXPOSE 4034
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4034/health || exit 1
ENTRYPOINT ["dotnet", "ConfigService.dll"]
