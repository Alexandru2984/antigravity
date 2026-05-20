using Stripe;
using PaymentService.Models;
using PaymentService.Data;
using Microsoft.EntityFrameworkCore;

namespace PaymentService.Services;

public interface IStripeService
{
    Task<PaymentIntentResult> CreateIntentAsync(Guid userId, Guid? listingId, decimal amount, string currency);
    Task<Transaction> ConfirmPaymentAsync(string paymentIntentId);
}

public record PaymentIntentResult(string ClientSecret, string PaymentIntentId, Guid TransactionId);

public class StripeService(PaymentDbContext db, IKafkaProducer kafka, ILogger<StripeService> logger)
    : IStripeService
{
    public async Task<PaymentIntentResult> CreateIntentAsync(
        Guid userId, Guid? listingId, decimal amount, string currency)
    {
        var opts = new PaymentIntentCreateOptions
        {
            Amount   = (long)(amount * 100),  // Stripe uses smallest currency unit
            Currency = currency.ToLower(),
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
            Metadata = new Dictionary<string, string>
            {
                ["user_id"]    = userId.ToString(),
                ["listing_id"] = listingId?.ToString() ?? "",
            },
        };

        var svc    = new PaymentIntentService();
        var intent = await svc.CreateAsync(opts);

        var tx = new Transaction
        {
            UserId                = userId,
            ListingId             = listingId,
            Amount                = amount,
            Currency              = currency,
            Status                = "pending",
            StripePaymentIntentId = intent.Id,
            StripeClientSecret    = intent.ClientSecret,
        };
        db.Transactions.Add(tx);
        await db.SaveChangesAsync();

        logger.LogInformation("Created PaymentIntent {IntentId} for user {UserId}", intent.Id, userId);
        return new PaymentIntentResult(intent.ClientSecret, intent.Id, tx.Id);
    }

    public async Task<Transaction> ConfirmPaymentAsync(string paymentIntentId)
    {
        var tx = await db.Transactions
            .FirstOrDefaultAsync(t => t.StripePaymentIntentId == paymentIntentId)
            ?? throw new KeyNotFoundException($"Transaction for {paymentIntentId} not found");

        var svc    = new PaymentIntentService();
        var intent = await svc.GetAsync(paymentIntentId);

        tx.Status    = intent.Status == "succeeded" ? "completed" : "failed";
        tx.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (tx.Status == "completed")
        {
            await kafka.PublishAsync("payments.processed", new
            {
                transaction_id = tx.Id,
                user_id        = tx.UserId,
                listing_id     = tx.ListingId,
                amount         = tx.Amount,
                currency       = tx.Currency,
                occurred_at    = DateTime.UtcNow,
            });
        }

        return tx;
    }
}
