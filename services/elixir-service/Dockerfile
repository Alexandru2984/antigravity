FROM elixir:1.15-alpine AS builder
ENV MIX_ENV=prod
WORKDIR /app
RUN mix local.hex --force && mix local.rebar --force
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod && mix deps.compile
COPY config/ config/
COPY lib/ lib/
RUN mix compile
RUN mix release

FROM alpine:3.20
RUN apk add --no-cache libstdc++ ncurses-libs
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY --from=builder --chown=app:polymarket /app/_build/prod/rel/polyglot .
USER app
EXPOSE 4057
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4057}/health" || exit 1
CMD ["bin/polyglot", "start"]
