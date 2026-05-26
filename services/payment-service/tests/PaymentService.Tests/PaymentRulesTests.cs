using PaymentService;
using Xunit;

namespace PaymentService.Tests;

public class PaymentRulesTests
{
    [Theory]
    [InlineData(1, "RON")]
    [InlineData(12.34, " usd ")]
    public void IsValidCreateIntentAcceptsPositiveAmountAndCurrency(decimal amount, string currency)
    {
        var request = new CreateIntentRequest(amount, currency, Guid.NewGuid());

        Assert.True(PaymentRules.IsValidCreateIntent(request));
    }

    [Theory]
    [InlineData(0, "RON")]
    [InlineData(-1, "RON")]
    [InlineData(10, "")]
    [InlineData(10, "RO")]
    [InlineData(10, "RON1")]
    public void IsValidCreateIntentRejectsInvalidRequests(decimal amount, string currency)
    {
        var request = new CreateIntentRequest(amount, currency, null);

        Assert.False(PaymentRules.IsValidCreateIntent(request));
    }

    [Theory]
    [InlineData(" RON ", "ron")]
    [InlineData("Usd", "usd")]
    public void NormalizeCurrencyTrimsAndLowercasesValidCurrency(string input, string expected)
    {
        Assert.Equal(expected, PaymentRules.NormalizeCurrency(input));
    }

    [Theory]
    [InlineData(1, 100)]
    [InlineData(12.34, 1234)]
    [InlineData(12.345, 1235)]
    public void ToStripeMinorUnitsRoundsToSmallestCurrencyUnit(decimal amount, long expected)
    {
        Assert.Equal(expected, PaymentRules.ToStripeMinorUnits(amount));
    }
}
