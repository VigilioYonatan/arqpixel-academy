import type { EventEnvelope } from '../../../../../shared/messaging/event-envelope.type.js';
import type {
  AtomicPlaceOrderUnit,
  OrderPublicSummary,
  OrderRepositoryPort,
} from '../../../application/ports/order.repository.port.js';
import { StockItem } from '../../../domain/entities/stock-item.entity.js';
import { OptimisticConcurrencyError } from '../../../domain/exceptions/order-domain.error.js';
import type { OrderSchema } from '../../../domain/schemas/order.schema.js';

type StoredStockRow = {
  available_qty: number;
  version: number;
};

/**
 * Offline deterministic adapter implementing atomic snapshot/rollback transactions,
 * optimistic locking (`version`), `(tenant_id, idempotency_key)` uniqueness, and `outbox_events`.
 */
export class InMemoryOrderRepository implements OrderRepositoryPort {
  private readonly orders = new Map<string, OrderSchema>();
  private readonly idempotency_index = new Map<string, string>();
  private readonly stock_table = new Map<string, StoredStockRow>();
  private readonly outbox_table: Array<EventEnvelope<unknown>> = [];
  private simulate_outbox_failure = false;

  seedStock(tenant_id: string, sku: string, available_qty: number, version = 1): void {
    this.stock_table.set(`${tenant_id}:${sku}`, { available_qty, version });
  }

  setSimulateOutboxFailure(should_fail: boolean): void {
    this.simulate_outbox_failure = should_fail;
  }

  getStockSnapshot(tenant_id: string, sku: string): StoredStockRow | undefined {
    const row = this.stock_table.get(`${tenant_id}:${sku}`);
    return row ? { ...row } : undefined;
  }

  getPendingOutboxEvents(): ReadonlyArray<EventEnvelope<unknown>> {
    return [...this.outbox_table];
  }

  private toPublicSummary(row: OrderSchema): OrderPublicSummary {
    // Allowlist projection: `internal_risk_audit_note` is NEVER returned outside persistence.
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      customer_id: row.customer_id,
      status: row.status,
      total_decimal: row.total_decimal,
      created_at: row.created_at,
    };
  }

  async findByIdempotencyKey(
    tenant_id: string,
    idempotency_key: string,
  ): Promise<{ readonly order: OrderPublicSummary; readonly replayed: boolean } | null> {
    const order_id = this.idempotency_index.get(`${tenant_id}:${idempotency_key}`);
    if (!order_id) return null;
    const found = this.orders.get(order_id);
    if (!found || found.tenant_id !== tenant_id) return null;
    return { order: this.toPublicSummary(found), replayed: true };
  }

  async saveOrderWithOutbox(unit: AtomicPlaceOrderUnit): Promise<OrderPublicSummary> {
    const idem_composite = `${unit.tenant_id}:${unit.idempotency_key}`;
    if (this.idempotency_index.has(idem_composite)) {
      const prev_id = this.idempotency_index.get(idem_composite)!;
      return this.toPublicSummary(this.orders.get(prev_id)!);
    }

    // Snapshot for atomic rollback if any step (stock invariant, optimistic lock, or outbox) fails
    const staged_stock = new Map<string, StoredStockRow>();

    for (const line of unit.stock_deductions) {
      const stock_key = `${unit.tenant_id}:${line.sku}`;
      const current_row = staged_stock.get(stock_key) ?? this.stock_table.get(stock_key);
      if (!current_row) {
        throw new Error(`SKU no registrado para el tenant: ${line.sku}`);
      }
      const aggregate = new StockItem(
        line.sku,
        unit.tenant_id,
        current_row.available_qty,
        current_row.version,
      );
      const transition = aggregate.reserveUnits(line.quantity);

      // Verify optimistic version has not drifted
      const live_row = this.stock_table.get(stock_key)!;
      if (live_row.version !== transition.expectedPreviousVersion && !staged_stock.has(stock_key)) {
        throw new OptimisticConcurrencyError(line.sku, transition.expectedPreviousVersion);
      }

      staged_stock.set(stock_key, {
        available_qty: transition.nextAvailableQty,
        version: transition.nextVersion,
      });
    }

    if (this.simulate_outbox_failure) {
      throw new Error('OUTBOX_WRITE_FAILED_SIMULATED_ROLLBACK');
    }

    // Commit all mutations together atomically
    for (const [stock_key, next_row] of staged_stock.entries()) {
      this.stock_table.set(stock_key, next_row);
    }
    this.orders.set(unit.order.id, { ...unit.order });
    this.idempotency_index.set(idem_composite, unit.order.id);
    this.outbox_table.push(unit.outbox_event);

    return this.toPublicSummary(unit.order);
  }

  /** Simulates concurrent compare-and-swap update using an explicit expected version. */
  reserveWithExpectedVersion(
    tenant_id: string,
    sku: string,
    expected_version: number,
    qty: number,
  ): StoredStockRow {
    const stock_key = `${tenant_id}:${sku}`;
    const live = this.stock_table.get(stock_key);
    if (!live) throw new Error(`SKU inexistente: ${sku}`);
    if (live.version !== expected_version) {
      throw new OptimisticConcurrencyError(sku, expected_version);
    }
    const item = new StockItem(sku, tenant_id, live.available_qty, live.version);
    const res = item.reserveUnits(qty);
    const updated = { available_qty: res.nextAvailableQty, version: res.nextVersion };
    this.stock_table.set(stock_key, updated);
    return updated;
  }

  async findById(order_id: string, tenant_id: string): Promise<OrderPublicSummary | null> {
    const row = this.orders.get(order_id);
    if (!row || row.tenant_id !== tenant_id) return null;
    return this.toPublicSummary(row);
  }

  async cancelOrderWithOutbox(
    order_id: string,
    tenant_id: string,
    outbox_event: EventEnvelope<{ readonly order_id: string; readonly reason: string }>,
  ): Promise<OrderPublicSummary | null> {
    const row = this.orders.get(order_id);
    if (!row || row.tenant_id !== tenant_id) return null;
    const updated: OrderSchema = { ...row, status: 'CANCELED' };
    this.orders.set(order_id, updated);
    this.outbox_table.push(outbox_event);
    return this.toPublicSummary(updated);
  }
}
