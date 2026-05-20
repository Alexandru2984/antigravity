defmodule AuthService.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field :email,            :string
    field :password_hash,    :string
    field :password,         :string, virtual: true
    field :roles,            {:array, :string}, default: ["user"]
    field :is_active,        :boolean, default: true
    field :email_verified,   :boolean, default: false
    field :last_login_at,    :utc_datetime

    timestamps(type: :utc_datetime)
  end

  @required_fields [:email, :password]
  @optional_fields [:roles, :is_active, :email_verified]

  def changeset(user, attrs) do
    user
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_format(:email, ~r/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "invalid email format")
    |> validate_length(:password, min: 8, max: 100)
    |> unique_constraint(:email)
    |> put_password_hash()
  end

  defp put_password_hash(%Ecto.Changeset{valid?: true, changes: %{password: pw}} = changeset) do
    put_change(changeset, :password_hash, Bcrypt.hash_pwd_salt(pw))
  end
  defp put_password_hash(changeset), do: changeset

  def verify_password(%__MODULE__{password_hash: hash}, password) do
    Bcrypt.verify_pass(password, hash)
  end
end
