import { orderSchema } from '../../../domain/schemas/order.schema.js';
/**
 * Public allowlist HTTP Response DTO: excludes `internal_risk_audit_note` and internal metadata.
 */
export const placeOrderResponseDto = orderSchema.pick({
    id: true,
    tenant_id: true,
    customer_id: true,
    status: true,
    total_decimal: true,
    created_at: true,
});
