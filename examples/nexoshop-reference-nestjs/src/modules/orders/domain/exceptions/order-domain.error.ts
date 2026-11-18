export class InsufficientStockError extends Error {
  readonly code = 'INSUFFICIENT_STOCK';
  constructor(sku: string, requested_qty: number, available_qty: number) {
    super(`Stock insuficiente para ${sku}: solicitado ${requested_qty}, disponible ${available_qty}`);
    this.name = 'InsufficientStockError';
  }
}

export class OptimisticConcurrencyError extends Error {
  readonly code = 'OPTIMISTIC_LOCK_CONFLICT';
  constructor(resource_id: string, expected_version: number) {
    super(`Conflicto de concurrencia optimista en ${resource_id} (versión esperada ${expected_version})`);
    this.name = 'OptimisticConcurrencyError';
  }
}

export class OrderStateConflictError extends Error {
  readonly code = 'ORDER_STATE_CONFLICT';
  constructor(order_id: string, current_status: string) {
    super(`Transición de negocio no permitida para pedido ${order_id} en estado ${current_status}`);
    this.name = 'OrderStateConflictError';
  }
}
