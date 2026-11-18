using NexoShop.Orders.Application.Ports;
using NexoShop.Orders.Domain;

namespace NexoShop.Orders.Application;

public sealed class PlaceOrderUseCase
{
    private readonly IOrderRepository _repository;

    public PlaceOrderUseCase(IOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task<OrderAggregate> ExecuteAsync(
        string tenantId,
        string idempotencyKey,
        string sku,
        int quantity,
        long unitPriceCents,
        CancellationToken ct = default)
    {
        var existing = await _repository.FindByIdempotencyKeyAsync(tenantId, idempotencyKey, ct);
        if (existing is not null)
            return existing;

        var order = OrderAggregate.Create(Guid.NewGuid().ToString("N"), tenantId, sku, quantity, unitPriceCents);
        var outbox = new OutboxEnvelope(
            Guid.NewGuid().ToString("N"),
            order.OrderId,
            "orders.placed.v1",
            $"{{\"order_id\":\"{order.OrderId}\",\"total_cents\":{order.TotalCents}}}");

        await _repository.SaveWithOutboxAsync(order, idempotencyKey, outbox, ct);
        return order;
    }
}
