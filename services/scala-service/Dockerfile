FROM hseeberger/scala-sbt:17.0.2_1.6.2_2.13.8 AS builder
WORKDIR /app
COPY build.sbt ./
COPY project ./project
RUN sbt update
COPY src ./src
RUN sbt test assembly

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY --from=builder --chown=app:polymarket /app/target/scala-2.13/scala-service.jar app.jar
USER app
EXPOSE 4058
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD ["wget", "-qO-", "http://127.0.0.1:4058/health"]
CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
