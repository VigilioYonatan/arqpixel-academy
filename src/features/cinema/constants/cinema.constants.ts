/**
 * Operational constants, playback speeds, resilient clock thresholds, and phonetic replacements
 * owned by the Interactive Cinema feature (`arquibot-pixel-cinema`, `ADR-0007`).
 */

export const CINEMA_SPEAKER_ROLES = ['host', 'mentor'] as const;

export const CINEMA_AURA_THEMES = ['amber', 'sky', 'emerald', 'violet', 'gold'] as const;

export const CINEMA_PLAYBACK_SPEEDS = [1, 1.25, 1.5] as const;

export const CINEMA_TICK_MS = 100;

/** Six 100ms ticks (600ms) without `<audio>.currentTime` advancing triggers deterministic fallback clock in headless CI. */
export const CINEMA_STALL_TICKS_LIMIT = 6;

export const CINEMA_SCRUBBER_MAX = 1000;

export const CINEMA_KEYBOARD_SEEK_SEC = 4;

export const CINEMA_WORDS_PER_SECOND_ESTIMATE = 2.65;

export const CINEMA_SPEAKER_LABELS = Object.freeze({
  host: 'Sofía · Tech Lead',
  mentor: 'ArquiBot · Mentor Senior',
} as const);

export const ARCHITECTURE_SPEECH_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = Object.freeze([
  ['ARQPIXEL Academy', 'Arc Píxel Academy'],
  ['ARQPIXEL', 'Arc Píxel'],
  ['NexoShop', 'Nexo Shop'],
  ['PostgreSQL', 'Póstgres'],
  ['Clean Architecture', 'Arquitectura Clean'],
  ['REQUIRES_REVIEW', 'revisión humana obligatoria'],
  ['FNV-1a', 'efe ene uve uno a'],
  ['C1/C2/C3', 'ce uno, ce dos y ce tres'],
  ['C1', 'ce uno'],
  ['C2', 'ce dos'],
  ['C3', 'ce tres'],
  ['C4', 'ce cuatro'],
  ['DDD', 'de de de'],
  ['SOLID', 'sólid'],
  ['GoF', 'Gang of Four'],
  ['MVC', 'eme uve ce'],
  ['POO', 'programación orientada a objetos'],
  ['SRP', 'ese erre pe'],
  ['OCP', 'o ce pe'],
  ['LSP', 'ele ese pe'],
  ['ISP', 'i ese pe'],
  ['DIP', 'de i pe'],
  ['YAGNI', 'yagni'],
  ['SDKs', 'ese de kas'],
  ['SDK', 'ese de ka'],
  ['Factory Method', 'Fáctori Mézod'],
  ['Abstract Factory', 'Ábstract Fáctori'],
  ['NotImplemented', 'no implementado'],
  ['IoC', 'inversión de control'],
  ['Express', 'Exprés'],
  ['Strategy', 'Estráteyi'],
  ['Adapter', 'Adápter'],
  ['Factory', 'Fáctori'],
  ['Builder', 'Bílder'],
  ['Observer', 'Obsérver'],
  ['Decorator', 'Decoréitor'],
  ['Singleton', 'Síngleton'],
  ['CQRS', 'ce cu erre ese'],
  ['ACID', 'ácid'],
  ['SLOs', 'ese ele os'],
  ['SLO', 'ese ele o'],
  ['SLI', 'ese ele i'],
  ['RPO/RTO', 'erre pe o y erre te o'],
  ['HTTPS', 'ache te te pe ese'],
  ['HTTP', 'ache te te pe'],
  ['DNS', 'de ene ese'],
  ['TLS', 'te ele ese'],
  ['POST', 'post'],
  ['p95', 'percentil noventa y cinco'],
  ['p99', 'percentil noventa y nueve'],
  ['STRIDE', 'estraid'],
  ['IDOR', 'ídor'],
  ['DLQ', 'cola de mensajes fallidos'],
  ['ADRs', 'documentos a de erre'],
  ['ADR', 'a de erre'],
  ['API', 'a pe i'],
  ['SQL', 'ese cu ele'],
  ['ORM', 'o erre eme'],
  ['3D', 'tres de'],
  ['trade-offs', 'treid ofs'],
  ['trade-off', 'treid of'],
  ['rollback', 'rólbak'],
  ['fallback', 'fólbak'],
  ['timeouts', 'taim auts'],
  ['timeout', 'taim aut'],
  ['setters', 'séters'],
  ['checkout', 'chekaut'],
  ['Frontend', 'Fróntend'],
  ['Strangler', 'Estrángler'],
]);
