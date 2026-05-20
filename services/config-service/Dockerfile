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
RUN useradd -r -s /bin/false app && chown app:app /app
USER app
COPY --from=builder /publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:4014
EXPOSE 4014
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4014/health || exit 1
ENTRYPOINT ["dotnet", "ConfigService.dll"]
