defmodule NotificationService.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children =
      [
        {Phoenix.PubSub, name: NotificationService.PubSub},
        NotificationServiceWeb.Endpoint,
        maybe_kafka_consumer()
      ]
      |> Enum.reject(&is_nil/1)

    Supervisor.start_link(children, strategy: :one_for_one, name: NotificationService.Supervisor)
  end

  defp maybe_kafka_consumer do
    if Application.get_env(:notification_service, :start_kafka_consumer?, true) do
      NotificationService.KafkaConsumer
    end
  end
end
