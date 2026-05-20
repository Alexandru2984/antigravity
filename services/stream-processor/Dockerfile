FROM hseeberger/scala-sbt:17.0.2_1.6.2_3.1.1
RUN useradd -m -s /bin/sh app
WORKDIR /app
COPY build.sbt ./
RUN sbt update
COPY src/ ./src/
RUN sbt compile
USER app
EXPOSE 4022
CMD ["sbt", "run"]
