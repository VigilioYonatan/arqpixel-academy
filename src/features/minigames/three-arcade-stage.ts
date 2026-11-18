/**
 * Interactive 3D Architectural Arcade Stage powered by Three.js (`0.187.0`, MIT) loaded lazily
 * on `#/minijuego/:id` (`ADR-0006`, `ux-game-experience`, `ui-interaction-motion`).
 * Includes strict GPU cleanup, `prefers-reduced-motion` support, zero inline styles (`style-src 'self'`),
 * and deterministic SVG 2D blueprint fallback when WebGL is unavailable.
 */

export type MinigameWorldId = 'tetris' | 'acoplamiento' | 'patrones' | 'dominio' | 'incidente';

export type MinigameWorldMeta = {
  readonly id: MinigameWorldId;
  readonly sceneTitle: string;
  readonly cameraLabel: string;
  readonly mechanicHint: string;
  readonly primaryHex: number;
  readonly accentHex: number;
  readonly nodeLabels: readonly [string, string, string, string];
};

export const MINIGAME_3D_WORLDS: Readonly<Record<MinigameWorldId, MinigameWorldMeta>> =
  Object.freeze({
    tetris: {
      id: 'tetris',
      sceneTitle: 'Torre Concéntrica 3D · Capas Limpias',
      cameraLabel: 'Vista isométrica de dependencias',
      mechanicHint: 'Cada acierto encaja el bloque 3D en su capa sin contaminar el Dominio.',
      primaryHex: 0x16e1ee,
      accentHex: 0x53e2ba,
      nodeLabels: ['Presentación', 'Aplicación', 'Dominio', 'Infraestructura'],
    },
    acoplamiento: {
      id: 'acoplamiento',
      sceneTitle: 'Constelación de Acoplamiento 3D',
      cameraLabel: 'Radar orbital de ciclos e imports',
      mechanicHint: 'Rompe las aristas rígidas hacia detalles técnicos e invierte los puertos.',
      primaryHex: 0x38bdf8,
      accentHex: 0xa481ff,
      nodeLabels: ['Dominio Puro', 'Puerto Estable', 'Adaptador SQL', 'Cliente HTTP'],
    },
    patrones: {
      id: 'patrones',
      sceneTitle: 'Forja Geométrica GoF / SOLID 3D',
      cameraLabel: 'Banco óptico de variabilidad',
      mechanicHint: 'Ensambla la pieza justa para la variación real y descarta el sobrediseño.',
      primaryHex: 0x16e1ee,
      accentHex: 0xffd77c,
      nodeLabels: ['Strategy', 'Adapter', 'Observer', 'Diseño Simple'],
    },
    dominio: {
      id: 'dominio',
      sceneTitle: 'Archipiélago DDD · Contextos Acotados 3D',
      cameraLabel: 'Mapa espacial de fronteras semánticas',
      mechanicHint: 'Conecta islas de negocio mediante eventos versionados sin compartir tablas.',
      primaryHex: 0x53e2ba,
      accentHex: 0x16e1ee,
      nodeLabels: ['Ventas', 'Pagos', 'Inventario', 'Facturación'],
    },
    incidente: {
      id: 'incidente',
      sceneTitle: 'Puente SRE 3D · Telemetría en 60 Pasos',
      cameraLabel: 'Matriz p99 y presupuesto de error',
      mechanicHint: 'Estabiliza las torres de latencia con rollback, backoff+jitter e idempotencia.',
      primaryHex: 0xffd77c,
      accentHex: 0x53e2ba,
      nodeLabels: ['SLI / Impacto', 'Rollback Seguro', 'Circuit Breaker', 'Idempotencia'],
    },
  });

export type MinigameHudState = {
  readonly gameId: string;
  readonly step: number;
  readonly totalSteps: number;
  readonly correctCount: number;
  readonly streak: number;
  readonly lastOutcome: 'idle' | 'hit' | 'miss';
  readonly reducedMotion: boolean;
};

export type MinigameHudMetrics = {
  readonly world: MinigameWorldMeta;
  readonly integrityPercent: number;
  readonly progressPercent: number;
  readonly statusBadge: string;
};

const esc = (v: unknown): string =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch),
  );

export function resolveMinigameWorld(game_id: string): MinigameWorldMeta {
  const key = game_id.trim().toLowerCase() as MinigameWorldId;
  return MINIGAME_3D_WORLDS[key] ?? MINIGAME_3D_WORLDS.tetris;
}

