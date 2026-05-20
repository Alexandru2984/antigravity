defmodule Polyglot.Application do
  use Application
  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: Polyglot.Router, options: [port: 4057]}
    ]
    opts = [strategy: :one_for_one, name: Polyglot.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
