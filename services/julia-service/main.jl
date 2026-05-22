using HTTP
using JSON
using Statistics

const PORT = 4054

function json_response(status::Int, payload)
    return HTTP.Response(status, ["Content-Type" => "application/json"], JSON.json(payload))
end

function numeric_vector(values)
    return [Float64(value) for value in values if value isa Number && isfinite(Float64(value))]
end

function analyze_price(price::Float64, comparables)
    samples = numeric_vector(comparables)
    if length(samples) < 2
        samples = [price * 0.85, price * 0.95, price * 1.05, price * 1.15]
    end

    sample_mean = mean(samples)
    sample_std = std(samples)
    z_score = sample_std == 0 ? 0.0 : (price - sample_mean) / sample_std
    outlier = abs(z_score) >= 2.0

    return Dict(
        "status" => "ok",
        "service" => "julia-stats",
        "engine" => "Julia-HighPerf-Stat",
        "price" => round(price, digits = 2),
        "comparables_count" => length(samples),
        "mean" => round(sample_mean, digits = 4),
        "std" => round(sample_std, digits = 4),
        "variance" => round(var(samples), digits = 4),
        "z_score" => round(z_score, digits = 4),
        "outlier" => outlier,
    )
end

println("Julia pricing analytics node active on port $PORT")

HTTP.serve("0.0.0.0", PORT) do request::HTTP.Request
    path = String(HTTP.URI(request.target).path)

    if request.method == "GET" && path == "/health"
        return json_response(200, Dict("status" => "ok", "service" => "julia-stats"))
    end

    if request.method != "POST"
        return json_response(404, Dict("error" => "not found"))
    end

    try
        data = JSON.parse(String(request.body))
        price = Float64(get(data, "price", 0))
        comparables = get(data, "comparables", get(data, "data", []))

        if price <= 0
            return json_response(400, Dict("error" => "price must be positive"))
        end

        return json_response(200, analyze_price(price, comparables))
    catch err
        return json_response(400, Dict("error" => "invalid request"))
    end
end
