FROM hseeberger/scala-sbt:17.0.2_1.6.2_3.1.1 AS builder
WORKDIR /app
COPY build.sbt .scalafmt.conf ./
COPY project ./project
RUN sbt update
COPY src/ ./src/
RUN sbt test assembly

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S polymarket && adduser -S app -G polymarket
WORKDIR /app
COPY --from=builder --chown=app:polymarket /app/target/scala-2.13/stream-processor.jar ./app.jar
USER app
EXPOSE 4013
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD ["wget", "-qO-", "http://127.0.0.1:4013/health"]
CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
