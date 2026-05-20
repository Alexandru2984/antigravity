# ── Builder ────────────────────────────────────────────────────
FROM gradle:8.8-jdk21 AS builder
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle buildFatJar --no-daemon

# ── Runner ─────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runner
RUN addgroup -S polymarket && adduser -S profile -G polymarket
WORKDIR /app
COPY --from=builder --chown=profile:polymarket /app/build/libs/profile-service-fat.jar ./app.jar
USER profile
EXPOSE 4027
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:4027/health || exit 1
CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
