defmodule AuthService.Guardian do
  use Guardian, otp_app: :auth_service

  alias AuthService.Accounts.User
  alias AuthService.Repo

  @doc """
  Stores the user's UUID as the subject claim.
  """
  def subject_for_token(%User{id: id}, _claims), do: {:ok, to_string(id)}
  def subject_for_token(_, _), do: {:error, :invalid_resource}

  @doc """
  Fetches the user from the database when verifying a token.
  """
  def resource_from_claims(%{"sub" => id}) do
    case Repo.get(User, id) do
      nil  -> {:error, :resource_not_found}
      user -> {:ok, user}
    end
  end
  def resource_from_claims(_), do: {:error, :invalid_claims}

  @doc """
  Builds extra claims merged into the JWT payload.
  Called automatically by Guardian on token creation.
  """
  def build_claims(claims, %User{} = user, _opts) do
    claims =
      claims
      |> Map.put("email", user.email)
      |> Map.put("roles", user.roles)

    {:ok, claims}
  end
end
