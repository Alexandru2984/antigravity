defmodule ChatServiceWeb.UserSocket do
  use Phoenix.Socket

  # ── Channel registration ───────────────────────────────────
  # room:<listing_id> — buyer-seller conversation per listing
  channel "room:*", ChatServiceWeb.RoomChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    # Verify JWT — extract user_id from the X-User-Id claim
    # In prod, validate against the public key; here we trust Gateway-injected header
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

  defp verify_token(token) do
    # Minimal: decode JWT, extract sub; full RS256 validation done by Gateway
    case String.split(token, ".") do
      [_header, payload_b64, _sig] ->
        case Base.url_decode64(payload_b64, padding: false) do
          {:ok, json} ->
            case Jason.decode(json) do
              {:ok, %{"sub" => sub}} -> {:ok, sub}
              _ -> {:error, "invalid_payload"}
            end
          _ -> {:error, "invalid_base64"}
        end
      _ -> {:error, "invalid_token_format"}
    end
  end
end
