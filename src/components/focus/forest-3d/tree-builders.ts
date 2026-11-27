import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NurserySlotState } from '@/types/database';
import { getNurserySlotProgress } from '@/lib/focus-timer';
import { BotanicalSpecies, SpeciesGeometryLibrary, SpeciesGeometrySet } from './types';

export const CANONICAL_ISLAND_RADIUS = 6.8;
export const POND_POS = new THREE.Vector2(
  CANONICAL_ISLAND_RADIUS * 0.44,
  -CANONICAL_ISLAND_RADIUS * 0.24
);

export const POND_RX = CANONICAL_ISLAND_RADIUS * 0.275;
export const POND_RZ = CANONICAL_ISLAND_RADIUS * 0.195;

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

export function terrainBaseHeightAt(
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

/**
 * Depressão escavada real sob o lago (até -0.24m no centro da bacia).
 */
export function pondDepressionAt(
  x: number,
  z: number,
  islandRadius = CANONICAL_ISLAND_RADIUS
): number {
  const scale = islandRadius / CANONICAL_ISLAND_RADIUS;
  const rx = POND_RX * scale;
  const rz = POND_RZ * scale;
  const dx = (x - POND_POS.x * scale) / rx;
  const dz = (z - POND_POS.y * scale) / rz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= 1.28) return 0;
  const t = Math.max(0, 1 - d2 / 1.28);
  return -0.24 * t * t * (3 - 2 * t);
}

export function terrainHeightAt(
  x: number,
  z: number,
  islandRadius = CANONICAL_ISLAND_RADIUS
): number {
  return terrainBaseHeightAt(x, z, islandRadius) + pondDepressionAt(x, z, islandRadius);
}

