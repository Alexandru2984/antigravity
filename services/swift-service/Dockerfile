FROM swift:5.9-jammy AS builder
WORKDIR /app
COPY . .
RUN swift build -c release

FROM swift:5.9-jammy-slim
WORKDIR /app
RUN useradd -r -s /usr/sbin/nologin app
COPY --from=builder /app/.build/release/App .
USER app
EXPOSE 4063
CMD ["./App"]
