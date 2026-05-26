defmodule AuthService.Accounts.UserTest do
  use ExUnit.Case, async: true

  alias AuthService.Accounts.User

  test "changeset normalizes valid registration data into a password hash" do
    changeset =
      User.changeset(%User{}, %{
        email: "user@example.com",
        password: "correct horse battery staple"
      })

    assert changeset.valid?
    assert Ecto.Changeset.get_change(changeset, :password_hash)
    refute Ecto.Changeset.get_change(changeset, :password_hash) =~ "correct horse"
  end

  test "changeset rejects invalid email and short password" do
    changeset =
      User.changeset(%User{}, %{
        email: "not-an-email",
        password: "short"
      })

    refute changeset.valid?
    assert "invalid email format" in errors_on(changeset).email
    assert "should be at least 8 character(s)" in errors_on(changeset).password
  end

  defp errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Enum.reduce(opts, message, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
