FROM haskell:9.4 AS builder
WORKDIR /app
RUN cabal update
RUN cabal install --lib wai warp http-types aeson
COPY . .
RUN ghc -o main Main.hs

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y libgmp10 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 4065
CMD ["./main"]
