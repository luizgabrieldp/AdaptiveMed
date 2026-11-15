import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NurserySlotState } from '@/types/database';
import { getNurserySlotProgress } from '@/lib/focus-timer';
import { BotanicalSpecies } from './types';

export const CANONICAL_ISLAND_RADIUS = 6.8;
export const POND_POS = new THREE.Vector2(
  CANONICAL_ISLAND_RADIUS * 0.44,
  -CANONICAL_ISLAND_RADIUS * 0.24
);

export function getSpeciesForArea(area: string, seedNum: number): BotanicalSpecies {
  const lower = area.toLowerCase();
  if (lower.includes('clínica') || lower.includes('clinica')) return 'ipe_blossom';
  if (lower.includes('cirurgia')) return 'broad_oak';
  if (lower.includes('pediatria')) return 'sakura_weeping';
  if (lower.includes('gineco') || lower.includes('obstetr')) return 'tropical_palm';
  if (lower.includes('preventiva') || lower.includes('saúde coletiva')) return 'alpine_pine';

  const pool: BotanicalSpecies[] = [
    'ipe_blossom',
    'broad_oak',
    'sakura_weeping',
    'tropical_palm',
    'alpine_pine',
  ];
  return pool[Math.abs(seedNum) % pool.length];
}

export function terrainHeightAt(
  x: number,
  z: number,
  islandRadius = CANONICAL_ISLAND_RADIUS
): number {
  const dist = Math.hypot(x, z);
  const edgeFade = Math.max(0, 1 - Math.pow(dist / islandRadius, 2.2));
  return (
    (Math.sin(x * 0.65) * Math.cos(z * 0.55) * 0.16 +
      Math.sin((x + z) * 0.42) * 0.08) *
    edgeFade
  );
}