export function computeMinigameHudMetrics(hud: MinigameHudState): MinigameHudMetrics {
  const world = resolveMinigameWorld(hud.gameId);
  const wrong_count = Math.max(0, hud.step - hud.correctCount);
  const integrity = Math.max(20, Math.min(100, 100 - wrong_count * 15 + hud.streak * 4));
  const progress = Math.round((hud.step / Math.max(1, hud.totalSteps)) * 100);
  const status_badge =
    hud.lastOutcome === 'hit'
      ? '✓ Arquitectura estable (+integridad)'
      : hud.lastOutcome === 'miss'
        ? '⚠ Tensión estructural detectada'
        : '◈ Esperando decisión del arquitecto';

  return {
    world,
    integrityPercent: Math.min(100, integrity),
    progressPercent: progress,
    statusBadge: status_badge,
  };
}

export function renderMinigameSvgFallbackHtml(hud: MinigameHudState): string {
  const { world, integrityPercent } = computeMinigameHudMetrics(hud);
  const active_slot = hud.step % 4;
  return `<svg class="three-fallback-svg" viewBox="0 0 680 210" role="img" aria-label="${esc(world.sceneTitle)}">
    <rect x="8" y="8" width="664" height="194" rx="14" fill="#071628" stroke="#1e4968"/>
    <path d="M28 164 L652 164" stroke="#173a56" stroke-dasharray="5 5"/>
    ${world.nodeLabels
      .map((label, idx) => {
        const x = 52 + idx * 152;
        const is_focus = idx === active_slot;
        const stroke = is_focus ? '#16e1ee' : '#2b587a';
        const fill = is_focus ? '#103754' : '#0b2238';
        return `<g>
          <rect x="${x}" y="${is_focus ? 48 : 62}" width="128" height="82" rx="11" fill="${fill}" stroke="${stroke}" stroke-width="${is_focus ? '2.5' : '1.5'}"/>
          <text x="${x + 64}" y="${is_focus ? 86 : 98}" text-anchor="middle" fill="#e9f8ff" font-size="12" font-weight="bold" font-family="sans-serif">${esc(label)}</text>
          <text x="${x + 64}" y="${is_focus ? 110 : 120}" text-anchor="middle" fill="#8fd8f0" font-size="10" font-family="sans-serif">Nodo 0${idx + 1}</text>
        </g>`;
      })
      .join('')}
    <text x="28" y="32" fill="#5ce1ff" font-size="12" font-weight="bold" font-family="sans-serif">${esc(world.sceneTitle)} · Integridad ${integrityPercent}%</text>
    <text x="28" y="186" fill="#9cb8ce" font-size="11" font-family="sans-serif">${esc(world.mechanicHint)}</text>
  </svg>`;
}

export function renderMinigameHudHtml(hud: MinigameHudState): string {
  const metrics = computeMinigameHudMetrics(hud);
  return `<section class="arcade-stage-shell" aria-label="Escenario espacial interactivo ${esc(metrics.world.sceneTitle)}">
    <div class="arcade-hud-top">
      <div>
        <span class="eyebrow">⬡ MOTOR ESPACIAL 3D · THREE.JS</span>
        <strong class="arcade-world-title">${esc(metrics.world.sceneTitle)}</strong>
      </div>
      <div class="arcade-pills">
        <span class="arcade-pill" data-hud-integrity="${metrics.integrityPercent}">🛡 Integridad: <b>${metrics.integrityPercent}%</b></span>
        <span class="arcade-pill">🔥 Racha: <b>${hud.streak}</b></span>
        <span class="arcade-pill" id="three-hover-readout">🎯 ${esc(metrics.statusBadge)}</span>
      </div>
    </div>
    <div id="three-arcade-host" class="three-arcade-viewport" data-renderer-mode="initializing" data-world="${esc(metrics.world.id)}">
      ${renderMinigameSvgFallbackHtml(hud)}
    </div>
    <div class="arcade-hud-bottom">
      <p class="arcade-caption">${esc(metrics.world.mechanicHint)} <small>(Clic directo en nodos 3D · Arrastra para orbitar · Teclas <kbd>1</kbd>–<kbd>4</kbd>)</small></p>
      <div class="arcade-controls">
        <button type="button" class="btn secondary small" id="three-cam-preset" aria-label="Cambiar encuadre de cámara 3D">⬡ Vista: Isométrica</button>
        <button type="button" class="btn secondary small" id="three-cam-orbit" aria-label="Rotar ángulo de cámara 3D">⟲ Rotar cámara</button>
        <button type="button" class="btn secondary small" id="three-toggle-anim" aria-pressed="${hud.reducedMotion ? 'true' : 'false'}">${hud.reducedMotion ? '▶ Activar giro 3D' : '⏸ Pausar giro 3D'}</button>
      </div>
    </div>
  </section>`;
}

