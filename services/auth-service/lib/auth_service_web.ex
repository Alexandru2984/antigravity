defmodule AuthServiceWeb do
  def controller do
    quote do
      use Phoenix.Controller,
        formats: [:json],
        layouts: [html: AuthServiceWeb.Layouts]

      import Plug.Conn
      alias AuthServiceWeb.Router.Helpers, as: Routes
    end
  end

  def router do
    quote do
      use Phoenix.Router
      import Plug.Conn
      import Phoenix.Controller
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
