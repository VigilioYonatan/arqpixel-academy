/**
 * Curriculum constants & pedagogical prerequisite DAG for all 54 ARQPIXEL nodes
 * (36 modules B01-A12 + 18 Senior missions S01-S18).
 */

export const CURRICULUM_LEVELS = ['Básico', 'Intermedio', 'Avanzado'] as const;
export type CurriculumLevel = (typeof CURRICULUM_LEVELS)[number];

export const MAP_STAGE_FILTERS = ['ALL', 'Básico', 'Intermedio', 'Avanzado', 'Senior'] as const;
export type MapStageFilter = (typeof MAP_STAGE_FILTERS)[number];

export const MAP_STATUS_FILTERS = ['ALL', 'READY', 'COMPLETED', 'PENDING_PREREQ'] as const;
export type MapStatusFilter = (typeof MAP_STATUS_FILTERS)[number];

/**
 * Advisory prerequisite graph across all 54 curriculum elements.
 * Every edge points from prerequisite -> dependent node (strictly acyclic DAG).
 */
export const CURRICULUM_PREREQUISITES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  // Nivel Básico (B01 - B12)
  B01: [],
  B02: ['B01'],
  B03: ['B01', 'B02'],
  B04: ['B03'],
  B05: ['B02', 'B03'],
  B06: ['B03', 'B05'],
  B07: ['B05', 'B06'],
  B08: ['B03'],
  B09: ['B03', 'B08'],
  B10: ['B08', 'B09'],
  B11: ['B08', 'B10'],
  B12: ['B04', 'B06', 'B10', 'B11'],

  // Nivel Intermedio (I01 - I12)
  I01: ['B09', 'B10'],
  I02: ['B11', 'I01'],
  I03: ['B11', 'I01'],
  I04: ['I02', 'I03'],
  I05: ['B06', 'I01'],
  I06: ['B06', 'I01', 'I05'],
  I07: ['I03', 'I06'],
  I08: ['B02', 'B09', 'I06'],
  I09: ['I08'],
  I10: ['I05', 'I08', 'I09'],
  I11: ['B05', 'I07'],
  I12: ['I06', 'I09', 'I10', 'I11'],

  // Nivel Avanzado (A01 - A12)
  A01: ['B02', 'B05', 'I11'],
  A02: ['I09', 'I12', 'A01'],
  A03: ['I11', 'A02'],
  A04: ['I10', 'A03'],
  A05: ['I05', 'A03', 'A04'],
  A06: ['A01', 'A05'],
  A07: ['A03', 'A06'],
  A08: ['I11', 'A01'],
  A09: ['A01', 'A07'],
  A10: ['A02', 'A08', 'A09'],
  A11: ['I12', 'A02', 'A10'],
  A12: ['A05', 'A06', 'A07', 'A09', 'A10'],

  // Senior Mode (S01 - S18)
  S01: ['B09', 'I12'],
  S02: ['I01'],
  S03: ['I03', 'I04'],
  S04: ['I06', 'I07'],
  S05: ['I08', 'I09'],
  S06: ['I10'],
  S07: ['I11'],
  S08: ['I12', 'A02'],
  S09: ['A03', 'A05'],
  S10: ['A05', 'A06'],
  S11: ['A01', 'A06'],
  S12: ['A08'],
  S13: ['A07'],
  S14: ['A09'],
  S15: ['A10'],
  S16: ['A11'],
  S17: ['A01', 'A06', 'A10'],
  S18: ['A12', 'S08', 'S09', 'S14', 'S16'],
});


export type SpecializationEnrichment = {
  readonly relatedMissions: readonly string[];
  readonly recommendedLabs: ReadonlyArray<readonly [string, string]>;
  readonly capstoneProjectId: string;
  readonly targetProfile: string;
};

