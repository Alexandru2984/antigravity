using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Services;
using PaymentService;
using Serilog;
using Stripe;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .Enrich.FromLogContext()
    .CreateLogger();
builder.Host.UseSerilog();

StripeConfiguration.ApiKey = builder.Configuration["STRIPE_SECRET_KEY"]
    ?? Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY")
    ?? "sk_test_placeholder";

var connStr = builder.Configuration.GetConnectionString("Postgres")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=localhost;Port=5432;Database=payments;Username=polymarket;Password=polymarket";
builder.Services.AddDbContext<PaymentDbContext>(opt => opt.UseNpgsql(connStr));

builder.Services.AddScoped<IStripeService, StripeService>();
builder.Services.AddSingleton<IKafkaProducer, KafkaProducer>();

builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation());

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "payment-service" }));
app.MapGet("/ready",  () => Results.Ok(new { status = "ready" }));

var payments = app.MapGroup("/payments");
PaymentEndpoints.MapPaymentEndpoints(payments);

app.Run();
