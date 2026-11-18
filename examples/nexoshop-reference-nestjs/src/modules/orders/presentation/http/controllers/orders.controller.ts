import { OrdersService } from '../../../application/services/orders.service.js';
import {
  InsufficientStockError,
  OptimisticConcurrencyError,
  OrderStateConflictError,
} from '../../../domain/exceptions/order-domain.error.js';
import { placeOrderRequestDto } from '../dto/place-order.request.dto.js';
import type { PlaceOrderResponseDto } from '../dto/place-order.response.dto.js';

export type AuthenticatedPrincipal = {
  readonly actor_id: string;
  readonly tenant_id: string;
};

export type HttpEnvelopeResponse<TBody> = {
  readonly status: 200 | 201 | 401 | 404 | 409 | 422;
  readonly body: TBody | { readonly error_code: string; readonly message: string };
};

/**
 * Thin HTTP boundary controller (Private-by-Default).
 * Validates input DTO, extracts `tenant_id` strictly from `principal`, and maps domain conflicts.
 */
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  async placeOrder(params: {
    readonly principal: AuthenticatedPrincipal | null;
    readonly idempotency_key: string;
    readonly raw_body: unknown;
  }): Promise<
    HttpEnvelopeResponse<{
      readonly data: PlaceOrderResponseDto;
      readonly idempotent_replay: boolean;
    }>
  > {
    if (!params.principal) {
      return {
        status: 401,
        body: { error_code: 'UNAUTHENTICATED', message: 'Autenticación obligatoria' },
      };
    }

    let dto: ReturnType<typeof placeOrderRequestDto.parse>;
    try {
      dto = placeOrderRequestDto.parse(params.raw_body, 'body');
    } catch (err) {
      return {
        status: 422,
        body: { error_code: 'VALIDATION_ERROR', message: (err as Error).message },
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
    } catch (err) {
      if (err instanceof InsufficientStockError || err instanceof OptimisticConcurrencyError) {
        return {
          status: 409,
          body: { error_code: err.code, message: err.message },
        };
      }
      return {
        status: 422,
        body: { error_code: 'ORDER_REJECTED', message: (err as Error).message },
      };
    }
  }

  async getOrder(params: {
    readonly principal: AuthenticatedPrincipal | null;
    readonly order_id: string;
  }): Promise<HttpEnvelopeResponse<PlaceOrderResponseDto>> {
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

  async cancelOrder(params: {
    readonly principal: AuthenticatedPrincipal | null;
    readonly order_id: string;
    readonly reason: string;
  }): Promise<HttpEnvelopeResponse<PlaceOrderResponseDto>> {
    if (!params.principal) {
      return {
        status: 401,
        body: { error_code: 'UNAUTHENTICATED', message: 'Autenticación obligatoria' },
      };
    }
    try {
      const canceled = await this.ordersService.cancelOrder(
        params.order_id,
        params.principal.tenant_id,
        params.reason,
      );
      if (!canceled) {
        return {
          status: 404,
          body: { error_code: 'ORDER_NOT_FOUND', message: 'Pedido inexistente en este tenant' },
        };
      }
      return { status: 200, body: canceled };
    } catch (err) {
      if (err instanceof OrderStateConflictError) {
        return { status: 409, body: { error_code: err.code, message: err.message } };
      }
      throw err;
    }
  }
}
