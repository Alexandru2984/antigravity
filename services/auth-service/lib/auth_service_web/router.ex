defmodule AuthServiceWeb.Router do
  use AuthServiceWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug Corsica,
      origins: [Application.get_env(:auth_service, :frontend_url, "http://localhost:3000")],
      allow_credentials: true,
      allow_headers: :all
  end

  scope "/health", AuthServiceWeb do
    pipe_through :api
    get "/",     HealthController, :index
    get "/ready",HealthController, :ready
  end

  scope "/auth", AuthServiceWeb do
    pipe_through :api

    post "/register", AuthController, :register
    post "/login",    AuthController, :login
    post "/refresh",  AuthController, :refresh
    post "/logout",   AuthController, :logout

    # Protected — requires valid JWT
    get  "/me",       AuthController, :me
  end
end
