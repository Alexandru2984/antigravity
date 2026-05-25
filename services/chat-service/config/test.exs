import Config

config :chat_service, ChatService.Repo,
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 1

config :chat_service, ChatServiceWeb.Endpoint, server: false
