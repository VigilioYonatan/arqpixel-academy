# NexoShop Reference — C# (.NET 8) Hexagonal & DDD

Implementación de referencia poliglota equivalente a las misiones **S04**, **S06** y **S09** en **C# 12 / .NET 8**:

- `src/Orders/Domain/OrderAggregate.cs`: agregado puro con control de concurrencia optimista (`Version`) e invariante de importe positivo, **cero dependencias** hacia `Infrastructure` o frameworks HTTP/ORM.
- `src/Orders/Application/Ports/IOrderRepository.cs`: puerto propietario de la capa de Aplicación (`SaveWithOutboxAsync` + `FindByIdempotencyKeyAsync`).
- `src/Orders/Application/PlaceOrderUseCase.cs`: orquestación idempotente + Transactional Outbox.
- `src/Orders/Infrastructure/PostgresOrderRepository.cs`: adaptador de persistencia que depende hacia adentro (`Application.Ports` + `Domain`).

> **Alcance de verificación honesta:** `node scripts/check-polyglot-architecture.mjs` valida automáticamente la dirección de `using` por capa y ausencia de `contracts/` globales en cada build local. La compilación binaria nativa con `dotnet build` requiere tener instalado el SDK de .NET 8 (`NOT_RUN` en entornos sin `.NET SDK`).
