import Config

config :notification_service, NotificationServiceWeb.Endpoint,
  url: [host: "localhost"],
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4005")],
  secret_key_base:
    System.get_env("SECRET_KEY_BASE") ||
      "dev_secret_key_base_replace_in_production_must_be_64_chars_min",
  server: true

config :notification_service,
  kafka_brokers:
    "KAFKA_BROKERS"
    |> System.get_env("localhost:9092")
    |> String.split(",", trim: true)
    |> Enum.map(fn broker ->
      [host, port] = String.split(broker, ":", parts: 2)
      {host, String.to_integer(port)}
    end),
  start_kafka_consumer?: true

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id]

for config <- ["#{config_env()}.exs"], File.exists?(Path.join(__DIR__, config)) do
  import_config config
end
