FROM ruby:3.3.11-alpine AS builder
RUN apk add --no-cache build-base nodejs postgresql-dev yaml-dev
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle config set without 'development test' && bundle install --jobs 4

FROM ruby:3.3.11-alpine
RUN apk add --no-cache postgresql-libs tzdata yaml
RUN adduser -D -s /bin/sh app
WORKDIR /app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY . .
RUN chown -R app:app /app
USER app
ENV PORT=4016
EXPOSE 4016
CMD ["sh", "-c", "bundle exec rails server -b 0.0.0.0 -p ${PORT:-4016}"]
