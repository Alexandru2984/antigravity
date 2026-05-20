FROM ruby:3.3-alpine AS builder
RUN apk add --no-cache build-base nodejs postgresql-dev yaml-dev
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install --jobs 4 --without development test

FROM ruby:3.3-alpine
RUN apk add --no-cache postgresql-libs yaml
RUN adduser -D -s /bin/sh app
WORKDIR /app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY . .
RUN chown -R app:app /app
USER app
EXPOSE 4026
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "4026"]
