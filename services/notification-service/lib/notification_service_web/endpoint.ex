defmodule NotificationServiceWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :notification_service

  socket("/socket", NotificationServiceWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll: false
  )

  plug(Plug.RequestId)
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])

  plug(Corsica,
    origins: [System.get_env("FRONTEND_URL", "http://localhost:3000")],
    allow_headers: ["authorization", "content-type", "x-request-id"],
    allow_methods: ["GET", "POST", "OPTIONS"]
  )

  plug(Plug.Parsers,
    parsers: [:urlencoded, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(NotificationServiceWeb.Router)
end
