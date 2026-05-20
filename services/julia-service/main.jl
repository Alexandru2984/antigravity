using HTTP
using JSON
using Statistics

println("Julia Analytics Core Active on port 4054")

HTTP.serve("0.0.0.0", 4054) do request::HTTP.Request
    if request.method == "POST"
        data = JSON.parse(String(request.body))
        # Calculăm dispersia și deviația standard reală
        vals = data["data"]
        result = Dict(
            "mean" => mean(vals),
            "std" => std(vals),
            "variance" => var(vals),
            "engine" => "Julia-HighPerf-Stat"
        )
        return HTTP.Response(200, JSON.json(result))
    end
    return HTTP.Response(200, "Julia Statistics Engine Online")
end
