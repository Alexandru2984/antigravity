defmodule AuthServiceWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :auth_service

  @session_options [
    store: :cookie,
    key: "_auth_service_key",
    signing_salt: "signing_salt"
  ]

  plug(Plug.RequestId)
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(Plug.MethodOverride)
  plug(Plug.Head)
  plug(Plug.Session, @session_options)

  plug(Corsica,
    origins: [Application.get_env(:auth_service, :frontend_url, "http://localhost:3000")],
    allow_credentials: true,
    allow_headers: ["authorization", "content-type", "x-request-id"]
  )

  plug(AuthServiceWeb.Router)
end
