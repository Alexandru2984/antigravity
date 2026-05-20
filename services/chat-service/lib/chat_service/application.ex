defmodule ChatService.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ChatService.Repo,
      {Phoenix.PubSub, name: ChatService.PubSub},
      ChatServiceWeb.Endpoint,
    ]

    opts = [strategy: :one_for_one, name: ChatService.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
