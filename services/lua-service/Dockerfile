FROM alpine:3.18
RUN apk add --no-cache lua5.3 lua-socket
WORKDIR /app
COPY main.lua .
EXPOSE 4059
CMD ["lua5.3", "main.lua"]
