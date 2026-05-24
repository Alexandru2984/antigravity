FROM alpine:3.22 AS builder
RUN apk add --no-cache git build-base clang llvm-dev bash
WORKDIR /opt
RUN git clone https://github.com/odin-lang/Odin
WORKDIR /opt/Odin
RUN ./build_odin.sh release
WORKDIR /app
COPY main.odin .
RUN /opt/Odin/odin build main.odin -file -out:main

FROM alpine:3.22
RUN apk add --no-cache libgcc libstdc++
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY --from=builder /app/main .
USER app
EXPOSE 4065
CMD ["./main"]
