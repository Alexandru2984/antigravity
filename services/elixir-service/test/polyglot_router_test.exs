defmodule Polyglot.RouterTest do
  use ExUnit.Case, async: true
  import Plug.Conn
  import Plug.Test

  @opts Polyglot.Router.init([])

  test "returns health status" do
    conn =
      :get
      |> conn("/health")
      |> Polyglot.Router.call(@opts)

    assert conn.status == 200
    assert Jason.decode!(conn.resp_body) == %{"service" => "elixir-service", "status" => "ok"}
  end

  test "creates deterministic event ids" do
    payload = %{
      "type" => "listing.updated",
      "listing_id" => "listing-123",
      "seller_id" => "user-1"
    }

    conn =
      :post
      |> conn("/events", Jason.encode!(payload))
      |> put_req_header("content-type", "application/json")
      |> Polyglot.Router.call(@opts)

    body = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert body["status"] == "ok"
    assert body["event_id"] == "dda696ebd8efd127"
    assert body["delivered_to"] == ["activity-feed", "notification-service", "analytics-service"]
  end

  test "rejects events without listing id" do
    conn =
      :post
      |> conn("/events", Jason.encode!(%{"type" => "listing.updated"}))
      |> put_req_header("content-type", "application/json")
      |> Polyglot.Router.call(@opts)

    assert conn.status == 400

    assert Jason.decode!(conn.resp_body) == %{
             "error" => "listing_id_required",
             "status" => "error"
           }
  end
end