export function hashSeed(input: string | number): number {
  const str = String(input);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function nextRand(state: { value: number }): number {
  let t = (state.value += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function computeNurseryPositions(
  slots: [NurserySlotState, NurserySlotState, NurserySlotState],
  islandRadius = CANONICAL_ISLAND_RADIUS,
  pondPos = POND_POS
): Array<{ x: number; z: number }> {
  const occupied: Array<{ x: number; z: number }> = [];
  return slots.map((slot, idx) => {
    const rng = { value: hashSeed(`nursery-${idx}-${slot.plotSeed ?? idx * 317 + 137}`) };
    const minR = 0.65;
    const maxR = Math.max(1.8, islandRadius * 0.56);
    let best = { x: (idx - 1) * 1.45, z: 1.1 };

    for (let attempt = 0; attempt < 36; attempt++) {
      const r = minR + Math.sqrt(nextRand(rng)) * (maxR - minR);
      // Privilegia levemente o arco frontal para visibilidade dos 3 canteiros
      const theta = 0.2 + nextRand(rng) * (Math.PI * 1.65);
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      best = { x, z };

      const nearPond = Math.hypot(x - pondPos.x, z - pondPos.y) < islandRadius * 0.3;
      const nearBed = occupied.some(p => Math.hypot(x - p.x, z - p.z) < 1.65);
      if (!nearPond && !nearBed) {
        occupied.push(best);
        return best;
      }
    }
    occupied.push(best);
    return best;
  });
}

/**
 * Posição determinística pura baseada apenas no ID da árvore e obstáculos fixos (lago + 3 canteiros),
 * garantindo zero reshuffle ao alternar filtros (Hoje/Semana/Mês/Tudo) ou plantar novas árvores.
 */
export function computeDeterministicTreePlacement(
  treeId: string,
  nurseryPositions: Array<{ x: number; z: number }>,
  islandRadius = CANONICAL_ISLAND_RADIUS,
  pondPos = POND_POS
): { x: number; z: number; rotationY: number; scaleJitter: number } {
  const h = hashSeed(treeId);
  const rng = { value: h };
  const minR = 0.85;
  const maxR = islandRadius - 0.72;

  let chosen = { x: 0, z: 0 };
  let placedSafely = false;
  for (let attempt = 0; attempt < 32; attempt++) {
    const r = minR + Math.sqrt(nextRand(rng)) * (maxR - minR);
    const theta = nextRand(rng) * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    chosen = { x, z };

    const nearPond = Math.hypot(x - pondPos.x, z - pondPos.y) < islandRadius * 0.28;
    const nearNursery = nurseryPositions.some(p => Math.hypot(x - p.x, z - p.z) < 1.18);
    if (!nearPond && !nearNursery) {
      placedSafely = true;
      break;
    }
  }

  // Fallback determinístico em anel externo caso todas as tentativas colidam com lago/canteiros
  if (!placedSafely) {
    for (let step = 0; step < 24; step++) {
      const ang = (((h & 0x3ff) / 1024) + step / 24) * Math.PI * 2;
      const r = maxR - 0.35;
      const fx = Math.cos(ang) * r;
      const fz = Math.sin(ang) * r;
      const nearPond = Math.hypot(fx - pondPos.x, fz - pondPos.y) < islandRadius * 0.28;
      const nearNursery = nurseryPositions.some(p => Math.hypot(fx - p.x, fz - p.z) < 1.18);
      if (!nearPond && !nearNursery) {
        chosen = { x: fx, z: fz };
        break;
      }
    }
  }

  return {
    x: chosen.x,
    z: chosen.z,
    rotationY: ((h & 0xffff) / 0xffff) * Math.PI * 2,
    scaleJitter: 0.86 + (((h >>> 16) & 0xff) / 255) * 0.28,
  };
}

export function createOrganicCanopyBlobGeo(seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const wave =
      1 +
      0.13 * Math.sin(x * 3.4 + seed) * Math.cos(z * 3.1 - seed) +
      0.09 * Math.sin(y * 4.2 + seed * 1.7);
    pos.setXYZ(i, x * wave * 1.06, y * wave * 0.84, z * wave * 1.04);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createLeafBladeGeo(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.16, 0.14, 0.09, 0.36);
  shape.quadraticCurveTo(0.02, 0.48, 0, 0.54);
  shape.quadraticCurveTo(-0.02, 0.48, -0.09, 0.36);
  shape.quadraticCurveTo(-0.16, 0.14, 0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.006,
  });

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setZ(i, z - y * y * 0.45);
  }
  geo.computeVertexNormals();
  const colors = new Float32Array(pos.count * 3);
  colors.fill(1.0);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function createTaperedCurveTubeGeo(
  points: THREE.Vector3[],
  rStart: number,
  rEnd: number,
  tubularSegments = 10,
  radialSegments = 7
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, tubularSegments, 1, radialSegments, false);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const center = new THREE.Vector3();
  const vertex = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, uv.getX(i)));
    curve.getPointAt(t, center);
    vertex.fromBufferAttribute(pos, i);
    const rootFlare = t < 0.18 ? (1 - t / 0.18) * 0.42 : 0;
    const radius = THREE.MathUtils.lerp(rStart, rEnd, t) * (1 + rootFlare);
    vertex.sub(center).multiplyScalar(radius).add(center);
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function prepareGeoPart(
  sourceGeo: THREE.BufferGeometry,
  matrix: THREE.Matrix4,
  vertexTint?: [number, number, number]
): THREE.BufferGeometry {
  const g = sourceGeo.index ? sourceGeo.toNonIndexed() : sourceGeo.clone();
  g.applyMatrix4(matrix);
  if (!g.attributes.normal) {
    g.computeVertexNormals();
  }
  const count = g.attributes.position.count;
  if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  if (vertexTint) {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = vertexTint[0];
      colors[i * 3 + 1] = vertexTint[1];
      colors[i * 3 + 2] = vertexTint[2];
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  } else if (g.attributes.color) {
    g.deleteAttribute('color');
  }
  return g;
}

export interface SpeciesGeometrySet {
  trunkGeo: THREE.BufferGeometry;
  canopyGeo: THREE.BufferGeometry | null;
  blossomGeo: THREE.BufferGeometry | null;
}

export type SpeciesGeometryLibrary = Record<BotanicalSpecies | 'withered', SpeciesGeometrySet>;

