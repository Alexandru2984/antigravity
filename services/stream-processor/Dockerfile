# ── Build stage ──────────────────────────────────────────────
FROM sbtscala/scala-sbt:eclipse-temurin-21.0.2_13_1.9.9_2.13.13 AS builder
WORKDIR /app

COPY build.sbt project/ ./
RUN sbt update

COPY src/ ./src/
RUN sbt assembly

# ── Runtime stage ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
RUN adduser -D -s /bin/sh app
WORKDIR /app
COPY --from=builder /app/target/scala-2.13/*-assembly-*.jar ./stream-processor.jar

USER app
EXPOSE 4033

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4033/health || exit 1

CMD ["java", "-Xmx512m", "-jar", "stream-processor.jar"]
