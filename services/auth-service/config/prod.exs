import Config
config :auth_service, AuthService.Repo,
  url: System.get_env("DATABASE_URL"),
  pool_size: 10
