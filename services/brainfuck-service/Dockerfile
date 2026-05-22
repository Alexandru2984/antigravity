FROM gcc:13-bookworm AS builder
WORKDIR /app
COPY bf.c .
RUN gcc -O3 -Wall -Wextra -Werror bf.c -o bf

FROM debian:bookworm-slim
RUN useradd -r -s /bin/false app
WORKDIR /app
COPY --from=builder /app/bf .
COPY service.bf .
RUN chown -R app:app /app
USER app
EXPOSE 4020
CMD ["./bf", "service.bf"]
