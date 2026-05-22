FROM php:8.2-cli-alpine
WORKDIR /app
RUN addgroup -S polymarket && adduser -S app -G polymarket
COPY index.php .
USER app
EXPOSE 4061
CMD ["php", "-S", "0.0.0.0:4061"]