export const POND_WATER_Y =
  terrainBaseHeightAt(POND_POS.x, POND_POS.y, CANONICAL_ISLAND_RADIUS) - 0.042;

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
      const theta = 0.2 + nextRand(rng) * (Math.PI * 1.65);
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      best = { x, z };

      const nearPond = Math.hypot(x - pondPos.x, z - pondPos.y) < islandRadius * 0.34;
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
  for (let attempt = 0; attempt < 36; attempt++) {
    const r = minR + Math.sqrt(nextRand(rng)) * (maxR - minR);
    const theta = nextRand(rng) * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    chosen = { x, z };

    const nearPond =
      Math.hypot((x - pondPos.x) / (POND_RX * 1.28), (z - pondPos.y) / (POND_RZ * 1.28)) < 1.0;
    const nearNursery = nurseryPositions.some(p => Math.hypot(x - p.x, z - p.z) < 1.18);
    if (!nearPond && !nearNursery) {
      placedSafely = true;
      break;
    }
  }

  if (!placedSafely) {
    for (let step = 0; step < 24; step++) {
      const ang = ((h & 0x3ff) / 1024 + step / 24) * Math.PI * 2;
      const r = maxR - 0.35;
      const fx = Math.cos(ang) * r;
      const fz = Math.sin(ang) * r;
      const nearPond =
        Math.hypot((fx - pondPos.x) / (POND_RX * 1.28), (fz - pondPos.y) / (POND_RZ * 1.28)) < 1.0;
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

// ============================================================================
// GEOMETRIAS DO DIORAMA (TERRENO SUBDIVIDIDO, PEDRAS, RELVA, NENÚFARES, JUNCOS)
// ============================================================================

/**
 * Terreno radial subdividido (22 anéis x 52 segmentos) costurado à saia lateral do penhasco,
 * respeitando `terrainHeightAt` com bacia escavada real de -0.24m sob POND_POS e
 * sombreamento de borda úmida via vertex colors.
 */
export function createSubdividedIslandTopGeo(
  islandRadius = CANONICAL_ISLAND_RADIUS,
  rings = 22,
  segments = 52
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const pushVertex = (x: number, y: number, z: number, u: number, v: number, r: number, g: number, b: number) => {
    positions.push(x, y, z);
    uvs.push(u, v);
    colors.push(r, g, b);
    return positions.length / 3 - 1;
  };

  const sampleGroundTint = (x: number, z: number): [number, number, number] => {
    const dep = pondDepressionAt(x, z, islandRadius);
    if (dep < -0.005) {
      // Borda úmida (transição escura úmida ao redor do lago) até o fundo da bacia
      const t = Math.min(1, -dep / 0.16);
      return [
        THREE.MathUtils.lerp(0.84, 0.56, t),
        THREE.MathUtils.lerp(0.82, 0.58, t),
        THREE.MathUtils.lerp(0.76, 0.55, t),
      ];
    }
    const distNorm = Math.hypot(x, z) / islandRadius;
    const edgeShade = 1.0 - Math.max(0, distNorm - 0.8) * 0.45;
    return [edgeShade, edgeShade, edgeShade];
  };

  // Vértice central (anel 0)
  const centerY = terrainHeightAt(0, 0, islandRadius);
  const cTint = sampleGroundTint(0, 0);
  const centerIdx = pushVertex(0, centerY, 0, 0.5, 0.5, cTint[0], cTint[1], cTint[2]);

  // Anéis 1..rings (com leve concentração perto da margem da ilha para silhueta limpa)
  const ringStarts: number[] = [];
  for (let r = 1; r <= rings; r++) {
    ringStarts.push(positions.length / 3);
    const t = r / rings;
    const rad = islandRadius * Math.pow(t, 0.94);
    for (let s = 0; s <= segments; s++) {
      const ang = (s / segments) * Math.PI * 2;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const y = terrainHeightAt(x, z, islandRadius);
      const u = x / (islandRadius * 2) + 0.5;
      const v = z / (islandRadius * 2) + 0.5;
      const tint = sampleGroundTint(x, z);
      pushVertex(x, y, z, u, v, tint[0], tint[1], tint[2]);
    }
  }

  // Triângulos do centro para anel 1 (winding CCW visto de +Y -> normal +Y)
  const firstRing = ringStarts[0];
  for (let s = 0; s < segments; s++) {
    indices.push(centerIdx, firstRing + s + 1, firstRing + s);
  }

  // Quads entre anéis consecutivos
  for (let r = 0; r < rings - 1; r++) {
    const a0 = ringStarts[r];
    const b0 = ringStarts[r + 1];
    for (let s = 0; s < segments; s++) {
      const i00 = a0 + s;
      const i01 = a0 + s + 1;
      const i10 = b0 + s;
      const i11 = b0 + s + 1;
      indices.push(i00, i01, i11);
      indices.push(i00, i11, i10);
    }
  }

  // Saia lateral costurada exatamente ao último anel descendo até -0.44m para encaixar no penhasco
  const skirtTopStart = positions.length / 3;
  const skirtBotStart = skirtTopStart + (segments + 1);
  for (let s = 0; s <= segments; s++) {
    const ang = (s / segments) * Math.PI * 2;
    const x = Math.cos(ang) * islandRadius;
    const z = Math.sin(ang) * islandRadius;
    const y = terrainHeightAt(x, z, islandRadius);
    pushVertex(x, y, z, (s / segments) * 4, 1, 0.88, 0.88, 0.88);
  }
  for (let s = 0; s <= segments; s++) {
    const ang = (s / segments) * Math.PI * 2;
    const radBot = islandRadius * 0.958;
    const x = Math.cos(ang) * radBot;
    const z = Math.sin(ang) * radBot;
    const y = -0.44 - 0.045 * Math.sin(x * 1.4 + z * 1.2);
    pushVertex(x, y, z, (s / segments) * 4, 0, 0.62, 0.60, 0.58);
  }
  for (let s = 0; s < segments; s++) {
    const t0 = skirtTopStart + s;
    const t1 = skirtTopStart + s + 1;
    const b0 = skirtBotStart + s;
    const b1 = skirtBotStart + s + 1;
    indices.push(t0, t1, b1);
    indices.push(t0, b1, b0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Fundo de seixos submerso encaixado na bacia do lago.
 */
export function createPondBedGeo(islandRadius = CANONICAL_ISLAND_RADIUS): THREE.BufferGeometry {
  const rings = 8;
  const segments = 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const scale = islandRadius / CANONICAL_ISLAND_RADIUS;
  const rx = POND_RX * 0.96 * scale;
  const rz = POND_RZ * 0.96 * scale;
  const cx = POND_POS.x * scale;
  const cz = POND_POS.y * scale;

  positions.push(cx, terrainHeightAt(cx, cz, islandRadius) + 0.012, cz);
  uvs.push(0.5, 0.5);

  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    // Eleva 1.2cm no centro da bacia e mergulha -1.5cm sob o solo na margem para zero z-fighting
    const yOffset = THREE.MathUtils.lerp(0.012, -0.015, t * t);
    for (let s = 0; s <= segments; s++) {
      const ang = (s / segments) * Math.PI * 2;
      const x = cx + Math.cos(ang) * rx * t;
      const z = cz + Math.sin(ang) * rz * t;
      const y = terrainHeightAt(x, z, islandRadius) + yOffset;
      positions.push(x, y, z);
      uvs.push(0.5 + Math.cos(ang) * 0.5 * t, 0.5 + Math.sin(ang) * 0.5 * t);
    }
  }

  for (let s = 0; s < segments; s++) {
    indices.push(0, 1 + s + 1, 1 + s);
  }
  for (let r = 0; r < rings - 1; r++) {
    const a0 = 1 + r * (segments + 1);
    const b0 = 1 + (r + 1) * (segments + 1);
    for (let s = 0; s < segments; s++) {
      indices.push(a0 + s, a0 + s + 1, b0 + s + 1);
      indices.push(a0 + s, b0 + s + 1, b0 + s);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Pedra facetada angular PBR (sem aspecto de blob arredondado).
 */
export function createFacetedRockGeo(seed = 17): THREE.BufferGeometry {
  const base = new THREE.DodecahedronGeometry(1.0, 1);
  const geo = base.toNonIndexed();
  base.dispose();

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();

  // Planos de corte determinísticos para criar facetas rochosas naturais
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n1 = Math.sin(v.x * 2.9 + seed) * Math.cos(v.z * 2.7 - seed * 0.5);
    const n2 = Math.cos(v.y * 3.6 + v.x * 1.8 + seed * 1.3);
    const scale = 0.88 + n1 * 0.14 + n2 * 0.08;
    v.multiplyScalar(scale);
    // Base levemente achatada para assentar firme no solo
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.35;
    // Topo suavemente plano para musgo
    if (v.y > 0.55) v.y = 0.55 + (v.y - 0.55) * 0.55;
    pos.setXYZ(i, v.x, v.y, v.z);
    // UV mapeada de forma que v próximo a 0 fique no topo (musgo da rockMossMap!)
    if (uv) {
      const uVal = Math.atan2(v.z, v.x) / (Math.PI * 2) + 0.5;
      const vVal = THREE.MathUtils.clamp(0.5 - v.y * 0.65, 0.02, 0.98);
      uv.setXY(i, uVal, vVal);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Tufo de relva curva (3 lâminas arqueadas = 18 tris) com vertex colors em gradiente e aLeafTip.
 */
export function createGrassTuftGeo(): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const leafTips: number[] = [];

  const bladeConfigs = [
    { ang: 0.0, lean: 0.07, h: 0.17, w: 0.014, ox: 0.0, oz: 0.0 },
    { ang: 1.28, lean: 0.085, h: 0.145, w: 0.013, ox: 0.018, oz: -0.012 },
    { ang: 2.52, lean: 0.08, h: 0.185, w: 0.013, ox: -0.016, oz: 0.014 },
    { ang: 3.82, lean: 0.065, h: 0.13, w: 0.012, ox: 0.012, oz: 0.019 },
    { ang: 5.15, lean: 0.075, h: 0.16, w: 0.012, ox: -0.019, oz: -0.014 },
  ];

  const pushTri = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    c0: [number, number, number],
    c1: [number, number, number],
    c2: [number, number, number],
    t0: number,
    t1: number,
    t2: number
  ) => {
    positions.push(...p0, ...p1, ...p2);
    // Normal inclinada para cima para iluminação macia da relva
    normals.push(0, 0.92, 0.38, 0, 0.92, 0.38, 0, 0.92, 0.38);
    uvs.push(0, t0, 1, t1, 0.5, t2);
    colors.push(...c0, ...c1, ...c2);
    leafTips.push(t0, t1, t2);
  };

  for (const cfg of bladeConfigs) {
    const cos = Math.cos(cfg.ang);
    const sin = Math.sin(cfg.ang);
    const tx = -sin;
    const tz = cos;

    const pt = (s: number, side: number): [number, number, number] => {
      const width = cfg.w * (1 - s * 0.92);
      const bend = s * s * cfg.lean;
      return [
        cfg.ox + cos * bend + tx * side * width,
        s * cfg.h,
        cfg.oz + sin * bend + tz * side * width,
      ];
    };

    const cBase: [number, number, number] = [0.46, 0.58, 0.44];
    const cMid: [number, number, number] = [0.78, 0.92, 0.68];
    const cTip: [number, number, number] = [1.08, 1.18, 0.88];

    // Segmento inferior (quad = 2 tris)
    const bL = pt(0, -1);
    const bR = pt(0, 1);
    const mL = pt(0.55, -1);
    const mR = pt(0.55, 1);
    const tip = pt(1.0, 0);

    pushTri(bL, bR, mR, cBase, cBase, cMid, 0, 0, 0.52);
    pushTri(bL, mR, mL, cBase, cMid, cMid, 0, 0.52, 0.52);
    // Ponta (1 tri)
    pushTri(mL, mR, tip, cMid, cMid, cTip, 0.52, 0.52, 1.0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('aLeafTip', new THREE.Float32BufferAttribute(leafTips, 1));
  return geo;
}

/**
 * Folha de nenúfar (disco levemente côncavo para lilyPadMap alpha-cutout).
 */
export function createLilyPadGeo(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(0.46, 0.46, 2, 2);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    pos.setY(i, r * r * 0.14);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Flor de nenúfar delicada (duas cartas em cálice raso).
 */
export function createLilyFlowerGeo(): THREE.BufferGeometry {
  const p1 = new THREE.PlaneGeometry(0.16, 0.16);
  p1.rotateX(-Math.PI / 2);
  p1.translate(0, 0.025, 0);
  const p2 = new THREE.PlaneGeometry(0.13, 0.13);
  p2.rotateX(-Math.PI / 2 + 0.12);
  p2.rotateY(0.6);
  p2.translate(0, 0.042, 0);
  const merged = mergeGeometries([p1.toNonIndexed(), p2.toNonIndexed()], false)!;
  p1.dispose();
  p2.dispose();
  return merged;
}

/**
 * Cluster de juncos/samambaias para margem do lago (3 cartas cruzadas = 6 tris + aLeafTip).
 */
export function createReedClusterGeo(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const plane = new THREE.PlaneGeometry(0.44, 0.56, 1, 2).toNonIndexed();
    plane.translate(0, 0.28, 0);
    plane.rotateY((i / 3) * Math.PI + 0.25);
    const pos = plane.attributes.position;
    const tips = new Float32Array(pos.count);
    const cols = new Float32Array(pos.count * 3);
    for (let k = 0; k < pos.count; k++) {
      const t = THREE.MathUtils.clamp(pos.getY(k) / 0.56, 0, 1);
      tips[k] = t * t;
      const ao = THREE.MathUtils.lerp(0.7, 1.08, t);
      cols[k * 3] = ao;
      cols[k * 3 + 1] = ao;
      cols[k * 3 + 2] = ao;
    }
    plane.setAttribute('aLeafTip', new THREE.BufferAttribute(tips, 1));
    plane.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    parts.push(plane);
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach(p => p.dispose());
  return merged;
}

// ============================================================================
// CONSTRUTORES BOTÂNICOS DE TRONCOS, GALHOS E CARTAS FOLIARES RECORTADAS
// ============================================================================

export function createTaperedCurveTubeGeo(
  points: THREE.Vector3[],
  rStart: number,
  rEnd: number,
  tubularSegments = 8,
  radialSegments = 6,
  rootFlareStrength = 0.0
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const raw = new THREE.TubeGeometry(curve, tubularSegments, 1, radialSegments, false);
  const pos = raw.attributes.position;
  const uv = raw.attributes.uv;
  const center = new THREE.Vector3();
  const vertex = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, uv.getX(i)));
    curve.getPointAt(t, center);
    vertex.fromBufferAttribute(pos, i);
    const flare = rootFlareStrength > 0 && t < 0.22 ? Math.pow(1 - t / 0.22, 1.6) * rootFlareStrength : 0;
    const radius = THREE.MathUtils.lerp(rStart, rEnd, Math.pow(t, 0.85)) * (1 + flare);
    vertex.sub(center).multiplyScalar(radius).add(center);
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    // Troca U/V para que V acompanhe o comprimento do tronco/galho (sulcos verticais da casca!)
    const uCirc = uv.getY(i);
    const vLen = uv.getX(i);
    uv.setXY(i, uCirc, vLen);
  }
  raw.computeVertexNormals();

  const geo = raw.toNonIndexed();
  raw.dispose();

  const count = geo.attributes.position.count;
  const tips = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const gPos = geo.attributes.position;
  for (let i = 0; i < count; i++) {
    const y = gPos.getY(i);
    // AO suave nas raízes e colo do tronco
    const ao = THREE.MathUtils.lerp(0.74, 1.0, THREE.MathUtils.clamp((y + 0.08) / 0.45, 0, 1));
    colors[i * 3] = ao;
    colors[i * 3 + 1] = ao;
    colors[i * 3 + 2] = ao;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aLeafTip', new THREE.BufferAttribute(tips, 1));
  return geo;
}

/**
 * Carta foliar hexagonal dobrada em V/arco 3D (6 tris tight-cropped ao atlas UV).
 * Base em (0, 0, 0) com aLeafTip = 0.0 -> ponta em (0, height, -arch) com aLeafTip = 1.0.
 */
export function createBentFoliageCardGeo(
  width = 0.42,
  height = 0.46,
  foldDepth = 0.055,
  archBack = 0.075
): THREE.BufferGeometry {
  const hw = width * 0.5;
  // 7 vértices formando um hexágono dobrado em V com vértice central elevado
  const verts: Array<[number, number, number, number, number, number]> = [
    // x, y, z, u, v, aLeafTip
    [0, 0, 0, 0.5, 0.02, 0.0], // 0: base presa ao galho
    [-hw * 0.86, height * 0.30, -foldDepth, 0.07, 0.31, 0.42], // 1: esquerda inferior
    [hw * 0.86, height * 0.30, -foldDepth, 0.93, 0.31, 0.42], // 2: direita inferior
    [0, height * 0.52, foldDepth * 0.85, 0.5, 0.52, 0.50], // 3: centro em relevo
    [-hw * 0.94, height * 0.72, -foldDepth * 1.15 - archBack * 0.45, 0.04, 0.72, 0.84], // 4: esquerda superior
    [hw * 0.94, height * 0.72, -foldDepth * 1.15 - archBack * 0.45, 0.96, 0.72, 0.84], // 5: direita superior
    [0, height, -archBack, 0.5, 0.98, 1.0], // 6: ponta livre
  ];

  // 6 triângulos cobrindo toda a silhueta do raminho
  const tris: Array<[number, number, number]> = [
    [0, 2, 3],
    [0, 3, 1],
    [1, 3, 4],
    [2, 5, 3],
    [3, 5, 6],
    [3, 6, 4],
  ];

  const positions: number[] = [];
  const uvs: number[] = [];
  const tips: number[] = [];
  const colors: number[] = [];

  for (const [a, b, c] of tris) {
    for (const idx of [a, b, c]) {
      const v = verts[idx];
      positions.push(v[0], v[1], v[2]);
      uvs.push(v[3], v[4]);
      tips.push(v[5]);
      colors.push(1, 1, 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aLeafTip', new THREE.Float32BufferAttribute(tips, 1));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Fronde arqueada fina de palmeira (~14 tris) com curvatura parabólica real e dobra em V.
 * Cresce ao longo de +Z a partir da coroa (0, 0, 0) com arco gracioso para cima e queda na ponta.
 */
function createPalmFrondGeo(length = 0.86, maxWidth = 0.36, droop = 0.34): THREE.BufferGeometry {
  const segs = 7; // 7 segmentos x 2 tris = 14 tris por fronde!
  const positions: number[] = [];
  const uvs: number[] = [];
  const tips: number[] = [];
  const colors: number[] = [];

  const sampleRow = (t: number) => {
    const z = t * length;
    const archY = Math.sin(t * Math.PI * 0.85) * 0.16 - t * t * droop;
    const halfW = maxWidth * 0.5 * (0.18 + 0.82 * Math.sin(Math.pow(t, 0.72) * Math.PI));
    const vDroop = -halfW * 0.18;
    const left: [number, number, number] = [-halfW, archY + vDroop, z];
    const right: [number, number, number] = [halfW, archY + vDroop, z];
    return { left, right, t };
  };

  for (let i = 0; i < segs; i++) {
    const r0 = sampleRow(i / segs);
    const r1 = sampleRow((i + 1) / segs);

    // Triângulo 1: r0.left, r1.left, r1.right
    positions.push(...r0.left, ...r1.left, ...r1.right);
    uvs.push(0.02, r0.t, 0.02, r1.t, 0.98, r1.t);
    tips.push(r0.t, r1.t, r1.t);
    const ao0 = THREE.MathUtils.lerp(0.68, 1.12, r0.t);
    const ao1 = THREE.MathUtils.lerp(0.68, 1.12, r1.t);
    colors.push(ao0, ao0, ao0, ao1, ao1, ao1, ao1, ao1, ao1);

    // Triângulo 2: r0.left, r1.right, r0.right
    positions.push(...r0.left, ...r1.right, ...r0.right);
    uvs.push(0.02, r0.t, 0.98, r1.t, 0.98, r0.t);
    tips.push(r0.t, r1.t, r0.t);
    colors.push(ao0, ao0, ao0, ao1, ao1, ao1, ao0, ao0, ao0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aLeafTip', new THREE.Float32BufferAttribute(tips, 1));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Aplica Spherical Normal Blending (65% normal radial da copa + 35% normal da carta)
 * e Vertex AO (0.42 no miolo -> 1.12 na borda) na geometria fundida de folhagem.
 */
function applyCanopyShadingAttributes(
  geo: THREE.BufferGeometry,
  canopyCenter: THREE.Vector3,
  aoMin = 0.42,
  aoMax = 1.12,
  sphericalWeight = 0.65
): void {
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  let col = geo.attributes.color;
  if (!col) {
    col = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
    geo.setAttribute('color', col);
  }

  let maxDist = 0.001;
  let minY = Infinity;
  let maxY = -Infinity;
  const v = new THREE.Vector3();
  const radN = new THREE.Vector3();
  const geomN = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.distanceTo(canopyCenter);
    if (d > maxDist) maxDist = d;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }

  const ySpan = Math.max(0.001, maxY - minY);

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    radN.subVectors(v, canopyCenter);
    const dist = radN.length();
    if (dist > 0.0001) {
      radN.divideScalar(dist);
    } else {
      radN.set(0, 1, 0);
    }
    // Bias sutil para o céu na normal radial
    radN.y += 0.2;
    radN.normalize();

    geomN.fromBufferAttribute(norm, i).normalize();
    geomN.lerp(radN, sphericalWeight).normalize();
    norm.setXYZ(i, geomN.x, geomN.y, geomN.z);

    const dNorm = THREE.MathUtils.clamp(dist / maxDist, 0, 1);
    const hNorm = THREE.MathUtils.clamp((v.y - minY) / ySpan, 0, 1);
    const ao = THREE.MathUtils.lerp(aoMin, aoMax, THREE.MathUtils.clamp(dNorm * 0.64 + hNorm * 0.36, 0, 1));
    // Pequena variação natural de clorofila por posição espacial (sem perder neutralidade em accentGeo)
    const micro = 0.96 + 0.08 * Math.sin(v.x * 11.3 + v.y * 9.7 + v.z * 13.1);
    const val = ao * micro;
    col.setXYZ(i, val, val, val);
  }

  norm.needsUpdate = true;
  col.needsUpdate = true;
}

function transformCard(
  template: THREE.BufferGeometry,
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  roll: number,
  scaleX: number,
  scaleY: number
): THREE.BufferGeometry {
  const g = template.clone();
  const up = new THREE.Vector3(0, 1, 0);
  const d = dir.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(up, d);
  const rollQ = new THREE.Quaternion().setFromAxisAngle(d, roll);
  q.premultiply(rollQ);
  const m = new THREE.Matrix4().compose(origin, q, new THREE.Vector3(scaleX, scaleY, scaleX));
  g.applyMatrix4(m);
  return g;
}

function mergeAndDispose(parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  const merged = mergeGeometries(parts, false);
  parts.forEach(p => p.dispose());
  return merged;
}

/**
 * Proxy low-poly (~16 tris) para raycasting ultrarrápido (<0.5ms com 96 árvores).
 */
function createTreeProxyGeo(radiusBottom: number, radiusTop: number, height: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 6, 1);
  geo.translate(0, height * 0.5, 0);
  return geo;
}

/**
 * Adiciona 3-5 raízes tabulares descendo até -0.08m abaixo do terreno.
 */
function appendButtressRoots(
  parts: THREE.BufferGeometry[],
  count: number,
  baseRadius: number,
  rng: { value: number }
): void {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + (nextRand(rng) - 0.5) * 0.35;
    const spread = baseRadius * (2.25 + nextRand(rng) * 0.85);
    const startH = 0.14 + nextRand(rng) * 0.08;
    const p0 = new THREE.Vector3(Math.cos(ang) * baseRadius * 0.45, startH, Math.sin(ang) * baseRadius * 0.45);
    const p1 = new THREE.Vector3(Math.cos(ang) * spread * 0.62, 0.03, Math.sin(ang) * spread * 0.62);
    const p2 = new THREE.Vector3(Math.cos(ang) * spread, -0.085, Math.sin(ang) * spread);
    parts.push(createTaperedCurveTubeGeo([p0, p1, p2], baseRadius * 0.44, baseRadius * 0.12, 4, 5, 0));
  }
}

export function buildSpeciesGeometryLibrary(): SpeciesGeometryLibrary {
  const cardTemplate = createBentFoliageCardGeo(0.42, 0.46, 0.058, 0.072);
  const wideCardTemplate = createBentFoliageCardGeo(0.48, 0.44, 0.052, 0.068);
  const pineFanTemplate = createBentFoliageCardGeo(0.44, 0.48, 0.044, 0.06);

  // =========================================================================
  // 1. ÁRVORES DE COPA LARGA: Ipê (ipe_blossom), Carvalho (broad_oak), Cerejeira (sakura_weeping)
  // =========================================================================
  const buildBroadleafSpecies = (
    species: 'ipe_blossom' | 'broad_oak' | 'sakura_weeping',
    isSapling: boolean
  ): {
    barkGeo: THREE.BufferGeometry;
    foliageGeo: THREE.BufferGeometry;
    accentGeo: THREE.BufferGeometry;
    canopyCenter: THREE.Vector3;
  } => {
    const rng = { value: hashSeed(`${species}-${isSapling ? 'sapling' : 'mature'}`) };
    const barkParts: THREE.BufferGeometry[] = [];
    const foliageParts: THREE.BufferGeometry[] = [];
    const accentParts: THREE.BufferGeometry[] = [];

    const isOak = species === 'broad_oak';
    const isSakura = species === 'sakura_weeping';
    const isIpe = species === 'ipe_blossom';

    const trunkH = isSapling ? 0.72 : isOak ? 0.88 : isSakura ? 0.84 : 0.92;
    const baseR = isSapling ? 0.052 : isOak ? 0.105 : 0.085;
    const topR = isSapling ? 0.022 : isOak ? 0.044 : 0.036;
    const leanX = isSakura ? 0.11 : isIpe ? -0.055 : 0.025;
    const leanZ = isSakura ? 0.04 : -0.02;

    // Raízes tabulares descendo até -0.085m
    appendButtressRoots(barkParts, isSapling ? 3 : isOak ? 5 : 4, baseR, rng);

    // Tronco principal com curva natural
    const trunkPts = [
      new THREE.Vector3(0, -0.06, 0),
      new THREE.Vector3(leanX * 0.35, trunkH * 0.36, leanZ * 0.4),
      new THREE.Vector3(leanX * 0.82, trunkH * 0.72, -leanZ * 0.3),
      new THREE.Vector3(leanX * 1.05, trunkH, leanZ * 0.2),
    ];
    const trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
    barkParts.push(
      createTaperedCurveTubeGeo(trunkPts, baseR, topR, isSapling ? 7 : 9, isSapling ? 6 : 7, 0.35)
    );

    const primaryCount = isSapling ? 3 : isOak ? 6 : 5;
    const goldenAngle = 2.3999632;
    const canopySpread = isSapling ? 0.36 : isOak ? 0.62 : isSakura ? 0.58 : 0.54;
    const cardScaleBase = isSapling ? 0.72 : isOak ? 0.95 : 0.88;

    const addLeafClusterAt = (
      tipPos: THREE.Vector3,
      outDir: THREE.Vector3,
      cardsInCluster: number,
      accentChance: number,
      droopBias: number
    ) => {
      for (let c = 0; c < cardsInCluster; c++) {
        const ang = (c / cardsInCluster) * Math.PI * 2 + nextRand(rng) * 0.85;
        const dir = outDir
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos(ang) * 0.58,
              0.24 - droopBias + (nextRand(rng) - 0.5) * 0.42,
              Math.sin(ang) * 0.58
            )
          )
          .normalize();
        const origin = tipPos.clone().addScaledVector(dir, -0.04);
        const sc = cardScaleBase * (0.82 + nextRand(rng) * 0.34);
        const roll = (nextRand(rng) - 0.5) * 1.4;
        foliageParts.push(transformCard(isOak ? wideCardTemplate : cardTemplate, origin, dir, roll, sc, sc * 1.04));
      }

      if (nextRand(rng) < accentChance) {
        const aCount = isIpe || isSakura ? 2 : 1;
        for (let a = 0; a < aCount; a++) {
          const ang = nextRand(rng) * Math.PI * 2;
          const aDir = outDir
            .clone()
            .add(
              new THREE.Vector3(
                Math.cos(ang) * 0.42,
                (isSakura ? -0.25 : 0.42) + (nextRand(rng) - 0.5) * 0.26,
                Math.sin(ang) * 0.42
              )
            )
            .normalize();
          const aOrigin = tipPos.clone().addScaledVector(aDir, 0.04);
          const aSc = cardScaleBase * (isOak ? 0.68 : 0.86) * (0.85 + nextRand(rng) * 0.25);
          accentParts.push(transformCard(cardTemplate, aOrigin, aDir, (nextRand(rng) - 0.5) * 1.1, aSc, aSc));
        }
      }
    };

    // Galhos primários escalonados em altura (nunca partem todos do mesmo nó!)
    for (let p = 0; p < primaryCount; p++) {
      const tStart = 0.48 + (p / Math.max(1, primaryCount - 1)) * 0.48;
      const startPt = trunkCurve.getPointAt(tStart);
      const azim = p * goldenAngle + (nextRand(rng) - 0.5) * 0.32;
      const reach = canopySpread * (0.72 + (1 - tStart * 0.32) * 0.45);
      const rise = (isOak ? 0.32 : isSakura ? 0.26 : 0.38) * (isSapling ? 0.72 : 1.0);

      const midPt = new THREE.Vector3(
        startPt.x + Math.cos(azim) * reach * 0.54,
        startPt.y + rise * 0.65,
        startPt.z + Math.sin(azim) * reach * 0.54
      );
      const endPt = new THREE.Vector3(
        startPt.x + Math.cos(azim) * reach,
        startPt.y + rise * (isSakura ? 0.76 : 1.0),
        startPt.z + Math.sin(azim) * reach
      );

      const pRadStart = THREE.MathUtils.lerp(baseR * 0.48, topR * 0.85, tStart);
      const pRadEnd = pRadStart * 0.38;
      barkParts.push(createTaperedCurveTubeGeo([startPt, midPt, endPt], pRadStart, pRadEnd, 5, 5, 0));

      const pCurve = new THREE.CatmullRomCurve3([startPt, midPt, endPt]);
      const secCount = isSapling ? 1 : isOak ? 3 : 2;

      // Galhos secundários + raminhos saindo de cada galho primário
      for (let s = 0; s < secCount; s++) {
        const sStartT = 0.44 + (s / Math.max(1, secCount)) * 0.46;
        const sStart = pCurve.getPointAt(sStartT);
        const sideSign = s % 2 === 0 ? 1 : -1;
        const sAzim = azim + sideSign * (0.58 + nextRand(rng) * 0.36);
        const sLen = reach * (0.48 + nextRand(rng) * 0.18);
        const sRise = (isSakura ? -0.06 : 0.18) + nextRand(rng) * 0.14;

        const sMid = new THREE.Vector3(
          sStart.x + Math.cos(sAzim) * sLen * 0.55,
          sStart.y + (isSakura ? 0.08 : sRise * 0.65),
          sStart.z + Math.sin(sAzim) * sLen * 0.55
        );
        const sEnd = new THREE.Vector3(
          sStart.x + Math.cos(sAzim) * sLen,
          sStart.y + sRise,
          sStart.z + Math.sin(sAzim) * sLen
        );
        barkParts.push(createTaperedCurveTubeGeo([sStart, sMid, sEnd], pRadEnd * 0.92, pRadEnd * 0.35, 3, 4, 0));

        const sOut = sEnd.clone().sub(sStart).normalize();
        addLeafClusterAt(
          sEnd,
          sOut,
          isSapling ? 2 : 3,
          isSapling ? 0.45 : isOak ? 0.62 : 0.86,
          isSakura ? 0.45 : 0.0
        );
      }

      // Cluster terminal na ponta do galho primário
      const pOut = endPt.clone().sub(startPt).normalize();
      addLeafClusterAt(
        endPt,
        pOut,
        isSapling ? 2 : 3,
        isSapling ? 0.55 : isOak ? 0.72 : 0.94,
        isSakura ? 0.38 : 0.0
      );
    }

    // Líder apical (topo da copa)
    const apexStart = trunkCurve.getPointAt(0.96);
    const apexEnd = apexStart.clone().add(new THREE.Vector3(leanX * 0.15, isSapling ? 0.24 : 0.34, 0));
    barkParts.push(createTaperedCurveTubeGeo([apexStart, apexEnd], topR * 0.82, topR * 0.28, 3, 4, 0));
    addLeafClusterAt(
      apexEnd,
      new THREE.Vector3(0, 1, 0),
      isSapling ? 3 : 4,
      1.0,
      isSakura ? 0.15 : 0.0
    );

    const canopyCenter = new THREE.Vector3(leanX * 0.8, trunkH + (isSapling ? 0.14 : 0.24), leanZ * 0.2);
    const barkGeo = mergeAndDispose(barkParts)!;
    const foliageGeo = mergeAndDispose(foliageParts)!;
    const accentGeo = mergeAndDispose(accentParts)!;

    applyCanopyShadingAttributes(foliageGeo, canopyCenter, 0.42, 1.12, 0.65);
    applyCanopyShadingAttributes(accentGeo, canopyCenter, 0.72, 1.16, 0.65);

    return { barkGeo, foliageGeo, accentGeo, canopyCenter };
  };

  // =========================================================================
  // 2. PALMEIRA TROPICAL (tropical_palm): 11 frondes pinadas finas (~480 tris total!)
  // =========================================================================
  const buildPalm = (isSapling: boolean) => {
    const rng = { value: hashSeed(`tropical_palm-${isSapling ? 'sapling' : 'mature'}`) };
    const barkParts: THREE.BufferGeometry[] = [];
    const foliageParts: THREE.BufferGeometry[] = [];
    const accentParts: THREE.BufferGeometry[] = [];

    const leanX = isSapling ? 0.08 : 0.16;
    const height = isSapling ? 0.86 : 1.34;
    const baseR = isSapling ? 0.056 : 0.078;
    const topR = isSapling ? 0.032 : 0.044;

    appendButtressRoots(barkParts, isSapling ? 3 : 4, baseR * 0.9, rng);

    const trunkPts = [
      new THREE.Vector3(0, -0.06, 0),
      new THREE.Vector3(leanX * 0.35, height * 0.34, 0.03),
      new THREE.Vector3(leanX * 0.88, height * 0.70, 0.01),
      new THREE.Vector3(leanX * 1.15, height, -0.02),
    ];
    barkParts.push(
      createTaperedCurveTubeGeo(trunkPts, baseR, topR, isSapling ? 8 : 11, isSapling ? 6 : 7, 0.26)
    );

    const crownPos = trunkPts[3];
    const frondCount = isSapling ? 6 : 11;
    const frondGeoUpper = createPalmFrondGeo(isSapling ? 0.56 : 0.86, isSapling ? 0.28 : 0.38, isSapling ? 0.22 : 0.32);
    const frondGeoLower = createPalmFrondGeo(isSapling ? 0.52 : 0.82, isSapling ? 0.26 : 0.36, isSapling ? 0.32 : 0.46);

    for (let f = 0; f < frondCount; f++) {
      const tierUpper = f % 2 === 0;
      const azim = (f / frondCount) * Math.PI * 2 + (tierUpper ? 0.1 : 0.35);
      const pitch = tierUpper ? -0.34 - (f % 3) * 0.08 : 0.08 + (f % 3) * 0.06;
      const g = (tierUpper ? frondGeoUpper : frondGeoLower).clone();
      const euler = new THREE.Euler(pitch, azim, (nextRand(rng) - 0.5) * 0.14, 'YXZ');
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(crownPos.x, crownPos.y + (tierUpper ? 0.02 : -0.03), crownPos.z),
        new THREE.Quaternion().setFromEuler(euler),
        new THREE.Vector3(1, 1, 1)
      );
      g.applyMatrix4(m);
      foliageParts.push(g);
    }
    frondGeoUpper.dispose();
    frondGeoLower.dispose();

    // Cachos de frutos / inflorescência pendendo sob a coroa na cor da Grande Área
    const bunchCount = isSapling ? 2 : 5;
    for (let b = 0; b < bunchCount; b++) {
      const ang = (b / bunchCount) * Math.PI * 2 + 0.4;
      const origin = new THREE.Vector3(
        crownPos.x + Math.cos(ang) * 0.065,
        crownPos.y - 0.04,
        crownPos.z + Math.sin(ang) * 0.065
      );
      const dir = new THREE.Vector3(Math.cos(ang) * 0.55, -0.82, Math.sin(ang) * 0.55).normalize();
      const sc = isSapling ? 0.42 : 0.56;
      accentParts.push(transformCard(cardTemplate, origin, dir, ang, sc, sc * 1.08));
    }

    const barkGeo = mergeAndDispose(barkParts)!;
    const foliageGeo = mergeAndDispose(foliageParts)!;
    const accentGeo = mergeAndDispose(accentParts)!;
    applyCanopyShadingAttributes(foliageGeo, crownPos, 0.58, 1.12, 0.45);
    applyCanopyShadingAttributes(accentGeo, crownPos, 0.78, 1.15, 0.5);

    return { barkGeo, foliageGeo, accentGeo };
  };

  // =========================================================================
  // 3. PINHEIRO ALPINO (alpine_pine): tronco cônico + 6 andares + agulhas + pinhas/brotos
  // =========================================================================
  const buildPine = (isSapling: boolean) => {
    const rng = { value: hashSeed(`alpine_pine-${isSapling ? 'sapling' : 'mature'}`) };
    const barkParts: THREE.BufferGeometry[] = [];
    const foliageParts: THREE.BufferGeometry[] = [];
    const accentParts: THREE.BufferGeometry[] = [];

    const height = isSapling ? 1.02 : 1.56;
    const baseR = isSapling ? 0.056 : 0.086;

    appendButtressRoots(barkParts, isSapling ? 3 : 4, baseR, rng);

    const trunkPts = [
      new THREE.Vector3(0, -0.06, 0),
      new THREE.Vector3(0.015, height * 0.45, -0.01),
      new THREE.Vector3(-0.01, height * 0.82, 0.01),
      new THREE.Vector3(0, height, 0),
    ];
    barkParts.push(createTaperedCurveTubeGeo(trunkPts, baseR, 0.012, isSapling ? 7 : 10, 6, 0.25));

    const tiers = isSapling
      ? [
          { y: 0.34, len: 0.36, branches: 4, cardSc: 0.64 },
          { y: 0.58, len: 0.27, branches: 4, cardSc: 0.56 },
          { y: 0.80, len: 0.18, branches: 3, cardSc: 0.46 },
        ]
      : [
          { y: 0.36, len: 0.56, branches: 5, cardSc: 0.86 },
          { y: 0.58, len: 0.48, branches: 5, cardSc: 0.80 },
          { y: 0.80, len: 0.40, branches: 5, cardSc: 0.72 },
          { y: 1.02, len: 0.32, branches: 4, cardSc: 0.64 },
          { y: 1.22, len: 0.23, branches: 4, cardSc: 0.54 },
          { y: 1.38, len: 0.14, branches: 3, cardSc: 0.42 },
        ];

    tiers.forEach((tier, ti) => {
      for (let b = 0; b < tier.branches; b++) {
        const ang = (b / tier.branches) * Math.PI * 2 + ti * 0.68 + (nextRand(rng) - 0.5) * 0.22;
        const start = new THREE.Vector3(0, tier.y, 0);
        const mid = new THREE.Vector3(
          Math.cos(ang) * tier.len * 0.55,
          tier.y - tier.len * 0.12,
          Math.sin(ang) * tier.len * 0.55
        );
        const end = new THREE.Vector3(
          Math.cos(ang) * tier.len,
          tier.y - tier.len * 0.16 + 0.04,
          Math.sin(ang) * tier.len
        );
        const brStart = Math.max(0.012, 0.026 * (1 - ti * 0.12));
        barkParts.push(createTaperedCurveTubeGeo([start, mid, end], brStart, brStart * 0.32, 3, 4, 0));

        // 2 placas radiais de agulhas sobre cada galho (uma no meio e outra na ponta)
        const outDir = end.clone().sub(start).normalize();
        const midFanDir = outDir.clone().add(new THREE.Vector3(0, 0.28, 0)).normalize();
        const tipFanDir = outDir.clone().add(new THREE.Vector3(0, 0.16, 0)).normalize();
        foliageParts.push(
          transformCard(pineFanTemplate, mid.clone().add(new THREE.Vector3(0, 0.01, 0)), midFanDir, (nextRand(rng) - 0.5) * 0.5, tier.cardSc * 0.92, tier.cardSc * 0.95)
        );
        foliageParts.push(
          transformCard(pineFanTemplate, end.clone().addScaledVector(outDir, -0.06), tipFanDir, (nextRand(rng) - 0.5) * 0.6, tier.cardSc * 0.84, tier.cardSc * 0.92)
        );

        // Pinhas e brotos terminais na cor da Grande Área nas pontas dos galhos
        if ((b + ti) % 2 === 0 || ti >= tiers.length - 2) {
          const coneDir = outDir.clone().add(new THREE.Vector3(0, 0.35, 0)).normalize();
          const aSc = tier.cardSc * 0.52;
          accentParts.push(transformCard(cardTemplate, end, coneDir, ang, aSc, aSc));
        }
      }
    });

    // Topo da conífera (2 cartas cruzadas + broto apical)
    const apexOrigin = new THREE.Vector3(0, height - 0.18, 0);
    foliageParts.push(transformCard(pineFanTemplate, apexOrigin, new THREE.Vector3(0.05, 1, 0), 0.2, 0.38, 0.48));
    foliageParts.push(transformCard(pineFanTemplate, apexOrigin, new THREE.Vector3(-0.05, 1, 0), 1.75, 0.38, 0.48));
    accentParts.push(transformCard(cardTemplate, new THREE.Vector3(0, height - 0.06, 0), new THREE.Vector3(0, 1, 0), 0.4, 0.28, 0.34));

    const canopyCenter = new THREE.Vector3(0, height * 0.56, 0);
    const barkGeo = mergeAndDispose(barkParts)!;
    const foliageGeo = mergeAndDispose(foliageParts)!;
    const accentGeo = mergeAndDispose(accentParts)!;
    applyCanopyShadingAttributes(foliageGeo, canopyCenter, 0.44, 1.12, 0.62);
    applyCanopyShadingAttributes(accentGeo, canopyCenter, 0.74, 1.16, 0.62);

    return { barkGeo, foliageGeo, accentGeo };
  };

  // =========================================================================
  // 4. GALHO SECO (withered): tronco retorcido multi-bifurcado com raízes
  // =========================================================================
  const buildWithered = (): SpeciesGeometrySet => {
    const rng = { value: hashSeed('withered-gnarled') };
    const parts: THREE.BufferGeometry[] = [];
    appendButtressRoots(parts, 3, 0.075, rng);

    const mainPts = [
      new THREE.Vector3(0, -0.06, 0),
      new THREE.Vector3(0.06, 0.32, 0.03),
      new THREE.Vector3(-0.04, 0.66, -0.03),
      new THREE.Vector3(-0.11, 0.94, 0.02),
    ];
    parts.push(createTaperedCurveTubeGeo(mainPts, 0.082, 0.022, 8, 6, 0.28));

    const limbs: Array<[THREE.Vector3[], number, number]> = [
      [
        [new THREE.Vector3(0.03, 0.44, 0.02), new THREE.Vector3(0.22, 0.60, 0.08), new THREE.Vector3(0.36, 0.72, 0.04)],
        0.034,
        0.009,
      ],
      [
        [new THREE.Vector3(0.18, 0.58, 0.07), new THREE.Vector3(0.24, 0.74, 0.19), new THREE.Vector3(0.29, 0.84, 0.24)],
        0.018,
        0.006,
      ],
      [
        [new THREE.Vector3(-0.02, 0.56, -0.02), new THREE.Vector3(-0.20, 0.71, -0.14), new THREE.Vector3(-0.32, 0.78, -0.22)],
        0.03,
        0.008,
      ],
      [
        [new THREE.Vector3(-0.06, 0.74, -0.01), new THREE.Vector3(0.04, 0.88, -0.18), new THREE.Vector3(0.10, 0.96, -0.26)],
        0.022,
        0.007,
      ],
    ];
    for (const [pts, r0, r1] of limbs) {
      parts.push(createTaperedCurveTubeGeo(pts, r0, r1, 5, 5, 0));
    }

    return {
      barkGeo: mergeAndDispose(parts)!,
      foliageGeo: null,
      accentGeo: null,
      saplingBarkGeo: null,
      saplingFoliageGeo: null,
      saplingAccentGeo: null,
      proxyGeo: createTreeProxyGeo(0.22, 0.34, 1.0),
    };
  };

  const makeBroadSet = (species: 'ipe_blossom' | 'broad_oak' | 'sakura_weeping'): SpeciesGeometrySet => {
    const mature = buildBroadleafSpecies(species, false);
    const sapling = buildBroadleafSpecies(species, true);
    return {
      barkGeo: mature.barkGeo,
      foliageGeo: mature.foliageGeo,
      accentGeo: mature.accentGeo,
      saplingBarkGeo: sapling.barkGeo,
      saplingFoliageGeo: sapling.foliageGeo,
      saplingAccentGeo: sapling.accentGeo,
      proxyGeo: createTreeProxyGeo(0.24, species === 'broad_oak' ? 0.74 : 0.66, 1.55),
    };
  };

  const palmMature = buildPalm(false);
  const palmSapling = buildPalm(true);
  const pineMature = buildPine(false);
  const pineSapling = buildPine(true);

  const lib: SpeciesGeometryLibrary = {
    ipe_blossom: makeBroadSet('ipe_blossom'),
    broad_oak: makeBroadSet('broad_oak'),
    sakura_weeping: makeBroadSet('sakura_weeping'),
    tropical_palm: {
      barkGeo: palmMature.barkGeo,
      foliageGeo: palmMature.foliageGeo,
      accentGeo: palmMature.accentGeo,
      saplingBarkGeo: palmSapling.barkGeo,
      saplingFoliageGeo: palmSapling.foliageGeo,
      saplingAccentGeo: palmSapling.accentGeo,
      proxyGeo: createTreeProxyGeo(0.22, 0.72, 1.62),
    },
    alpine_pine: {
      barkGeo: pineMature.barkGeo,
      foliageGeo: pineMature.foliageGeo,
      accentGeo: pineMature.accentGeo,
      saplingBarkGeo: pineSapling.barkGeo,
      saplingFoliageGeo: pineSapling.foliageGeo,
      saplingAccentGeo: pineSapling.accentGeo,
      proxyGeo: createTreeProxyGeo(0.56, 0.14, 1.62),
    },
    withered: buildWithered(),
  };

  cardTemplate.dispose();
  wideCardTemplate.dispose();
  pineFanTemplate.dispose();

  return lib;
}

// ============================================================================
// CONSTRUTOR DOS 4 ESTÁGIOS DISTINTOS NO VIVEIRO
// ============================================================================

export interface NurseryBuilderMaterials {
  barkMat: THREE.Material;
  barkDepthMat: THREE.Material;
  stemMat: THREE.Material;
  seedMat: THREE.Material;
  foliageMats: Record<BotanicalSpecies, THREE.Material>;
  foliageDepthMats: Record<BotanicalSpecies, THREE.Material>;
  getAreaAccentMat: (species: BotanicalSpecies, colorHex: string) => THREE.Material;
  accentDepthMats: Record<BotanicalSpecies, THREE.Material>;
}

export interface NurserySharedGeometries {
  cotyledonCardGeo: THREE.BufferGeometry;
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
  const foliageMat = mats.foliageMats[species];
  const foliageDepthMat = mats.foliageDepthMats[species];
  const accentMat = mats.getAreaAccentMat(species, colorHex);
  const accentDepthMat = mats.accentDepthMats[species];
  const spec = geos.speciesLib[species];

  if (prog.stageNumber === 1) {
    // Estágio 1: Semente aberta + caule emergente + 2 cotilédones recortados
    const seedMesh = new THREE.Mesh(geos.seedPodGeo, mats.seedMat);
    seedMesh.scale.set(1.15, 0.72, 0.85);
    seedMesh.position.y = 0.045;
    seedMesh.castShadow = true;
    group.add(seedMesh);

    const sproutHeight = 0.11 + prog.stageProgressRatio * 0.15;
    const shoot = new THREE.Mesh(
      trackTempGeo(
        createTaperedCurveTubeGeo(
          [
            new THREE.Vector3(0, 0.04, 0),
            new THREE.Vector3(0.022, 0.04 + sproutHeight * 0.55, 0.01),
            new THREE.Vector3(0.008, 0.04 + sproutHeight, 0),
          ],
          0.018,
          0.007,
          6,
          5,
          0
        )
      ),
      mats.stemMat
    );
    shoot.castShadow = true;
    group.add(shoot);

    if (prog.stageProgressRatio > 0.18) {
      for (const side of [-1, 1]) {
        const cot = new THREE.Mesh(geos.cotyledonCardGeo, foliageMat);
        cot.customDepthMaterial = foliageDepthMat;
        cot.position.set(0.008, 0.04 + sproutHeight * 0.92, 0);
        cot.rotation.y = side > 0 ? 0.3 : Math.PI - 0.3;
        cot.rotation.x = 0.82;
        cot.scale.setScalar(0.42 + prog.stageProgressRatio * 0.22);
        cot.castShadow = true;
        group.add(cot);
      }
      // Micro broto luminoso da cor da Grande Área no ápice
      const bud = new THREE.Mesh(geos.cotyledonCardGeo, accentMat);
      bud.customDepthMaterial = accentDepthMat;
      bud.position.set(0.008, 0.04 + sproutHeight, 0);
      bud.scale.setScalar(0.28 + prog.stageProgressRatio * 0.14);
      group.add(bud);
    }
  } else if (prog.stageNumber === 2) {
    // Estágio 2: Broto lenhoso com 2 mini-galhos + 6 cartas foliares recortadas + broto apical da área
    const h = 0.38 + prog.stageProgressRatio * 0.18;
    const stem = new THREE.Mesh(
      trackTempGeo(
        createTaperedCurveTubeGeo(
          [
            new THREE.Vector3(0, -0.02, 0),
            new THREE.Vector3(-0.024, h * 0.48, 0.018),
            new THREE.Vector3(0.016, h, -0.01),
          ],
          0.032,
          0.012,
          7,
          6,
          0.2
        )
      ),
      mats.barkMat
    );
    stem.customDepthMaterial = mats.barkDepthMat;
    stem.castShadow = true;
    group.add(stem);

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.35;
      const leaf = new THREE.Mesh(geos.cotyledonCardGeo, foliageMat);
      leaf.customDepthMaterial = foliageDepthMat;
      leaf.position.set(0.006, h * (0.48 + (i % 3) * 0.2), 0);
      leaf.rotation.y = ang;
      leaf.rotation.x = 0.72 + (i % 2) * 0.22;
      leaf.scale.setScalar(0.68 + (i % 2) * 0.16);
      leaf.castShadow = true;
      group.add(leaf);
    }

    const apexAccent = new THREE.Mesh(geos.cotyledonCardGeo, accentMat);
    apexAccent.customDepthMaterial = accentDepthMat;
    apexAccent.position.set(0.016, h * 0.94, -0.01);
    apexAccent.scale.setScalar(0.56);
    apexAccent.castShadow = true;
    group.add(apexAccent);
  } else if (prog.stageNumber === 3) {
    // Estágio 3: Muda jovem dedicada (saplingGeo com 2 níveis de galhos + ~45% das cartas!)
    const scale = 0.8 + prog.stageProgressRatio * 0.14;
    const barkMesh = new THREE.Mesh(spec.saplingBarkGeo ?? spec.barkGeo, mats.barkMat);
    barkMesh.customDepthMaterial = mats.barkDepthMat;
    barkMesh.castShadow = true;
    barkMesh.receiveShadow = true;
    group.add(barkMesh);

    const sapFol = spec.saplingFoliageGeo ?? spec.foliageGeo;
    if (sapFol) {
      const folMesh = new THREE.Mesh(sapFol, foliageMat);
      folMesh.customDepthMaterial = foliageDepthMat;
      folMesh.castShadow = true;
      folMesh.receiveShadow = true;
      group.add(folMesh);
    }

    const sapAcc = spec.saplingAccentGeo ?? spec.accentGeo;
    if (sapAcc) {
      const accMesh = new THREE.Mesh(sapAcc, accentMat);
      accMesh.customDepthMaterial = accentDepthMat;
      accMesh.castShadow = true;
      group.add(accMesh);
    }
    group.scale.setScalar(scale);
  } else {
    // Estágio 4: Árvore madura completa com copa e floração/acento pleno
    const scale = 0.9 + prog.stageProgressRatio * 0.14;
    const barkMesh = new THREE.Mesh(spec.barkGeo, mats.barkMat);
    barkMesh.customDepthMaterial = mats.barkDepthMat;
    barkMesh.castShadow = true;
    barkMesh.receiveShadow = true;
    group.add(barkMesh);

    if (spec.foliageGeo) {
      const folMesh = new THREE.Mesh(spec.foliageGeo, foliageMat);
      folMesh.customDepthMaterial = foliageDepthMat;
      folMesh.castShadow = true;
      folMesh.receiveShadow = true;
      group.add(folMesh);
    }
    if (spec.accentGeo) {
      const accMesh = new THREE.Mesh(spec.accentGeo, accentMat);
      accMesh.customDepthMaterial = accentDepthMat;
      accMesh.castShadow = true;
      group.add(accMesh);
    }
    group.scale.setScalar(scale);
  }

  return group;
}
