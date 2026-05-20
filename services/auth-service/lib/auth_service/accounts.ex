defmodule AuthService.Accounts do
  @moduledoc """
  The Accounts context — user registration, login, token management.
  """
  import Ecto.Query
  alias AuthService.{Repo, Guardian}
  alias AuthService.Accounts.User
  alias AuthService.{RedisPool, Token}
  alias AuthService.Kafka.Producer, as: KafkaProducer

  @refresh_token_ttl_seconds 30 * 24 * 60 * 60  # 30 days

  # ── Registration ───────────────────────────────────────────────

  def register_user(attrs) do
    with {:ok, user} <- %User{} |> User.changeset(attrs) |> Repo.insert(),
         {:ok, tokens} <- issue_tokens(user) do
      KafkaProducer.produce("polymarket.users.registered", %{
        event: "user.registered",
        user_id: user.id,
        email: user.email,
        roles: user.roles,
        ts: DateTime.utc_now() |> DateTime.to_iso8601()
      })
      {:ok, user, tokens}
    end
  end

  # ── Login ──────────────────────────────────────────────────────

  def login(email, password) do
    user = Repo.get_by(User, email: String.downcase(email))

    cond do
      is_nil(user) ->
        # Constant-time comparison to prevent timing attacks
        Bcrypt.no_user_verify()
        {:error, :invalid_credentials}

      not user.is_active ->
        {:error, :account_disabled}

      not User.verify_password(user, password) ->
        {:error, :invalid_credentials}

      true ->
        update_last_login(user)
        KafkaProducer.produce("polymarket.users.logged_in", %{
          event: "user.logged_in",
          user_id: user.id,
          ts: DateTime.utc_now() |> DateTime.to_iso8601()
        })
        issue_tokens(user)
    end
  end

  # ── Token refresh ──────────────────────────────────────────────

  def refresh_tokens(refresh_token) do
    key = redis_refresh_key(refresh_token)
    case RedisPool.command(["GET", key]) do
      {:ok, nil} ->
        {:error, :invalid_refresh_token}

      {:ok, user_id} ->
        # Single-use: delete old token immediately (rotation)
        RedisPool.command(["DEL", key])

        case Repo.get(User, user_id) do
          nil  -> {:error, :user_not_found}
          user -> issue_tokens(user)
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  # ── Logout ─────────────────────────────────────────────────────

  def logout(refresh_token) do
    key = redis_refresh_key(refresh_token)
    RedisPool.command(["DEL", key])
    :ok
  end

  # ── Helpers ────────────────────────────────────────────────────

  defp issue_tokens(user) do
    with {:ok, access_token, claims} <- Guardian.encode_and_sign(user, %{}, token_type: "access", ttl: {1, :hour}),
         refresh_token               <- Token.generate_opaque(),
         :ok                         <- store_refresh_token(refresh_token, user.id) do
      {:ok, %{
        access_token:  access_token,
        refresh_token: refresh_token,
        token_type:    "bearer",
        expires_in:    3600,
        user:          user
      }}
    end
  end

  defp store_refresh_token(token, user_id) do
    key = redis_refresh_key(token)
    case RedisPool.command(["SETEX", key, @refresh_token_ttl_seconds, to_string(user_id)]) do
      {:ok, _}        -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp redis_refresh_key(token), do: "refresh:#{token}"

  defp update_last_login(user) do
    user
    |> Ecto.Changeset.change(%{last_login_at: DateTime.utc_now() |> DateTime.truncate(:second)})
    |> Repo.update()
  end
end