/* Minimal strict structural typing over lazy-loaded Three.js 0.187.0 ESM */
interface ThreeObject3D {
  position: { set(x: number, y: number, z: number): void; x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { setScalar(s: number): void };
  userData: Record<string, unknown>;
  add(...items: ThreeObject3D[]): void;
}
interface ThreeVector2 {
  x: number;
  y: number;
  set(x: number, y: number): void;
}
interface ThreeRaycaster {
  setFromCamera(coords: ThreeVector2, camera: ThreeObject3D): void;
  intersectObjects(
    objects: readonly ThreeObject3D[],
    recursive?: boolean,
  ): Array<{ object: ThreeObject3D }>;
}
interface ThreeDisposable {
  dispose(): void;
}
interface ThreeRenderer {
  domElement: HTMLCanvasElement;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: ThreeObject3D, camera: ThreeObject3D): void;
  dispose(): void;
  getContext(): WebGLRenderingContext | WebGL2RenderingContext;
}
interface ThreePerspectiveCamera extends ThreeObject3D {
  aspect: number;
  lookAt(x: number, y: number, z: number): void;
  updateProjectionMatrix(): void;
}
interface ThreeNamespace {
  Scene: new () => ThreeObject3D & { background: unknown };
  Color: new (hex: number) => unknown;
  PerspectiveCamera: new (
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ) => ThreePerspectiveCamera;
  WebGLRenderer: new (params: { antialias?: boolean; alpha?: boolean; powerPreference?: string }) => ThreeRenderer;
  Group: new () => ThreeObject3D;
  BoxGeometry: new (w: number, h: number, d: number) => ThreeDisposable;
  CylinderGeometry: new (rt: number, rb: number, h: number, seg: number) => ThreeDisposable;
  OctahedronGeometry: new (r: number, detail?: number) => ThreeDisposable;
  TorusGeometry: new (r: number, tube: number, radSeg: number, tubSeg: number) => ThreeDisposable;
  SphereGeometry: new (r: number, wSeg: number, hSeg: number) => ThreeDisposable;
  EdgesGeometry: new (geom: ThreeDisposable) => ThreeDisposable;
  MeshStandardMaterial: new (params: {
    color: number;
    emissive?: number;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    opacity?: number;
  }) => ThreeDisposable;
  LineBasicMaterial: new (params: { color: number }) => ThreeDisposable;
  Mesh: new (geom: ThreeDisposable, mat: ThreeDisposable) => ThreeObject3D;
  LineSegments: new (geom: ThreeDisposable, mat: ThreeDisposable) => ThreeObject3D;
  AmbientLight: new (color: number, intensity: number) => ThreeObject3D;
  DirectionalLight: new (color: number, intensity: number) => ThreeObject3D;
  PointLight: new (color: number, intensity: number, distance: number) => ThreeObject3D;
  GridHelper: new (size: number, divisions: number, c1: number, c2: number) => ThreeObject3D & ThreeDisposable;
  Vector2: new (x?: number, y?: number) => ThreeVector2;
  Raycaster: new () => ThreeRaycaster;
}

let activeCleanup: (() => void) | null = null;
let cachedThreePromise: Promise<ThreeNamespace> | null = null;

export function disposeActiveThreeStage(): void {
  if (activeCleanup) {
    const fn = activeCleanup;
    activeCleanup = null;
    fn();
  }
}

function loadThreeLazy(): Promise<ThreeNamespace> {
  if (!cachedThreePromise) {
    const module_url = new URL('../../vendor/three/three.module.js', import.meta.url).href;
    cachedThreePromise = import(module_url) as Promise<ThreeNamespace>;
  }
  return cachedThreePromise;
}

