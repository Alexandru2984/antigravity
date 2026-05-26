using Microsoft.Extensions.Configuration;
using PaymentService;
using Xunit;

namespace PaymentService.Tests;

public class PaymentRuntimeConfigTests
{
    [Fact]
    public void FromConfigurationUsesComposeStyleKeys()
    {
        var config = Configuration(new Dictionary<string, string?>
        {
            ["Stripe:SecretKey"] = "sk_test_service",
            ["Stripe:WebhookSecret"] = "whsec_service",
            ["ConnectionStrings:Postgres"] = "Host=postgres;Database=polymarket_payments",
            ["Kafka:BootstrapServers"] = "kafka:29092",
        });

        var runtime = PaymentRuntimeConfigLoader.FromConfiguration(config);

        Assert.Equal("sk_test_service", runtime.StripeSecretKey);
        Assert.Equal("whsec_service", runtime.StripeWebhookSecret);
        Assert.Equal("Host=postgres;Database=polymarket_payments", runtime.DatabaseUrl);
        Assert.Equal("kafka:29092", runtime.KafkaBootstrapServers);
    }

    [Fact]
    public void FromConfigurationSupportsLegacyEnvironmentKeyNames()
    {
        var config = Configuration(new Dictionary<string, string?>
        {
            ["STRIPE_SECRET_KEY"] = "sk_test_legacy",
            ["STRIPE_WEBHOOK_SECRET"] = "whsec_legacy",
            ["DATABASE_URL"] = "Host=postgres;Database=legacy_payments",
            ["KAFKA_BROKERS"] = "kafka:29092",
        });

        var runtime = PaymentRuntimeConfigLoader.FromConfiguration(config);

        Assert.Equal("sk_test_legacy", runtime.StripeSecretKey);
        Assert.Equal("whsec_legacy", runtime.StripeWebhookSecret);
        Assert.Equal("Host=postgres;Database=legacy_payments", runtime.DatabaseUrl);
        Assert.Equal("kafka:29092", runtime.KafkaBootstrapServers);
    }

    [Fact]
    public void FromConfigurationRequiresRuntimeSecrets()
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            PaymentRuntimeConfigLoader.FromConfiguration(Configuration(new Dictionary<string, string?>())));

        Assert.Equal("Stripe:SecretKey is required", error.Message);
    }

    [Fact]
    public void KafkaBootstrapServersRequiresConfiguredValue()
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            PaymentRuntimeConfigLoader.KafkaBootstrapServers(
                Configuration(new Dictionary<string, string?>())));

        Assert.Equal("Kafka:BootstrapServers is required", error.Message);
    }

    private static IConfiguration Configuration(Dictionary<string, string?> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }
}
