FROM julia:1.10-bookworm
WORKDIR /app
ENV JULIA_DEPOT_PATH=/opt/julia
# Precompile every package the service `using`s (including the Statistics
# stdlib) at build time so the compile cache is baked into the image. The
# container runs read-only, so no precompilation can happen at runtime.
RUN julia -e 'using Pkg; Pkg.add(["HTTP", "JSON"]); using HTTP, JSON, Statistics'
COPY main.jl .
RUN useradd -r -s /bin/false app && chown -R app:app /app /opt/julia
USER app
EXPOSE 4054
CMD ["julia", "main.jl"]
