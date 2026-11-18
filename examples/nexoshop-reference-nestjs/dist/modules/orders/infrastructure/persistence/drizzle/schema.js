/**
 * Canonical PostgreSQL / Drizzle schema blueprint (`snake_case` columns, exact decimal money,
 * optimistic `version`, composite tenant constraints, and `outbox_events` + `idempotency_keys`).
 * Note: Live PostgreSQL DDL execution is marked `NOT_RUN` when no Postgres server is active.
 */
export const DRIZZLE_POSTGRES_TABLES_SPEC = Object.freeze({
    orders: {
        table_name: 'orders',
        columns: {
            id: 'varchar(64) PRIMARY KEY',
            tenant_id: 'varchar(64) NOT NULL',
            customer_id: 'varchar(64) NOT NULL',
            status: "varchar(24) NOT NULL CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'CANCELED'))",
            total_decimal: 'numeric(12, 2) NOT NULL',
            internal_risk_audit_note: 'varchar(200) NOT NULL',
            created_at: 'timestamptz NOT NULL DEFAULT now()',
        },
        indexes: ['CREATE INDEX idx_orders_tenant_created ON orders (tenant_id, created_at DESC, id DESC)'],
    },
    stock_items: {
        table_name: 'stock_items',
        columns: {
            tenant_id: 'varchar(64) NOT NULL',
            sku: 'varchar(40) NOT NULL',
            available_qty: 'integer NOT NULL CHECK (available_qty >= 0)',
            version: 'integer NOT NULL DEFAULT 1',
        },
        constraints: ['PRIMARY KEY (tenant_id, sku)'],
    },
    idempotency_keys: {
        table_name: 'idempotency_keys',
        columns: {
            tenant_id: 'varchar(64) NOT NULL',
            idempotency_key: 'varchar(128) NOT NULL',
            order_id: 'varchar(64) NOT NULL REFERENCES orders(id)',
            created_at: 'timestamptz NOT NULL DEFAULT now()',
        },
        constraints: ['PRIMARY KEY (tenant_id, idempotency_key)'],
    },
    outbox_events: {
        table_name: 'outbox_events',
        columns: {
            event_id: 'varchar(80) PRIMARY KEY',
            tenant_id: 'varchar(64) NOT NULL',
            aggregate_id: 'varchar(64) NOT NULL',
            event_type: 'varchar(80) NOT NULL',
            schema_version: 'integer NOT NULL',
            payload_json: 'jsonb NOT NULL',
            occurred_at: 'timestamptz NOT NULL',
            published_at: 'timestamptz NULL',
        },
        indexes: [
            'CREATE INDEX idx_outbox_pending ON outbox_events (occurred_at ASC) WHERE published_at IS NULL',
        ],
    },
});
