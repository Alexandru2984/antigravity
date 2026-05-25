defmodule Polyglot.Application do
  use Application

  def start(_type, _args) do
    children =
      [
        maybe_http_listener()
      ]
      |> Enum.reject(&is_nil/1)

    opts = [strategy: :one_for_one, name: Polyglot.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp maybe_http_listener do
    if Application.get_env(:polyglot, :start_http?, true) do
      {Plug.Cowboy, scheme: :http, plug: Polyglot.Router, options: [port: port()]}
    end
  end

  defp port do
    "PORT"
    |> System.get_env("4057")
    |> String.to_integer()
  end
end
