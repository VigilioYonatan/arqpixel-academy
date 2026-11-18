# NexoShop Reference — Java 21 Hexagonal & DDD

Implementación de referencia poliglota equivalente a las misiones **S04**, **S06** y **S09** en **Java 21**:

- `src/com/nexoshop/orders/domain/OrderAggregate.java`: agregado inmutable con validación de invariantes, `tenantId` obligatorio y concurrencia optimista (`version`), sin ningún `import` de infraestructura.
- `src/com/nexoshop/orders/application/port/OrderRepositoryPort.java`: puerto de salida en `application.port`.
- `src/com/nexoshop/orders/application/PlaceOrderService.java`: caso de uso idempotente + Transactional Outbox.
- `src/com/nexoshop/orders/infrastructure/JpaOrderRepositoryAdapter.java`: adaptador tecnológico orientado hacia los puertos internos.

> **Alcance de verificación honesta:** `node scripts/check-polyglot-architecture.mjs` verifica automáticamente la dirección de `import`/`package` por capa y ausencia de `contracts/` globales. La compilación con `javac` requiere JDK 21 instalado (`NOT_RUN` en entornos sin JDK).
