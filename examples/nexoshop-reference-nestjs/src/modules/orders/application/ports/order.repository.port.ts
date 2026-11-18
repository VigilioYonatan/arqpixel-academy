import type { EventEnvelope } from '../../../../shared/messaging/event-envelope.type.js';
import type { OrderLineSchema, OrderSchema } from '../../domain/schemas/order.schema.js';

export const ORDER_REPOSITORY_PORT = Symbol('ORDER_REPOSITORY_PORT');

export type OrderPlacedEventPayload = {
  readonly order_id: string;
  readonly customer_id: string;
  readonly total_decimal: string;
  readonly line_count: number;
};

export type AtomicPlaceOrderUnit = {
  readonly tenant_id: string;
  readonly idempotency_key: string;
  readonly order: OrderSchema;
  readonly stock_deductions: readonly OrderLineSchema[];
  readonly outbox_event: EventEnvelope<OrderPlacedEventPayload>;
};

export type OrderPublicSummary = Pick<
  OrderSchema,
  'id' | 'tenant_id' | 'customer_id' | 'status' | 'total_decimal' | 'created_at'
>;

export interface OrderRepositoryPort {
  findByIdempotencyKey(
    tenant_id: string,
    idempotency_key: string,
  ): Promise<{ readonly order: OrderPublicSummary; readonly replayed: boolean } | null>;

  saveOrderWithOutbox(unit: AtomicPlaceOrderUnit): Promise<OrderPublicSummary>;

  findById(order_id: string, tenant_id: string): Promise<OrderPublicSummary | null>;

  cancelOrderWithOutbox(
    order_id: string,
    tenant_id: string,
    outbox_event: EventEnvelope<{ readonly order_id: string; readonly reason: string }>,
  ): Promise<OrderPublicSummary | null>;
}
