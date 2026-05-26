using Confluent.Kafka;
using PaymentService;
using System.Text.Json;

namespace PaymentService.Services;

public interface IKafkaProducer
{
    Task PublishAsync(string topic, object payload);
}

public class KafkaProducer : IKafkaProducer, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaProducer> _logger;

    public KafkaProducer(IConfiguration config, ILogger<KafkaProducer> logger)
    {
        _logger = logger;
        var bootstrapServers = PaymentRuntimeConfigLoader.KafkaBootstrapServers(config);

        var producerConfig = new ProducerConfig
        {
            BootstrapServers = bootstrapServers,
            Acks = Acks.Leader,
            EnableDeliveryReports = false,
            MessageTimeoutMs = 5000,
        };
        _producer = new ProducerBuilder<string, string>(producerConfig).Build();
    }

    public async Task PublishAsync(string topic, object payload)
    {
        try
        {
            var json = JsonSerializer.Serialize(payload);
            await _producer.ProduceAsync(topic, new Message<string, string>
            {
                Key = Guid.NewGuid().ToString(),
                Value = json,
            });
            _logger.LogDebug("Published to {Topic}: {Payload}", topic, json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish to Kafka topic {Topic}", topic);
        }
    }

    public void Dispose() => _producer?.Dispose();
}
