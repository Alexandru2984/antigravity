FROM julia:1.10-bookworm
WORKDIR /app
RUN julia -e 'using Pkg; Pkg.add(["HTTP", "JSON"])'
COPY main.jl .
EXPOSE 4054
CMD ["julia", "main.jl"]

