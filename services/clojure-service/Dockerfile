FROM clojure:openjdk-17-lein AS builder
WORKDIR /app
COPY project.clj .
RUN lein deps
COPY . .
RUN lein uberjar

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY --from=builder /app/target/uberjar/clojure-service-0.1.0-SNAPSHOT-standalone.jar app.jar
USER app
EXPOSE 4023
CMD ["java", "-jar", "app.jar"]
