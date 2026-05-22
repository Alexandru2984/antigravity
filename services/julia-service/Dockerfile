FROM julia:1.10-bookworm
WORKDIR /app
ENV JULIA_DEPOT_PATH=/opt/julia
RUN julia -e 'using Pkg; Pkg.add(["HTTP", "JSON"])'
COPY main.jl .
RUN useradd -r -s /bin/false app && chown -R app:app /app /opt/julia
USER app
EXPOSE 4054
CMD ["julia", "main.jl"]
