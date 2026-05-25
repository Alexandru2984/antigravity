defmodule NotificationServiceWeb.Router do
  use Phoenix.Router

  pipeline :api do
    plug(:accepts, ["json"])
  end

  scope "/", NotificationServiceWeb do
    pipe_through(:api)

    get("/health", HealthController, :index)
    get("/ready", HealthController, :index)
  end
end

defmodule NotificationServiceWeb.HealthController do
  use Phoenix.Controller, formats: [:json]

  def index(conn, _params) do
    json(conn, %{status: "ok", service: "notification-service"})
  end
end
