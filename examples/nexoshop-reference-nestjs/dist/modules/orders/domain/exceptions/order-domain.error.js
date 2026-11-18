export class InsufficientStockError extends Error {
    code = 'INSUFFICIENT_STOCK';
    constructor(sku, requested_qty, available_qty) {
        super(`Stock insuficiente para ${sku}: solicitado ${requested_qty}, disponible ${available_qty}`);
        this.name = 'InsufficientStockError';
    }
}
export class OptimisticConcurrencyError extends Error {
    code = 'OPTIMISTIC_LOCK_CONFLICT';
    constructor(resource_id, expected_version) {
        super(`Conflicto de concurrencia optimista en ${resource_id} (versión esperada ${expected_version})`);
        this.name = 'OptimisticConcurrencyError';
    }
}
export class OrderStateConflictError extends Error {
    code = 'ORDER_STATE_CONFLICT';
    constructor(order_id, current_status) {
        super(`Transición de negocio no permitida para pedido ${order_id} en estado ${current_status}`);
        this.name = 'OrderStateConflictError';
    }
}
