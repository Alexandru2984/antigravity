module ConfigService.FeatureFlags

open Npgsql.FSharp

type FeatureFlag =
    { Name: string
      Enabled: bool
      Description: string
      UpdatedAt: System.DateTime }

let private connStr () =
    System.Environment.GetEnvironmentVariable("DATABASE_URL")
    |> Option.ofObj
    |> Option.defaultValue "Host=localhost;Port=5432;Database=config;Username=polymarket;Password=polymarket"

let getAll () : FeatureFlag list =
    connStr ()
    |> Sql.connect
    |> Sql.query "SELECT name, enabled, description, updated_at FROM feature_flags ORDER BY name"
    |> Sql.execute (fun read ->
        { Name = read.string "name"
          Enabled = read.bool "enabled"
          Description = read.string "description"
          UpdatedAt = read.dateTime "updated_at" })

let getByName (name: string) : FeatureFlag option =
    connStr ()
    |> Sql.connect
    |> Sql.query "SELECT name, enabled, description, updated_at FROM feature_flags WHERE name = @name"
    |> Sql.parameters [ "@name", Sql.string name ]
    |> Sql.execute (fun read ->
        { Name = read.string "name"
          Enabled = read.bool "enabled"
          Description = read.string "description"
          UpdatedAt = read.dateTime "updated_at" })
    |> List.tryHead

let upsert (name: string) (enabled: bool) (description: string) : unit =
    connStr ()
    |> Sql.connect
    |> Sql.query
        """
        INSERT INTO feature_flags (name, enabled, description, updated_at)
        VALUES (@name, @enabled, @description, NOW())
        ON CONFLICT (name) DO UPDATE
            SET enabled = @enabled, description = @description, updated_at = NOW()
    """
    |> Sql.parameters
        [ "@name", Sql.string name
          "@enabled", Sql.bool enabled
          "@description", Sql.string description ]
    |> Sql.executeNonQuery
    |> ignore
