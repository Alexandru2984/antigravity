defmodule AuthService.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_type, _args) do
    # Start OpenTelemetry BEFORE anything else
    # :opentelemetry_exporter.setup()
    OpentelemetryPhoenix.setup(adapter: :cowboy2)
    OpentelemetryEcto.setup([:auth_service, :repo])

    children = [
      AuthService.Repo,
      {Phoenix.PubSub, name: AuthService.PubSub},
      AuthService.RedisPool,
      AuthService.Kafka.Producer,
      AuthServiceWeb.Endpoint,
    ]

    opts = [strategy: :one_for_one, name: AuthService.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    AuthServiceWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
