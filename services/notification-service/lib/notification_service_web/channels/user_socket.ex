defmodule NotificationServiceWeb.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel("notification:*", NotificationServiceWeb.NotificationChannel)

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case verify_token(token) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user_id, user_id)}

      {:error, reason} ->
        {:error, %{reason: reason}}
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"

  @doc false
  def verify_token(token) when is_binary(token) do
    with [header_b64, payload_b64, signature_b64] <- String.split(token, "."),
         {:ok, header} <- decode_json_segment(header_b64),
         :ok <- require_rs256(header),
         {:ok, %{"sub" => sub}} when is_binary(sub) and byte_size(sub) > 0 <-
           decode_json_segment(payload_b64),
         {:ok, signature} <- decode_base64url(signature_b64),
         {:ok, public_key} <- jwt_public_key(),
         true <- verify_signature("#{header_b64}.#{payload_b64}", signature, public_key) do
      {:ok, sub}
    else
      false -> {:error, "invalid_signature"}
      {:ok, _claims} -> {:error, "invalid_payload"}
      {:error, reason} -> {:error, reason}
      _ -> {:error, "invalid_token_format"}
    end
  end

  def verify_token(_token), do: {:error, "invalid_token_format"}

  defp decode_json_segment(segment) do
    with {:ok, json} <- decode_base64url(segment),
         {:ok, decoded} <- Jason.decode(json) do
      {:ok, decoded}
    else
      _ -> {:error, "invalid_base64"}
    end
  end

  defp decode_base64url(segment) do
    case Base.url_decode64(segment, padding: false) do
      {:ok, decoded} -> {:ok, decoded}
      :error -> {:error, "invalid_base64"}
    end
  end

  defp require_rs256(%{"alg" => "RS256"}), do: :ok
  defp require_rs256(_header), do: {:error, "invalid_algorithm"}

  defp jwt_public_key do
    public_key_pem =
      "JWT_PUBLIC_KEY"
      |> System.get_env("")
      |> String.replace("\\n", "\n")
      |> String.trim()

    with false <- public_key_pem == "",
         [entry | _] <- :public_key.pem_decode(public_key_pem) do
      {:ok, :public_key.pem_entry_decode(entry)}
    else
      true -> {:error, "missing_public_key"}
      [] -> {:error, "invalid_public_key"}
    end
  rescue
    _ -> {:error, "invalid_public_key"}
  end

  defp verify_signature(signing_input, signature, public_key) do
    :public_key.verify(signing_input, :sha256, signature, public_key)
  rescue
    _ -> false
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
