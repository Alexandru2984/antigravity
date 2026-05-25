import Config

if config_env() == :prod do
  config :notification_service, NotificationServiceWeb.Endpoint,
    http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4005")],
    secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
    server: true

  config :notification_service,
    kafka_brokers:
      "KAFKA_BROKERS"
      |> System.fetch_env!()
      |> String.split(",", trim: true)
      |> Enum.map(fn broker ->
        [host, port] = String.split(broker, ":", parts: 2)
        {host, String.to_integer(port)}
      end)
end
