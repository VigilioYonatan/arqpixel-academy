import { InsufficientStockError } from '../exceptions/order-domain.error.js';
/**
 * Aggregate Root for SKU inventory protection (`S06`).
 * Enforces `available_qty >= 0` and advances `version` on every reservation
 * so the persistence adapter can execute `WHERE sku = $1 AND version = $2`.
 */
export class StockItem {
    sku;
    tenant_id;
    current_available_qty;
    current_version;
    constructor(sku, tenant_id, current_available_qty, current_version) {
        this.sku = sku;
        this.tenant_id = tenant_id;
        this.current_available_qty = current_available_qty;
        this.current_version = current_version;
        if (current_available_qty < 0 || !Number.isInteger(current_available_qty)) {
            throw new Error('Stock inicial inválido');
        }
    }
    get availableQty() {
        return this.current_available_qty;
    }
    get version() {
        return this.current_version;
    }
    reserveUnits(requested_qty) {
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
