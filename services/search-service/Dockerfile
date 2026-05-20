# ── Builder ────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
# Download deps first (cached layer)
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Runner ─────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runner
RUN addgroup -S polymarket && adduser -S search -G polymarket
WORKDIR /app
COPY --from=builder --chown=search:polymarket /app/target/search-service-0.1.0.jar ./app.jar
USER search
EXPOSE 4023
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:4023/health || exit 1
CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
