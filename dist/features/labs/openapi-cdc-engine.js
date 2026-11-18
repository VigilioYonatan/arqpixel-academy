/**
 * P2 L1252: Real OpenAPI 3.1.0 provider specifications & executable Consumer-Driven Contract (CDC)
 * validator (`WebCheckout`, `MobileOrders`, `FiscalWorker`) with visual SVG contract topology.
 */
export const OPENAPI_PROVIDER_SPECS = Object.freeze({
    v1_baseline: {
        openapi: '3.1.0',
        info: { title: 'NexoShop Orders API', version: '1.0.0' },
        paths: {
            '/v1/orders': {
                post: {
                    operationId: 'placeOrder',
                    requestBodyRequired: {
                        required: ['tenant_id', 'sku', 'quantity'],
                        properties: {
                            tenant_id: { type: 'string' },
                            sku: { type: 'string' },
                            quantity: { type: 'integer' },
                        },
                    },
                    responses: {
                        '201': {
                            required: ['order_id', 'status', 'total_cents', 'currency'],
                            properties: {
                                order_id: { type: 'string', format: 'uuid' },
                                status: { type: 'string' },
                                total_cents: { type: 'integer' },
                                currency: { type: 'string' },
                            },
                        },
                    },
                },
            },
            '/v1/orders/{id}': {
                get: {
                    operationId: 'getOrderSummary',
                    responses: {
                        '200': {
                            required: ['order_id', 'status', 'total_cents'],
                            properties: {
                                order_id: { type: 'string' },
                                status: { type: 'string' },
                                total_cents: { type: 'integer' },
                            },
                        },
                    },
                },
            },
        },
    },
    v2_additive_compatible: {
        openapi: '3.1.0',
        info: { title: 'NexoShop Orders API (Expand-Contract Safe)', version: '1.2.0' },
        paths: {
            '/v1/orders': {
                post: {
                    operationId: 'placeOrder',
                    requestBodyRequired: {
                        required: ['tenant_id', 'sku', 'quantity'],
                        properties: {
                            tenant_id: { type: 'string' },
                            sku: { type: 'string' },
                            quantity: { type: 'integer' },
                            coupon_code: { type: 'string' },
                        },
                    },
                    responses: {
                        '201': {
                            required: ['order_id', 'status', 'total_cents', 'currency'],
                            properties: {
                                order_id: { type: 'string', format: 'uuid' },
                                status: { type: 'string' },
                                total_cents: { type: 'integer' },
                                currency: { type: 'string' },
                                estimated_delivery_iso: { type: 'string', format: 'date-time' },
                            },
                        },
                    },
                },
            },
            '/v1/orders/{id}': {
                get: {
                    operationId: 'getOrderSummary',
                    responses: {
                        '200': {
                            required: ['order_id', 'status', 'total_cents'],
                            properties: {
                                order_id: { type: 'string' },
                                status: { type: 'string' },
                                total_cents: { type: 'integer' },
                                tracking_code: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    },
    v2_breaking_rename_and_required: {
        openapi: '3.1.0',
        info: { title: 'NexoShop Orders API (PR Rompedor)', version: '2.0.0-rc1' },
        paths: {
            '/v1/orders': {
                post: {
                    operationId: 'placeOrder',
                    requestBodyRequired: {
                        // Breaking 1: adds mandatory warehouse_region without default
                        required: ['tenant_id', 'sku', 'quantity', 'warehouse_region'],
                        properties: {
                            tenant_id: { type: 'string' },
                            sku: { type: 'string' },
                            quantity: { type: 'integer' },
                            warehouse_region: { type: 'string' },
                        },
                    },
                    responses: {
                        '201': {
                            // Breaking 2: renames total_cents -> amount_decimal (number) and drops currency
                            required: ['order_id', 'status', 'amount_decimal'],
                            properties: {
                                order_id: { type: 'string' },
                                status: { type: 'string' },
                                amount_decimal: { type: 'number' },
                            },
                        },
                    },
                },
            },
            '/v1/orders/{id}': {
                get: {
                    operationId: 'getOrderSummary',
                    responses: {
                        '200': {
                            // Breaking 3: changes total_cents type from integer to string
                            required: ['order_id', 'status', 'total_cents'],
                            properties: {
                                order_id: { type: 'string' },
                                status: { type: 'string' },
                                total_cents: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    },
});
export const CONSUMER_DRIVEN_PACTS = Object.freeze([
    {
        consumerId: 'web-checkout-spa',
        consumerName: 'Web Checkout SPA',
        path: '/v1/orders',
        method: 'post',
        sentRequestFields: ['tenant_id', 'sku', 'quantity'],
        expectedStatus: '201',
        requiredResponseFields: {
            order_id: 'string',
            status: 'string',
            total_cents: 'integer',
        },
    },
    {
        consumerId: 'mobile-ios-android',
        consumerName: 'App Móvil iOS/Android v1.4',
        path: '/v1/orders/{id}',
        method: 'get',
        expectedStatus: '200',
        requiredResponseFields: {
            order_id: 'string',
            total_cents: 'integer',
        },
    },
    {
        consumerId: 'fiscal-billing-worker',
        consumerName: 'Worker Tributario / Facturación',
        path: '/v1/orders',
        method: 'post',
        sentRequestFields: ['tenant_id', 'sku', 'quantity'],
        expectedStatus: '201',
        requiredResponseFields: {
            order_id: 'string',
            total_cents: 'integer',
            currency: 'string',
        },
    },
]);
export function verifyOpenApiConsumerContracts(variant_id, pacts = CONSUMER_DRIVEN_PACTS) {
    const spec = OPENAPI_PROVIDER_SPECS[variant_id];
    const outcomes = pacts.map((pact) => {
        const violations = [];
        const path_item = spec.paths[pact.path];
        const op = path_item?.[pact.method];
        if (!op) {
            violations.push(`Ruta o método ausente en OpenAPI: ${pact.method.toUpperCase()} ${pact.path}`);
            return {
                consumerId: pact.consumerId,
                consumerName: pact.consumerName,
                status: 'FAIL',
                violations,
            };
        }
        if (op.requestBodyRequired && pact.sentRequestFields) {
            const sent_set = new Set(pact.sentRequestFields);
            for (const req_field of op.requestBodyRequired.required) {
                if (!sent_set.has(req_field)) {
                    violations.push(`Proveedor exige nuevo campo obligatorio en request («${req_field}») que ${pact.consumerName} no envía.`);
                }
            }
        }
        const resp = op.responses[pact.expectedStatus];
        if (!resp) {
            violations.push(`Código HTTP esperado ${pact.expectedStatus} no declarado en OpenAPI.`);
        }
        else {
            for (const [field, expected_type] of Object.entries(pact.requiredResponseFields)) {
                const prop = resp.properties[field];
                if (!prop || !resp.required.includes(field)) {
                    violations.push(`Campo obligatorio de respuesta «${field}» eliminado o degradado a opcional.`);
                }
                else if (prop.type !== expected_type) {
                    violations.push(`Cambio incompatible de tipo en «${field}»: consumidor espera ${expected_type}, OpenAPI declara ${prop.type}.`);
                }
            }
        }
        return {
            consumerId: pact.consumerId,
            consumerName: pact.consumerName,
            status: violations.length === 0 ? 'PASS' : 'FAIL',
            violations,
        };
    });
    return {
        variantId: variant_id,
        providerVersion: spec.info.version,
        overallStatus: outcomes.every((o) => o.status === 'PASS') ? 'PASS' : 'FAIL',
        outcomes,
    };
}
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
export function renderOpenApiCdcDiagramSvgHtml(result) {
    const provider_stroke = result.overallStatus === 'PASS' ? '#53e2ba' : '#ff7890';
    return `<div class="map-svg-wrap my-14" tabindex="0" role="region" aria-label="Diagrama de verificación Consumer-Driven Contracts OpenAPI 3.1">
    <svg class="senior-pipeline-svg" viewBox="0 0 720 156" role="img" aria-label="3 consumidores verificados contra OpenAPI ${esc(result.providerVersion)}: ${result.overallStatus}">
      <rect x="440" y="34" width="256" height="88" rx="13" fill="#0b243b" stroke="${provider_stroke}" stroke-width="2.2"/>
      <text x="568" y="64" text-anchor="middle" fill="${provider_stroke}" font-size="12" font-weight="bold" font-family="sans-serif">PROVIDER OPENAPI 3.1</text>
      <text x="568" y="86" text-anchor="middle" fill="#eef9ff" font-size="12" font-family="sans-serif">Orders API v${esc(result.providerVersion)}</text>
      <text x="568" y="106" text-anchor="middle" fill="#9bc0d9" font-size="10" font-family="sans-serif">Gate CDC: ${result.overallStatus}</text>

      ${result.outcomes
        .map((out, idx) => {
        const y = 14 + idx * 46;
        const color = out.status === 'PASS' ? '#53e2ba' : '#ffb74d';
        return `<g>
            <rect x="18" y="${y}" width="250" height="36" rx="9" fill="#091d30" stroke="${color}" stroke-width="1.8"/>
            <text x="32" y="${y + 22}" fill="#ecf8ff" font-size="11" font-weight="bold" font-family="sans-serif">${out.status === 'PASS' ? '✓' : '✕'} ${esc(out.consumerName)}</text>
            <line x1="268" y1="${y + 18}" x2="438" y2="78" stroke="${color}" stroke-width="1.8" stroke-dasharray="${out.status === 'PASS' ? '0' : '5 4'}"/>
          </g>`;
    })
        .join('')}
    </svg>
  </div>`;
}
