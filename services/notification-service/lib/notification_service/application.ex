defmodule NotificationService.Application do
  use Application

  @impl true
  def start(_type, _args) do
    :opentelemetry_exporter.setup()
    OpentelemetryPhoenix.setup(adapter: :cowboy2)

    children = [
      {Phoenix.PubSub, name: NotificationService.PubSub},
      NotificationServiceWeb.Endpoint,
      NotificationService.KafkaConsumer,
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: NotificationService.Supervisor)
  end
end
