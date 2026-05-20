defmodule NotificationServiceWeb.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel "notification:*", NotificationServiceWeb.NotificationChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    # Verify JWT (RS256) — public key only
    case verify_jwt(token) do
      {:ok, claims} ->
        socket = assign(socket, :user_id, claims["sub"])
        {:ok, socket}

      {:error, reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"

  defp verify_jwt(token) do
    public_key_pem = System.get_env("JWT_PUBLIC_KEY") |> String.replace("\\n", "\n")
    signer = Joken.Signer.create("RS256", %{"pem" => public_key_pem})

    case Joken.verify(token, signer) do
      {:ok, claims} -> {:ok, claims}
      {:error, reason} -> {:error, reason}
    end
  end
end

defmodule NotificationServiceWeb.NotificationChannel do
  use Phoenix.Channel

  @impl true
  def join("notification:" <> user_id, _payload, socket) do
    if socket.assigns.user_id == user_id do
      # Subscribe this process to user-specific PubSub topic
      Phoenix.PubSub.subscribe(NotificationService.PubSub, "user:#{user_id}")
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info({:notification, notification}, socket) do
    push(socket, "notification", notification)
    {:noreply, socket}
  end
end
