import { orderSchema } from '../../../domain/schemas/order.schema.js';
/**
 * HTTP Request DTO derived directly from `orderSchema.pick(...)` in the HTTP presentation boundary.
 * Notice `tenant_id` is omitted on purpose: it MUST come from the authenticated server principal.
 */
export const placeOrderRequestDto = orderSchema.pick({
    customer_id: true,
    lines: true,
});
