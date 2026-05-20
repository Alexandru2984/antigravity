FROM r-base:latest
RUN R -e "install.packages('plumber', repos='https://cloud.r-project.org/')"
WORKDIR /app
COPY . .
EXPOSE 4060
CMD ["Rscript", "main.R"]
