FROM hseeberger/scala-sbt:17.0.2_1.6.2_2.13.8 AS builder
WORKDIR /app
COPY . .
RUN sbt assembly

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/scala-2.13/*.jar app.jar
EXPOSE 4058
CMD ["java", "-jar", "app.jar"]
