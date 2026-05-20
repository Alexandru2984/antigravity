using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Services;
using Serilog;
using Stripe;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ───────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .Enrich.FromLogContext()
    .CreateLogger();
builder.Host.UseSerilog();

// ── Stripe ────────────────────────────────────────────────────
StripeConfiguration.ApiKey = builder.Configuration["STRIPE_SECRET_KEY"]
    ?? Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY")
    ?? throw new InvalidOperationException("STRIPE_SECRET_KEY is required");

// ── Database ──────────────────────────────────────────────────
var connStr = builder.Configuration.GetConnectionString("Postgres")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=localhost;Port=5432;Database=payments;Username=polymarket;Password=polymarket";
builder.Services.AddDbContext<PaymentDbContext>(opt => opt.UseNpgsql(connStr));

// ── Services ──────────────────────────────────────────────────
builder.Services.AddScoped<IStripeService, StripeService>();
builder.Services.AddSingleton<IKafkaProducer, KafkaProducer>();

// ── OpenTelemetry ─────────────────────────────────────────────
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation());

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── Migrations ────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();

// ── Health ────────────────────────────────────────────────────
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "payment-service" }));
app.MapGet("/ready",  () => Results.Ok(new { status = "ready" }));

// ── Payment Endpoints ─────────────────────────────────────────
app.MapGroup("/payments").MapPaymentEndpoints();

app.Run($"http://0.0.0.0:{Environment.GetEnvironmentVariable("PORT") ?? "4006"}");
