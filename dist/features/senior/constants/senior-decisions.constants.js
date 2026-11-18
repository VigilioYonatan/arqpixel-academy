/**
 * Senior Mode mission decision choices and evaluation thresholds owned by the Senior feature.
 */
export const MIN_SENIOR_ADR_LENGTH = 160;
export const SENIOR_FULL_SCORE = 100;
export const SENIOR_MISSION_DECISIONS = Object.freeze([
    ['Modularizar por capacidades y migrar por etapas', 'Reescribir toda la plataforma en un único release', 'Mantener acoplamiento total sin tests'],
    ['Aplicar una interfaz pequeña y pruebas de regresión', 'Agregar diez capas abstractas sin variaciones', 'Usar métodos globales mutables'],
    ['Adapter y Strategy según variación de proveedores', 'Un switch gigante en cada controlador', 'Herencia para todas las integraciones'],
    ['Invertir dependencias hacia puertos de dominio', 'Importar ORM directamente en entidades', 'Mover todas las clases a controllers'],
    ['Identificar Bounded Contexts con equipos y lenguaje', 'Compartir un modelo universal para todos los procesos', 'Separar únicamente por tablas'],
    ['Definir agregados con invariantes y consistencia local', 'Permitir escrituras directas a cualquier entidad', 'Usar una única transacción global permanente'],
    ['Versionar contratos y mantener compatibilidad temporal', 'Cambiar campos sin avisar a clientes', 'Forzar actualización instantánea de apps'],
    ['Evaluar modular monolith antes de extraer servicios', 'Crear un microservicio por endpoint', 'Evitar definir límites'],
    ['Idempotencia persistida más outbox y control de reintentos', 'Reintentar cobros indefinidamente', 'Confiar en que eventos llegan una vez'],
    ['Elegir semántica de consistencia con UX explícita', 'Prometer consistencia fuerte gratuita en cada servicio', 'Ignorar lecturas obsoletas'],
    ['Estimar carga y diseñar caché, colas y escalado por cuello real', 'Multiplicar instancias sin observar métricas', 'Eliminar pruebas de carga'],
    ['Aplicar amenazas y autorización por recurso', 'Permitir permisos amplios con confianza en frontend', 'Guardar secretos en repositorio'],
    ['Usar timeout, backoff, jitter y circuit breaker', 'Retries simultáneos ilimitados', 'Dejar conexiones abiertas para siempre'],
    ['Definir SLI/SLO y trazas para diagnosticar p95', 'Monitorear solo si el servidor responde 200', 'Deshabilitar logs en incidentes'],
    ['Canary, observación, rollback y migraciones compatibles', 'Desplegar globalmente sin gates', 'Actualizar esquema eliminando columnas al instante'],
    ['Strangler con cortes por etapa y reversión', 'Big bang sin migración de datos', 'Doble escritura sin reconciliación'],
    ['Cuantificar coste por operación y medir calidad', 'Reducir redundancia sin validar objetivos', 'Ignorar límites presupuestales'],
    ['Documentar ADR, riesgos, C4 y plan operativo', 'Escoger la opción de moda sin justificar', 'Excluir a las partes interesadas'],
]);
