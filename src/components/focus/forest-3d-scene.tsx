'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/components/layout/theme-provider';
import {
  MaturedGardenTree,
  NurserySlotState,
  StudyArea,
  StudySession,
  getAreaStyle,
} from '@/types/database';
import { FULL_TREE_SECONDS, getNurserySlotProgress } from '@/lib/focus-timer';
import { Trees, RotateCw, ZoomIn, ZoomOut, Sparkles, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Forest3DSceneProps {
  sessions: StudySession[];
  maturedFromGarden?: MaturedGardenTree[];
  nurserySlots: [NurserySlotState, NurserySlotState, NurserySlotState];
  activeSlotIndex: 0 | 1 | 2;
  activeSlotLiveSeconds: number;
  isTimerRunningOrPaused: boolean;
  areas: StudyArea[];
  onSelectSlot?: (slotIndex: 0 | 1 | 2) => void;
  heightClassName?: string;
}

type BotanicalSpecies =
  | 'ipe_blossom'
  | 'broad_oak'
  | 'sakura_weeping'
  | 'tropical_palm'
  | 'alpine_pine';

interface PermanentTreeItem {
  id: string;
  colorHex: string;
  isWithered: boolean;
  area: string;
  species: BotanicalSpecies;
  scale: number;
}

function getSpeciesForArea(area: string, index: number): BotanicalSpecies {
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
  return pool[index % pool.length];
}

function terrainHeightAt(x: number, z: number, islandRadius: number): number {
  const dist = Math.hypot(x, z);
  const edgeFade = Math.max(0, 1 - Math.pow(dist / islandRadius, 2.2));
  const gentleRoll =
    (Math.sin(x * 0.65) * Math.cos(z * 0.55) * 0.16 +
      Math.sin((x + z) * 0.42) * 0.08) *
    edgeFade;
  return gentleRoll;
}

function hashSeed(input: string | number): number {
  const str = String(input);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextRand(state: { value: number }): number {
  // Mulberry32 determinístico para espalhar plantas e árvores de modo natural por todo o mapa
  let t = (state.value += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pickOrganicMapPoint(
  seedInput: string | number,
  islandRadius: number,
  pondPos: THREE.Vector2,
  occupied: Array<{ x: number; z: number }>,
  minDistance: number,
  minCenterRadius = 0.25
): { x: number; z: number } {
  const rng = { value: hashSeed(seedInput) };
  const maxR = Math.max(1.2, islandRadius - 0.72);
  let best = { x: 0, z: 0 };

  for (let attempt = 0; attempt < 28; attempt++) {
    const r = minCenterRadius + Math.sqrt(nextRand(rng)) * Math.max(0.5, maxR - minCenterRadius);
    const theta = nextRand(rng) * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    best = { x, z };

    const nearPond = Math.hypot(x - pondPos.x, z - pondPos.y) < islandRadius * 0.27;
    const nearTree = occupied.some(p => Math.hypot(x - p.x, z - p.z) < minDistance);
    if (!nearPond && !nearTree) {
      return best;
    }
  }
  return best;
}

/**
 * Cria geometria orgânica de copa de árvore deformando suavemente um Icosahedron.
 */
function createOrganicCanopyBlobGeo(seed: number): THREE.BufferGeometry {
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
    // Achata levemente na vertical para parecer copa botânica real
    pos.setXYZ(i, x * wave * 1.06, y * wave * 0.84, z * wave * 1.04);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Cria geometria orgânica de pétala / folha curvada.
 */
function createLeafBladeGeo(): THREE.BufferGeometry {
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

  // Curva suavemente a lâmina da folha para trás
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setZ(i, z - y * y * 0.45);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Cria galho/tronco cônico curvado ao longo de pontos 3D com raízes alargadas.
 */
function createTaperedCurveTubeGeo(
  points: THREE.Vector3[],
  rStart: number,
  rEnd: number,
  tubularSegments = 12,
  radialSegments = 8
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
    // Alargamento suave nas raízes (t próximo de 0) + afinamento progressivo
    const rootFlare = t < 0.18 ? (1 - t / 0.18) * 0.42 : 0;
    const radius = THREE.MathUtils.lerp(rStart, rEnd, t) * (1 + rootFlare);
    vertex.sub(center).multiplyScalar(radius).add(center);
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export const Forest3DScene: React.FC<Forest3DSceneProps> = ({
  sessions,
  maturedFromGarden = [],
  nurserySlots,
  activeSlotIndex,
  activeSlotLiveSeconds,
  isTimerRunningOrPaused,
  areas,
  onSelectSlot,
  heightClassName = 'h-[380px] sm:h-[440px]',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [webglFailed, setWebglFailed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoomOffset, setZoomOffset] = useState(0);

  const autoRotateRef = useRef(true);
  const zoomOffsetRef = useRef(0);
  const onSelectSlotRef = useRef(onSelectSlot);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    zoomOffsetRef.current = zoomOffset;
  }, [zoomOffset]);

  useEffect(() => {
    onSelectSlotRef.current = onSelectSlot;
  }, [onSelectSlot]);

  // Consolida árvores maduras vindas de sessões + árvores amadurecidas por boosts
  const permanentTrees = useMemo<PermanentTreeItem[]>(() => {
    const items: PermanentTreeItem[] = [];
    for (const sess of sessions) {
      const style = getAreaStyle(sess.area, areas);
      if (sess.status === 'withered') {
        items.push({
          id: `${sess.id}-withered`,
          colorHex: '#78716c',
          isWithered: true,
          area: sess.area,
          species: 'broad_oak',
          scale: 0.85,
        });
      } else {
        const count = Math.max(0, sess.trees_earned || 0);
        for (let i = 0; i < count; i++) {
          const idx = items.length;
          items.push({
            id: `${sess.id}-t-${i}`,
            colorHex: style.primary,
            isWithered: false,
            area: sess.area,
            species: getSpeciesForArea(sess.area, idx),
            scale: 0.88 + ((idx * 17) % 5) * 0.06,
          });
        }
      }
    }

    for (const matured of maturedFromGarden) {
      const style = getAreaStyle(matured.area, areas);
      const idx = items.length;
      items.push({
        id: matured.id,
        colorHex: style.primary,
        isWithered: false,
        area: matured.area,
        species: getSpeciesForArea(matured.area, idx),
        scale: 0.92 + ((idx * 13) % 5) * 0.05,
      });
    }

    return items.slice(0, 96);
  }, [sessions, maturedFromGarden, areas]);

  // Snapshot simplificado das etapas dos 3 canteiros para controle de rebuild
  const nurserySignature = useMemo(() => {
    return nurserySlots
      .map((slot, idx) => {
        const secs = idx === activeSlotIndex ? activeSlotLiveSeconds : slot.accumulatedSeconds;
        const prog = getNurserySlotProgress(secs);
        // Reconstroi a geometria da muda quando sobe de degrau fino (a cada ~10% ou mudança de estágio)
        const stepBucket = Math.floor(prog.progressRatio * 12);
        const hasBees = Boolean(slot.beesActiveUntilMs && slot.beesActiveUntilMs > Date.now());
        const recentBoost = Boolean(slot.lastBoostAtMs && Date.now() - slot.lastBoostAtMs < 15000);
        return `${slot.area}:${slot.plotSeed ?? idx}:${prog.stageNumber}:${stepBucket}:${hasBees}:${recentBoost}`;
      })
      .join('|');
  }, [nurserySlots, activeSlotIndex, activeSlotLiveSeconds]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const isDark = resolvedTheme === 'dark';
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 420;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.05 : 1.08;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Pools compartilhados para performance instantânea e descarte limpo
    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposableGeos.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposableMats.push(m);
      return m;
    };

    const canopyBlobs = [0, 1.3, 2.7, 4.1].map(seed => trackGeo(createOrganicCanopyBlobGeo(seed)));
    const leafBladeGeo = trackGeo(createLeafBladeGeo());
    const stoneGeo = trackGeo(createOrganicCanopyBlobGeo(9.4));
    const seedPodGeo = trackGeo(new THREE.SphereGeometry(0.11, 14, 12));
    const beeBodyGeo = trackGeo(new THREE.CapsuleGeometry(0.025, 0.045, 4, 8));
    const beeWingGeo = trackGeo(new THREE.PlaneGeometry(0.055, 0.03));

    const barkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x5c3d2e : 0x6f4731,
        roughness: 0.92,
        metalness: 0.02,
      })
    );
    const darkBarkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x452f24 : 0x543626,
        roughness: 0.95,
      })
    );
    const witheredBarkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x73675c,
        roughness: 0.95,
      })
    );
    const stemGreenMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        roughness: 0.55,
      })
    );
    const soilMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x3b281c : 0x5d3d28,
        roughness: 0.96,
      })
    );
    const beeBodyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.4,
        emissive: 0x78350f,
        emissiveIntensity: 0.25,
      })
    );
    const beeWingMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      })
    );

    const islandRadius = Math.max(4.6, Math.min(8.2, 4.3 + Math.sqrt(permanentTrees.length) * 0.42));
    const camera = new THREE.PerspectiveCamera(37, width / height, 0.1, 100);
    const baseCamDist = islandRadius * 2.18;

    // Iluminação atmosférica suave (céu + solo + sol dourado com sombra macia)
    const hemiLight = new THREE.HemisphereLight(
      isDark ? 0x93c5fd : 0xe0f2fe,
      isDark ? 0x1e293b : 0x3f6212,
      isDark ? 0.85 : 1.05
    );
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(isDark ? 0xe0f2fe : 0xfff8e7, isDark ? 1.25 : 1.45);
    sunLight.position.set(7.5, 12.5, 8.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 32;
    const d = islandRadius + 1.5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, isDark ? 0.32 : 0.2);
    rimLight.position.set(-8, 5, -7);
    scene.add(rimLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Base da ilha orgânica com relevo suave + borda rochosa arredondada (zero formato de bloco)
    const topGeo = trackGeo(new THREE.CylinderGeometry(islandRadius, islandRadius * 0.96, 0.42, 48, 3));
    const topPos = topGeo.attributes.position;
    for (let i = 0; i < topPos.count; i++) {
      const vx = topPos.getX(i);
      const vy = topPos.getY(i);
      const vz = topPos.getZ(i);
      if (vy > 0) {
        topPos.setY(i, vy + terrainHeightAt(vx, vz, islandRadius));
      } else {
        topPos.setY(i, vy - 0.05 * Math.sin(vx * 1.4 + vz * 1.2));
      }
    }
    topGeo.computeVertexNormals();

    const grassMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x1b4d3e : 0x43a047,
        roughness: 0.88,
        metalness: 0.02,
      })
    );
    const grassMesh = new THREE.Mesh(topGeo, grassMat);
    grassMesh.position.y = -0.21;
    grassMesh.receiveShadow = true;
    worldGroup.add(grassMesh);

    const cliffGeo = trackGeo(
      new THREE.CylinderGeometry(islandRadius * 0.95, islandRadius * 0.62, 0.82, 42, 2)
    );
    const cliffPos = cliffGeo.attributes.position;
    for (let i = 0; i < cliffPos.count; i++) {
      const vx = cliffPos.getX(i);
      const vy = cliffPos.getY(i);
      const vz = cliffPos.getZ(i);
      const n = 1 + 0.05 * Math.sin(Math.atan2(vz, vx) * 6 + vy * 3);
      cliffPos.setX(i, vx * n);
      cliffPos.setZ(i, vz * n);
    }
    cliffGeo.computeVertexNormals();

    const cliffMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x3b2c22 : 0x7c583e,
        roughness: 0.96,
      })
    );
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
    cliffMesh.position.y = -0.78;
    cliffMesh.receiveShadow = true;
    worldGroup.add(cliffMesh);

    // Lago pequeno refletivo na lateral direita-fundo
    const pondPos = new THREE.Vector2(islandRadius * 0.44, -islandRadius * 0.24);
    const pondY = terrainHeightAt(pondPos.x, pondPos.y, islandRadius) + 0.015;
    const pondGeo = trackGeo(new THREE.CircleGeometry(islandRadius * 0.2, 28));
    const pondMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x0e7490 : 0x38bdf8,
        roughness: 0.12,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88,
      })
    );
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.25, 0.85, 1);
    pond.position.set(pondPos.x, pondY, pondPos.y);
    pond.receiveShadow = true;
    worldGroup.add(pond);

    // Pedras orgânicas na beira do lago
    const stoneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x64748b : 0x94a3b8,
        roughness: 0.85,
      })
    );
    for (let s = 0; s < 7; s++) {
      const ang = (s / 7) * Math.PI * 2;
      const sx = pondPos.x + Math.cos(ang) * islandRadius * 0.22;
      const sz = pondPos.y + Math.sin(ang) * islandRadius * 0.16;
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.scale.set(0.16 + (s % 3) * 0.05, 0.1, 0.14 + ((s + 1) % 2) * 0.05);
      stone.position.set(sx, terrainHeightAt(sx, sz, islandRadius) + 0.04, sz);
      stone.rotation.y = s * 0.9;
      stone.castShadow = true;
      stone.receiveShadow = true;
      worldGroup.add(stone);
    }

    // Relva orgânica em InstancedMesh (1 chamada de draw apenas)
    const grassCount = 140;
    const bladeGeo = trackGeo(new THREE.ConeGeometry(0.028, 0.18, 4));
    bladeGeo.translate(0, 0.09, 0);
    const bladeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x22c55e : 0x65a30d,
        roughness: 0.85,
      })
    );
    const grassInst = new THREE.InstancedMesh(bladeGeo, bladeMat, grassCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < grassCount; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);
      const r = 0.65 + ((i * 37) % 100) / 100 * (islandRadius - 0.85);
      const gx = Math.cos(a) * r;
      const gz = Math.sin(a) * r;
      if (Math.hypot(gx - pondPos.x, gz - pondPos.y) < islandRadius * 0.24) {
        dummy.scale.setScalar(0);
      } else {
        const gy = terrainHeightAt(gx, gz, islandRadius);
        dummy.position.set(gx, gy, gz);
        dummy.rotation.set(((i % 5) - 2) * 0.08, a, ((i % 3) - 1) * 0.08);
        dummy.scale.setScalar(0.75 + (i % 4) * 0.18);
      }
      dummy.updateMatrix();
      grassInst.setMatrixAt(i, dummy.matrix);
    }
    grassInst.instanceMatrix.needsUpdate = true;
    worldGroup.add(grassInst);

    // Constrói árvore botânica orgânica madura ou em formação
    const buildOrganicTree = (
      colorHex: string,
      species: BotanicalSpecies,
      scale: number,
      isWithered: boolean,
      seedIdx: number
    ): THREE.Group => {
      const group = new THREE.Group();

      if (isWithered) {
        const trunk = new THREE.Mesh(
          trackGeo(
            createTaperedCurveTubeGeo(
              [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0.05, 0.35, 0.02),
                new THREE.Vector3(-0.04, 0.72, -0.02),
              ],
              0.085,
              0.032,
              8,
              7
            )
          ),
          witheredBarkMat
        );
        trunk.castShadow = true;
        group.add(trunk);

        const limb = new THREE.Mesh(
          trackGeo(
            createTaperedCurveTubeGeo(
              [
                new THREE.Vector3(0.02, 0.42, 0),
                new THREE.Vector3(0.18, 0.58, 0.05),
                new THREE.Vector3(0.28, 0.65, 0.08),
              ],
              0.032,
              0.012,
              6,
              6
            )
          ),
          witheredBarkMat
        );
        limb.castShadow = true;
        group.add(limb);

        group.scale.setScalar(scale);
        return group;
      }

      const areaColor = new THREE.Color(colorHex || '#10b981');
      // Folhagem fiel à coloração da Grande Área escolhida, com variação tonal orgânica (luz e sombra)
      const canopyMainColor = areaColor.clone();
      const canopyLightColor = areaColor.clone().lerp(new THREE.Color(0xffffff), 0.22);
      const canopyShadowColor = areaColor.clone().multiplyScalar(0.72);
      const blossomColor = areaColor.clone().lerp(new THREE.Color(0xffffff), 0.38);

      const leafMainMat = trackMat(
        new THREE.MeshStandardMaterial({ color: canopyMainColor, roughness: 0.78 })
      );
      const leafLightMat = trackMat(
        new THREE.MeshStandardMaterial({ color: canopyLightColor, roughness: 0.74 })
      );
      const leafDarkMat = trackMat(
        new THREE.MeshStandardMaterial({ color: canopyShadowColor, roughness: 0.84 })
      );
      const blossomMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: blossomColor,
          roughness: 0.6,
          emissive: blossomColor,
          emissiveIntensity: 0.08,
        })
      );

      if (species === 'tropical_palm') {
        const lean = ((seedIdx % 3) - 1) * 0.12;
        const trunk = new THREE.Mesh(
          trackGeo(
            createTaperedCurveTubeGeo(
              [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(lean * 0.6, 0.55, 0.04),
                new THREE.Vector3(lean * 1.3, 1.15, -0.02),
              ],
              0.075,
              0.042,
              12,
              8
            )
          ),
          barkMat
        );
        trunk.castShadow = true;
        group.add(trunk);

        const topPosVec = new THREE.Vector3(lean * 1.3, 1.14, -0.02);
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2 + seedIdx * 0.4;
          const frond = new THREE.Mesh(leafBladeGeo, f % 2 === 0 ? leafMainMat : leafLightMat);
          frond.position.copy(topPosVec);
          frond.rotation.y = ang;
          frond.rotation.x = Math.PI / 2.25;
          frond.scale.set(1.15, 1.35, 1.1);
          frond.castShadow = true;
          group.add(frond);
        }

        // Flores/frutos tropicais na base da copa
        for (let b = 0; b < 3; b++) {
          const dot = new THREE.Mesh(seedPodGeo, blossomMat);
          dot.scale.setScalar(0.38);
          const a = (b / 3) * Math.PI * 2;
          dot.position.set(
            topPosVec.x + Math.cos(a) * 0.07,
            topPosVec.y - 0.05,
            topPosVec.z + Math.sin(a) * 0.07
          );
          group.add(dot);
        }
      } else if (species === 'alpine_pine') {
        const trunk = new THREE.Mesh(
          trackGeo(
            createTaperedCurveTubeGeo(
              [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0.02, 0.6, 0),
                new THREE.Vector3(0, 1.28, 0),
              ],
              0.085,
              0.022,
              10,
              8
            )
          ),
          darkBarkMat
        );
        trunk.castShadow = true;
        group.add(trunk);

        const tiers = [
          { y: 0.56, radius: 0.44, puffs: 5 },
          { y: 0.88, radius: 0.34, puffs: 4 },
          { y: 1.16, radius: 0.23, puffs: 3 },
        ];
        tiers.forEach((tier, ti) => {
          for (let p = 0; p < tier.puffs; p++) {
            const ang = (p / tier.puffs) * Math.PI * 2 + ti * 0.65;
            const puff = new THREE.Mesh(
              canopyBlobs[(p + ti) % canopyBlobs.length],
              ti === 2 ? leafLightMat : ti === 1 ? leafMainMat : leafDarkMat
            );
            puff.position.set(
              Math.cos(ang) * tier.radius * 0.46,
              tier.y,
              Math.sin(ang) * tier.radius * 0.46
            );
            puff.scale.set(tier.radius * 0.78, tier.radius * 0.48, tier.radius * 0.78);
            puff.castShadow = true;
            puff.receiveShadow = true;
            group.add(puff);
          }
          const crown = new THREE.Mesh(canopyBlobs[ti % canopyBlobs.length], leafMainMat);
          crown.position.set(0, tier.y + 0.1, 0);
          crown.scale.set(tier.radius * 0.7, tier.radius * 0.52, tier.radius * 0.7);
          crown.castShadow = true;
          group.add(crown);
        });
      } else {
        // Ipê / Carvalho / Cerejeira orgânica com bifurcação real de galhos
        const bendX = ((seedIdx % 5) - 2) * 0.04;
        const trunk = new THREE.Mesh(
          trackGeo(
            createTaperedCurveTubeGeo(
              [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(bendX, 0.38, 0.02),
                new THREE.Vector3(bendX * 1.4, 0.72, -0.02),
              ],
              0.095,
              0.048,
              10,
              8
            )
          ),
          barkMat
        );
        trunk.castShadow = true;
        group.add(trunk);

        const branchDefs = [
          { end: new THREE.Vector3(0.28 + bendX, 0.92, 0.16), r: 0.32 },
          { end: new THREE.Vector3(-0.26 + bendX, 0.88, 0.14), r: 0.3 },
          { end: new THREE.Vector3(bendX * 0.8, 0.96, -0.26), r: 0.31 },
          { end: new THREE.Vector3(bendX * 1.2, 1.12, 0.02), r: 0.36 },
        ];

        const baseJoin = new THREE.Vector3(bendX * 1.1, 0.62, 0);
        branchDefs.forEach((b, bi) => {
          const mid = baseJoin.clone().lerp(b.end, 0.5);
          mid.y += 0.06;
          const limb = new THREE.Mesh(
            trackGeo(createTaperedCurveTubeGeo([baseJoin, mid, b.end], 0.036, 0.016, 7, 6)),
            barkMat
          );
          limb.castShadow = true;
          group.add(limb);

          const isSakuraOrIpe = species === 'sakura_weeping' || species === 'ipe_blossom';
          const mat =
            bi === 3
              ? isSakuraOrIpe
                ? blossomMat
                : leafLightMat
              : bi % 2 === 0
              ? leafMainMat
              : leafDarkMat;
          const cluster = new THREE.Mesh(canopyBlobs[(bi + seedIdx) % canopyBlobs.length], mat);
          cluster.position.copy(b.end);
          cluster.scale.set(
            b.r * (species === 'broad_oak' ? 1.18 : 1.0),
            b.r * 0.82,
            b.r * (species === 'broad_oak' ? 1.18 : 1.0)
          );
          cluster.castShadow = true;
          cluster.receiveShadow = true;
          group.add(cluster);

          // Pequenos aglomerados florais nas pontas para Ipê / Cerejeira
          if (isSakuraOrIpe) {
            const bloom = new THREE.Mesh(canopyBlobs[(bi + 1) % canopyBlobs.length], blossomMat);
            bloom.position.set(b.end.x * 1.08, b.end.y + 0.08, b.end.z * 1.08);
            bloom.scale.setScalar(b.r * 0.58);
            bloom.castShadow = true;
            group.add(bloom);
          }
        });
      }

      group.scale.setScalar(scale);
      return group;
    };

    // Constrói os 4 estágios orgânicos para cada um dos 3 Canteiros do Viveiro
    const buildNurseryPlantByStage = (
      colorHex: string,
      species: BotanicalSpecies,
      accumulatedSec: number,
      seedIdx: number
    ): THREE.Group => {
      const prog = getNurserySlotProgress(accumulatedSec);
      const group = new THREE.Group();
      const areaColor = new THREE.Color(colorHex || '#10b981');
      const leafMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: areaColor.clone(),
          roughness: 0.62,
        })
      );
      const budColorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: areaColor.clone().lerp(new THREE.Color(0xffffff), 0.28),
          roughness: 0.45,
          emissive: areaColor,
          emissiveIntensity: 0.18,
        })
      );

      if (prog.stageNumber === 1) {
        // Estágio 1 (0-25 min): Semente germinando com broto embrionário e cotilédones
        const seedGeo = trackGeo(new THREE.SphereGeometry(0.095, 14, 12));
        const seedMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.78 })
        );
        const seedMesh = new THREE.Mesh(seedGeo, seedMat);
        seedMesh.scale.set(1.25, 0.78, 0.92);
        seedMesh.position.y = 0.055;
        seedMesh.castShadow = true;
        group.add(seedMesh);

        const sproutHeight = 0.1 + prog.stageProgressRatio * 0.14;
        const shoot = new THREE.Mesh(
          trackGeo(
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
          stemGreenMat
        );
        shoot.castShadow = true;
        group.add(shoot);

        if (prog.stageProgressRatio > 0.25) {
          for (const side of [-1, 1]) {
            const leaf = new THREE.Mesh(leafBladeGeo, leafMat);
            leaf.position.set(0.01, 0.06 + sproutHeight, 0);
            leaf.rotation.z = side * 0.9;
            leaf.rotation.x = 0.45;
            leaf.scale.setScalar(0.32 + prog.stageProgressRatio * 0.15);
            group.add(leaf);
          }
        }
      } else if (prog.stageNumber === 2) {
        // Estágio 2 (25-50 min): Broto jovem com caule flexível e folhas esculpidas
        const h = 0.34 + prog.stageProgressRatio * 0.16;
        const stem = new THREE.Mesh(
          trackGeo(
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
          stemGreenMat
        );
        stem.castShadow = true;
        group.add(stem);

        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + 0.4;
          const leaf = new THREE.Mesh(leafBladeGeo, leafMat);
          leaf.position.set(0.01, h * (0.62 + (i % 2) * 0.25), 0);
          leaf.rotation.y = ang;
          leaf.rotation.x = Math.PI / 2.6;
          leaf.scale.setScalar(0.55 + (i % 2) * 0.12);
          leaf.castShadow = true;
          group.add(leaf);
        }

        const apexBud = new THREE.Mesh(seedPodGeo, budColorMat);
        apexBud.scale.setScalar(0.42);
        apexBud.position.set(0.02, h + 0.03, -0.01);
        group.add(apexBud);
      } else if (prog.stageNumber === 3) {
        // Estágio 3 (50-75 min): Árvore jovem com tronco lenhoso, 2 galhos e copa inicial
        const tree = buildOrganicTree(colorHex, species, 0.62 + prog.stageProgressRatio * 0.12, false, seedIdx);
        group.add(tree);
      } else {
        // Estágio 4 (75-100 min): Copa em floração quase madura!
        const tree = buildOrganicTree(colorHex, species, 0.88 + prog.stageProgressRatio * 0.16, false, seedIdx);
        group.add(tree);
      }

      return group;
    };

    // Posições orgânicas espalhadas aleatoriamente por toda a ilha (sem canteiros fixos)
    const occupiedPoints: Array<{ x: number; z: number }> = [];
    const nurseryPositions: Array<{ x: number; z: number }> = nurserySlots.map((slot, idx) => {
      const pt = pickOrganicMapPoint(
        `nursery-${idx}-${slot.plotSeed ?? (idx * 317 + 137)}`,
        islandRadius,
        pondPos,
        occupiedPoints,
        1.55,
        0.35
      );
      occupiedPoints.push(pt);
      return pt;
    });

    const animatedBees: Array<{
      group: THREE.Group;
      wingL: THREE.Mesh;
      wingR: THREE.Mesh;
      center: THREE.Vector3;
      radius: number;
      speed: number;
      phase: number;
    }> = [];

    const animatedDrops: Array<{
      mesh: THREE.Mesh;
      center: THREE.Vector3;
      phase: number;
    }> = [];

    const clickableBedTargets: THREE.Object3D[] = [];
    let activeBedRing: THREE.Mesh | null = null;
    let activeBedPlantGroup: THREE.Group | null = null;

    nurserySlots.forEach((slot, idx) => {
      const pos = nurseryPositions[idx];
      const groundY = terrainHeightAt(pos.x, pos.z, islandRadius);
      const isSelected = idx === activeSlotIndex;
      const slotStyle = getAreaStyle(slot.area, areas);
      const liveSec = isSelected ? activeSlotLiveSeconds : slot.accumulatedSeconds;
      const prog = getNurserySlotProgress(liveSec);

      const bedGroup = new THREE.Group();
      bedGroup.position.set(pos.x, groundY, pos.z);
      bedGroup.userData = { nurserySlotIndex: idx };

      // Pequeno monte natural de terra fértil no chão (sem borda rígida/quadrada)
      const moundGeo = trackGeo(new THREE.SphereGeometry(0.46, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2));
      const mound = new THREE.Mesh(moundGeo, soilMat);
      mound.scale.set(1, 0.16, 1);
      mound.position.y = 0.01;
      mound.receiveShadow = true;
      mound.userData = { nurserySlotIndex: idx };
      bedGroup.add(mound);

      if (isSelected) {
        const ringGeo = trackGeo(new THREE.RingGeometry(0.56, 0.65, 36));
        const ringMat = trackMat(
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(slotStyle.primary),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isTimerRunningOrPaused ? 0.9 : 0.6,
          })
        );
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.03;
        bedGroup.add(ring);
        activeBedRing = ring;
      }

      const plant = buildNurseryPlantByStage(
        slotStyle.primary,
        getSpeciesForArea(slot.area, idx),
        liveSec,
        idx + 1
      );
      plant.position.y = 0.06;
      plant.traverse(child => {
        child.userData = { nurserySlotIndex: idx };
      });
      bedGroup.add(plant);
      if (isSelected) {
        activeBedPlantGroup = plant;
      }

      // Abelhas animadas quando há enxame ativo OU planta já está no Estágio 4
      const hasActiveBees =
        (slot.beesActiveUntilMs && slot.beesActiveUntilMs > Date.now()) ||
        prog.stageNumber === 4;
      if (hasActiveBees) {
        const beeCount = slot.beesActiveUntilMs && slot.beesActiveUntilMs > Date.now() ? 3 : 1;
        for (let b = 0; b < beeCount; b++) {
          const beeGroup = new THREE.Group();
          const body = new THREE.Mesh(beeBodyGeo, beeBodyMat);
          body.rotation.z = Math.PI / 2;
          beeGroup.add(body);

          const wingL = new THREE.Mesh(beeWingGeo, beeWingMat);
          wingL.position.set(0, 0.03, 0.025);
          wingL.rotation.x = 0.5;
          beeGroup.add(wingL);

          const wingR = new THREE.Mesh(beeWingGeo, beeWingMat);
          wingR.position.set(0, 0.03, -0.025);
          wingR.rotation.x = -0.5;
          beeGroup.add(wingR);

          worldGroup.add(beeGroup);
          animatedBees.push({
            group: beeGroup,
            wingL,
            wingR,
            center: new THREE.Vector3(pos.x, groundY + 0.55 + prog.stageNumber * 0.15, pos.z),
            radius: 0.42 + b * 0.12,
            speed: 1.7 + b * 0.35,
            phase: idx * 2.1 + b * 2.09,
          });
        }
      }

      // Partículas ascendentes recentes quando acabou de aplicar Água/Adubo/Abelha
      if (slot.lastBoostAtMs && Date.now() - slot.lastBoostAtMs < 15000) {
        const dropGeo = trackGeo(new THREE.OctahedronGeometry(0.035, 1));
        const dropMat = trackMat(
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
        );
        for (let dIdx = 0; dIdx < 6; dIdx++) {
          const drop = new THREE.Mesh(dropGeo, dropMat);
          worldGroup.add(drop);
          animatedDrops.push({
            mesh: drop,
            center: new THREE.Vector3(pos.x, groundY + 0.25, pos.z),
            phase: dIdx * 1.05,
          });
        }
      }

      worldGroup.add(bedGroup);
      clickableBedTargets.push(bedGroup);
    });

    // Árvores maduras espalhadas de modo orgânico e aleatório por toda a ilha
    permanentTrees.forEach((treeItem, idx) => {
      const pt = pickOrganicMapPoint(
        treeItem.id,
        islandRadius,
        pondPos,
        occupiedPoints,
        0.92,
        0.3
      );
      occupiedPoints.push(pt);

      const ty = terrainHeightAt(pt.x, pt.z, islandRadius);
      const treeMesh = buildOrganicTree(
        treeItem.colorHex,
        treeItem.species,
        treeItem.scale,
        treeItem.isWithered,
        idx
      );
      treeMesh.position.set(pt.x, ty - 0.02, pt.z);
      treeMesh.rotation.y = (idx * 1.37) % (Math.PI * 2);
      worldGroup.add(treeMesh);
    });

    // Raycaster para selecionar canteiro clicando direto na ilha 3D
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let isDragging = false;
    let movedDuringPointer = false;
    let lastX = 0;
    let yaw = 1.57; // Começa olhando de frente para os 3 canteiros
    let pitch = 0.46;

    const domEl = renderer.domElement;
    domEl.style.cursor = 'grab';

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      movedDuringPointer = false;
      lastX = e.clientX;
      domEl.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      if (Math.abs(dx) > 2) movedDuringPointer = true;
      lastX = e.clientX;
      yaw += dx * 0.008;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (isDragging && !movedDuringPointer && onSelectSlotRef.current) {
        const rect = domEl.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(clickableBedTargets, true);
        if (hits.length > 0) {
          const slotIdx = hits[0].object.userData?.nurserySlotIndex;
          if (slotIdx === 0 || slotIdx === 1 || slotIdx === 2) {
            onSelectSlotRef.current(slotIdx);
          }
        }
      }
      isDragging = false;
      domEl.style.cursor = 'grab';
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let t = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      if (autoRotateRef.current && !isDragging && !prefersReduced) {
        yaw += 0.0018;
      }

      if (activeBedRing && !prefersReduced) {
        const ringMat = activeBedRing.material as THREE.MeshBasicMaterial;
        ringMat.opacity = (isTimerRunningOrPaused ? 0.72 : 0.45) + Math.sin(t * 3.1) * 0.22;
      }

      if (activeBedPlantGroup && isTimerRunningOrPaused && !prefersReduced) {
        const sway = Math.sin(t * 2.2) * 0.025;
        activeBedPlantGroup.rotation.z = sway;
      }

      if (!prefersReduced) {
        for (const bee of animatedBees) {
          const ang = t * bee.speed + bee.phase;
          bee.group.position.set(
            bee.center.x + Math.cos(ang) * bee.radius,
            bee.center.y + Math.sin(ang * 2.1) * 0.11,
            bee.center.z + Math.sin(ang) * bee.radius
          );
          bee.group.rotation.y = -ang + Math.PI / 2;
          const flap = Math.sin(t * 26 + bee.phase) * 0.55;
          bee.wingL.rotation.x = 0.5 + flap;
          bee.wingR.rotation.x = -0.5 - flap;
        }

        for (const drop of animatedDrops) {
          const cycle = (t * 0.9 + drop.phase) % 1;
          const ang = drop.phase * 2.4 + t * 1.4;
          drop.mesh.position.set(
            drop.center.x + Math.cos(ang) * 0.34,
            drop.center.y + cycle * 0.85,
            drop.center.z + Math.sin(ang) * 0.34
          );
          drop.mesh.scale.setScalar(1 - cycle * 0.6);
        }
      }

      const dist = Math.max(4.8, Math.min(18, baseCamDist + zoomOffsetRef.current));
      camera.position.x = Math.cos(yaw) * Math.cos(pitch) * dist;
      camera.position.z = Math.sin(yaw) * Math.cos(pitch) * dist;
      camera.position.y = Math.sin(pitch) * dist;
      camera.lookAt(0, 0.35, 0.25);

      renderer?.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);

      disposableGeos.forEach(g => g.dispose());
      disposableMats.forEach(m => m.dispose());
      renderer?.dispose();
      if (container) container.innerHTML = '';
    };
  }, [permanentTrees, areas, resolvedTheme, nurserySignature, activeSlotIndex, isTimerRunningOrPaused]);

  const liveTreesCount = permanentTrees.filter(t => !t.isWithered).length;
  const witheredCount = permanentTrees.filter(t => t.isWithered).length;
  const activeStage = getNurserySlotProgress(activeSlotLiveSeconds);

  if (webglFailed) {
    return (
      <div
        className={`rounded-2xl border border-border bg-gradient-to-b from-emerald-500/10 via-card to-card p-6 flex flex-col items-center justify-center text-center gap-3 ${heightClassName}`}
      >
        <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-500">
          <Trees className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {liveTreesCount} árvores maduras + 3 canteiros ativos no viveiro
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Visualização 2D ativa (WebGL indisponível neste dispositivo).
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-md pt-2">
          {nurserySlots.map((slot, idx) => {
            const p = Math.round(
              ((idx === activeSlotIndex ? activeSlotLiveSeconds : slot.accumulatedSeconds) /
                FULL_TREE_SECONDS) *
                100
            );
            return (
              <span
                key={slot.slotIndex}
                className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold bg-card"
              >
                Canteiro {idx + 1}: {slot.area} ({p}%)
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-border overflow-hidden bg-gradient-to-b from-sky-500/10 via-emerald-500/5 to-card shadow-inner">
      {/* Canvas WebGL 3D */}
      <div ref={containerRef} className={`w-full ${heightClassName}`} />

      {/* Overlay Superior Esquerdo: Contadores */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-md border border-border text-[11px] font-bold text-foreground shadow-sm">
          <Trees className="h-3.5 w-3.5 text-emerald-500" />
          <span>
            {liveTreesCount} {liveTreesCount === 1 ? 'árvore madura' : 'árvores maduras'}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-md border border-border text-[11px] font-bold text-foreground shadow-sm">
          <Flower2 className="h-3.5 w-3.5 text-amber-500" />
          <span>
            Canteiro {activeSlotIndex + 1} • Estágio {activeStage.stageNumber}/4
          </span>
        </span>
        {witheredCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-md border border-border text-[11px] font-semibold text-muted-foreground shadow-sm">
            {witheredCount} {witheredCount === 1 ? 'galho seco' : 'galhos secos'}
          </span>
        )}
        {isTimerRunningOrPaused && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-sm">
            <Sparkles className="h-3 w-3" /> Cultivando ao vivo
          </span>
        )}
      </div>

      {/* Overlay Superior Direito: Controles de Câmera */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setZoomOffset(z => Math.max(-4, z - 1.4))}
          className="h-7 w-7 bg-card/85 backdrop-blur-md"
          title="Aproximar câmera"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setZoomOffset(z => Math.min(6, z + 1.4))}
          className="h-7 w-7 bg-card/85 backdrop-blur-md"
          title="Afastar câmera"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={autoRotate ? 'default' : 'outline'}
          onClick={() => setAutoRotate(prev => !prev)}
          className="h-7 px-2.5 text-[11px] font-semibold gap-1 backdrop-blur-md"
          title="Alternar rotação automática"
        >
          <RotateCw className="h-3 w-3" />
          <span className="hidden sm:inline">{autoRotate ? 'Girando' : 'Parado'}</span>
        </Button>
      </div>

      {/* Dica de interação no rodapé */}
      <div className="absolute bottom-2.5 left-3 pointer-events-none">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-card/80 backdrop-blur-sm border border-border/60 text-muted-foreground">
          Arraste para girar 360° • Plantas nascem espalhadas pelo mapa com a cor da área escolhida
        </span>
      </div>
    </div>
  );
};
