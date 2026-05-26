FROM elixir:1.16-alpine AS test
RUN apk add --no-cache build-base git
RUN mix local.hex --force && mix local.rebar --force
ENV MIX_ENV=test
WORKDIR /app
COPY mix.exs mix.lock ./
RUN mix deps.get && mix deps.compile
COPY config/ config/
COPY lib/ lib/
COPY test/ test/
RUN mix format --check-formatted \
      mix.exs \
      config/config.exs \
      config/runtime.exs \
      config/test.exs \
      lib/notification_service/application.ex \
      lib/notification_service/kafka_consumer.ex \
      lib/notification_service_web/channels/user_socket.ex \
      lib/notification_service_web/endpoint.ex \
      lib/notification_service_web/router.ex \
      test/test_helper.exs \
      test/**/*.exs \
  && mix test \
  && touch /tmp/tests-passed

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
COPY --from=test /tmp/tests-passed /tmp/tests-passed
RUN mix compile
RUN mix release

# ── Runner ──────────────────────────────────────────────────────
FROM alpine:3.20 AS runner
RUN apk add --no-cache libstdc++ openssl ncurses-libs
RUN addgroup -S polymarket && adduser -S notification -G polymarket
WORKDIR /app
COPY --from=builder --chown=notification:polymarket /app/_build/prod/rel/notification_service ./
USER notification
EXPOSE 4005
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4005}/health" || exit 1
CMD ["/app/bin/notification_service", "start"]
