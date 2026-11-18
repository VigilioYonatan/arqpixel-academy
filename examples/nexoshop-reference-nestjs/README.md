# NexoShop Reference Backend — Arquitectura Hexagonal, DDD Pragmático, Outbox e Idempotencia

Micro-repositorio ejecutable de referencia incluido en **ARQPIXEL Academy** (Sección 2.2.2 del Master Spec, conectado con `#/proyectos` y las misiones Senior **`S04`**, **`S06`** y **`S09`**).

## Propósito Educativo y Límites Honestos

Demuestra en código TypeScript real y ejecutable offline cómo aplicar las convenciones **Vigilio 2026**:

1. **Dominio puro y desacoplado (`S04`):** `domain/` y `application/` no importan ORM, controladores HTTP ni detalles de infraestructura. Verificado automáticamente por prueba estática de arquitectura.
2. **Ownership estricto de símbolos (Cero carpeta `contracts/` global):**
   - Constantes operativas en `domain/constants/order-rules.constants.ts`.
   - Schema propietario y tipo inferido juntos en `domain/schemas/order.schema.ts` (`orderSchema` + `OrderSchema`, dinero como string decimal exacto).
   - DTOs HTTP derivados mediante `.pick()` / `.extend()` en `presentation/http/dto/*.dto.ts` con proyección allowlist.
3. **Agregado con invariantes y concurrencia optimista (`S06`):** `StockItem` bloquea sobreventa (`available_qty >= 0`) e incrementa `version` para impedir *lost updates* ante compras simultáneas.
4. **Idempotencia + Transactional Outbox atómico (`S09`):** `OrdersService.placeOrder()` deduplica reintentos por `(tenant_id, idempotency_key)` y persiste el agregado junto al `EventEnvelope` en `outbox_events` dentro de la misma unidad transaccional.
5. **Seguridad privada por defecto (`S12`):** `tenant_id` se extrae exclusivamente del principal autenticado en servidor (nunca del body del cliente), bloqueando accesos cruzados BOLA/IDOR.

## Estructura del Módulo (`Golden Path`)

```text
examples/nexoshop-reference-nestjs/
├── src/
│   ├── shared/
│   │   ├── messaging/event-envelope.type.ts
│   │   └── validation/zod-lite.ts
│   └── modules/orders/
│       ├── domain/
│       │   ├── constants/order-rules.constants.ts
│       │   ├── entities/stock-item.entity.ts
│       │   ├── exceptions/order-domain.error.ts
│       │   └── schemas/order.schema.ts
│       ├── application/
│       │   ├── ports/order.repository.port.ts
│       │   └── services/orders.service.ts
│       ├── infrastructure/
│       │   └── persistence/
│       │       ├── drizzle/schema.ts
│       │       └── in-memory/in-memory-order.repository.ts
│       ├── presentation/http/
│       │   ├── controllers/orders.controller.ts
│       │   └── dto/
│       │       ├── place-order.request.dto.ts
│       │       └── place-order.response.dto.ts
│       └── orders.module.ts
└── tests/
    └── orders-reference.test.mjs
```

## Comandos Reproducibles (100 % Offline)

```bash
cd examples/nexoshop-reference-nestjs
npm run typecheck
npm test
```

## Matriz de Evidencia

| Control | Estado | Evidencia |
|---|---|---|
| Frontera de imports (`domain` y `application` sin HTTP/ORM) | `PASS` | `tests/orders-reference.test.mjs` |
| Prevención de sobreventa y bloqueo optimista (`version`) | `PASS` | `tests/orders-reference.test.mjs` |
| Replay idempotente + rollback atómico de Outbox | `PASS` | `tests/orders-reference.test.mjs` |
| Aislamiento multi-tenant BOLA/IDOR + allowlist DTO | `PASS` | `tests/orders-reference.test.mjs` |
| Integración contra instancia PostgreSQL viva | `NOT_RUN` | Adaptador `in-memory` ejecutado offline; `drizzle/schema.ts` declara tablas y constraints SQL para entorno con PostgreSQL activo |
