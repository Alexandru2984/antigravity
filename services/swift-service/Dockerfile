FROM swift:5.9-jammy AS builder
WORKDIR /app
COPY . .
RUN swift build -c release

FROM swift:5.9-jammy-slim
WORKDIR /app
COPY --from=builder /app/.build/release/App .
EXPOSE 4063
CMD ["./App", "serve", "--hostname", "0.0.0.0"]