export const SPECIALIZATION_ENRICHMENTS: Readonly<Record<string, SpecializationEnrichment>> = Object.freeze({
  R01: {
    relatedMissions: ['S02', 'S03'],
    recommendedLabs: [
      ['patterns', 'Pattern & Refactoring Clinic'],
      ['dependencias', 'Dependency Graph Builder'],
    ],
    capstoneProjectId: 'CAP-R01',
    targetProfile: 'Ingenieros de software que buscan modularizar reglas cambiantes sin caer en sobreingeniería de patrones.',
  },
  R02: {
    relatedMissions: ['S01', 'S04'],
    recommendedLabs: [
      ['dependencias', 'Dependency Graph Builder'],
      ['c4', 'C4 Studio'],
    ],
    capstoneProjectId: 'CAP-R02',
    targetProfile: 'Desarrolladores backend/fullstack que necesitan aislar casos de uso y dominio de frameworks HTTP y ORMs.',
  },
  R03: {
    relatedMissions: ['S05', 'S06'],
    recommendedLabs: [
      ['ddd', 'DDD Workshop'],
      ['c4', 'C4 Studio'],
    ],
    capstoneProjectId: 'CAP-R03',
    targetProfile: 'Equipos con dominios complejos que requieren lenguaje ubicuo, Bounded Contexts e invariantes transaccionales.',
  },
  R04: {
    relatedMissions: ['S07', 'S12'],
    recommendedLabs: [
      ['api', 'API Contract Lab'],
      ['adr', 'Architecture Decision Studio'],
    ],
    capstoneProjectId: 'CAP-R04',
    targetProfile: 'Diseñadores de APIs públicas o internas con clientes heterogéneos, versionado e idempotencia.',
  },
  R05: {
    relatedMissions: ['S10', 'S11'],
    recommendedLabs: [
      ['distributed', 'Distributed Systems Simulator'],
      ['c4', 'C4 Studio'],
    ],
    capstoneProjectId: 'CAP-R05',
    targetProfile: 'Ingenieros preparando diseño de sistemas a escala, estimación cuantitativa de capacidad, caché y SLO.',
  },
  R06: {
    relatedMissions: ['S08', 'S09', 'S13'],
    recommendedLabs: [
      ['distributed', 'Distributed Systems Simulator'],
      ['incident', 'Incident & Reliability Lab'],
    ],
    capstoneProjectId: 'CAP-R06',
    targetProfile: 'Arquitectos evaluando cuándo extraer servicios y cómo coordinar eventos con outbox, sagas e idempotencia.',
  },
  R07: {
    relatedMissions: ['S13', 'S14', 'S15', 'S16'],
    recommendedLabs: [
      ['incident', 'Incident & Reliability Lab'],
      ['adr', 'Architecture Decision Studio'],
    ],
    capstoneProjectId: 'CAP-R07',
    targetProfile: 'Perfiles SRE, plataforma y backend responsables de observabilidad, despliegues progresivos y migración sin caída.',
  },
  R08: {
    relatedMissions: ['S08', 'S09', 'S15', 'S17', 'S18'],
    recommendedLabs: [
      ['c4', 'C4 Studio'],
      ['adr', 'Architecture Decision Studio'],
      ['incident', 'Incident & Reliability Lab'],
    ],
    capstoneProjectId: 'CAP-R08',
    targetProfile: 'Tech Leads y Staff/Senior Architects que defienden trade-offs técnicos, financieros y operativos ante comité.',
  },
});

/**
 * Canonical bibliographic references & attribution clusters by module group (`§23 L2682`).
 * All prose and diagrams in ARQPIXEL are original syntheses inspired by classic engineering literature.
 */
