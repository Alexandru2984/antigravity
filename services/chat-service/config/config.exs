import Config

config :chat_service, ecto_repos: [ChatService.Repo]

config :chat_service, ChatService.Repo,
  url:
    System.get_env("DATABASE_URL") ||
      "postgresql://polymarket:polymarket_dev@localhost:5432/polymarket_chat",
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

config :chat_service, ChatServiceWeb.Endpoint,
  url: [host: "localhost"],
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4011")],
  secret_key_base:
    System.get_env("SECRET_KEY_BASE") ||
      "dev_secret_key_base_replace_in_production_must_be_64_chars_min",
  server: true

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id]

for config <- ["#{config_env()}.exs"], File.exists?(Path.join(__DIR__, config)) do
  import_config config
end
