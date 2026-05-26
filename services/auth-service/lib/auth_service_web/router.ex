defmodule AuthServiceWeb.Router do
  use AuthServiceWeb, :router

  @frontend_url Application.compile_env(:auth_service, :frontend_url, "http://localhost:3000")

  pipeline :api do
    plug(:accepts, ["json"])

    plug(Corsica,
      origins: [@frontend_url],
      allow_credentials: true,
      allow_headers: ["authorization", "content-type", "x-request-id"]
    )
  end

  scope "/health", AuthServiceWeb do
    pipe_through(:api)
    get("/", HealthController, :index)
    get("/ready", HealthController, :ready)
  end

  scope "/auth", AuthServiceWeb do
    pipe_through(:api)

    post("/register", AuthController, :register)
    post("/login", AuthController, :login)
    post("/refresh", AuthController, :refresh)
    post("/logout", AuthController, :logout)

    # Protected — requires valid JWT
    get("/me", AuthController, :me)
  end
end
