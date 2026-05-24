FROM alpine:3.22 AS builder
RUN apk add --no-cache zig
WORKDIR /app
COPY . .
RUN zig build-exe src/main.zig -O ReleaseSafe

FROM alpine:3.22
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY --from=builder /app/main .
USER app
EXPOSE 4062
CMD ["./main"]
