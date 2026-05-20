# ── Build stage ──────────────────────────────────────────────
FROM elixir:1.16-alpine AS builder

RUN apk add --no-cache git build-base

WORKDIR /app
ENV MIX_ENV=prod

COPY mix.exs mix.lock* ./
RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get --only prod
RUN mix deps.compile

COPY lib ./lib
COPY config ./config

RUN mix compile
RUN mix release

# ── Runtime stage ─────────────────────────────────────────────
FROM alpine:3.20
RUN apk add --no-cache libstdc++ ncurses-libs

RUN adduser -D -s /bin/sh app
WORKDIR /app
COPY --from=builder /app/_build/prod/rel/chat_service ./

USER app
EXPOSE 4011

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4011/health || exit 1

CMD ["./bin/chat_service", "start"]
