import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createOrdersReferenceModule } from '../dist/modules/orders/orders.module.js';
import { StockItem } from '../dist/modules/orders/domain/entities/stock-item.entity.js';
import {
  InsufficientStockError,
  OptimisticConcurrencyError,
} from '../dist/modules/orders/domain/exceptions/order-domain.error.js';
import { DRIZZLE_POSTGRES_TABLES_SPEC } from '../dist/modules/orders/infrastructure/persistence/drizzle/schema.js';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function collectTsFiles(dir_path) {
  const found = [];
  for (const entry of readdirSync(dir_path, { withFileTypes: true })) {
    const full = join(dir_path, entry.name);
    if (entry.isDirectory()) found.push(...collectTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) found.push(full);
  }
  return found;
}

test('S04 · Arquitectura de imports: domain/ y application/ jamás importan infrastructure/ ni presentation/, cero contracts/ global', () => {
  assert.equal(existsSync(join(ROOT_DIR, 'contracts')), false);
  assert.equal(existsSync(join(ROOT_DIR, 'src', 'contracts')), false);

  const domainFiles = collectTsFiles(join(ROOT_DIR, 'src', 'modules', 'orders', 'domain'));
  const appFiles = collectTsFiles(join(ROOT_DIR, 'src', 'modules', 'orders', 'application'));
  assert.ok(domainFiles.length >= 4);
  assert.ok(appFiles.length >= 2);

  for (const file of [...domainFiles, ...appFiles]) {
    const source = readFileSync(file, 'utf8');
    assert.equal(
      /infrastructure|presentation|drizzle|controllers|express|@nestjs\/swagger/.test(source),
      false,
      `Fuga de infraestructura/HTTP detectada en capa interna: ${file}`,
    );
    assert.equal(/\bas\s+any\b|:\s*any\b/.test(source), false, `Prohibido any en ${file}`);
  }

  for (const file of domainFiles) {
    const source = readFileSync(file, 'utf8');
    assert.equal(
      /application/.test(source),
      false,
      `El dominio no debe depender de application/: ${file}`,
    );
  }
});

test('S06 · Agregado StockItem y adaptador impiden sobreventa y detectan conflicto optimista por versión', async () => {
  const aggregate = new StockItem('SKU-LAPTOP', 'tenant-acme', 3, 1);
  const r1 = aggregate.reserveUnits(2);
  assert.equal(r1.nextAvailableQty, 1);
  assert.equal(r1.nextVersion, 2);

  // Intentar reservar 2 cuando solo queda 1 lanza InsufficientStockError
  assert.throws(() => aggregate.reserveUnits(2), InsufficientStockError);

  // Simulación de carrera concurrente leyendo la misma versión previa (version = 1)
  const { repository } = createOrdersReferenceModule();
  repository.seedStock('tenant-acme', 'SKU-MONITOR', 3, 1);

  const firstCommit = repository.reserveWithExpectedVersion('tenant-acme', 'SKU-MONITOR', 1, 2);
  assert.equal(firstCommit.available_qty, 1);
  assert.equal(firstCommit.version, 2);

  // Segundo proceso concurrente que leyó version=1 falla por OptimisticConcurrencyError
  assert.throws(
    () => repository.reserveWithExpectedVersion('tenant-acme', 'SKU-MONITOR', 1, 2),
    OptimisticConcurrencyError,
  );
  assert.equal(repository.getStockSnapshot('tenant-acme', 'SKU-MONITOR')?.available_qty, 1);
});

