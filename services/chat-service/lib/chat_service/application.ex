defmodule ChatService.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children =
      [
        maybe_repo(),
        {Phoenix.PubSub, name: ChatService.PubSub},
        ChatServiceWeb.Endpoint
      ]
      |> Enum.reject(&is_nil/1)

    opts = [strategy: :one_for_one, name: ChatService.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp maybe_repo do
    if Application.get_env(:chat_service, :start_repo?, true) do
      ChatService.Repo
    end
  end
end
