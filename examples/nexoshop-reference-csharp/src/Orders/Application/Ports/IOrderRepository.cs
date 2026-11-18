using NexoShop.Orders.Domain;

namespace NexoShop.Orders.Application.Ports;

public sealed record OutboxEnvelope(string EventId, string AggregateId, string EventType, string PayloadJson);

public interface IOrderRepository
{
    Task<OrderAggregate?> FindByIdempotencyKeyAsync(string tenantId, string idempotencyKey, CancellationToken ct = default);
    Task SaveWithOutboxAsync(OrderAggregate order, string idempotencyKey, OutboxEnvelope outboxEvent, CancellationToken ct = default);
}
