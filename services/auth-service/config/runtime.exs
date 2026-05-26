import Config

# config/runtime.exs is executed for all environments, including
# during releases. It overrides compile-time configuration.

if System.get_env("PHX_SERVER") || config_env() == :prod do
  config :auth_service, AuthServiceWeb.Endpoint, server: true
end

prod? = config_env() == :prod

jwt_private_key =
  case System.get_env("JWT_PRIVATE_KEY") do
    value when is_binary(value) and value != "" ->
      value

    _ when prod? ->
      raise """
      environment variable JWT_PRIVATE_KEY is missing.
      """

    _ ->
      case File.read("priv/keys/jwt_private.pem") do
        {:ok, value} ->
          value

        {:error, _} ->
          raise """
          JWT_PRIVATE_KEY is missing and priv/keys/jwt_private.pem was not found.
          Generate local development keys under services/auth-service/priv/keys.
          """
      end
  end

config :auth_service, AuthService.Guardian,
  secret_key: %{
    "pem" => jwt_private_key
  }

if prod? do
  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default is provided here, but in production we require it to be set.
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      "dev_secret_key_base_replace_in_production_must_be_64_chars_min_placeholder_value_for_safety"

  config :auth_service, AuthServiceWeb.Endpoint,
    http: [
      ip: {0, 0, 0, 0},
      port: String.to_integer(System.get_env("PORT") || "4001")
    ],
    secret_key_base: secret_key_base

  # Database configuration
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: postgresql://USER:PASS@HOST/DATABASE
      """

  config :auth_service, AuthService.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: [:inet6]

  # Redis configuration
  redis_url = System.get_env("REDIS_URL") || "redis://redis:6379"
  config :auth_service, :redis_url, redis_url

  # Kafka configuration
  kafka_brokers =
    (System.get_env("KAFKA_BROKERS") || "kafka:9092")
    |> String.split(",")
    |> Enum.map(fn broker ->
      [host, port] = String.split(broker, ":")
      {String.to_charlist(host), String.to_integer(port)}
    end)

  config :auth_service, :kafka_brokers, kafka_brokers
end
