FROM elixir:1.16-alpine AS test
RUN apk add --no-cache build-base git
WORKDIR /app
RUN mix local.hex --force && mix local.rebar --force
ENV MIX_ENV=test
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
      lib/auth_service/application.ex \
      lib/auth_service_web/endpoint.ex \
      lib/auth_service_web/router.ex \
      test/test_helper.exs \
      test/**/*.exs \
  && mix compile --warnings-as-errors \
  && JWT_PRIVATE_KEY=docker-build-test-key mix run --no-start -e 'token = AuthService.Token.generate_opaque(); unless Regex.match?(~r/\A[0-9a-f]{64}\z/, token), do: raise("opaque token format check failed")' \
  && touch /tmp/tests-passed

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
COPY --from=test /tmp/tests-passed /tmp/tests-passed

RUN mix compile
RUN mix release

# ── Stage 2: runtime ────────────────────────────────────────────
FROM alpine:3.19 AS runner

RUN apk add --no-cache libstdc++ openssl ncurses-libs

WORKDIR /app

RUN addgroup -S polymarket && adduser -S auth -G polymarket
USER auth

COPY --from=builder --chown=auth:polymarket /app/_build/prod/rel/auth_service ./

EXPOSE 4001
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4001}/health/ready" || exit 1

CMD ["/app/bin/auth_service", "start"]
