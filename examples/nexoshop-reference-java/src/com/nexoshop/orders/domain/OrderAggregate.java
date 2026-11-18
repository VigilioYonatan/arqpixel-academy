package com.nexoshop.orders.domain;

public record OrderAggregate(
    String orderId,
    String tenantId,
    String sku,
    int quantity,
    long totalCents,
    int version
) {
    public OrderAggregate {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId obligatorio para aislamiento multi-tenant.");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity debe ser mayor que cero.");
        }
        if (totalCents <= 0) {
            throw new IllegalArgumentException("totalCents debe ser positivo.");
        }
    }

    public static OrderAggregate create(String orderId, String tenantId, String sku, int quantity, long unitPriceCents) {
        if (unitPriceCents <= 0) {
            throw new IllegalArgumentException("unitPriceCents debe ser positivo.");
        }
        return new OrderAggregate(orderId, tenantId, sku, quantity, Math.multiplyExact(quantity, unitPriceCents), 1);
    }

    public OrderAggregate advanceOptimisticVersion(int expectedVersion) {
        if (this.version != expectedVersion) {
            throw new IllegalStateException("Conflicto de concurrencia optimista en OrderAggregate.");
        }
        return new OrderAggregate(orderId, tenantId, sku, quantity, totalCents, version + 1);
    }
}
