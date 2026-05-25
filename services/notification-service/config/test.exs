import Config

config :notification_service, start_kafka_consumer?: false
config :notification_service, NotificationServiceWeb.Endpoint, server: false
