defmodule ChatServiceWeb.Router do
  use Phoenix.Router
  import Plug.Conn

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", ChatServiceWeb do
    pipe_through :api
    get "/health", HealthController, :index
    get "/ready",  HealthController, :index
  end
end

defmodule ChatServiceWeb.HealthController do
  use Phoenix.Controller, formats: [:json]

  def index(conn, _params) do
    json(conn, %{status: "ok", service: "chat-service"})
  end
end
