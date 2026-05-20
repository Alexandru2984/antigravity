# ── Build stage ──────────────────────────────────────────────
FROM php:8.3-cli-alpine AS builder

RUN apk add --no-cache git unzip librdkafka-dev
RUN pecl install rdkafka && docker-php-ext-enable rdkafka

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .
RUN php artisan config:cache && php artisan route:cache

# ── Runtime stage ─────────────────────────────────────────────
FROM php:8.3-cli-alpine
RUN apk add --no-cache librdkafka

RUN adduser -D -s /bin/sh app

COPY --from=builder /usr/local/lib/php /usr/local/lib/php
COPY --from=builder /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d
COPY --from=builder /app /app

WORKDIR /app
USER app
EXPOSE 4029

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4029/health || exit 1

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=4029"]