export async function mountThreeArcadeStage(hud: MinigameHudState): Promise<void> {
  disposeActiveThreeStage();

  const host = document.querySelector('#three-arcade-host') as HTMLElement | null;
  if (!host) return;

  const prefers_reduced =
    hud.reducedMotion ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let is_disposed = false;
  let raf_id = 0;
  let paused = prefers_reduced;
  let orbit_angle = 0.55 + hud.step * 0.35;
  let camera_pitch = 4.1;

  const disposables: ThreeDisposable[] = [];
  let renderer: ThreeRenderer | null = null;
  let resize_observer: ResizeObserver | null = null;

  activeCleanup = () => {
    is_disposed = true;
    if (raf_id) cancelAnimationFrame(raf_id);
    resize_observer?.disconnect();
    for (const item of disposables) {
      try {
        item.dispose();
      } catch {
        /* ignore */
      }
    }
    if (renderer) {
      try {
        renderer.dispose();
        const gl = renderer.getContext();
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        /* ignore */
      }
      renderer = null;
    }
  };

  try {
    const THREE = await loadThreeLazy();
    if (is_disposed || !document.body.contains(host)) return;

    const width = Math.max(280, host.clientWidth || 640);
    const height = Math.max(190, host.clientHeight || 220);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // Important: pass updateStyle=false so Three.js never injects inline CSS attributes (strict CSP style-src 'self')
    renderer.setSize(width, height, false);
    renderer.domElement.className = 'three-arcade-canvas';
    renderer.domElement.setAttribute(
      'aria-label',
      `Escena 3D interactiva: ${resolveMinigameWorld(hud.gameId).sceneTitle}`,
    );

    const world_meta = resolveMinigameWorld(hud.gameId);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x061322);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const syncCamera = (): void => {
      const radius = 8.4;
      camera.position.set(
        Math.cos(orbit_angle) * radius,
        camera_pitch,
        Math.sin(orbit_angle) * radius,
      );
      camera.lookAt(0, 0.4, 0);
    };
    syncCamera();

    const ambient = new THREE.AmbientLight(0x9bdcff, 1.15);
    const key_light = new THREE.DirectionalLight(0xffffff, 1.7);
    key_light.position.set(6, 10, 7);
    const pulse_color =
      hud.lastOutcome === 'hit'
        ? 0x53e2ba
        : hud.lastOutcome === 'miss'
          ? 0xffb74d
          : world_meta.primaryHex;
    const point_light = new THREE.PointLight(pulse_color, 2.4, 18);
    point_light.position.set(0, 3.2, 2.2);
    scene.add(ambient, key_light, point_light);

    const grid = new THREE.GridHelper(12, 12, 0x1a567a, 0x0f2d46);
    grid.position.set(0, -1.6, 0);
    disposables.push(grid);
    scene.add(grid);

    const root_group = new THREE.Group();
    const animated_nodes: ThreeObject3D[] = [];
    const pickable_nodes: ThreeObject3D[] = [];
    scene.add(root_group);

    const track = <T extends ThreeDisposable>(res: T): T => {
      disposables.push(res);
      return res;
    };

    // 4 interactive 3D Option Beacons [A, B, C, D] selectable via WebGL Raycaster click or hover
    world_meta.nodeLabels.forEach((node_label, opt_idx) => {
      const beacon_geom = track(new THREE.OctahedronGeometry(0.32, 0));
      const beacon_mat = track(
        new THREE.MeshStandardMaterial({
          color: opt_idx === hud.step % 4 ? 0x53e2ba : 0x16e1ee,
          emissive: 0x0b4b63,
          emissiveIntensity: 0.65,
          metalness: 0.55,
          roughness: 0.22,
        }),
      );
      const beacon = new THREE.Mesh(beacon_geom, beacon_mat);
      beacon.position.set(-3.15 + opt_idx * 2.1, -1.12, 3.15);
      beacon.userData = { optionIndex: opt_idx, label: node_label };
      scene.add(beacon);
      pickable_nodes.push(beacon);
    });

    if (world_meta.id === 'tetris') {
      // 4 concentric architectural slabs + active falling voxel block
      for (let i = 0; i < 4; i++) {
        const w = 3.6 - i * 0.42;
        const geom = track(new THREE.BoxGeometry(w, 0.46, w));
        const is_solved_layer = i < hud.correctCount;
        const mat = track(
          new THREE.MeshStandardMaterial({
            color: is_solved_layer ? 0x12786a : 0x0e3352,
            emissive: i === 2 ? 0x0d5c75 : 0x061b2e,
            emissiveIntensity: 0.55,
            roughness: 0.32,
            metalness: 0.45,
          }),
        );
        const slab = new THREE.Mesh(geom, mat);
        slab.position.set(0, -1.1 + i * 0.68, 0);
        const edges = track(new THREE.EdgesGeometry(geom));
        const line = new THREE.LineSegments(
          edges,
          track(new THREE.LineBasicMaterial({ color: is_solved_layer ? 0x53e2ba : 0x16e1ee })),
        );
        slab.add(line);
        root_group.add(slab);
      }
      const active_geom = track(new THREE.BoxGeometry(0.95, 0.95, 0.95));
      const active_mat = track(
        new THREE.MeshStandardMaterial({
          color: pulse_color,
          emissive: pulse_color,
          emissiveIntensity: 0.45,
          roughness: 0.2,
          metalness: 0.6,
        }),
      );
      const voxel = new THREE.Mesh(active_geom, active_mat);
      voxel.position.set(0, 2.25, 0);
      root_group.add(voxel);
      animated_nodes.push(voxel);
    } else if (world_meta.id === 'acoplamiento') {
      // Central pure domain core + 4 orbital adapters
      const core_geom = track(new THREE.OctahedronGeometry(1.05, 0));
      const core_mat = track(
        new THREE.MeshStandardMaterial({
          color: 0x16e1ee,
          emissive: 0x0a4f68,
          emissiveIntensity: 0.6,
          roughness: 0.25,
          metalness: 0.65,
        }),
      );
      const core = new THREE.Mesh(core_geom, core_mat);
      core.position.set(0, 0.4, 0);
      root_group.add(core);
      animated_nodes.push(core);

      const ring_geom = track(new THREE.TorusGeometry(2.6, 0.05, 12, 48));
      const ring_mat = track(
        new THREE.MeshStandardMaterial({
          color: hud.lastOutcome === 'miss' ? 0xffb74d : 0x38bdf8,
          emissive: 0x103c58,
          emissiveIntensity: 0.5,
        }),
      );
      const ring = new THREE.Mesh(ring_geom, ring_mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.4, 0);
      root_group.add(ring);

      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + hud.step * 0.2;
        const sat_geom = track(new THREE.SphereGeometry(0.42, 18, 18));
        const decoupled = i < hud.correctCount;
        const sat_mat = track(
          new THREE.MeshStandardMaterial({
            color: decoupled ? 0x53e2ba : 0xa481ff,
            emissive: decoupled ? 0x0f5132 : 0x301b5e,
            emissiveIntensity: 0.5,
          }),
        );
        const sat = new THREE.Mesh(sat_geom, sat_mat);
        sat.position.set(Math.cos(ang) * 2.6, 0.4, Math.sin(ang) * 2.6);
        root_group.add(sat);
        animated_nodes.push(sat);
      }
    } else if (world_meta.id === 'patrones') {
      // Precision GoF blueprint forge: outer torus + interchangeable strategy prisms
      const outer_geom = track(new THREE.TorusGeometry(2.0, 0.12, 16, 48));
      const outer_mat = track(
        new THREE.MeshStandardMaterial({
          color: 0x16e1ee,
          emissive: 0x0c4a60,
          emissiveIntensity: 0.45,
          metalness: 0.7,
          roughness: 0.2,
        }),
      );
      const outer = new THREE.Mesh(outer_geom, outer_mat);
      outer.position.set(0, 0.6, 0);
      root_group.add(outer);
      animated_nodes.push(outer);

      for (let i = 0; i < 3; i++) {
        const prism_geom = track(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 6));
        const prism_mat = track(
          new THREE.MeshStandardMaterial({
            color: i < hud.correctCount ? 0x53e2ba : 0xffd77c,
            emissive: 0x1c2d42,
            emissiveIntensity: 0.35,
            roughness: 0.3,
          }),
        );
        const prism = new THREE.Mesh(prism_geom, prism_mat);
        prism.position.set((i - 1) * 1.45, 0.5, 0);
        root_group.add(prism);
        animated_nodes.push(prism);
      }
    } else if (world_meta.id === 'dominio') {
      // 5 Hexagonal Bounded Context islands + event courier sphere
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const hex_geom = track(new THREE.CylinderGeometry(0.95, 1.05, 0.5, 6));
        const aligned = i < hud.correctCount;
        const hex_mat = track(
          new THREE.MeshStandardMaterial({
            color: aligned ? 0x157f68 : 0x123d5e,
            emissive: aligned ? 0x0c4f41 : 0x071d30,
            emissiveIntensity: 0.55,
            roughness: 0.35,
          }),
        );
        const island = new THREE.Mesh(hex_geom, hex_mat);
        island.position.set(Math.cos(ang) * 2.55, -0.5 + (i % 2) * 0.25, Math.sin(ang) * 2.55);
        const edge = track(new THREE.EdgesGeometry(hex_geom));
        island.add(
          new THREE.LineSegments(
            edge,
            track(new THREE.LineBasicMaterial({ color: aligned ? 0x53e2ba : 0x16e1ee })),
          ),
        );
        root_group.add(island);
      }
      const pkt_geom = track(new THREE.SphereGeometry(0.32, 16, 16));
      const pkt_mat = track(
        new THREE.MeshStandardMaterial({
          color: pulse_color,
          emissive: pulse_color,
          emissiveIntensity: 0.7,
        }),
      );
      const packet = new THREE.Mesh(pkt_geom, pkt_mat);
      packet.position.set(0, 0.85, 0);
      root_group.add(packet);
      animated_nodes.push(packet);
    } else {
      // incidente: 6x2 SRE 60-step telemetry towers
      for (let i = 0; i < 6; i++) {
        const stabilized = i < hud.correctCount;
        const bar_h = stabilized ? 1.05 : 2.35 - (i % 2) * 0.45;
        const bar_geom = track(new THREE.BoxGeometry(0.68, bar_h, 0.68));
        const bar_mat = track(
          new THREE.MeshStandardMaterial({
            color: stabilized ? 0x53e2ba : i === hud.step ? 0xffb74d : 0x228ffc,
            emissive: stabilized ? 0x0a4a3a : 0x2a1f10,
            emissiveIntensity: 0.5,
            roughness: 0.28,
          }),
        );
        const tower = new THREE.Mesh(bar_geom, bar_mat);
        tower.position.set(-2.5 + i * 1.0, -1.5 + bar_h / 2, 0);
        root_group.add(tower);
        if (!stabilized) animated_nodes.push(tower);
      }
    }

    let outcome_ring: ThreeObject3D | null = null;
    if (hud.lastOutcome === 'hit' || hud.lastOutcome === 'miss') {
      const fx_geom = track(new THREE.TorusGeometry(1.45, 0.045, 12, 48));
      const fx_mat = track(
        new THREE.MeshStandardMaterial({
          color: pulse_color,
          emissive: pulse_color,
          emissiveIntensity: 0.85,
          roughness: 0.2,
        }),
      );
      outcome_ring = new THREE.Mesh(fx_geom, fx_mat);
      outcome_ring.rotation.x = Math.PI / 2;
      outcome_ring.position.set(0, -1.48, 0);
      scene.add(outcome_ring);
    }

    host.innerHTML = '';
    host.appendChild(renderer.domElement);
    host.dataset.rendererMode = 'webgl-threejs';
    host.dataset.orbitCount = '0';
    host.dataset.pickedCount = '0';

    const raycaster = new THREE.Raycaster();
    const pointer_ndc = new THREE.Vector2();
    const readout_el = document.querySelector('#three-hover-readout');

    let is_dragging = false;
    let down_ptr_x = 0;
    let down_ptr_y = 0;
    let last_ptr_x = 0;
    let last_ptr_y = 0;
    let drag_travel_px = 0;
    let orbit_count = 0;
    let picked_count = 0;
    const canvas_el = renderer.domElement;

    const raycastAtClientPoint = (client_x: number, client_y: number): ThreeObject3D | null => {
      const rect = canvas_el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointer_ndc.set(
        ((client_x - rect.left) / rect.width) * 2 - 1,
        -(((client_y - rect.top) / rect.height) * 2 - 1),
      );
      raycaster.setFromCamera(pointer_ndc, camera);
      const hits = raycaster.intersectObjects(pickable_nodes, false);
      return hits.length > 0 ? hits[0].object : null;
    };

    canvas_el.addEventListener('pointerdown', (ev: PointerEvent) => {
      is_dragging = true;
      down_ptr_x = ev.clientX;
      down_ptr_y = ev.clientY;
      last_ptr_x = ev.clientX;
      last_ptr_y = ev.clientY;
      drag_travel_px = 0;
      try {
        canvas_el.setPointerCapture(ev.pointerId);
      } catch {
        /* synthetic event without active pointerId */
      }
    });

    canvas_el.addEventListener('pointermove', (ev: PointerEvent) => {
      if (is_disposed || !renderer) return;
      if (!is_dragging) {
        const hovered = raycastAtClientPoint(ev.clientX, ev.clientY);
        for (const b of pickable_nodes) {
          b.scale.setScalar(b === hovered ? 1.26 : 1);
        }
        if (hovered && readout_el) {
          const idx = Number(hovered.userData.optionIndex ?? 0);
          const letter = String.fromCharCode(65 + idx);
          readout_el.textContent = `🎯 Nodo 3D [${letter}] · ${String(hovered.userData.label ?? '')} (clic para elegir)`;
        }
        renderer.render(scene, camera);
        return;
      }
      const dx = ev.clientX - last_ptr_x;
      const dy = ev.clientY - last_ptr_y;
      drag_travel_px += Math.hypot(dx, dy);
      last_ptr_x = ev.clientX;
      last_ptr_y = ev.clientY;
      orbit_angle += dx * 0.012;
      camera_pitch = Math.max(1.5, Math.min(6.4, camera_pitch + dy * 0.015));
      orbit_count += 1;
      host.dataset.orbitCount = String(orbit_count);
      syncCamera();
      renderer.render(scene, camera);
    });

    canvas_el.addEventListener('pointerup', (ev: PointerEvent) => {
      const was_tap =
        is_dragging &&
        drag_travel_px < 6 &&
        Math.hypot(ev.clientX - down_ptr_x, ev.clientY - down_ptr_y) < 6;
      is_dragging = false;
      if (!was_tap || is_disposed) return;
      const hit = raycastAtClientPoint(ev.clientX, ev.clientY);
      if (hit) {
        const opt_idx = Number(hit.userData.optionIndex ?? -1);
        picked_count += 1;
        host.dataset.pickedCount = String(picked_count);
        const choice_btn = document.querySelector<HTMLButtonElement>(
          `[data-mini-answer="${opt_idx}"]:not([disabled])`,
        );
        choice_btn?.click();
      }
    });

    canvas_el.addEventListener('pointercancel', () => {
      is_dragging = false;
    });

    const renderFrame = (time_ms: number): void => {
      if (is_disposed || !renderer) return;
      const t = time_ms * 0.0012;
      if (!paused) {
        root_group.rotation.y = Math.sin(t * 0.55) * 0.28;
        animated_nodes.forEach((node, idx) => {
          node.rotation.y = t + idx * 0.4;
          node.rotation.x = Math.sin(t + idx) * 0.22;
        });
        if (outcome_ring) {
          outcome_ring.scale.setScalar(1 + ((time_ms * 0.0014) % 1) * 1.65);
        }
      }
      renderer.render(scene, camera);
      if (!paused) {
        raf_id = requestAnimationFrame(renderFrame);
      }
    };

    if (typeof ResizeObserver !== 'undefined') {
      resize_observer = new ResizeObserver(() => {
        if (is_disposed || !renderer || !host) return;
        const next_w = Math.max(280, host.clientWidth || 640);
        const next_h = Math.max(190, host.clientHeight || 220);
        camera.aspect = next_w / next_h;
        camera.updateProjectionMatrix();
        renderer.setSize(next_w, next_h, false);
        renderer.render(scene, camera);
      });
      resize_observer.observe(host);
    }

    const preset_btn = document.querySelector('#three-cam-preset') as HTMLButtonElement | null;
    if (preset_btn) {
      const presets: ReadonlyArray<readonly [string, number, number]> = [
        ['Isométrica', 0.65, 4.1],
        ['Cenital', Math.PI / 2, 6.2],
        ['Frontal', Math.PI / 2, 2.0],
      ];
      let preset_idx = 0;
      preset_btn.onclick = () => {
        preset_idx = (preset_idx + 1) % presets.length;
        const [name, ang, pitch] = presets[preset_idx];
        orbit_angle = ang;
        camera_pitch = pitch;
        preset_btn.textContent = `⬡ Vista: ${name}`;
        syncCamera();
        renderer?.render(scene, camera);
      };
    }

    const orbit_btn = document.querySelector('#three-cam-orbit') as HTMLButtonElement | null;
    if (orbit_btn) {
      orbit_btn.onclick = () => {
        orbit_angle += Math.PI / 4;
        syncCamera();
        renderer?.render(scene, camera);
      };
    }

    const anim_btn = document.querySelector('#three-toggle-anim') as HTMLButtonElement | null;
    if (anim_btn) {
      anim_btn.onclick = () => {
        paused = !paused;
        anim_btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        anim_btn.textContent = paused ? '▶ Activar giro 3D' : '⏸ Pausar giro 3D';
        if (!paused) {
          raf_id = requestAnimationFrame(renderFrame);
        } else if (raf_id) {
          cancelAnimationFrame(raf_id);
          raf_id = 0;
        }
      };
    }

    // Always paint first frame deterministically; animate if reduced-motion is off
    renderer.render(scene, camera);
    if (!paused) {
      raf_id = requestAnimationFrame(renderFrame);
    }
  } catch {
    if (!is_disposed && host) {
      host.dataset.rendererMode = 'svg-fallback';
      host.innerHTML = renderMinigameSvgFallbackHtml(hud);
    }
  }
}

