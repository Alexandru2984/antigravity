# ── Build stage ──────────────────────────────────────────────
FROM ubuntu:24.04 AS builder

RUN apt-get update && apt-get install -y \
    cmake ninja-build git g++ pkg-config \
    libssl-dev libjsoncpp-dev uuid-dev zlib1g-dev \
    libc-ares-dev libvips-dev libcurl4-openssl-dev \
    librdkafka-dev \
    && rm -rf /var/lib/apt/lists/*

# Build Drogon from source (pinned version)
WORKDIR /deps
RUN git clone --depth 1 --branch v1.9.6 https://github.com/drogonframework/drogon.git && \
    cd drogon && git submodule update --init && \
    mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_EXAMPLES=OFF .. && \
    make -j$(nproc) && make install

WORKDIR /app
COPY CMakeLists.txt .
COPY src/ ./src/

RUN cmake -DCMAKE_BUILD_TYPE=Release -S . -B build && \
    cmake --build build --target image-service -j$(nproc)

# ── Runtime stage ─────────────────────────────────────────────
FROM ubuntu:24.04 AS runtime

RUN apt-get update && apt-get install -y \
    libvips libcurl4 librdkafka1 librdkafka++1 libjsoncpp25 libssl3 libc-ares2 wget \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -r -s /bin/false app

WORKDIR /app
COPY --from=builder /app/build/image-service .

USER app
EXPOSE 4024

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD wget -qO- http://localhost:4024/health || exit 1

CMD ["./image-service"]
