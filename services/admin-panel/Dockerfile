# ── Build stage ──────────────────────────────────────────────
FROM ruby:3.3-alpine AS builder

RUN apk add --no-cache build-base nodejs yarn postgresql-dev

WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install --jobs 4 --without development test

COPY . .
RUN bundle exec rails assets:precompile SECRET_KEY_BASE=dummy 2>/dev/null || true

# ── Runtime stage ─────────────────────────────────────────────
FROM ruby:3.3-alpine
RUN apk add --no-cache postgresql-libs nodejs

RUN adduser -D -s /bin/sh app
WORKDIR /app

COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app .

RUN chown -R app:app /app
USER app

ENV PORT=4036 RAILS_ENV=production SECRET_KEY_BASE=changeme

EXPOSE 4036

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4036/health || exit 1

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "4036"]
