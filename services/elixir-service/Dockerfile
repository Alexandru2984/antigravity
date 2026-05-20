FROM elixir:1.15-alpine AS builder
ENV MIX_ENV=prod
WORKDIR /app
RUN mix local.hex --force && mix local.rebar --force
COPY mix.exs .
RUN mix deps.get
COPY . .
RUN mix release

FROM alpine:3.18
RUN apk add --no-cache libstdc++ ncurses-libs
WORKDIR /app
# Copiem tot folderul de release pentru siguranță
COPY --from=builder /app/_build/prod/rel/polyglot .
EXPOSE 4057
CMD ["bin/polyglot", "start"]
