using Microsoft.Extensions.Configuration;

namespace PaymentService;

public record PaymentRuntimeConfig(
    string StripeSecretKey,
    string StripeWebhookSecret,
    string DatabaseUrl,
    string KafkaBootstrapServers
);

public static class PaymentRuntimeConfigLoader
{
    public static PaymentRuntimeConfig FromConfiguration(IConfiguration config)
    {
        return new PaymentRuntimeConfig(
            StripeSecretKey: Required(config, "Stripe:SecretKey", "STRIPE_SECRET_KEY"),
            StripeWebhookSecret: Required(config, "Stripe:WebhookSecret", "STRIPE_WEBHOOK_SECRET"),
            DatabaseUrl: Required(config, "ConnectionStrings:Postgres", "DATABASE_URL"),
            KafkaBootstrapServers: Required(config, "Kafka:BootstrapServers", "KAFKA_BROKERS")
        );
    }

    public static string KafkaBootstrapServers(IConfiguration config)
    {
        return Required(config, "Kafka:BootstrapServers", "KAFKA_BROKERS");
    }

    public static string StripeWebhookSecret(IConfiguration config)
    {
        return Required(config, "Stripe:WebhookSecret", "STRIPE_WEBHOOK_SECRET");
    }

    private static string Required(IConfiguration config, string primaryKey, string fallbackKey)
    {
        var value = config[primaryKey] ?? config[fallbackKey];
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{primaryKey} is required");
        }

        return value;
    }
}
