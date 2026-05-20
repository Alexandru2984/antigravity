defmodule AuthService.AuthJSON do
  alias AuthService.Accounts.User

  def auth_response(%{user: user, tokens: tokens}) do
    %{
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type:    tokens.token_type,
      expires_in:    tokens.expires_in,
      user:          render_user(user)
    }
  end

  def user(%{user: user}) do
    render_user(user)
  end

  def error(%{changeset: changeset}) do
    %{
      error: "validation_error",
      message: "Validation failed",
      details: Ecto.Changeset.traverse_errors(changeset, &translate_error/1)
    }
  end

  def error(%{message: message}) do
    %{error: "error", message: message}
  end

  defp render_user(%User{} = user) do
    %{
      id:         user.id,
      email:      user.email,
      roles:      user.roles,
      is_active:  user.is_active,
      created_at: user.inserted_at
    }
  end

  defp translate_error({msg, opts}) do
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      String.replace(acc, "%{#{key}}", to_string(value))
    end)
  end
end
