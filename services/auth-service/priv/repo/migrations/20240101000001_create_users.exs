defmodule AuthService.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    # Enable UUID extension
    execute "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"", ""

    create table(:users, primary_key: false) do
      add :id,             :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :email,          :citext, null: false
      add :password_hash,  :string, null: false
      add :roles,          {:array, :text}, null: false, default: ["user"]
      add :is_active,      :boolean, null: false, default: true
      add :email_verified, :boolean, null: false, default: false
      add :last_login_at,  :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:email])
    create index(:users, [:is_active])

    # Enable citext for case-insensitive email
    execute "CREATE EXTENSION IF NOT EXISTS citext", ""
  end
end
