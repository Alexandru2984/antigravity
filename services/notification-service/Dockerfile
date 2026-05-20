# ── Builder ─────────────────────────────────────────────────────
FROM elixir:1.16-alpine AS builder
RUN apk add --no-cache build-base git
WORKDIR /app
RUN mix local.hex --force && mix local.rebar --force
ENV MIX_ENV=prod
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod && mix deps.compile
COPY config/ config/
COPY lib/     lib/
RUN mix release

# ── Runner ──────────────────────────────────────────────────────
FROM alpine:3.19 AS runner
RUN apk add --no-cache libstdc++ openssl ncurses-libs
RUN addgroup -S polymarket && adduser -S notification -G polymarket
WORKDIR /app
COPY --from=builder --chown=notification:polymarket /app/_build/prod/rel/notification_service ./
USER notification
EXPOSE 4025
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:4025/health || exit 1
CMD ["/app/bin/notification_service", "start"]
