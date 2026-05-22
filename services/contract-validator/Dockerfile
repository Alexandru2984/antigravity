FROM haskell:9.6 AS builder
WORKDIR /app
COPY package.yaml stack.yaml ./
RUN stack setup --install-ghc && stack build --only-dependencies
COPY . .
RUN mkdir -p /app/bin && stack build --copy-bins --local-bin-path /app/bin

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libgmp10 && rm -rf /var/lib/apt/lists/*
RUN useradd -r -s /bin/false app
WORKDIR /app
COPY --from=builder /app/bin/contract-validator /app/contract-validator
RUN chown -R app:app /app
USER app
EXPOSE 4035
CMD ["/app/contract-validator"]
