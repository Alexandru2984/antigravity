FROM r-base:4.4.2
WORKDIR /app
COPY . .
RUN useradd -r -s /bin/false app && chown -R app:app /app
USER app
EXPOSE 4060
CMD ["Rscript", "main.R"]
