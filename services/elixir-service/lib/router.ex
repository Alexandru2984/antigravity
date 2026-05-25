defmodule Polyglot.Router do
  use Plug.Router

  plug(:match)

  plug(Plug.Parsers,
    parsers: [:json],
    pass: ["application/json"],
    json_decoder: Jason,
    length: 8_192
  )

  plug(:dispatch)

  get "/" do
    json(conn, 200, %{status: "ok", service: "elixir-concurrency", beam: true})
  end

  get "/health" do
    json(conn, 200, %{status: "ok", service: "elixir-service"})
  end

  post "/events" do
    event = conn.body_params
    event_type = string_field(event, "type", "listing.updated")
    listing_id = string_field(event, "listing_id", "")
    seller_id = string_field(event, "seller_id", "")

    if listing_id == "" do
      json(conn, 400, %{status: "error", error: "listing_id_required"})
    else
      event_id =
        :crypto.hash(:sha256, "#{event_type}:#{listing_id}:#{seller_id}")
        |> Base.encode16(case: :lower)
        |> binary_part(0, 16)

      json(conn, 200, %{
        status: "ok",
        service: "elixir-broker",
        event_id: event_id,
        event_type: event_type,
        listing_id: listing_id,
        realtime: true,
        delivered_to: ["activity-feed", "notification-service", "analytics-service"],
        queue: "beam-local-bus"
      })
    end
  end

  match _ do
    json(conn, 404, %{status: "error", error: "not_found"})
  end

  defp string_field(payload, key, fallback) when is_map(payload) do
    case Map.get(payload, key, fallback) do
      value when is_binary(value) -> String.trim(value)
      value when is_integer(value) or is_float(value) -> to_string(value)
      _ -> fallback
    end
  end

  defp json(conn, status, payload) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Jason.encode!(payload))
  end
end
