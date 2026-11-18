export function simulatePaymentReplay(input) {
    const { orders, duplicateRate, idempotency, outbox } = input;
    if (!Number.isSafeInteger(orders) || orders < 1 || orders > 100000 || !Number.isFinite(duplicateRate) || duplicateRate < 0 || duplicateRate > 100)
        throw Error('Parámetros de pagos no válidos');
    const repeatAttempts = Math.round(orders * duplicateRate / 100);
    const chargeAttempts = orders + repeatAttempts;
    const effectiveCharges = idempotency ? orders : chargeAttempts;
    // One artificial publication failure per 20 logical operations without an outbox.
    const lostEvents = outbox ? 0 : Math.ceil(orders / 20);
    return { orders, repeatAttempts, chargeAttempts, effectiveCharges,
        duplicateCharges: effectiveCharges - orders, eventsEventuallyPublished: orders - lostEvents, lostEvents,
        invariants: { oneChargePerOrder: effectiveCharges === orders, oneEventualEventPerOrder: lostEvents === 0 },
        assumptions: 'El simulador supone un reintento como máximo por operación, una tasa fija de pérdidas del 5 % sin outbox y entrega eventual exitosa con outbox. No conecta con pasarelas ni reproduce carreras reales.' };
}
export function simulatePeakCapacity(input) {
    const { incomingRpm, workers, rpmPerWorker, queueLimit, minutes } = input;
    if (![incomingRpm, workers, rpmPerWorker, queueLimit, minutes].every(Number.isSafeInteger) || incomingRpm < 1 || incomingRpm > 10000000 || workers < 1 || workers > 10000 || rpmPerWorker < 1 || rpmPerWorker > 100000 || queueLimit < 0 || queueLimit > 10000000 || minutes < 1 || minutes > 120)
        throw Error('Parámetros de capacidad no válidos');
    const processingRpm = workers * rpmPerWorker;
    const pending = Math.max(0, (incomingRpm - processingRpm) * minutes);
    const queued = Math.min(pending, queueLimit);
    const dropped = Math.max(0, pending - queueLimit);
    const utilization = Math.round((incomingRpm / processingRpm) * 10000) / 100;
    const reservePercent = Math.round(((processingRpm - incomingRpm) / processingRpm) * 1000) / 10;
    return { processingRpm, pending, queued, dropped, utilization, reservePercent,
        stable: processingRpm >= incomingRpm,
        assumptions: 'Modelo lineal por minuto: capacidad uniforme por worker, tráfico constante, sin latencia de red, batching, fallos ni backpressure. No representa una prueba de carga de producción.' };
}
