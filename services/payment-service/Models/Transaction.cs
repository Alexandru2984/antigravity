namespace PaymentService.Models;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid? ListingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "RON";
    public string Status { get; set; } = "pending";  // pending | completed | failed | refunded
    public string StripePaymentIntentId { get; set; } = "";
    public string? StripeClientSecret { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
