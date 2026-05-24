using PaymentService.Services;
using PaymentService.Data;
using PaymentService.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Stripe;

namespace PaymentService;

public static class PaymentEndpoints
{
    public static RouteGroupBuilder MapPaymentEndpoints(this RouteGroupBuilder group)
    {
        // POST /payments/intent — create payment intent
        group.MapPost("/intent", async (
            CreateIntentRequest req,
            IStripeService stripe,
            HttpContext ctx) =>
        {
            var (userId, authFailure) = RequireGatewayUser(ctx);
            if (authFailure is not null)
            {
                return authFailure;
            }

            if (req.Amount <= 0 || string.IsNullOrWhiteSpace(req.Currency))
            {
                return Results.BadRequest(new { error = "Invalid payment request" });
            }

            var result = await stripe.CreateIntentAsync(userId!.Value, req.ListingId, req.Amount, req.Currency);
            return Results.Ok(new
            {
                client_secret = result.ClientSecret,
                payment_intent_id = result.PaymentIntentId,
                transaction_id = result.TransactionId,
            });
        });

        // POST /payments/confirm — confirm payment
        group.MapPost("/confirm", async (
            ConfirmRequest req,
            IStripeService stripe,
            HttpContext ctx) =>
        {
            var (userId, authFailure) = RequireGatewayUser(ctx);
            if (authFailure is not null)
            {
                return authFailure;
            }

            Transaction tx;
            try
            {
                tx = await stripe.ConfirmPaymentAsync(userId!.Value, req.PaymentIntentId);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }

            return Results.Ok(new { status = tx.Status, transaction_id = tx.Id });
        });

        // GET /payments/:id — get transaction
        group.MapGet("/{id:guid}", async (Guid id, PaymentDbContext db, HttpContext ctx) =>
        {
            var (userId, authFailure) = RequireGatewayUser(ctx);
            if (authFailure is not null)
            {
                return authFailure;
            }

            var tx = await db.Transactions
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId!.Value);
            return tx is null ? Results.NotFound() : Results.Ok(tx);
        });

        // POST /payments/webhook — Stripe webhook
        group.MapPost("/webhook", async (
            HttpContext ctx,
            PaymentDbContext db,
            IKafkaProducer kafka,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            var json = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
            var sig = ctx.Request.Headers["Stripe-Signature"].FirstOrDefault() ?? "";
            var secret = config["STRIPE_WEBHOOK_SECRET"]
                ?? Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET")
                ?? "";

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(json, sig, secret,
                    throwOnApiVersionMismatch: false);

                if (stripeEvent.Type == "payment_intent.succeeded")
                {
                    var intent = (PaymentIntent)stripeEvent.Data.Object;
                    var tx = await db.Transactions.FirstOrDefaultAsync(
                        t => t.StripePaymentIntentId == intent.Id);
                    if (tx is not null)
                    {
                        tx.Status = "completed";
                        tx.UpdatedAt = DateTime.UtcNow;
                        await db.SaveChangesAsync();
                        await kafka.PublishAsync("payments.processed", new
                        {
                            transaction_id = tx.Id,
                            user_id = tx.UserId,
                            listing_id = tx.ListingId,
                            amount = tx.Amount,
                            occurred_at = DateTime.UtcNow,
                        });
                        logger.LogInformation("Payment succeeded for intent {IntentId}", intent.Id);
                    }
                }

                return Results.Ok();
            }
            catch (StripeException ex)
            {
                logger.LogWarning("Invalid Stripe webhook: {Msg}", ex.Message);
                return Results.BadRequest();
            }
        });

        return group;
    }

    private static (Guid? UserId, IResult? Failure) RequireGatewayUser(HttpContext ctx)
    {
        var expectedToken = Environment.GetEnvironmentVariable("INTERNAL_SERVICE_TOKEN") ?? "";
        if (string.IsNullOrWhiteSpace(expectedToken))
        {
            return (null, Results.Problem(
                "INTERNAL_SERVICE_TOKEN is not configured",
                statusCode: StatusCodes.Status500InternalServerError));
        }

        var actualToken = ctx.Request.Headers["X-Internal-Service-Token"].FirstOrDefault() ?? "";
        if (!ConstantTimeEquals(expectedToken, actualToken))
        {
            return (null, Results.Unauthorized());
        }

        var userIdStr = ctx.Request.Headers["X-User-Id"].FirstOrDefault() ?? "";
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return (null, Results.Unauthorized());
        }

        return (userId, null);
    }

    private static bool ConstantTimeEquals(string expected, string actual)
    {
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(actual));

        return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
    }
}

public record CreateIntentRequest(decimal Amount, string Currency, Guid? ListingId);
public record ConfirmRequest(string PaymentIntentId);
