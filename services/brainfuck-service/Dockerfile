FROM gcc:latest AS builder
WORKDIR /app
COPY bf.c .
RUN gcc -O3 bf.c -o bf

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/bf .
COPY service.bf .
EXPOSE 4020
CMD while true; do (printf "HTTP/1.1 200 OK\r\nConnection: close\r\nContent-Type: text/plain\r\n\r\n"; ./bf service.bf) | nc -lp 4020 -N; done
