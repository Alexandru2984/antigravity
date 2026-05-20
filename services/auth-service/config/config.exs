import Config

# ── Phoenix Endpoint ─────────────────────────────────────────
config :auth_service, AuthServiceWeb.Endpoint,
  url: [host: "localhost"],
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4020")],
  secret_key_base: System.get_env("SECRET_KEY_BASE") || "dev_secret_key_base_replace_in_production_must_be_64_chars_min",
  render_errors: [
    formats: [json: AuthServiceWeb.ErrorJSON],
    layout: false
  ],
  server: true

# ── Database ─────────────────────────────────────────────────
config :auth_service, AuthService.Repo,
  url:  System.get_env("AUTH_DATABASE_URL") || "postgresql://polymarket:polymarket_dev@localhost:5432/polymarket_auth",
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  timeout: 30_000

# ── Guardian JWT (RS256) ──────────────────────────────────────
config :auth_service, AuthService.Guardian,
  issuer: "polymarket",
  secret_key: %{
    "pem" => System.get_env("JWT_PRIVATE_KEY") || File.read!("priv/keys/jwt_private.pem")
  },
  allowed_algos: ["RS256"],
  token_verify_module: Guardian.Token.Jwt.Verify,
  token_ttl: %{
    "access"  => {1, :hour},
    "refresh" => {30, :day}
  }

# ── Redis ─────────────────────────────────────────────────────
config :auth_service, :redis_url,
  System.get_env("REDIS_URL") || "redis://localhost:6379"

# ── Kafka ─────────────────────────────────────────────────────
kafka_brokers =
  (System.get_env("KAFKA_BROKERS") || "localhost:9092")
  |> String.split(",")
  |> Enum.map(fn broker ->
    [host, port] = String.split(broker, ":")
    {String.to_charlist(host), String.to_integer(port)}
  end)

config :auth_service, :kafka_brokers, kafka_brokers

# ── OpenTelemetry ─────────────────────────────────────────────
config :opentelemetry, :resource,
  service: [
    name: "auth-service",
    version: "0.1.0"
  ]

config :opentelemetry_exporter,
  otlp_protocol: :http_protobuf,
  otlp_endpoint: System.get_env("OTEL_EXPORTER_OTLP_ENDPOINT") || "http://localhost:4318"

# ── Logger ────────────────────────────────────────────────────
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id]

# ── Ecto ─────────────────────────────────────────────────────
config :auth_service, ecto_repos: [AuthService.Repo]

# ── Frontend URL for CORS ─────────────────────────────────────
config :auth_service, :frontend_url,
  System.get_env("FRONTEND_URL") || "http://localhost:3000"

# ── Import env-specific overrides ────────────────────────────
import_config "#{config_env()}.exs"
