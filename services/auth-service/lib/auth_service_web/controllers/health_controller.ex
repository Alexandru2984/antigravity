defmodule AuthServiceWeb.HealthController do
  use AuthServiceWeb, :controller

  def index(conn, _params) do
    json(conn, %{status: "ok", service: "auth-service"})
  end

  def ready(conn, _params) do
    # Check DB and Redis
    db_up = Ecto.Adapters.SQL.query(AuthService.Repo, "SELECT 1", [])
    redis_up = AuthService.RedisPool.command(["PING"])

    case {db_up, redis_up} do
      {{:ok, _}, {:ok, "PONG"}} ->
        json(conn, %{status: "ready"})
      _ ->
        conn |> put_status(:service_unavailable) |> json(%{status: "not_ready"})
    end
  end
end