test('S09 · Idempotency-Key deduplica reintentos y fallo de Outbox ejecuta rollback atómico completo', async () => {
  const { controller, repository } = createOrdersReferenceModule();
  repository.seedStock('tenant-acme', 'SKU-MOUSE', 10, 1);

  const principal = { actor_id: 'usr-1', tenant_id: 'tenant-acme' };
  const payload = {
    customer_id: 'cust-100',
    lines: [{ sku: 'SKU-MOUSE', quantity: 3, unit_price_decimal: '49.90' }],
  };

  // Llamada inicial -> 201 Created, total exacto "149.70", stock pasa de 10 a 7, 1 evento Outbox
  const first = await controller.placeOrder({
    principal,
    idempotency_key: 'idem-order-0001',
    raw_body: payload,
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.idempotent_replay, false);
  assert.equal(first.body.data.total_decimal, '149.70');
  assert.equal(repository.getStockSnapshot('tenant-acme', 'SKU-MOUSE')?.available_qty, 7);
  assert.equal(repository.getPendingOutboxEvents().length, 1);

  // Reintento duplicado con la misma Idempotency-Key -> 200 OK replay, NO descuenta stock otra vez ni duplica Outbox
  const replay = await controller.placeOrder({
    principal,
    idempotency_key: 'idem-order-0001',
    raw_body: payload,
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.idempotent_replay, true);
  assert.equal(replay.body.data.id, first.body.data.id);
  assert.equal(repository.getStockSnapshot('tenant-acme', 'SKU-MOUSE')?.available_qty, 7);
  assert.equal(repository.getPendingOutboxEvents().length, 1);

  // Fallo simulado al escribir en Outbox -> rollback atómico: stock permanece en 7 y no queda orden fantasma
  repository.setSimulateOutboxFailure(true);
  const failedTx = await controller.placeOrder({
    principal,
    idempotency_key: 'idem-order-0002',
    raw_body: payload,
  });
  assert.equal(failedTx.status, 422);
  assert.equal(repository.getStockSnapshot('tenant-acme', 'SKU-MOUSE')?.available_qty, 7);
  assert.equal(repository.getPendingOutboxEvents().length, 1);
});

test('S12 · Seguridad privada por defecto, aislamiento BOLA/IDOR por tenant y proyección allowlist sin columnas internas', async () => {
  const { controller, repository } = createOrdersReferenceModule();
  repository.seedStock('tenant-alpha', 'SKU-KEYB', 5, 1);

  // Sin autenticación -> 401
  const unauth = await controller.placeOrder({
    principal: null,
    idempotency_key: 'idem-unauth-01',
    raw_body: { customer_id: 'cust-01', lines: [{ sku: 'SKU-KEYB', quantity: 1, unit_price_decimal: '99.00' }] },
  });
  assert.equal(unauth.status, 401);

  // Intento de inyectar tenant_id falso en el body -> rechazado por DTO estricto (422)
  const spoofedBody = await controller.placeOrder({
    principal: { actor_id: 'u1', tenant_id: 'tenant-alpha' },
    idempotency_key: 'idem-spoof-01',
    raw_body: {
      tenant_id: 'tenant-victim',
      customer_id: 'cust-01',
      lines: [{ sku: 'SKU-KEYB', quantity: 1, unit_price_decimal: '99.00' }],
    },
  });
  assert.equal(spoofedBody.status, 422);

  // Creación legítima en tenant-alpha
  const created = await controller.placeOrder({
    principal: { actor_id: 'u1', tenant_id: 'tenant-alpha' },
    idempotency_key: 'idem-alpha-01',
    raw_body: {
      customer_id: 'cust-01',
      lines: [{ sku: 'SKU-KEYB', quantity: 1, unit_price_decimal: '99.00' }],
    },
  });
  assert.equal(created.status, 201);
  assert.equal('internal_risk_audit_note' in created.body.data, false, 'Nunca filtrar columnas internas');

  // Tenant Beta intenta leer el pedido de Tenant Alpha (BOLA/IDOR) -> 404 aislado
  const crossTenantRead = await controller.getOrder({
    principal: { actor_id: 'u2', tenant_id: 'tenant-beta' },
    order_id: created.body.data.id,
  });
  assert.equal(crossTenantRead.status, 404);

  // Especificación Drizzle/PostgreSQL incluye constraints de tenant, stock >= 0 e índice parcial Outbox
  assert.ok(DRIZZLE_POSTGRES_TABLES_SPEC.stock_items.columns.available_qty.includes('>= 0'));
  assert.ok(DRIZZLE_POSTGRES_TABLES_SPEC.idempotency_keys.constraints[0].includes('tenant_id'));
});