export function buildSpeciesGeometryLibrary(): SpeciesGeometryLibrary {
  const blobs = [0, 1.3, 2.7, 4.1].map(s => createOrganicCanopyBlobGeo(s));
  const leafBlade = createLeafBladeGeo();
  const podGeo = new THREE.SphereGeometry(0.11, 10, 8);
  const mat4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  const compose = (
    p: [number, number, number],
    r: [number, number, number],
    s: [number, number, number],
    order: THREE.EulerOrder = 'XYZ'
  ) => {
    pos.set(p[0], p[1], p[2]);
    euler.set(r[0], r[1], r[2], order);
    quat.setFromEuler(euler);
    scl.set(s[0], s[1], s[2]);
    return mat4.compose(pos, quat, scl).clone();
  };

  const mergeOrSingle = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null => {
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    const merged = mergeGeometries(parts, false);
    parts.forEach(p => p.dispose());
    return merged;
  };

  // Helper para Ipê / Carvalho / Cerejeira
  const buildBroadTree = (species: 'ipe_blossom' | 'broad_oak' | 'sakura_weeping'): SpeciesGeometrySet => {
    const trunkParts: THREE.BufferGeometry[] = [];
    const canopyParts: THREE.BufferGeometry[] = [];
    const blossomParts: THREE.BufferGeometry[] = [];

    const bendX = species === 'sakura_weeping' ? 0.06 : species === 'ipe_blossom' ? -0.04 : 0.02;
    const rawTrunk = createTaperedCurveTubeGeo(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(bendX, 0.38, 0.02),
        new THREE.Vector3(bendX * 1.4, 0.72, -0.02),
      ],
      0.095,
      0.048,
      10,
      8
    );
    trunkParts.push(prepareGeoPart(rawTrunk, new THREE.Matrix4()));
    rawTrunk.dispose();

    const baseJoin = new THREE.Vector3(bendX * 1.1, 0.62, 0);
    const branchDefs = [
      { end: new THREE.Vector3(0.28 + bendX, 0.92, 0.16), r: 0.33, tint: [0.95, 0.95, 0.95] as [number, number, number] },
      { end: new THREE.Vector3(-0.26 + bendX, 0.88, 0.14), r: 0.31, tint: [0.74, 0.74, 0.74] as [number, number, number] },
      { end: new THREE.Vector3(bendX * 0.8, 0.96, -0.26), r: 0.32, tint: [0.9, 0.9, 0.9] as [number, number, number] },
      { end: new THREE.Vector3(bendX * 1.2, 1.14, 0.02), r: 0.37, tint: [1.12, 1.12, 1.12] as [number, number, number] },
    ];

    const isFlowering = species === 'ipe_blossom' || species === 'sakura_weeping';
    const widthMult = species === 'broad_oak' ? 1.2 : species === 'sakura_weeping' ? 1.08 : 1.0;

    branchDefs.forEach((b, bi) => {
      const mid = baseJoin.clone().lerp(b.end, 0.5);
      mid.y += 0.06;
      const limbRaw = createTaperedCurveTubeGeo([baseJoin, mid, b.end], 0.036, 0.016, 7, 6);
      trunkParts.push(prepareGeoPart(limbRaw, new THREE.Matrix4()));
      limbRaw.dispose();

      canopyParts.push(
        prepareGeoPart(
          blobs[bi % blobs.length],
          compose(
            [b.end.x, b.end.y, b.end.z],
            [0, bi * 0.8, 0],
            [b.r * widthMult, b.r * 0.82, b.r * widthMult]
          ),
          b.tint
        )
      );

      if (isFlowering) {
        blossomParts.push(
          prepareGeoPart(
            blobs[(bi + 1) % blobs.length],
            compose(
              [b.end.x * 1.09, b.end.y + 0.08, b.end.z * 1.09],
              [0.15, bi * 1.1, 0],
              [b.r * 0.52, b.r * 0.44, b.r * 0.52]
            ),
            [1.0, 1.0, 1.0]
          )
        );
      }
    });

    return {
      trunkGeo: mergeOrSingle(trunkParts)!,
      canopyGeo: mergeOrSingle(canopyParts),
      blossomGeo: mergeOrSingle(blossomParts),
    };
  };

  // Tropical Palm
  const buildPalm = (): SpeciesGeometrySet => {
    const trunkParts: THREE.BufferGeometry[] = [];
    const canopyParts: THREE.BufferGeometry[] = [];
    const blossomParts: THREE.BufferGeometry[] = [];

    const lean = 0.11;
    const rawTrunk = createTaperedCurveTubeGeo(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(lean * 0.6, 0.55, 0.04),
        new THREE.Vector3(lean * 1.3, 1.15, -0.02),
      ],
      0.075,
      0.042,
      10,
      8
    );
    trunkParts.push(prepareGeoPart(rawTrunk, new THREE.Matrix4()));
    rawTrunk.dispose();

    const topPos = [lean * 1.3, 1.14, -0.02] as const;
    for (let f = 0; f < 8; f++) {
      const ang = (f / 8) * Math.PI * 2 + 0.25;
      const tilt = f % 2 === 0 ? Math.PI / 2.35 : Math.PI / 2.85;
      const tint: [number, number, number] = f % 2 === 0 ? [0.95, 0.95, 0.95] : [1.1, 1.1, 1.1];
      canopyParts.push(
        prepareGeoPart(
          leafBlade,
          compose([topPos[0], topPos[1], topPos[2]], [tilt, ang, 0], [1.3, 1.5, 1.2], 'YXZ'),
          tint
        )
      );
    }

    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2;
      blossomParts.push(
        prepareGeoPart(
          podGeo,
          compose(
            [topPos[0] + Math.cos(a) * 0.07, topPos[1] - 0.05, topPos[2] + Math.sin(a) * 0.07],
            [0, 0, 0],
            [0.42, 0.42, 0.42]
          ),
          [1.0, 1.0, 1.0]
        )
      );
    }

    return {
      trunkGeo: mergeOrSingle(trunkParts)!,
      canopyGeo: mergeOrSingle(canopyParts),
      blossomGeo: mergeOrSingle(blossomParts),
    };
  };

  // Alpine Pine
  const buildPine = (): SpeciesGeometrySet => {
    const trunkParts: THREE.BufferGeometry[] = [];
    const canopyParts: THREE.BufferGeometry[] = [];

    const rawTrunk = createTaperedCurveTubeGeo(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.02, 0.6, 0),
        new THREE.Vector3(0, 1.28, 0),
      ],
      0.085,
      0.022,
      10,
      8
    );
    trunkParts.push(prepareGeoPart(rawTrunk, new THREE.Matrix4()));
    rawTrunk.dispose();

    const tiers = [
      { y: 0.56, radius: 0.44, puffs: 5, tint: [0.74, 0.74, 0.74] as [number, number, number] },
      { y: 0.88, radius: 0.34, puffs: 4, tint: [0.94, 0.94, 0.94] as [number, number, number] },
      { y: 1.16, radius: 0.23, puffs: 3, tint: [1.12, 1.12, 1.12] as [number, number, number] },
    ];
    tiers.forEach((tier, ti) => {
      for (let p = 0; p < tier.puffs; p++) {
        const ang = (p / tier.puffs) * Math.PI * 2 + ti * 0.65;
        canopyParts.push(
          prepareGeoPart(
            blobs[(p + ti) % blobs.length],
            compose(
              [Math.cos(ang) * tier.radius * 0.46, tier.y, Math.sin(ang) * tier.radius * 0.46],
              [0, ang, 0],
              [tier.radius * 0.78, tier.radius * 0.48, tier.radius * 0.78]
            ),
            tier.tint
          )
        );
      }
      canopyParts.push(
        prepareGeoPart(
          blobs[ti % blobs.length],
          compose([0, tier.y + 0.1, 0], [0, ti, 0], [tier.radius * 0.7, tier.radius * 0.52, tier.radius * 0.7]),
          [0.98, 0.98, 0.98]
        )
      );
    });

    return {
      trunkGeo: mergeOrSingle(trunkParts)!,
      canopyGeo: mergeOrSingle(canopyParts),
      blossomGeo: null,
    };
  };

  // Withered branch
  const buildWithered = (): SpeciesGeometrySet => {
    const trunkParts: THREE.BufferGeometry[] = [];
    const t1 = createTaperedCurveTubeGeo(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.05, 0.35, 0.02),
        new THREE.Vector3(-0.04, 0.72, -0.02),
      ],
      0.085,
      0.032,
      8,
      7
    );
    const t2 = createTaperedCurveTubeGeo(
      [
        new THREE.Vector3(0.02, 0.42, 0),
        new THREE.Vector3(0.18, 0.58, 0.05),
        new THREE.Vector3(0.28, 0.65, 0.08),
      ],
      0.032,
      0.012,
      6,
      6
    );
    trunkParts.push(prepareGeoPart(t1, new THREE.Matrix4()));
    trunkParts.push(prepareGeoPart(t2, new THREE.Matrix4()));
    t1.dispose();
    t2.dispose();

    return {
      trunkGeo: mergeOrSingle(trunkParts)!,
      canopyGeo: null,
      blossomGeo: null,
    };
  };

  const lib: SpeciesGeometryLibrary = {
    ipe_blossom: buildBroadTree('ipe_blossom'),
    broad_oak: buildBroadTree('broad_oak'),
    sakura_weeping: buildBroadTree('sakura_weeping'),
    tropical_palm: buildPalm(),
    alpine_pine: buildPine(),
    withered: buildWithered(),
  };

  blobs.forEach(b => b.dispose());
  leafBlade.dispose();
  podGeo.dispose();

  return lib;
}

