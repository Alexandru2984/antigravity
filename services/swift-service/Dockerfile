FROM swift:5.8-focal AS builder
WORKDIR /app
COPY . .
RUN swift build -c release

FROM swift:5.8-focal-slim
WORKDIR /app
COPY --from=builder /app/.build/release/App .
EXPOSE 4063
CMD ["./App"]
