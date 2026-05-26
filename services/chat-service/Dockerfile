FROM elixir:1.16-alpine AS test
RUN apk add --no-cache git build-base
WORKDIR /app
RUN mix local.hex --force && mix local.rebar --force
ENV MIX_ENV=test
COPY mix.exs mix.lock* ./
RUN mix deps.get && mix deps.compile
COPY config ./config
COPY lib ./lib
COPY test ./test
RUN mix format --check-formatted \
      config/config.exs \
      config/runtime.exs \
      config/test.exs \
      lib/chat_service/application.ex \
      lib/chat_service/messages.ex \
      lib/chat_service/repo.ex \
      lib/chat_service_web/channels/room_channel.ex \
      lib/chat_service_web/user_socket.ex \
      test/**/*.exs \
  && mix test \
  && touch /tmp/tests-passed

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
COPY --from=test /tmp/tests-passed /tmp/tests-passed

RUN mix compile
RUN mix release

# ── Runtime stage ─────────────────────────────────────────────
FROM alpine:3.20
RUN apk add --no-cache libstdc++ ncurses-libs

RUN adduser -D -s /bin/sh app
WORKDIR /app
COPY --from=builder --chown=app:app /app/_build/prod/rel/chat_service ./

USER app
EXPOSE 4011

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- "http://127.0.0.1:${PORT:-4011}/health" || exit 1

CMD ["./bin/chat_service", "start"]
