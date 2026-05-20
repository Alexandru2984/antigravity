# ── Stage 1: build ──────────────────────────────────────────────
FROM elixir:1.16-alpine AS builder

RUN apk add --no-cache build-base git nodejs npm

WORKDIR /app

# Install hex + rebar
RUN mix local.hex --force && mix local.rebar --force

ENV MIX_ENV=prod

COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

COPY config/ config/
COPY lib/     lib/
COPY priv/    priv/

RUN mix compile
RUN mix release

# ── Stage 2: runtime ────────────────────────────────────────────
FROM alpine:3.19 AS runner

RUN apk add --no-cache libstdc++ openssl ncurses-libs

WORKDIR /app

RUN addgroup -S polymarket && adduser -S auth -G polymarket
USER auth

COPY --from=builder --chown=auth:polymarket /app/_build/prod/rel/auth_service ./

EXPOSE 4020
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:4020/health || exit 1

CMD ["/app/bin/auth_service", "start"]
