using HTTP
using JSON
using Statistics

println("Julia Statistics Engine starting on port 4054...")

HTTP.serve("0.0.0.0", 4054) do request::HTTP.Request
    if request.method == "POST"
        try
            data = JSON.parse(String(request.body))
            vals = data["values"]
            result = Dict(
                "mean" => mean(vals),
                "std" => std(vals),
                "engine" => "Julia High-Performance"
            )
            return HTTP.Response(200, JSON.json(result))
        catch e
            return HTTP.Response(400, "Error processing numbers")
        end
    else
        return HTTP.Response(200, "Julia Engine Active")
    end
end
