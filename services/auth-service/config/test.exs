import Config

config :auth_service, AuthServiceWeb.Endpoint,
  server: false,
  secret_key_base: "test_secret_key_base_that_is_long_enough_for_phoenix_signing"

config :auth_service, AuthService.Repo,
  url:
    System.get_env("DATABASE_URL") ||
      System.get_env("AUTH_DATABASE_URL") ||
      "postgresql://polymarket:polymarket_test@localhost:5432/polymarket_auth_test",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 1

config :auth_service, :redis_url, System.get_env("REDIS_URL") || "redis://localhost:6379"
config :auth_service, :kafka_brokers, [{"localhost", 9092}]
config :auth_service, :start_kafka_producer?, false
