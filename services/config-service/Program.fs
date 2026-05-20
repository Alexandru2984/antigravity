module ConfigService.Program

open System
open System.Text.Json
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open Giraffe
open ConfigService.FeatureFlags

// ── Handlers ──────────────────────────────────────────────────

let health: HttpHandler =
    fun _ ctx -> task {
        ctx.Response.ContentType <- "application/json"
        let json = """{"status":"ok","service":"config-service"}"""
        do! ctx.Response.WriteAsync(json)
        return Some ctx
    }

let getAllFlags: HttpHandler =
    fun _ ctx -> task {
        let flags = getAll ()
        return! json flags ctx
    }

let getFlagByName (name: string): HttpHandler =
    fun _ ctx -> task {
        match getByName name with
        | Some flag -> return! json flag ctx
        | None      -> return! RequestErrors.NOT_FOUND "Not found" ctx
    }

let upsertFlag (name: string): HttpHandler =
    fun req ctx -> task {
        let! body  = ctx.ReadBodyFromRequestAsync()
        let parsed = JsonSerializer.Deserialize<{| enabled: bool; description: string |}>(body)
        upsert name parsed.enabled parsed.description
        return! json {| updated = name |} ctx
    }

let isEnabled (name: string): HttpHandler =
    fun _ ctx -> task {
        let enabled =
            match getByName name with
            | Some f -> f.Enabled
            | None   -> false
        return! json {| name = name; enabled = enabled |} ctx
    }

// ── Routes ────────────────────────────────────────────────────

let webApp: HttpHandler =
    choose [
        GET  >=> route "/health"                 >=> health
        GET  >=> route "/ready"                  >=> health
        GET  >=> route "/config/flags"           >=> getAllFlags
        GET  >=> routef "/config/flags/%s"       getFlagByName
        PUT  >=> routef "/config/flags/%s"       upsertFlag
        GET  >=> routef "/config/flags/%s/check" isEnabled
    ]

// ── Bootstrap ─────────────────────────────────────────────────

[<EntryPoint>]
let main args =
    let builder = WebApplication.CreateBuilder(args)
    builder.Services.AddGiraffe() |> ignore

    let app = builder.Build()
    app.UseGiraffe(webApp)

    let port = Environment.GetEnvironmentVariable("PORT") |> Option.ofObj |> Option.defaultValue "4034"
    app.Run($"http://0.0.0.0:{port}")
    0
