defmodule ChatServiceWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :chat_service

  socket "/socket", ChatServiceWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll: false

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug CORSPlug,
    origin: [System.get_env("FRONTEND_URL", "http://localhost:3000")],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    headers: ["Authorization", "Content-Type", "X-Request-ID"]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug ChatServiceWeb.Router
end
