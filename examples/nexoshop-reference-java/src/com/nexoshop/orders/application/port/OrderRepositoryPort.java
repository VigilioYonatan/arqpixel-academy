package com.nexoshop.orders.application.port;

import com.nexoshop.orders.domain.OrderAggregate;
import java.util.Optional;

public interface OrderRepositoryPort {
    record OutboxRecord(String eventId, String aggregateId, String eventType, String payloadJson) {}

    Optional<OrderAggregate> findByIdempotencyKey(String tenantId, String idempotencyKey);

    void saveWithOutbox(OrderAggregate order, String idempotencyKey, OutboxRecord outboxRecord);
}
