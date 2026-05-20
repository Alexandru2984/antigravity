defmodule AuthServiceWeb.AuthController do
  use AuthServiceWeb, :controller

  alias AuthService.Accounts
  alias AuthService.Guardian

  # ── POST /auth/register ─────────────────────────────────────
  def register(conn, params) do
    case Accounts.register_user(params) do
      {:ok, user, tokens} ->
        conn
        |> put_status(:created)
        |> render(:auth_response, user: user, tokens: tokens)

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)

      {:error, reason} ->
        conn
        |> put_status(:internal_server_error)
        |> render(:error, message: inspect(reason))
    end
  end

  # ── POST /auth/login ────────────────────────────────────────
  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.login(email, password) do
      {:ok, tokens} ->
        conn
        |> put_status(:ok)
        |> render(:auth_response, user: Map.get(tokens, :user), tokens: tokens)

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> render(:error, message: "Invalid email or password")

      {:error, :account_disabled} ->
        conn
        |> put_status(:forbidden)
        |> render(:error, message: "Account is disabled")
    end
  end

  # ── POST /auth/refresh ──────────────────────────────────────
  def refresh(conn, %{"refresh_token" => refresh_token}) do
    case Accounts.refresh_tokens(refresh_token) do
      {:ok, tokens} ->
        conn
        |> put_status(:ok)
        |> render(:auth_response, user: Map.get(tokens, :user), tokens: tokens)

      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> render(:error, message: "Invalid or expired refresh token")
    end
  end

  # ── POST /auth/logout ───────────────────────────────────────
  def logout(conn, %{"refresh_token" => refresh_token}) do
    Accounts.logout(refresh_token)
    send_resp(conn, :no_content, "")
  end

  # ── GET /auth/me ────────────────────────────────────────────
  def me(conn, _params) do
    token = extract_bearer(conn)
    case Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        alias AuthService.Repo
        alias AuthService.Accounts.User
        user = Repo.get(User, claims["sub"])
        conn
        |> put_status(:ok)
        |> render(:user, user: user)

      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> render(:error, message: "Invalid token")
    end
  end

  # ── Helpers ─────────────────────────────────────────────────
  defp extract_bearer(conn) do
    conn
    |> get_req_header("authorization")
    |> List.first("")
    |> String.replace_prefix("Bearer ", "")
  end
end
