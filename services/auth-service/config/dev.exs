import Config

config :auth_service, AuthService.Repo,
  hostname: "localhost",
  username: "polymarket",
  password: "polymarket_dev",
  database: "polymarket_auth_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 5

config :auth_service, AuthServiceWeb.Endpoint,
  code_reloader: true,
  check_origin: false,
  watchers: []

config :logger, level: :debug
