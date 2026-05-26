# ── Test stage ───────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS test
WORKDIR /app
COPY PaymentService.csproj .
COPY tests/PaymentService.Tests/PaymentService.Tests.csproj tests/PaymentService.Tests/
RUN dotnet restore tests/PaymentService.Tests/PaymentService.Tests.csproj
COPY . .
RUN dotnet test tests/PaymentService.Tests/PaymentService.Tests.csproj --no-restore \
    && touch /tmp/tests-passed

# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app
COPY PaymentService.csproj .
RUN dotnet restore
COPY . .
COPY --from=test /tmp/tests-passed /tmp/tests-passed
RUN dotnet publish -c Release -o /publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user
RUN id -u app >/dev/null 2>&1 || (useradd -r -s /bin/false app && chown app:app /app)
USER app

COPY --from=builder --chown=app:app /publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:4006
ENV PORT=4006
EXPOSE 4006

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD ["dotnet", "PaymentService.dll", "--health"]

ENTRYPOINT ["dotnet", "PaymentService.dll"]
