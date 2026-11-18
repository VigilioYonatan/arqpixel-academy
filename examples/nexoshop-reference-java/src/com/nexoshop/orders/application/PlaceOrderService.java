package com.nexoshop.orders.application;

import com.nexoshop.orders.application.port.OrderRepositoryPort;
import com.nexoshop.orders.application.port.OrderRepositoryPort.OutboxRecord;
import com.nexoshop.orders.domain.OrderAggregate;
import java.util.UUID;

public final class PlaceOrderService {
    private final OrderRepositoryPort repository;

    public PlaceOrderService(OrderRepositoryPort repository) {
        this.repository = repository;
    }

    public OrderAggregate placeOrder(
        String tenantId,
        String idempotencyKey,
        String sku,
        int quantity,
        long unitPriceCents
    ) {
        return repository.findByIdempotencyKey(tenantId, idempotencyKey).orElseGet(() -> {
            OrderAggregate created = OrderAggregate.create(
                UUID.randomUUID().toString(),
                tenantId,
                sku,
                quantity,
                unitPriceCents
            );
            OutboxRecord outbox = new OutboxRecord(
                UUID.randomUUID().toString(),
                created.orderId(),
                "orders.placed.v1",
                "{\"order_id\":\"" + created.orderId() + "\",\"total_cents\":" + created.totalCents() + "}"
            );
            repository.saveWithOutbox(created, idempotencyKey, outbox);
            return created;
        });
    }
}
