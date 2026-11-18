using NexoShop.Orders.Application.Ports;
using NexoShop.Orders.Domain;

namespace NexoShop.Orders.Infrastructure;

public sealed class PostgresOrderRepository : IOrderRepository
{
    private readonly Dictionary<string, OrderAggregate> _idempotencyStore = new();
    private readonly List<OutboxEnvelope> _outboxTable = new();

    public Task<OrderAggregate?> FindByIdempotencyKeyAsync(
        string tenantId,
        string idempotencyKey,
        CancellationToken ct = default)
    {
        _idempotencyStore.TryGetValue($"{tenantId}:{idempotencyKey}", out var found);
        return Task.FromResult(found);
    }

    public Task SaveWithOutboxAsync(
        OrderAggregate order,
        string idempotencyKey,
        OutboxEnvelope outboxEvent,
        CancellationToken ct = default)
    {
        _idempotencyStore[$"{order.TenantId}:{idempotencyKey}"] = order;
        _outboxTable.Add(outboxEvent);
        return Task.CompletedTask;
    }
}
