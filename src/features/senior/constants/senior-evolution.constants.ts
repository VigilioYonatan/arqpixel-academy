/**
 * Mission-specific Phase 2 chained crises, FinOps/Capacity component weights,
 * and Human Reviewer audit questions for all 18 Senior Missions (`ARQ-016` & `ARQ-017`).
 */

export const SENIOR_DOSSIER_SCHEMA_VERSION = 2;
export const SENIOR_DOSSIER_FORMAT = 'ARQPIXEL-SENIOR-DOSSIER-V2';

export type ComponentImpactProfile = {
  readonly monthlyCostUsd: number;
  readonly capacityMultiplier: number;
  readonly uncertaintyReductionPct: number;
  readonly signalUnlocked: string;
};

export const COMPONENT_OPERATIONAL_PROFILES: Readonly<Record<string, ComponentImpactProfile>> =
  Object.freeze({
    'API Gateway': {
      monthlyCostUsd: 95,
      capacityMultiplier: 1.08,
      uncertaintyReductionPct: 3,
      signalUnlocked: 'Rate-limiting HTTP 429 y latencia de borde p95/p99',
    },
    'Dominio aislado': {
      monthlyCostUsd: 25,
      capacityMultiplier: 1.05,
      uncertaintyReductionPct: 4,
      signalUnlocked: 'Invariantes deterministas auditables sin ruido de infraestructura',
    },
    'Base de datos': {
      monthlyCostUsd: 240,
      capacityMultiplier: 1.0,
      uncertaintyReductionPct: 2,
      signalUnlocked: 'Contención de locks SQL, réplicas y pool PgBouncer',
    },
    Idempotencia: {
      monthlyCostUsd: 60,
      capacityMultiplier: 1.12,
      uncertaintyReductionPct: 5,
      signalUnlocked: 'Tasa de deduplicación por Idempotency-Key / inbox_processed',
    },
    'Cola de eventos': {
      monthlyCostUsd: 130,
      capacityMultiplier: 1.22,
      uncertaintyReductionPct: 4,
      signalUnlocked: 'Profundidad de backlog (KEDA lag) y tasa de desvío a DLQ',
    },
    Observabilidad: {
      monthlyCostUsd: 110,
      capacityMultiplier: 1.04,
      uncertaintyReductionPct: 10,
      signalUnlocked: 'Trazas distribuidas OTel, SLI de negocio y alertas Multi-Window Burn Rate',
    },
    Autorización: {
      monthlyCostUsd: 45,
      capacityMultiplier: 1.0,
      uncertaintyReductionPct: 3,
      signalUnlocked: 'Auditoría de denegaciones RBAC/ABAC y aislamiento por tenant_id',
    },
    'Plan de rollback': {
      monthlyCostUsd: 40,
      capacityMultiplier: 1.02,
      uncertaintyReductionPct: 5,
      signalUnlocked: 'Guardrails de canary progresivo y reversión en < 3 min',
    },
  });

export const BUDGET_CEILINGS_USD: Readonly<Record<string, number>> = Object.freeze({
  limitado: 480,
  moderado: 780,
  amplio: 1_250,
});

export type Phase2EvolutionDefinition = {
  readonly crisisTitle: string;
  readonly triggerEvent: string;
  readonly canonicalOptions: readonly [string, string, string];
  readonly requiredPhase1Support: string;
  readonly reviewerQuestions: readonly [string, string, string, string];
};

/**
 * First entry in `canonicalOptions` is the defensible architectural evolution;
 * runtime engine rotates options deterministically by `(mission_id, seed)`.
 */