export const MODULE_CANONICAL_REFERENCES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  B01: ['Martin Fowler — Software Architecture Guide', 'Ralph Johnson — Architecture as Shared Understanding'],
  B02: ['ISO/IEC 25010 — System and Software Quality Models', 'Neal Ford, Mark Richards — Fundamentals of Software Architecture (Quality Attributes)'],
  B03: ['David Parnas (1972) — On the Criteria To Be Used in Decomposing Systems into Modules', 'Larry Constantine & Edward Yourdon — Structured Design (Cohesion & Coupling)'],
  B04: ['Simon Brown — The C4 Model for Visualising Software Architecture (CC BY 4.0 concept attribution)', 'Philippe Kruchten — The 4+1 View Model of Architecture'],
  B05: ['Roy Fielding (2000) — Architectural Styles and the Design of Network-based Software Architectures', 'Martin Kleppmann — Designing Data-Intensive Applications (Cap. 4: Encoding and Evolution)'],
  B06: ['Martin Fowler — Patterns of Enterprise Application Architecture (Domain Logic & Data Source)', 'Alistair Cockburn — Ports and Adapters'],
  B07: ['Martin Kleppmann — Designing Data-Intensive Applications (Storage Engines & Transactions)', 'PostgreSQL Documentation — Concurrency Control & MVCC'],
  B08: ['Betsy Beyer et al. — Site Reliability Engineering (SLIs, SLOs, Error Budgets)', 'Charity Majors et al. — Observability Engineering'],
  B09: ['Michael Nygard (2011) — Documenting Architecture Decisions (ADR)', 'Gregor Hohpe — The Software Architect Elevator'],
  B10: ['Gerard Meszaros — xUnit Test Patterns', 'Mike Cohn — Succeeding with Agile (Testing Pyramid)'],
  B11: ['Kent Beck — Tidy First? & Refactoring', 'Martin Fowler — Refactoring: Improving the Design of Existing Code (2nd Ed.)'],
  B12: ['Sam Newman — Monolith to Microservices (Modular Monolith First)', 'Kamil Grzybek — Modular Monolith with DDD'],
  I01: ['Robert C. Martin — Agile Software Development: Principles, Patterns, and Practices (SOLID)', 'Barbara Liskov & Jeannette Wing (1994) — Behavioral Subtyping'],
  I02: ['Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (GoF) — Design Patterns (Creational)', 'Joshua Bloch — Effective API Construction'],
  I03: ['GoF — Design Patterns (Adapter, Decorator, Facade, Proxy)', 'Alistair Cockburn — Anti-Corruption & Adapter Boundaries'],
  I04: ['GoF — Design Patterns (Strategy, Observer, Command, State)', 'Martin Fowler — Replacing Conditional Logic with Polymorphism'],
  I05: ['Martin Fowler — PoEAA (Repository, Unit of Work, Service Layer)', 'Greg Young — CQRS Documents (2010)'],
  I06: ['Alistair Cockburn (2005) — Hexagonal Architecture (Ports & Adapters)', 'Jeffrey Palermo — Onion Architecture'],
  I07: ['Robert C. Martin — Clean Architecture: A Craftsman’s Guide to Software Structure', 'Tom Hombergs — Get Your Hands Dirty on Clean Architecture'],
  I08: ['Eric Evans (2003) — Domain-Driven Design: Tackling Complexity in the Heart of Software', 'Vaughn Vernon — Domain-Driven Design Distilled'],
  I09: ['Eric Evans — Strategic Design & Context Mapping', 'Alberto Brandolini — Introducing EventStorming'],
  I10: ['Vaughn Vernon — Implementing Domain-Driven Design (Effective Aggregate Design)', 'Martin Fowler — Evans Classification (Entities vs Value Objects)'],
  I11: ['IETF RFC 9110 / RFC 9457 — HTTP Semantics & Problem Details for HTTP APIs', 'OpenAPI Initiative — OpenAPI Specification 3.1'],
  I12: ['Simon Brown — Modular Monoliths', 'Neal Ford, Rebecca Parsons, Patrick Kua — Building Evolutionary Architectures'],
  A01: ['Neil Gunther — Guerrilla Capacity Planning (Universal Scalability Law)', 'John D. C. Little — Little’s Law in Queueing Systems'],
  A02: ['Sam Newman — Building Microservices (2nd Ed.)', 'Martin Fowler — Microservice Trade-Offs & MonolithFirst'],
  A03: ['Gregor Hohpe & Bobby Woolf — Enterprise Integration Patterns', 'Chris Richardson — Microservices Patterns (Transactional Outbox)'],
  A04: ['Hector Garcia-Molina & Kenneth Salem (1987) — Sagas', 'Bernd Rücker — Practical Process Automation (Choreography vs Orchestration)'],
  A05: ['Pat Helland — Idempotence Is Not a Medical Condition', 'Eric Brewer / Seth Gilbert & Nancy Lynch — CAP Theorem & PACELC'],
  A06: ['Marc Brooker — Caching, Stampedes & Jitter (AWS Architecture Blog)', 'Martin Kleppmann — Derived Data & Cache Invalidation'],
  A07: ['Michael Nygard — Release It! (2nd Ed.: Timeouts, Circuit Breakers, Bulkheads)', 'AWS Builders’ Library — Timeouts, Retries and Backoff with Jitter'],
  A08: ['OWASP Foundation — Application Security Verification Standard (ASVS 5.0) & API Security Top 10', 'Adam Shostack — Threat Modeling: Designing for Security (STRIDE)'],
  A09: ['W3C — Trace Context Recommendation (traceparent)', 'OpenTelemetry Specification — Traces, Metrics, and Logs'],
  A10: ['Jez Humble & David Farley — Continuous Delivery (Blue/Green, Canary, Progressive Delivery)', 'SLSA Framework — Supply-chain Levels for Software Artifacts'],
  A11: ['Michael Feathers — Working Effectively with Legacy Code', 'Martin Fowler — Strangler Fig Application & Parallel Change (Expand-Contract)'],
  A12: ['Gregor Hohpe — Architecting at Scale & FinOps Trade-offs', 'FinOps Foundation — Cloud Financial Management Principles'],
});
