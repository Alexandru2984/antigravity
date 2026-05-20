FROM nimlang/nim:latest-alpine AS builder
WORKDIR /app
COPY . .
RUN nim c -d:release main.nim

FROM alpine:latest
RUN apk add --no-cache libgcc
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 4064
CMD ["./main"]
