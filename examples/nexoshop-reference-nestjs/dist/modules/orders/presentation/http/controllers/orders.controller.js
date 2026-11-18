import { InsufficientStockError, OptimisticConcurrencyError, OrderStateConflictError, } from '../../../domain/exceptions/order-domain.error.js';
import { placeOrderRequestDto } from '../dto/place-order.request.dto.js';
/**
 * Thin HTTP boundary controller (Private-by-Default).
 * Validates input DTO, extracts `tenant_id` strictly from `principal`, and maps domain conflicts.
 */
export class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async placeOrder(params) {
        if (!params.principal) {
            return {
                status: 401,
                body: { error_code: 'UNAUTHENTICATED', message: 'Autenticación obligatoria' },
            };
        }
        let dto;
        try {
            dto = placeOrderRequestDto.parse(params.raw_body, 'body');
        }
        catch (err) {
            return {
                status: 422,
                body: { error_code: 'VALIDATION_ERROR', message: err.message },
            };
        }
        try {
            const result = await this.ordersService.placeOrder({
                tenant_id: params.principal.tenant_id,
                customer_id: dto.customer_id,
                idempotency_key: params.idempotency_key,
                lines: dto.lines,
            });
            return {
                status: result.idempotent_replay ? 200 : 201,
                body: {
                    data: result.order,
                    idempotent_replay: result.idempotent_replay,
                },
            };
        }
        catch (err) {
            if (err instanceof InsufficientStockError || err instanceof OptimisticConcurrencyError) {
                return {
                    status: 409,
                    body: { error_code: err.code, message: err.message },
                };
            }
            return {
                status: 422,
                body: { error_code: 'ORDER_REJECTED', message: err.message },
            };
        }
    }
    async getOrder(params) {
        if (!params.principal) {
            return {
                status: 401,
                body: { error_code: 'UNAUTHENTICATED', message: 'Autenticación obligatoria' },
            };
        }
        const order = await this.ordersService.getOrder(params.order_id, params.principal.tenant_id);
        if (!order) {
            return {
                status: 404,
                body: { error_code: 'ORDER_NOT_FOUND', message: 'Pedido inexistente en este tenant' },
            };
        }
        return { status: 200, body: order };
    }
    async cancelOrder(params) {
        if (!params.principal) {
            return {
                status: 401,
                body: { error_code: 'UNAUTHENTICATED', message: 'Autenticación obligatoria' },
            };
        }
        try {
            const canceled = await this.ordersService.cancelOrder(params.order_id, params.principal.tenant_id, params.reason);
            if (!canceled) {
                return {
                    status: 404,
                    body: { error_code: 'ORDER_NOT_FOUND', message: 'Pedido inexistente en este tenant' },
                };
            }
            return { status: 200, body: canceled };
        }
        catch (err) {
            if (err instanceof OrderStateConflictError) {
                return { status: 409, body: { error_code: err.code, message: err.message } };
            }
            throw err;
        }
    }
}
