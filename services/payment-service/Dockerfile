# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app

COPY PaymentService.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user
RUN useradd -r -s /bin/false app && chown app:app /app
USER app

COPY --from=builder /publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:4026
EXPOSE 4026

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD wget -qO- http://localhost:4026/health || exit 1

ENTRYPOINT ["dotnet", "PaymentService.dll"]
