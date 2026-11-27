import * as THREE from 'three';

export type BotanicalSpecies =
  | 'ipe_blossom'
  | 'broad_oak'
  | 'sakura_weeping'
  | 'tropical_palm'
  | 'alpine_pine';

export type TreeSpeciesKey = BotanicalSpecies | 'withered';

export interface PermanentTreeItem {
  id: string;
  colorHex: string;
  isWithered: boolean;
  area: string;
  subjectName: string | null;
  sessionDate: string;
  durationSeconds: number | null;
  modeLabel: string;
  species: BotanicalSpecies;
  scale: number;
  rotationY: number;
  x: number;
  z: number;
}

export type HoveredTarget =
  | {
      kind: 'slot';
      slotIndex: 0 | 1 | 2;
      area: string;
      subjectName: string | null;
      stageNumber: 1 | 2 | 3 | 4;
      stageLabel: string;
      liveSeconds: number;
      remainingToNextSec: number;
      hasBees: boolean;
      isActive: boolean;
      colorHex: string;
      worldPos: { x: number; y: number; z: number };
    }
  | {
      kind: 'tree';
      tree: PermanentTreeItem;
      worldPos: { x: number; y: number; z: number };
    };

export interface SharedCanopyUniforms {
  uTime: { value: number };
  uMouse3D: { value: THREE.Vector3 };
  uMouseVelocity: { value: THREE.Vector3 };
  uMouseActive: { value: number };
  uMotionScale: { value: number };
  uIsDark: { value: number };
  uSunDir: { value: THREE.Vector3 };
}

export interface SpeciesGeometrySet {
  barkGeo: THREE.BufferGeometry;
  foliageGeo: THREE.BufferGeometry | null;
  accentGeo: THREE.BufferGeometry | null;
  saplingBarkGeo: THREE.BufferGeometry | null;
  saplingFoliageGeo: THREE.BufferGeometry | null;
  saplingAccentGeo: THREE.BufferGeometry | null;
  proxyGeo: THREE.BufferGeometry;
}

export type SpeciesGeometryLibrary = Record<TreeSpeciesKey, SpeciesGeometrySet>;

export interface ForestBenchSpeciesMetrics {
  instances: number;
  barkTris: number;
  foliageTris: number;
  accentTris: number;
}

export interface ForestBenchResult {
  timestamp: string;
  benchTrees: number;
  witheredTrees: number;
  pixelRatio: number;
  viewport: { width: number; height: number };
  isWebGL2: boolean;
  msaaSamples: number;
  shadowMapSize: number;
  zenMode: boolean;
  initMs: number;
  syncTreesMs: number;
  syncNurseryMs: number;
  raycastMsAvg: number;
  raycastMsP95: number;
  mainDrawCalls: number;
  mainTriangles: number;
  shadowDrawCalls: number;
  shadowTriangles: number;
  totalDrawCalls: number;
  totalTriangles: number;
  memory: {
    geometries: number;
    textures: number;
    programs: number;
  };
  framesSampled: number;
  fpsAvg: number;
  fps1PctLow: number;
  rafDeltaAvg: number;
  rafDeltaP95: number;
  speciesBreakdown: Record<string, ForestBenchSpeciesMetrics>;
}

export interface ForestBenchHandle {
  ready: boolean;
  latest: ForestBenchResult | null;
  runBenchmark: (frames?: number) => Promise<ForestBenchResult>;
  setBenchTrees: (count: number) => void;
  setZenMode: (zen: boolean) => void;
  setCameraCloseUp: (targetTreeIndex?: number) => void;
  resetCamera: () => void;
}

declare global {
  interface Window {
    __ADAPTIVEMED_FOREST_BENCH__?: ForestBenchHandle;
  }
}
