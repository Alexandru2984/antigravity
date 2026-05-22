FROM nimlang/nim:latest-alpine AS builder
WORKDIR /app
COPY . .
RUN nim c -d:release main.nim

FROM alpine:latest
RUN apk add --no-cache libgcc
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY --from=builder /app/main .
USER app
EXPOSE 4064
CMD ["./main"]
