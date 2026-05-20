FROM alpine:latest AS builder
RUN apk add --no-cache git build-base clang15 llvm15-dev bash
WORKDIR /opt
RUN git clone https://github.com/odin-lang/Odin
WORKDIR /opt/Odin
RUN ./build_odin.sh release
WORKDIR /app
COPY main.odin .
RUN /opt/Odin/odin build main.odin -file -out:main

FROM alpine:latest
RUN apk add --no-cache libgcc libstdc++
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 4065
CMD ["./main"]
