FROM alpine:3.18
RUN apk add --no-cache lua5.3 lua-socket
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY main.lua .
USER app
EXPOSE 4059
CMD ["lua5.3", "main.lua"]
