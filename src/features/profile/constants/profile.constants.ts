/**
 * Profile, Achievements, Accessibility Settings and About constants owned by the Profile feature (ARQ-010).
 */

export const SETTINGS_STORAGE_KEY = 'arqpixel-settings-v1';

export const THEME_MODES = ['dark', 'light', 'high-contrast', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const FONT_SCALES = ['normal', 'large', 'xlarge'] as const;
export type FontScale = (typeof FONT_SCALES)[number];

export const ACHIEVEMENT_CATEGORIES = [
  'Niveles Curriculares',
  'Especializaciones',
  'Senior Mode',
  'Práctica y Portafolio',
] as const;

export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export type AchievementBlueprint = {
  readonly id: string;
  readonly title: string;
  readonly category: AchievementCategory;
  readonly criteriaText: string;
  readonly targetCount: number;
};

export const ACHIEVEMENT_BLUEPRINTS: readonly AchievementBlueprint[] = Object.freeze([
  {
    id: 'ACH-FIRST-MODULE',
    title: 'Primer diseño',
    category: 'Niveles Curriculares',
    criteriaText: 'Aprobar al menos 1 módulo del currículo base.',
    targetCount: 1,
  },
  {
    id: 'ACH-BASICS-12',
    title: 'Fundamentos de arquitectura',
    category: 'Niveles Curriculares',
    criteriaText: 'Completar los 12 módulos del nivel Básico (B01–B12).',
    targetCount: 12,
  },
  {
    id: 'ACH-INTERMEDIATE-12',
    title: 'Diseñador modular',
    category: 'Niveles Curriculares',
    criteriaText: 'Completar los 12 módulos del nivel Intermedio (I01–I12).',
    targetCount: 12,
  },
  {
    id: 'ACH-ADVANCED-12',
    title: 'Diseñador de sistemas',
    category: 'Niveles Curriculares',
    criteriaText: 'Completar los 12 módulos del nivel Avanzado (A01–A12).',
    targetCount: 12,
  },
  {
    id: 'ACH-CURRICULUM-36',
    title: 'Currículo completo (36/36)',
    category: 'Niveles Curriculares',
    criteriaText: 'Aprobar las 36 lecciones fundamentales, intermedias y avanzadas.',
    targetCount: 36,
  },
  {
    id: 'ACH-SENIOR-FIRST',
    title: 'Primer Senior superado',
    category: 'Senior Mode',
    criteriaText: 'Superar la evaluación estructural completa de 1 misión Senior.',
    targetCount: 1,
  },
  {
    id: 'ACH-SENIOR-CRITICAL-PAIR',
    title: 'Guardián de Pagos y Capacidad',
    category: 'Senior Mode',
    criteriaText: 'Superar las misiones críticas S09 (Pagos idempotentes) y S11 (Capacidad).',
    targetCount: 2,
  },
  {
    id: 'ACH-SENIOR-ALL-18',
    title: 'Comité de Arquitectura (18/18)',
    category: 'Senior Mode',
    criteriaText: 'Superar los controles estructurales de las 18 misiones de producción.',
    targetCount: 18,
  },
  {
    id: 'ACH-PATH-R01',
    title: 'Especialista SOLID y GoF (R01)',
    category: 'Especializaciones',
    criteriaText: 'Completar todos los módulos requeridos por la especialización R01.',
    targetCount: 8,
  },
  {
    id: 'ACH-PATH-R02',
    title: 'Especialista Clean / Hexagonal (R02)',
    category: 'Especializaciones',
    criteriaText: 'Completar todos los módulos requeridos por la especialización R02.',
    targetCount: 7,
  },
  {
    id: 'ACH-PATH-R03',
    title: 'Especialista DDD (R03)',
    category: 'Especializaciones',
    criteriaText: 'Completar todos los módulos requeridos por la especialización R03.',
    targetCount: 5,
  },
  {
    id: 'ACH-PATH-R04',
    title: 'Especialista API Design (R04)',
    category: 'Especializaciones',
    criteriaText: 'Completar todos los módulos requeridos por la especialización R04.',
    targetCount: 4,
  },
  {
    id: 'ACH-PATH-R05',
    title: 'Especialista System Design (R05)',
    category: 'Especializaciones',
    criteriaText: 'Completar todos los módulos requeridos por la especialización R05.',
    targetCount: 5,
  },
  {
    id: 'ACH-PATH-R06',
    title: 'Especialista Eventos y Microservicios (R06)',
    category: 'Especializaciones',
    criteriaText: 'Completar todos los módulos requeridos por la especialización R06.',
    targetCount: 6,
  },
  {
    id: 'ACH-PATH-R07',
    title: 'Especialista Cloud y Reliability (R07)',
    category: 'Especializaciones',
    criteriaText: 'Completar todos los módulos requeridos por la especialización R07.',
    targetCount: 5,
  },
  {
    id: 'ACH-PATH-R08',
    title: 'Arquitecto Integral de Plataforma (R08)',
    category: 'Especializaciones',
    criteriaText: 'Completar los 9 módulos avanzados requeridos por la especialización R08.',
    targetCount: 9,
  },
  {
    id: 'ACH-MINIGAMES-30',
    title: 'Criterio en Minijuegos (30/30)',
    category: 'Práctica y Portafolio',
    criteriaText: 'Alcanzar las 30 decisiones óptimas en los cinco minijuegos de arquitectura.',
    targetCount: 30,
  },
  {
    id: 'ACH-CAPSTONE-AUTHOR',
    title: 'Autor de Portafolio Capstone',
    category: 'Práctica y Portafolio',
    criteriaText: 'Completar la estructura verificable de al menos 1 Proyecto Integrador / Capstone.',
    targetCount: 1,
  },
]);
