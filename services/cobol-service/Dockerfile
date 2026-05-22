FROM debian:bookworm-slim AS builder
RUN apt-get update && apt-get install -y \
    gcc gnucobol libcob4-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY billing.cob server.c ./
RUN cobc -x billing.cob -o billing
RUN gcc -O2 -Wall -Wextra -Werror server.c -o cobol-ledger-service

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libcob4 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -r -s /bin/false app
WORKDIR /app
COPY --from=builder /app/billing .
COPY --from=builder /app/cobol-ledger-service .
RUN chown -R app:app /app
USER app
EXPOSE 4022
CMD ["./cobol-ledger-service"]
