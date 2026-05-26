namespace PaymentService;

public static class PaymentRules
{
    public static bool IsValidCreateIntent(CreateIntentRequest request)
    {
        return request.Amount > 0 && IsValidCurrency(request.Currency);
    }

    public static bool IsValidCurrency(string? currency)
    {
        return !string.IsNullOrWhiteSpace(currency)
            && currency.Trim().Length == 3
            && currency.Trim().All(char.IsAsciiLetter);
    }

    public static string NormalizeCurrency(string currency)
    {
        if (!IsValidCurrency(currency))
        {
            throw new ArgumentException("Currency must be a three-letter ISO code.", nameof(currency));
        }

        return currency.Trim().ToLowerInvariant();
    }

    public static long ToStripeMinorUnits(decimal amount)
    {
        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be positive.");
        }

        return checked((long)Math.Round(amount * 100m, 0, MidpointRounding.AwayFromZero));
    }
}
