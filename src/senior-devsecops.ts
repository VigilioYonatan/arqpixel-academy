/** Mission-specific DevSecOps review of architectural controls.
 * This is a teaching exercise; it does not scan source repositories or issue certifications. */
export const SECURITY_CONTROLS = [
  {id:'sast',label:'SAST y revisión de código en PR',description:'Encontrar patrones peligrosos antes del merge'},
  {id:'sca',label:'SCA / dependencias y SBOM',description:'Inventariar componentes y avisos de seguridad'},
  {id:'secrets',label:'Secret scanning y rotación',description:'Evitar credenciales dentro del código y los artefactos'},
  {id:'contracts',label:'Pruebas de contrato y autorización',description:'Verificar compatibilidad y límites de acceso'},
  {id:'supply',label:'Firmas, procedencia y permisos CI mínimos',description:'Proteger la cadena de suministro del artefacto'},
  {id:'runtime',label:'Observabilidad, rate limiting y rollback',description:'Detectar y contener efectos en producción'},
  {id:'threat',label:'Threat modeling STRIDE y pruebas de abuso',description:'Razonar sobre fronteras de confianza y ataques'},
  {id:'quality',label:'Biome, tests, TypeScript y coverage gate',description:'Evitar regresiones y bloquear cambios sin pruebas'},
] as const;
export type SecurityControlId=typeof SECURITY_CONTROLS[number]['id'];
export type DevSecOpsPolicy={focus:string;must:[SecurityControlId,SecurityControlId];verification:string;failureMode:string};
const policies:Record<string,DevSecOpsPolicy>={
 S01:{focus:'Migración sin romper compatibilidad',must:['contracts','runtime'],verification:'Contract tests contra clientes antiguos y canary con rollback',failureMode:'Cortar el monolito sin contratos ni telemetría'},
 S02:{focus:'Cambios seguros de reglas de negocio',must:['quality','sast'],verification:'Tests de regresión en cada estrategia y SAST en PR',failureMode:'Refactor sin tests ni análisis estático'},
 S03:{focus:'Límites de proveedores externos',must:['contracts','sca'],verification:'Consumer tests con dependencias vulnerables controladas',failureMode:'Actualizar SDK sin revisar contrato ni CVEs'},
 S04:{focus:'Separación de capas y dependencias',must:['quality','sast'],verification:'Regla de arquitectura en CI y pruebas de dominio aislado',failureMode:'Permitir imports de infraestructura en dominio'},
 S05:{focus:'Fronteras de contexto y autorización',must:['contracts','threat'],verification:'Revisar permisos y contratos entre contextos',failureMode:'Compartir permisos globales entre dominios'},
 S06:{focus:'Integridad de inventario',must:['contracts','runtime'],verification:'Tests concurrentes y alertas de sobreventa',failureMode:'No detectar carreras ni inconsistencias'},
 S07:{focus:'APIs públicas versionadas',must:['contracts','quality'],verification:'Contract tests del esquema y coverage gate',failureMode:'Cambiar payload sin evaluar consumidores'},
 S08:{focus:'Seguridad entre microservicios',must:['threat','runtime'],verification:'Threat model de llamadas servicio-servicio y señales operativas',failureMode:'Confiar en cualquier identidad interna'},
 S09:{focus:'Integridad de pagos',must:['contracts','threat'],verification:'Prueba de callback duplicado y abuso de idempotency-key',failureMode:'Aceptar reintentos sin idempotencia y autenticación'},
 S10:{focus:'Consistencia y privacidad de lecturas',must:['contracts','runtime'],verification:'Prueba de datos desfasados y observabilidad de retrasos',failureMode:'Exponer estado obsoleto como definitivo'},
 S11:{focus:'Resistencia a picos maliciosos',must:['runtime','threat'],verification:'Prueba de saturación y abuso de rate limits',failureMode:'Aceptar tráfico ilimitado sin backpressure'},
 S12:{focus:'Privacidad y defensa en profundidad',must:['threat','secrets'],verification:'Threat model y prueba de acceso horizontal más rotación',failureMode:'Filtrar PII o secretos en logs'},
 S13:{focus:'Resiliencia y dependencia vulnerable',must:['sca','runtime'],verification:'SCA de SDK y fault-injection sin amplificar reintentos',failureMode:'Reintentos infinitos ante tercero vulnerable'},
 S14:{focus:'Telemetría sin filtración de datos',must:['runtime','secrets'],verification:'Test de redacción de PII y alertas SLO',failureMode:'Registrar tokens y datos privados'},
 S15:{focus:'Release seguro y reversible',must:['supply','runtime'],verification:'Provenance de artefactos y canary con rollback',failureMode:'Publicar desde CI con permisos de escritura amplios'},
 S16:{focus:'Migración de esquema reversible',must:['contracts','supply'],verification:'Expand/contract verificado y entrega trazable',failureMode:'Desplegar esquema incompatible con clientes'},
 S17:{focus:'Riesgo de seguridad vs ahorro',must:['sca','runtime'],verification:'Inventario SBOM y métricas de costo/SLO',failureMode:'Desactivar controles para reducir costo'},
 S18:{focus:'Gobernanza de releases multi-equipo',must:['supply','quality'],verification:'Política de merge y firma de entregables auditables',failureMode:'Aprobar cambios sin revisión ni evidencias'},
};
export function devsecopsPolicy(missionId:string):DevSecOpsPolicy {
 const p=policies[missionId];if(!p)throw Error('Misión desconocida para DevSecOps');return p;
}
export function evaluateDevSecOps(missionId:string,selected:readonly string[]){
 const p=devsecopsPolicy(missionId),allowed=new Set<string>(SECURITY_CONTROLS.map(c=>c.id));
 const unique=new Set(selected), unknown=selected.filter(c=>!allowed.has(c));
 const missing=p.must.filter(c=>!unique.has(c));
 const tooMany=unique.size>4,tooFew=unique.size<2;
 const pass=!unknown.length&&!missing.length&&!tooMany&&!tooFew&&unique.size===selected.length;
 const reason=unknown.length?'Hay controles desconocidos.':tooMany?'Limita el alcance: seleccionar todos los controles no constituye priorización.':tooFew?'Selecciona al menos dos controles.':missing.length?`Faltan controles críticos: ${missing.join(', ')}.`:unique.size!==selected.length?'Hay controles duplicados.':'Controles mínimos priorizados; su configuración real exige revisión y pruebas.';
 return {status:pass?'PASS':'FAIL',pass,reason,focus:p.focus,verification:p.verification,failureMode:p.failureMode,selected:[...selected]};
}
