package com.nexoshop.orders.infrastructure;

import com.nexoshop.orders.application.port.OrderRepositoryPort;
import com.nexoshop.orders.domain.OrderAggregate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class JpaOrderRepositoryAdapter implements OrderRepositoryPort {
    private final Map<String, OrderAggregate> idempotencyStore = new HashMap<>();
    private final List<OutboxRecord> outboxRecords = new ArrayList<>();

    @Override
    public Optional<OrderAggregate> findByIdempotencyKey(String tenantId, String idempotencyKey) {
        return Optional.ofNullable(idempotencyStore.get(tenantId + ":" + idempotencyKey));
    }

    @Override
    public void saveWithOutbox(OrderAggregate order, String idempotencyKey, OutboxRecord outboxRecord) {
        idempotencyStore.put(order.tenantId() + ":" + idempotencyKey, order);
        outboxRecords.add(outboxRecord);
    }
}
