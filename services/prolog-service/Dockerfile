FROM swipl:9.2.9
WORKDIR /app
COPY . .
RUN useradd -r -s /bin/false app && chown -R app:app /app
USER app
EXPOSE 4055
CMD ["swipl", "server.pl", "--foreground"]
