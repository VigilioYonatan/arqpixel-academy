import { InsufficientStockError } from '../exceptions/order-domain.error.js';

/**
 * Aggregate Root for SKU inventory protection (`S06`).
 * Enforces `available_qty >= 0` and advances `version` on every reservation
 * so the persistence adapter can execute `WHERE sku = $1 AND version = $2`.
 */
export class StockItem {
  constructor(
    readonly sku: string,
    readonly tenant_id: string,
    private current_available_qty: number,
    private current_version: number,
  ) {
    if (current_available_qty < 0 || !Number.isInteger(current_available_qty)) {
      throw new Error('Stock inicial inválido');
    }
  }

  get availableQty(): number {
    return this.current_available_qty;
  }

  get version(): number {
    return this.current_version;
  }

  reserveUnits(requested_qty: number): {
    readonly expectedPreviousVersion: number;
    readonly nextAvailableQty: number;
    readonly nextVersion: number;
  } {
    if (!Number.isInteger(requested_qty) || requested_qty <= 0) {
      throw new Error('La cantidad a reservar debe ser un entero positivo');
    }
    if (this.current_available_qty < requested_qty) {
      throw new InsufficientStockError(this.sku, requested_qty, this.current_available_qty);
    }

    const expected_previous = this.current_version;
    this.current_available_qty -= requested_qty;
    this.current_version += 1;

    return {
      expectedPreviousVersion: expected_previous,
      nextAvailableQty: this.current_available_qty,
      nextVersion: this.current_version,
    };
  }
}