export interface NurseryBuilderMaterials {
  barkMat: THREE.Material;
  stemMat: THREE.Material;
  seedMat: THREE.Material;
  getAreaLeafMat: (colorHex: string) => THREE.Material;
  getAreaBlossomMat: (colorHex: string) => THREE.Material;
}

export interface NurserySharedGeometries {
  leafBladeGeo: THREE.BufferGeometry;
  seedPodGeo: THREE.BufferGeometry;
  speciesLib: SpeciesGeometryLibrary;
}

export function buildNurseryPlantGroup(
  colorHex: string,
  species: BotanicalSpecies,
  accumulatedSec: number,
  mats: NurseryBuilderMaterials,
  geos: NurserySharedGeometries,
  trackTempGeo: (g: THREE.BufferGeometry) => THREE.BufferGeometry
): THREE.Group {
  const prog = getNurserySlotProgress(accumulatedSec);
  const group = new THREE.Group();
  const leafMat = mats.getAreaLeafMat(colorHex);
  const blossomMat = mats.getAreaBlossomMat(colorHex);

  if (prog.stageNumber === 1) {
    const seedMesh = new THREE.Mesh(geos.seedPodGeo, mats.seedMat);
    seedMesh.scale.set(1.15, 0.72, 0.85);
    seedMesh.position.y = 0.055;
    seedMesh.castShadow = true;
    group.add(seedMesh);

    const sproutHeight = 0.1 + prog.stageProgressRatio * 0.14;
    const shoot = new THREE.Mesh(
      trackTempGeo(
        createTaperedCurveTubeGeo(
          [
            new THREE.Vector3(0, 0.06, 0),
            new THREE.Vector3(0.03, 0.06 + sproutHeight * 0.6, 0.01),
            new THREE.Vector3(0.01, 0.06 + sproutHeight, 0),
          ],
          0.02,
          0.008,
          7,
          6
        )
      ),
      mats.stemMat
    );
    shoot.castShadow = true;
    group.add(shoot);

    if (prog.stageProgressRatio > 0.25) {
      for (const side of [-1, 1]) {
        const leaf = new THREE.Mesh(geos.leafBladeGeo, leafMat);
        leaf.position.set(0.01, 0.06 + sproutHeight, 0);
        leaf.rotation.z = side * 0.9;
        leaf.rotation.x = 0.45;
        leaf.scale.setScalar(0.32 + prog.stageProgressRatio * 0.15);
        group.add(leaf);
      }
    }
  } else if (prog.stageNumber === 2) {
    const h = 0.34 + prog.stageProgressRatio * 0.16;
    const stem = new THREE.Mesh(
      trackTempGeo(
        createTaperedCurveTubeGeo(
          [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.03, h * 0.5, 0.02),
            new THREE.Vector3(0.02, h, -0.01),
          ],
          0.032,
          0.014,
          9,
          7
        )
      ),
      mats.stemMat
    );
    stem.castShadow = true;
    group.add(stem);

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + 0.4;
      const leaf = new THREE.Mesh(geos.leafBladeGeo, leafMat);
      leaf.position.set(0.01, h * (0.62 + (i % 2) * 0.25), 0);
      leaf.rotation.y = ang;
      leaf.rotation.x = Math.PI / 2.6;
      leaf.scale.setScalar(0.55 + (i % 2) * 0.12);
      leaf.castShadow = true;
      group.add(leaf);
    }

    const apexBud = new THREE.Mesh(geos.seedPodGeo, blossomMat);
    apexBud.scale.setScalar(0.42);
    apexBud.position.set(0.02, h + 0.03, -0.01);
    group.add(apexBud);
  } else {
    // Estágios 3 (0.64..0.76) e 4 (0.88..1.04) usam a geometria compartilhada da espécie!
    const spec = geos.speciesLib[species];
    const scale =
      prog.stageNumber === 3
        ? 0.62 + prog.stageProgressRatio * 0.14
        : 0.88 + prog.stageProgressRatio * 0.16;

    const trunkMesh = new THREE.Mesh(spec.trunkGeo, mats.barkMat);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    group.add(trunkMesh);

    if (spec.canopyGeo) {
      const canopyMesh = new THREE.Mesh(spec.canopyGeo, leafMat);
      canopyMesh.castShadow = true;
      canopyMesh.receiveShadow = true;
      group.add(canopyMesh);
    }
    if (spec.blossomGeo && prog.stageNumber === 4) {
      const blossomMesh = new THREE.Mesh(spec.blossomGeo, blossomMat);
      blossomMesh.castShadow = true;
      group.add(blossomMesh);
    }
    group.scale.setScalar(scale);
  }

  return group;
}
