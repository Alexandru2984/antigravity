FROM hseeberger/scala-sbt:17.0.2_1.6.2_3.1.1 AS builder
WORKDIR /app
COPY build.sbt ./
RUN sbt update
COPY src/ ./src/
RUN sbt compile

FROM eclipse-temurin:17-jre-alpine
RUN adduser -D -s /bin/sh app
WORKDIR /app
COPY --from=builder /app/target /app/target
COPY --from=builder /root/.sbt /root/.sbt
COPY --from=builder /root/.ivy2 /root/.ivy2
USER app
EXPOSE 4022
CMD ["sbt", "run"]
