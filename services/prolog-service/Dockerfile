FROM swipl:latest
WORKDIR /app
COPY rules.pl .
EXPOSE 4055
CMD ["swipl", "rules.pl", "--foreground"]
