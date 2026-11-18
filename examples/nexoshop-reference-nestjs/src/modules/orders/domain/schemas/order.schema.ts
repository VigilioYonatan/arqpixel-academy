import { z } from '../../../../shared/validation/zod-lite.js';
import {
  EXACT_DECIMAL_MONEY_REGEX,
  MAX_ORDER_LINES,
  MAX_UNITS_PER_LINE,
  ORDER_STATUSES,
} from '../constants/order-rules.constants.js';

export const orderLineSchema = z.object({
  sku: z.string({ min: 3, max: 40, pattern: /^[A-Z0-9-]+$/ }),
  quantity: z.int({ min: 1, max: MAX_UNITS_PER_LINE }),
  // Dinero exacto como string decimal para impedir errores IEEE-754 entre JSON y PostgreSQL numeric(12,2).
  unit_price_decimal: z.string({ pattern: EXACT_DECIMAL_MONEY_REGEX }),
});

export type OrderLineSchema = z.infer<typeof orderLineSchema>;

export const orderSchema = z.object({
  id: z.string({ min: 4, max: 64 }),
  tenant_id: z.string({ min: 3, max: 64 }),
  customer_id: z.string({ min: 3, max: 64 }),
  status: z.enum(ORDER_STATUSES),
  lines: z.array(orderLineSchema, { min: 1, max: MAX_ORDER_LINES }),
  total_decimal: z.string({ pattern: EXACT_DECIMAL_MONEY_REGEX }),
  created_at: z.string({ min: 10, max: 40 }),
  internal_risk_audit_note: z.string({ min: 0, max: 200 }),
});

export type OrderSchema = z.infer<typeof orderSchema>;

export function sumOrderLinesDecimal(lines: readonly OrderLineSchema[]): string {
  let total_cents = 0;
  for (const line of lines) {
    const [int_part, dec_part] = line.unit_price_decimal.split('.');
    const unit_cents = Number(int_part) * 100 + Number(dec_part);
    total_cents += unit_cents * line.quantity;
  }
  const whole = Math.floor(total_cents / 100);
  const cents = String(total_cents % 100).padStart(2, '0');
  return `${whole}.${cents}`;
}
