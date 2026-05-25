module ConfigService.FeatureFlags

open System.Text.Json
open Npgsql.FSharp

type FeatureFlag =
    { Name: string
      Enabled: bool
      Description: string
      UpdatedAt: System.DateTime }

let private connStr () =
    System.Environment.GetEnvironmentVariable("DATABASE_URL")
    |> Option.ofObj
    |> Option.orElseWith (fun () ->
        System.Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
        |> Option.ofObj)
    |> Option.defaultValue "Host=localhost;Port=5432;Database=polymarket_config;Username=polymarket;Password=polymarket"

let private flagValue enabled =
    JsonSerializer.Serialize {| enabled = enabled |}

let private readFlag (read: CommonExtensionsAndTypesForNpgsqlFSharp.RowReader) =
    { Name = read.text "name"
      Enabled = read.bool "enabled"
      Description = read.text "description"
      UpdatedAt = read.dateTime "updated_at" }

let ensureSchema () : unit =
    connStr ()
    |> Sql.connect
    |> Sql.query
        """
        CREATE TABLE IF NOT EXISTS feature_flags (
            key         VARCHAR(100) PRIMARY KEY,
            value       JSONB        NOT NULL,
            description TEXT,
            enabled     BOOLEAN      NOT NULL DEFAULT true,
            rollout_pct INT          CHECK (rollout_pct BETWEEN 0 AND 100) DEFAULT 100,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    """
    |> Sql.executeNonQuery
    |> ignore

let deleteByName (name: string) : unit =
    connStr ()
    |> Sql.connect
    |> Sql.query "DELETE FROM feature_flags WHERE key = @name"
    |> Sql.parameters [ "@name", Sql.string name ]
    |> Sql.executeNonQuery
    |> ignore

let getAll () : FeatureFlag list =
    connStr ()
    |> Sql.connect
    |> Sql.query
        "SELECT key AS name, enabled, COALESCE(description, '') AS description, updated_at FROM feature_flags ORDER BY key"
    |> Sql.execute readFlag

let getByName (name: string) : FeatureFlag option =
    connStr ()
    |> Sql.connect
    |> Sql.query
        "SELECT key AS name, enabled, COALESCE(description, '') AS description, updated_at FROM feature_flags WHERE key = @name"
    |> Sql.parameters [ "@name", Sql.string name ]
    |> Sql.execute readFlag
    |> List.tryHead

let upsert (name: string) (enabled: bool) (description: string) : unit =
    connStr ()
    |> Sql.connect
    |> Sql.query
        """
        INSERT INTO feature_flags (key, value, enabled, description, updated_at)
        VALUES (@name, CAST(@value AS jsonb), @enabled, @description, NOW())
        ON CONFLICT (key) DO UPDATE
            SET value = CAST(@value AS jsonb),
                enabled = @enabled,
                description = @description,
                updated_at = NOW()
    """
    |> Sql.parameters
        [ "@name", Sql.string name
          "@value", Sql.string (flagValue enabled)
          "@enabled", Sql.bool enabled
          "@description", Sql.string description ]
    |> Sql.executeNonQuery
    |> ignore
