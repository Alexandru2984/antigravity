module ConfigService.Program

open System
open System.Text.Json
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open Giraffe
open ConfigService.FeatureFlags

// ── Handlers ──────────────────────────────────────────────────

let health: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let json = """{"status":"ok","service":"config-service"}"""
        ctx.SetContentType "application/json"
        text json next ctx

let getAllFlags: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let flags = getAll ()
        json flags next ctx

let getFlagByName (name: string) : HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        match getByName name with
        | Some flag -> json flag next ctx
        | None -> RequestErrors.NOT_FOUND "Not found" next ctx

type UpsertPayload() =
    member val enabled = false with get, set
    member val description = "" with get, set

let upsertFlag (name: string) : HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let parsed = JsonSerializer.Deserialize<UpsertPayload>(body)

            upsert name parsed.enabled parsed.description
            return! json {| updated = name |} next ctx
        }

let isEnabled (name: string) : HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let enabled =
            match getByName name with
            | Some f -> f.Enabled
            | None -> false

        json {| name = name; enabled = enabled |} next ctx

// ── Routes ────────────────────────────────────────────────────

let webApp: HttpHandler =
    choose
        [ GET >=> route "/health" >=> health
          GET >=> route "/ready" >=> health
          GET >=> route "/config/flags" >=> getAllFlags
          GET >=> routef "/config/flags/%s" getFlagByName
          PUT >=> routef "/config/flags/%s" upsertFlag
          GET >=> routef "/config/flags/%s/check" isEnabled ]

// ── Bootstrap ─────────────────────────────────────────────────

[<EntryPoint>]
let main args =
    let builder = WebApplication.CreateBuilder(args)
    builder.Services.AddGiraffe() |> ignore

    let app = builder.Build()
    app.UseGiraffe(webApp)

    let port =
        Environment.GetEnvironmentVariable("PORT")
        |> Option.ofObj
        |> Option.defaultValue "4034"

    app.Run($"http://0.0.0.0:{port}")
    0
