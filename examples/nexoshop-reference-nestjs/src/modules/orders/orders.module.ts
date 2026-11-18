import { ORDER_REPOSITORY_PORT } from './application/ports/order.repository.port.js';
import { OrdersService } from './application/services/orders.service.js';
import { InMemoryOrderRepository } from './infrastructure/persistence/in-memory/in-memory-order.repository.js';
import { OrdersController } from './presentation/http/controllers/orders.controller.js';

export function createOrdersReferenceModule() {
  const repository = new InMemoryOrderRepository();
  const service = new OrdersService(repository);
  const controller = new OrdersController(service);

  return {
    provideToken: ORDER_REPOSITORY_PORT,
    repository,
    service,
    controller,
  };
}
