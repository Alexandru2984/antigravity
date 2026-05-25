import Config

if config_env() == :prod do
  config :chat_service, ChatService.Repo,
    url: System.fetch_env!("DATABASE_URL"),
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  config :chat_service, ChatServiceWeb.Endpoint,
    http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4011")],
    secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
    server: true
end
