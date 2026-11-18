namespace NexoShop.Orders.Domain;

public sealed class OrderAggregate
{
    public string OrderId { get; }
    public string TenantId { get; }
    public string Sku { get; }
    public int Quantity { get; }
    public long TotalCents { get; }
    public int Version { get; private set; }

    private OrderAggregate(
        string orderId,
        string tenantId,
        string sku,
        int quantity,
        long unitPriceCents,
        int version)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            throw new InvalidOperationException("TenantId obligatorio para aislamiento multi-tenant.");
        if (quantity <= 0)
            throw new InvalidOperationException("La cantidad del pedido debe ser mayor a cero.");
        if (unitPriceCents <= 0)
            throw new InvalidOperationException("El precio unitario en centavos debe ser positivo.");

        OrderId = orderId;
        TenantId = tenantId;
        Sku = sku;
        Quantity = quantity;
        TotalCents = checked(quantity * unitPriceCents);
        Version = version;
    }

    public static OrderAggregate Create(
        string orderId,
        string tenantId,
        string sku,
        int quantity,
        long unitPriceCents) =>
        new(orderId, tenantId, sku, quantity, unitPriceCents, version: 1);

    public void AdvanceOptimisticVersion(int expectedVersion)
    {
        if (Version != expectedVersion)
            throw new InvalidOperationException($"Conflicto de concurrencia optimista: esperado v{expectedVersion}, actual v{Version}.");
        Version++;
    }
}
