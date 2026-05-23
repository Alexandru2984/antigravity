# ── Build stage ──────────────────────────────────────────────
FROM php:8.3-cli-alpine AS builder

RUN apk add --no-cache git unzip librdkafka-dev autoconf build-base
RUN docker-php-ext-install pdo_mysql
RUN pecl install rdkafka && docker-php-ext-enable rdkafka

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .
RUN mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && php artisan --version

# ── Runtime stage ─────────────────────────────────────────────
FROM php:8.3-cli-alpine
RUN apk add --no-cache librdkafka

RUN adduser -D -s /bin/sh app

COPY --from=builder /usr/local/lib/php /usr/local/lib/php
COPY --from=builder /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d
COPY --from=builder /app /app

WORKDIR /app
RUN mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && chown -R app:app bootstrap/cache storage
USER app
EXPOSE 4009

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- "http://127.0.0.1:${PORT:-4009}/api/health" || exit 1

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-4009}"]
