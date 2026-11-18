/** Domain business limits owned exclusively by the Orders bounded context. */
export const MAX_ORDER_LINES = 50;
export const MAX_UNITS_PER_LINE = 20;
export const IDEMPOTENCY_KEY_MIN_LENGTH = 8;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
export const ORDER_STATUSES = ['PENDING_PAYMENT', 'PAID', 'CANCELED'];
export const EXACT_DECIMAL_MONEY_REGEX = /^\d+\.\d{2}$/;
