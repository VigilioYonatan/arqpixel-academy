import { IDEMPOTENCY_KEY_MIN_LENGTH } from '../../domain/constants/order-rules.constants.js';
import { OrderStateConflictError } from '../../domain/exceptions/order-domain.error.js';
import { sumOrderLinesDecimal, } from '../../domain/schemas/order.schema.js';
/**
 * Application Service decoupled from HTTP, NestJS decorators and ORM rows (`S04`, `S06`, `S09`).
 * Injected constructor property uses `camelCase` per Vigilio NestJS DI exception,
 * while method parameters and local variables use `snake_case`.
 */
export class OrdersService {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async placeOrder(command) {
        const clean_key = command.idempotency_key.trim();
        if (clean_key.length < IDEMPOTENCY_KEY_MIN_LENGTH) {
            throw new Error('Idempotency-Key obligatoria y de longitud suficiente');
        }
        // Reintentos de red con la misma clave devuelven el mismo resultado sin volver a descontar stock.
        const existing = await this.orderRepository.findByIdempotencyKey(command.tenant_id, clean_key);
        if (existing) {
            return { order: existing.order, idempotent_replay: true };
        }
        const total_decimal = sumOrderLinesDecimal(command.lines);
        const created_at = command.now_iso ?? new Date().toISOString();
        const order_id = command.generated_order_id ?? `ord_${Date.now()}`;
        const event_id = command.generated_event_id ?? `evt_${order_id}`;
        const saved_summary = await this.orderRepository.saveOrderWithOutbox({
            tenant_id: command.tenant_id,
            idempotency_key: clean_key,
            order: {
                id: order_id,
                tenant_id: command.tenant_id,
                customer_id: command.customer_id,
                status: 'PENDING_PAYMENT',
                lines: [...command.lines],
                total_decimal,
                created_at,
                internal_risk_audit_note: 'INTERNAL_ONLY_DO_NOT_SERIALIZE',
            },
            stock_deductions: command.lines,
            outbox_event: {
                event_id,
                event_type: 'orders.order_placed',
                schema_version: 1,
                occurred_at: created_at,
                tenant_id: command.tenant_id,
                aggregate_id: order_id,
                payload: {
                    order_id,
                    customer_id: command.customer_id,
                    total_decimal,
                    line_count: command.lines.length,
                },
            },
        });
        return { order: saved_summary, idempotent_replay: false };
    }
    async getOrder(order_id, tenant_id) {
        return this.orderRepository.findById(order_id, tenant_id);
    }
    async cancelOrder(order_id, tenant_id, reason, now_iso) {
        const current = await this.orderRepository.findById(order_id, tenant_id);
        if (!current)
            return null;
        if (current.status === 'PAID' || current.status === 'CANCELED') {
            throw new OrderStateConflictError(order_id, current.status);
        }
        return this.orderRepository.cancelOrderWithOutbox(order_id, tenant_id, {
            event_id: `evt_cancel_${order_id}`,
            event_type: 'orders.order_canceled',
            schema_version: 1,
            occurred_at: now_iso ?? new Date().toISOString(),
            tenant_id,
            aggregate_id: order_id,
            payload: { order_id, reason },
        });
    }
}