export const SENIOR_PHASE2_EVOLUTIONS: Readonly<Record<string, Phase2EvolutionDefinition>> =
  Object.freeze({
    S01: {
      crisisTitle: 'Fase 2 · Parche fiscal urgente en mitad de la extracción del monolito',
      triggerEvent:
        'Regulación tributaria exige cambiar el cálculo de impuestos en 48 h mientras el 50 % del checkout sigue en el monolito legado y el otro 50 % pasa por el nuevo módulo.',
      canonicalOptions: [
        'Encapsular la regla fiscal detrás de una costura (seam) compartida con contract tests duales y feature flag reversible',
        'Duplicar el cálculo con copy-paste divergente en ambos lados sin pruebas de paridad',
        'Congelar toda operación comercial durante dos semanas para terminar una reescritura Big Bang',
      ],
      requiredPhase1Support: 'Dominio aislado',
      reviewerQuestions: [
        '¿El mapa de dependencias identifica qué tablas siguen acopladas antes de extraer código?',
        '¿Cómo garantiza paridad numérica entre la ruta legada y el módulo nuevo durante la transición?',
        '¿Cuál es la señal exacta para abortar el desvío Strangler y volver al monolito?',
        '¿El coste operativo propuesto cabe en la capacidad real del equipo actual?',
      ],
    },
    S02: {
      crisisTitle: 'Fase 2 · Contraejemplo de reglas combinadas B2B + cupón relámpago',
      triggerEvent:
        'Comercial lanza un descuento acumulable con tope de margen mínimo que rompe la jerarquía rígida de clases creada la semana pasada.',
      canonicalOptions: [
        'Componer políticas puras evaluadas en orden explícito con tope invariante en dominio y suite parametrizada',
        'Añadir un flag booleano global mutable en memoria compartida entre peticiones',
        'Crear 18 subclases abstractas anticipando campañas de los próximos cinco años',
      ],
      requiredPhase1Support: 'Dominio aislado',
      reviewerQuestions: [
        '¿La abstracción propuesta responde a ejes de cambio reales o introduce indirección gratuita?',
        '¿Dónde reside la invariante de margen mínimo para impedir descuentos que generen pérdida?',
        '¿Qué test de regresión detectaría un orden incorrecto al encadenar dos promociones?',
        '¿Cómo se revierte una campaña defectuosa en segundos sin redesplegar binarios?',
      ],
    },
    S03: {
      crisisTitle: 'Fase 2 · Degradación 4× y cambio de firma en proveedor primario',
      triggerEvent:
        'El proveedor externo principal sube su latencia p95 a 3.800 ms y empieza a devolver HTTP 429 con un formato JSON no documentado.',
      canonicalOptions: [
        'Aislar la traducción en el Adapter, aplicar timeout estricto + circuit breaker y conmutar al proveedor secundario vía puerto',
        'Propagar el nuevo JSON crudo del proveedor hasta los controladores y vistas del frontend',
        'Desactivar la validación de esquemas y esperar indefinidamente cada respuesta HTTP',
      ],
      requiredPhase1Support: 'Observabilidad',
      reviewerQuestions: [
        '¿El puerto pertenece al vocabulario del dominio o copia los nombres propietarios del SDK externo?',
        '¿Cómo evita que un fallo del proveedor primario contamine o bloquee al secundario?',
        '¿Qué contract tests detectan divergencias cuando el proveedor cambia su payload?',
        '¿Están coordinados los timeouts del adaptador con el SLA total del endpoint?',
      ],
    },
    S04: {
      crisisTitle: 'Fase 2 · Cambio forzoso de adaptador de persistencia bajo auditoría',
      triggerEvent:
        'Seguridad exige reemplazar un driver ORM vulnerable e introducir cifrado de columnas sensibles en 72 h sin alterar una sola regla de facturación.',
      canonicalOptions: [
        'Sustituir únicamente el adaptador en infraestructura conserv intacta la suite unitaria del dominio e integrando tests SQL reales',
        'Reescribir las entidades del dominio para heredar directamente de la nueva librería SQL',
        'Mover las reglas de facturación a triggers opacos dentro de la base de datos sin tests',
      ],
      requiredPhase1Support: 'Dominio aislado',
      reviewerQuestions: [
        '¿Puede ejecutarse el 100 % de las pruebas de reglas de negocio sin levantar base de datos ni servidor HTTP?',
        '¿Se filtran tipos del ORM o códigos SQL crudos hacia casos de uso o respuestas públicas?',
        '¿Dónde se gestiona el borde transaccional cuando una operación toca agregado y outbox?',
        '¿Evita mappers ceremoniales innecesarios allí donde no aportan aislamiento real?',
      ],
    },
    S05: {
      crisisTitle: 'Fase 2 · Presión ejecutiva para compartir tablas entre Catálogo y Facturación',
      triggerEvent:
        'Para acelerar un reporte trimestral, un equipo propone hacer JOIN y UPDATE directo desde Facturación sobre las tablas internas de Catálogo.',
      canonicalOptions: [
        'Rechazar la escritura cruzada en BD; publicar proyección/evento versionado con contrato explícito y ACL donde aplique',
        'Permitir que ambos equipos editen la misma tabla productos sin dueño ni migraciones coordinadas',
        'Bloquear despliegues de ambos equipos indefinidamente con un comité manual diario',
      ],
      requiredPhase1Support: 'API Gateway',
      reviewerQuestions: [
        '¿Queda claro qué Bounded Context es fuente de verdad autoritativa de cada atributo?',
        '¿Cómo se protege el modelo interno frente a cambios unilaterales de un contexto upstream?',
        '¿Qué coste de latencia o eventualidad introduce evitar el JOIN directo y cómo se mitiga?',
        '¿Existen pruebas de contrato consumidor-proveedor en el pipeline?',
      ],
    },
    S06: {
      crisisTitle: 'Fase 2 · Flash sale 5× sobre las últimas 3 unidades de un SKU caliente',
      triggerEvent:
        '200 peticiones simultáneas intentan reservar las últimas 3 unidades mientras otro flujo intenta modificar la dirección de entrega del mismo pedido.',
      canonicalOptions: [
        'Separar el agregado de Stock con versión optimista/condición atómica en BD y coordinar el pedido por evento sin bloquear catálogos',
        'Envolver Catálogo, Usuario, Pedido, Stock y Envío en un único bloqueo exclusivo global (`SERIALIZABLE` de 15 s)',
        'Verificar `stock > 0` solo en memoria de cada réplica antes de hacer `UPDATE` ciego',
      ],
      requiredPhase1Support: 'Base de datos',
      reviewerQuestions: [
        '¿Qué invariante exacta exige atomicidad inmediata y cuáles aceptan consistencia eventual?',
        '¿Cómo demuestra mediante prueba concurrente reproducible que jamás se venden 4 unidades cuando quedan 3?',
        '¿Qué ocurre en UX cuando una reserva expira o pierde la carrera optimista?',
        '¿El tamaño del agregado minimiza la contención de filas calientes en PostgreSQL?',
      ],
    },
    S07: {
      crisisTitle: 'Fase 2 · 38 % de apps móviles continúan en v1 tras vencer la ventana estimada',
      triggerEvent:
        'Un socio corporativo exige eliminar un campo legacy hoy por limpieza estética, pero telemetría muestra que el 38 % de pedidos móviles aún usan el contrato v1.',
      canonicalOptions: [
        'Mantener coexistencia Expand/Contract con adaptador de traducción, telemetría por versión de cliente y fecha de retiro comunicada',
        'Borrar el campo en producción inmediatamente forzando error 500 en clientes antiguos',
        'Clonar todo el backend completo por cada versión menor de la app móvil',
      ],
      requiredPhase1Support: 'Plan de rollback',
      reviewerQuestions: [
        '¿Se mide tráfico real por versión y consumidor antes de ejecutar la fase Contract?',
        '¿Cómo conviven v1 y v2 sin duplicar la lógica de dominio subyacente?',
        '¿Están documentados los códigos de error estables, paginación e Idempotency-Key?',
        '¿Qué gate automático bloquea un breaking change accidental en un Pull Request?',
      ],
    },
    S08: {
      crisisTitle: 'Fase 2 · Recorte presupuestario FinOps del 30 % y rotación en plataforma',
      triggerEvent:
        'Finanzas recorta un 30 % el gasto cloud mensual y dos especialistas de Kubernetes dejan la empresa justo cuando se planeaba partir el sistema en 12 microservicios.',
      canonicalOptions: [
        'Consolidar en monolito modular con fronteras estrictas (Nivel 1/2), extrayendo únicamente el worker con cuello de botella demostrado',
        'Continuar creando 12 clústeres, 12 pipelines y 12 bases de datos sin personal para operarlos',
        'Mezclar todos los módulos en un espagueti sin fronteras porque ya no son microservicios',
      ],
      requiredPhase1Support: 'Dominio aislado',
      reviewerQuestions: [
        '¿El ADR cuantifica la carga cognitiva del equipo y el impuesto fijo de red/observabilidad distribuida?',
        '¿Qué fronteras internas impiden que el monolito modular degenere en una Big Ball of Mud?',
        '¿Qué umbral objetivo de carga o autonomía dispararía extraer un servicio concreto en el futuro?',
        '¿Cómo se mantiene despliegue seguro e independiente de migraciones de datos?',
      ],
    },
    S09: {
      crisisTitle: 'Fase 2 · Partición de red post-commit seguida de ráfaga de webhooks duplicados',
      triggerEvent:
        'El broker pierde conectividad 12 minutos tras confirmarse cobros en PostgreSQL; al volver, la pasarela reenvía 3 veces cada webhook de confirmación.',
      canonicalOptions: [
        'Drenar eventos pendientes desde Outbox con `SKIP LOCKED` y deduplicar webhooks/consumidores mediante clave única persistida',
        'Reejecutar todos los cobros manualmente desde logs de texto sin clave de idempotencia',
        'Ignorar los mensajes atrasados y pedir a los clientes que compren de nuevo',
      ],
      requiredPhase1Support: 'Idempotencia',
      reviewerQuestions: [
        '¿La clave de idempotencia está respaldada por un constraint UNIQUE atómico en base de datos?',
        '¿Cómo garantiza que ningún pedido pagado quede sin evento publicado si el proceso cae tras el commit?',
        '¿Cuál es la ventana de retención de claves idempotentes y el runbook de redrive desde DLQ?',
        '¿Cómo se reconcilian contablemente discrepancias entre el PSP externo y el libro local?',
      ],
    },
    S10: {
      crisisTitle: 'Fase 2 · Lag de 18 segundos en réplicas de lectura durante campaña masiva',
      triggerEvent:
        'Tras confirmar su compra, los usuarios son redirigidos a «Mis pedidos», que lee de una réplica atrasada 18 s y muestra lista vacía provocando recompras.',
      canonicalOptions: [
        'Aplicar read-your-own-writes para el autor reciente (lectura primaria acotada por marcador/versión) y estado explícito «Confirmando pedido» en UI',
        'Mostrar «No tienes pedidos» como estado definitivo y ocultar el retraso',
        'Apagar todas las réplicas de lectura en pleno pico y enviar el 100 % de catálogos al nodo primario',
      ],
      requiredPhase1Support: 'Observabilidad',
      reviewerQuestions: [
        '¿El sistema distingue claramente entre lectura obsoleta temporal y fallo transaccional real?',
        '¿Se mide el replication lag como SLI con umbral de degradación automática?',
        '¿Cómo acompaña la interfaz de usuario la ventana de consistencia eventual sin inducir doble compra?',
        '¿La invalidación de caché ocurre estrictamente después del commit?',
      ],
    },
    S11: {
      crisisTitle: 'Fase 2 · Pico 5× agota conexiones SQL y proponen mezclar HPA + KEDA en el mismo workload',
      triggerEvent:
        'Una campaña viral multiplica por 5 el tráfico; PostgreSQL rechaza conexiones nuevas y alguien sugiere activar HPA por CPU y KEDA por cola sobre el mismo Deployment.',
      canonicalOptions: [
        'Introducir pooling PgBouncer, separar Deployment HTTP (HPA) del Worker asíncrono (KEDA por lag real) y aplicar backpressure/límites de cola',
        'Activar HPA y KEDA simultáneamente sobre el mismo Deployment sin límite de conexiones SQL',
        'Quitar todos los `requests` y `limits` de memoria para que quepan más pods por nodo hasta provocar OOMKill',
      ],
      requiredPhase1Support: 'Cola de eventos',
      reviewerQuestions: [
        '¿Por qué combinar HPA y KEDA sobre un mismo Deployment provoca thrashing de escalado?',
        '¿Están calculados el pool máximo de conexiones por réplica frente a `max_connections` de PostgreSQL?',
        '¿Incluye `PodDisruptionBudget` y dispersión multizona (`topologySpreadConstraints`)?',
        '¿Qué política de admisión o degradación protege al sistema cuando se llena el buffer?',
      ],
    },
    S12: {
      crisisTitle: 'Fase 2 · Intento de extracción cruzada multi-tenant (BOLA/IDOR) en endpoint de reportes',
      triggerEvent:
        'Seguridad detecta peticiones autenticadas con JWT válido cambiando el parámetro `organization_id` de la URL para descargar facturas de otros clientes.',
      canonicalOptions: [
        'Derivar `tenant_id` exclusivamente del principal autenticado en servidor, reforzar filtro obligatorio en repositorio/DB, auditar 403 y redactar PII en logs',
        'Confiar en que el frontend oculta el selector de organización y mantener solo validación de firma JWT',
        'Volcar los payloads completos con tokens y documentos de identidad en logs centrales para investigar',
      ],
      requiredPhase1Support: 'Autorización',
      reviewerQuestions: [
        '¿Distingue claramente autenticación (JWT válido) de autorización por recurso y pertenencia al tenant?',
        '¿Existe defensa en profundidad en la capa de persistencia contra lecturas cruzadas entre tenants?',
        '¿Se verifica que logs, trazas, cachés y respaldos no expongan PII ni secretos?',
        '¿Qué pruebas negativas automatizadas verifican 401 vs 403 frente a manipulación de IDs?',
      ],
    },
    S13: {
      crisisTitle: 'Fase 2 · Tormenta sincronizada de reintentos tras microcorte regional del proveedor',
      triggerEvent:
        'Tras 40 segundos de caída del proveedor de envíos, 80 instancias internas reintentan al mismo milisegundo cada segundo, impidiendo que el proveedor se recupere.',
      canonicalOptions: [
        'Aplicar backoff exponencial con full jitter, presupuesto máximo de retries por petición, circuit breaker con `HALF_OPEN` y degradación elegante (encolar cotización diferida)',
        'Aumentar los reintentos a 25 veces sin espera para «asegurar que alguna pase»',
        'Compartir el mismo pool de hilos entre checkout crítico y sincronización secundaria de tracking',
      ],
      requiredPhase1Support: 'Plan de rollback',
      reviewerQuestions: [
        '¿La latencia de peor caso (`timeout × intentos`) respeta el deadline del cliente llamador?',
        '¿Cómo evita el aislamiento Bulkhead que una dependencia secundaria tumbe el flujo principal de ingresos?',
        '¿Cuál es el comportamiento funcional degradado cuando el circuito permanece `OPEN`?',
        '¿Se inyectó este fallo en entorno controlado para comprobar la recuperación en `HALF_OPEN`?',
      ],
    },
    S14: {
      crisisTitle: 'Fase 2 · Error Budget mensual al 8 % (Burn Rate 15,2×) antes de gran lanzamiento',
      triggerEvent:
        'Aunque CPU y healthcheck `/healthz` marcan 200 OK, la latencia p95 del checkout supera el umbral SLO consumiendo el presupuesto a ritmo 15,2×.',
      canonicalOptions: [
        'Activar política de Error Budget: pausar despliegues funcionales no críticos, correlacionar trazas p95 por dependencia lenta y restaurar margen SLO primero',
        'Subir el umbral de latencia del SLO de 400 ms a 5.000 ms para que el dashboard vuelva a ponerse en verde',
        'Agregar `user_id` y `request_uuid` como labels en todas las métricas Prometheus disparando la cardinalidad',
      ],
      requiredPhase1Support: 'Observabilidad',
      reviewerQuestions: [
        '¿Los SLIs miden éxito y latencia percibida por el usuario en vez de simple liveness de proceso?',
        '¿Las alertas usan ventanas múltiples de Burn Rate para equilibrar rapidez de detección y bajo ruido?',
        '¿Se controla estrictamente la cardinalidad de etiquetas en métricas dejando IDs únicos para trazas/logs?',
        '¿Qué acuerdo de gobernanza vincula el agotamiento del Error Budget con la priorización de fiabilidad?',
      ],
    },
    S15: {
      crisisTitle: 'Fase 2 · Regresión silenciosa de negocio en el 10 % de tráfico Canary',
      triggerEvent:
        'El despliegue canary al 10 % no arroja errores HTTP 500, pero la tasa de conversión de pagos cae un 28 % respecto a la cohorte estable.',
      canonicalOptions: [
        'Ejecutar rollback automático basado en métrica de negocio/SLI comparativa, conservando el esquema de BD compatible hacia atrás (fase Expand)',
        'Promover igualmente al 100 % porque no hay excepciones no controladas en consola',
        'Ejecutar `DROP COLUMN` de la versión anterior durante el rollback dejando corruptas las réplicas estables',
      ],
      requiredPhase1Support: 'Plan de rollback',
      reviewerQuestions: [
        '¿El canary evalúa métricas de negocio además de códigos técnicos HTTP 5xx?',
        '¿Las migraciones de datos están desacopladas del despliegue de código para permitir rollback instantáneo?',
        '¿Tienen caducidad y propietario los feature flags introducidos?',
        '¿Se ensayó el tiempo real de reversión bajo tráfico activo?',
      ],
    },
    S16: {
      crisisTitle: 'Fase 2 · Discrepancia del 1,4 % en lecturas Shadow antes de apagar el legado',
      triggerEvent:
        'La comparación automática entre el motor legado y el nuevo microservicio detecta diferencias de redondeo y estados huérfanos en el 1,4 % de órdenes.',
      canonicalOptions: [
        'Detener el cutover final, mantener al legado como fuente autoritativa, corregir redondeo con decimal exacto, ejecutar backfill idempotente y exigir 0 % de divergencia crítica',
        'Cortar las escrituras del sistema legado hoy mismo y corregir en caliente las quejas de clientes',
        'Correr el backfill de 20 millones de registros en una sola transacción bloqueante a mediodía',
      ],
      requiredPhase1Support: 'Plan de rollback',
      reviewerQuestions: [
        '¿Está definido explícitamente el punto de no retorno y cómo revertir antes de cruzarlo?',
        '¿El backfill procesa lotes acotados con checkpoints reanudables y medición de locks WAL?',
        '¿Cómo se evitan ciclos infinitos de sincronización durante ventanas de escritura dual?',
        '¿Qué evidencia cuantitativa autoriza pasar de shadow read a escritura primaria nueva?',
      ],
    },
    S17: {
      crisisTitle: 'Fase 2 · Sobrecosto cloud del 45 % por NAT Gateway, previews huérfanas y nodos ociosos',
      triggerEvent:
        'FinOps detecta una desviación del +45 % mensual causada por descargas S3 cruzando NAT Gateway, 40 entornos preview sin TTL y proponen mover PostgreSQL primario a instancias Spot.',
      canonicalOptions: [
        'Enrutar S3/ECR por VPC Gateway Endpoints gratuitos, aplicar TTL automático a Review Apps, migrar servicios stateless a ARM64/Graviton y mantener la BD primaria en On-Demand con SLO protegido',
        'Mover la base de datos transaccional primaria a instancias Spot sin réplica para ahorrar 70 %',
        'Apagar recolecciones de backups, logs de seguridad y entornos de pruebas de contrato',
      ],
      requiredPhase1Support: 'Observabilidad',
      reviewerQuestions: [
        '¿Distingue claramente estimaciones preventivas (Infracost/OpenCost) de facturación reconciliada real?',
        '¿Dónde es seguro aprovechar Spot/Karpenter (workers idempotentes) y dónde es inaceptable (estado primario)?',
        '¿Están exigidas las etiquetas `Owner`, `Environment`, `CostCenter` y `Service` en CI?',
        '¿Cada recorte de gasto propuesto demuestra impacto nulo o controlado sobre el SLO comprometido?',
      ],
    },
    S18: {
      crisisTitle: 'Fase 2 · Bloqueo en Comité de Arquitectura entre velocidad comercial y deuda crítica',
      triggerEvent:
        'Producto exige lanzar expansión regional en 30 días sin cambiar nada, mientras Seguridad e Infraestructura piden congelar toda entrega durante 6 meses.',
      canonicalOptions: [
        'Acordar hoja de ruta 30-60-90 días: bloquear únicamente riesgos P0 no negociables (authz/idempotencia/rollback), habilitar entrega acotada con guardrails SLO y asignar owners con fecha de revisión de ADR',
        'Aprobar verbalmente todo sin ADR, métricas ni responsables para evitar fricción en la reunión',
        'Paralizar el 100 % de entregas de negocio durante medio año prometiendo una arquitectura perfecta',
      ],
      requiredPhase1Support: 'Dominio aislado',
      reviewerQuestions: [
        '¿El paquete integra coherentemente vistas C4, ADRs con alternativas reales, riesgos STRIDE y plan operativo?',
        '¿Separa decisiones irreversibles (que exigen rigor inmediato) de decisiones reversibles iterables?',
        '¿Cada iniciativa del plan 30-60-90 días tiene owner, métrica refutable y condición de salida?',
        '¿Reconoce honestamente los límites e incertidumbres que requieren validación en producción real?',
      ],
    },
  });
