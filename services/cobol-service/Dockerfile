FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y gnucobol netcat-openbsd && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY billing.cob .
RUN cobc -x billing.cob -o billing
EXPOSE 4022
CMD while true; do (printf "HTTP/1.1 200 OK\r\nConnection: close\r\nContent-Type: text/plain\r\n\r\n"; ./billing) | nc -lp 4022 -N; done