export type MinigameCatalogCardItem = {
  readonly id: string;
  readonly icon: string;
  readonly tag: string;
  readonly title: string;
  readonly subtitle: string;
  readonly bestScore: number;
  readonly starsCount: number;
};

/**
 * Renders the `#/minijuegos` catalog with a minimalist 5-world spatial constellation SVG,
 * WebGL Raycaster + Orbit telemetry strip, and per-world progress cards.
 */
export function renderMinigamesCatalogHtml(
  items: readonly MinigameCatalogCardItem[],
  totalBestDecisions: number,
): string {
  const pct = Math.round((totalBestDecisions / 30) * 100);
  const world_nodes = items.slice(0, 5).map((item, idx) => {
    const x = 86 + idx * 127;
    const done_world = item.bestScore >= 5;
    return `<g>
      <circle cx="${x}" cy="40" r="23" fill="${done_world ? '#0d3648' : '#091f36'}" stroke="${done_world ? '#53e2ba' : '#18e1ee'}" stroke-width="1.8"/>
      <text x="${x}" y="37" text-anchor="middle" fill="#f3fbff" font-size="10.5" font-weight="bold" font-family="monospace">0${idx + 1}</text>
      <text x="${x}" y="51" text-anchor="middle" fill="#8fd8f2" font-size="9.5" font-family="monospace">${item.bestScore}/6</text>
      <text x="${x}" y="82" text-anchor="middle" fill="#d8f3ff" font-size="9.5" font-weight="bold" font-family="sans-serif">${esc(item.title)}</text>
    </g>`;
  });

  return `<div class="page-title">
    <span class="eyebrow">✦ ENTRENAMIENTO ESPACIAL 3D · THREE.JS 0.187</span>
    <h1>Minijuegos de arquitectura</h1>
    <p>Cinco mundos interactivos en 3D con selección espacial WebGL Raycaster, órbita de cámara 360°, atajos de teclado (1–4) y explicación inmediata.</p>
  </div>

  <section class="live-blueprint-shell mb-20" aria-label="Telemetría espacial de los 5 mundos 3D">
    <div class="live-blueprint-topbar">
      <div class="live-status-group">
        <span class="live-status-pill"><i class="live-dot" aria-hidden="true"></i> MOTOR WEBGL + FALLBACK SVG ACCESIBLE</span>
        <span class="map-badge">${totalBestDecisions}/30 decisiones óptimas · Independiente del XP Senior</span>
      </div>
    </div>
    <div class="live-blueprint-body">
      <div class="tabular-metrics-grid">
        <div class="tabular-metric-cell"><span>INTERACCIÓN 3D</span><b>Raycaster [A–D] + Órbita 360°</b></div>
        <div class="tabular-metric-cell"><span>ACCESIBILIDAD</span><b>Teclas 1–4 + Reduced Motion</b></div>
        <div class="tabular-metric-cell"><span>PRESETS CÁMARA</span><b>Isométrica · Cenital · Frontal</b></div>
        <div class="tabular-metric-cell"><span>PROGRESO LOCAL</span><b>${pct}% (${totalBestDecisions}/30 aciertos)</b></div>
      </div>
      <svg class="senior-pipeline-svg" viewBox="0 0 680 102" role="img" aria-label="Constelación de los cinco mundos 3D de arquitectura">
        <rect width="680" height="102" rx="12" fill="#061426"/>
        <line x1="109" y1="40" x2="571" y2="40" class="arch-flow-edge" stroke="#16e1ee" stroke-width="2"/>
        ${world_nodes.join('')}
      </svg>
      <progress class="progress arq-progress" max="100" value="${pct}" aria-label="Estrellas de minijuegos ${pct}%"></progress>
    </div>
  </section>

  <div class="lab-grid minigames-grid">
    ${items
      .map((game) => {
        const world = resolveMinigameWorld(game.id);
        const stars = '★'.repeat(game.starsCount) + '☆'.repeat(Math.max(0, 3 - game.starsCount));
        return `<a class="lab-item" href="#/minijuego/${esc(game.id)}">
          <div class="map-node-top">
            <div class="lab-icon mb-0">${esc(game.icon)}</div>
            <span class="map-badge">3D · Three.js</span>
          </div>
          <span class="mini-tag mt-10">${esc(game.tag)}</span>
          <h3>${esc(game.title)}</h3>
          <p>${esc(game.subtitle)}</p>
          <small class="muted">⬡ ${esc(world.sceneTitle)}</small>
          <span class="tile-link mt-10">${stars} · Mejor ${game.bestScore}/6 ↗</span>
        </a>`;
      })
      .join('')}
  </div>`;
}
