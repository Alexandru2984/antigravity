FROM fedora:latest AS builder
RUN dnf install -y nasm gcc glibc-devel
WORKDIR /app
COPY fib.asm main.c ./
RUN nasm -f elf64 fib.asm -o fib.o
RUN gcc main.c fib.o -o assembly-service

FROM fedora:latest
WORKDIR /app
COPY --from=builder /app/assembly-service .
EXPOSE 4021
CMD ["./assembly-service"]
