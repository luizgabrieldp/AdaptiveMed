'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { useTheme } from '@/components/layout/theme-provider';
import {
  MaturedGardenTree,
  NurserySlotState,
  StudyArea,
  StudySession,
  getAreaStyle,
} from '@/types/database';
import {
  FULL_TREE_SECONDS,
  formatDurationCompact,
  getExtraMaturedGardenTrees,
  getNurserySlotProgress,
  getTreeStageLabel,
} from '@/lib/focus-timer';
import { formatDateBR } from '@/lib/spaced-repetition';
import {
  Trees,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Flower2,
  Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createProceduralTexturePack } from './forest-3d/procedural-textures';
import {
  MAX_LAKE_RIPPLES,
  applyBotanicalShader,
  applyGrassWindShader,
  createCoupledDepthMaterial,
  createInteractiveLakeMaterial,
  createParticleField,
  createVolumetricGodRays,
} from './forest-3d/shaders';
import {
  CANONICAL_ISLAND_RADIUS,
  POND_POS,
  POND_RX,
  POND_RZ,
  POND_WATER_Y,
  buildNurseryPlantGroup,
  buildSpeciesGeometryLibrary,
  computeDeterministicTreePlacement,
  computeNurseryPositions,
  createBentFoliageCardGeo,
  createFacetedRockGeo,
  createGrassTuftGeo,
  createLilyFlowerGeo,
  createLilyPadGeo,
  createPondBedGeo,
  createReedClusterGeo,
  createSubdividedIslandTopGeo,
  getSpeciesForArea,
  hashSeed,
  terrainHeightAt,
} from './forest-3d/tree-builders';
import {
  BotanicalSpecies,
  ForestBenchResult,
  ForestBenchSpeciesMetrics,
  HoveredTarget,
  PermanentTreeItem,
  SharedCanopyUniforms,
  TreeSpeciesKey,
} from './forest-3d/types';

const ALL_SPECIES: BotanicalSpecies[] = [
  'ipe_blossom',
  'broad_oak',
  'sakura_weeping',
  'tropical_palm',
  'alpine_pine',
];

const BENCH_AREA_PRESETS: Array<{
  area: string;
  species: BotanicalSpecies;
  colorHex: string;
  subject: string;
}> = [
  { area: 'Clínica Médica', species: 'ipe_blossom', colorHex: '#3b82f6', subject: 'Cardiologia' },
  { area: 'Cirurgia', species: 'broad_oak', colorHex: '#ef4444', subject: 'Abdome Agudo' },
  { area: 'Pediatria', species: 'sakura_weeping', colorHex: '#ec4899', subject: 'Neonatologia' },
  { area: 'Ginecologia e Obstetrícia', species: 'tropical_palm', colorHex: '#a855f7', subject: 'Pré-Natal' },
  { area: 'Medicina Preventiva', species: 'alpine_pine', colorHex: '#10b981', subject: 'Epidemiologia' },
];

function buildDeterministicBenchTrees(
  liveCount: number,
  witheredCount: number,
  nurseryPositions: Array<{ x: number; z: number }>
): PermanentTreeItem[] {
  const items: PermanentTreeItem[] = [];
  for (let i = 0; i < liveCount; i++) {
    const preset = BENCH_AREA_PRESETS[i % BENCH_AREA_PRESETS.length];
    const id = `bench-tree-${i}`;
    const placement = computeDeterministicTreePlacement(id, nurseryPositions);
    items.push({
      id,
      colorHex: preset.colorHex,
      isWithered: false,
      area: preset.area,
      subjectName: preset.subject,
      sessionDate: '2026-11-27',
      durationSeconds: FULL_TREE_SECONDS,
      modeLabel: i % 2 === 0 ? 'Pomodoro' : 'Cronômetro',
      species: preset.species,
      scale: placement.scaleJitter,
      rotationY: placement.rotationY,
      x: placement.x,
      z: placement.z,
    });
  }
  for (let w = 0; w < witheredCount; w++) {
    const id = `bench-withered-${w}`;
    const placement = computeDeterministicTreePlacement(id, nurseryPositions);
    items.push({
      id,
      colorHex: '#78716c',
      isWithered: true,
      area: BENCH_AREA_PRESETS[w % BENCH_AREA_PRESETS.length].area,
      subjectName: 'Sessão interrompida',
      sessionDate: '2026-11-27',
      durationSeconds: 900,
      modeLabel: 'Galho seco',
      species: 'broad_oak',
      scale: 0.86,
      rotationY: placement.rotationY,
      x: placement.x,
      z: placement.z,
    });
  }
  return items;
}

function getGeometryTriCount(geo: THREE.BufferGeometry | null): number {
  if (!geo) return 0;
  if (geo.index) return Math.round(geo.index.count / 3);
  const pos = geo.attributes.position;
  return pos ? Math.round(pos.count / 3) : 0;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)));
  return sorted[idx];
}

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
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();

  const [webglFailed, setWebglFailed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTarget | null>(null);
  const [boostTick, setBoostTick] = useState(0);

  // Estado de carga sintética para modo benchmark (?bench=1), lido pós-hidratação para evitar Hydration Mismatch
  const [benchConfig, setBenchConfig] = useState<{ active: boolean; trees: number }>({
    active: false,
    trees: 96,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setZenMode(true);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('bench') === '1') {
      const parsed = Number(params.get('benchTrees'));
      const count = Number.isFinite(parsed) && parsed >= 0 ? Math.min(200, Math.floor(parsed)) : 96;
      setBenchConfig({ active: true, trees: count });
    }
  }, []);

  const autoRotateRef = useRef(autoRotate);
  const zenModeRef = useRef(zenMode);
  const onSelectSlotRef = useRef(onSelectSlot);
  const isTimerRunningRef = useRef(isTimerRunningOrPaused);
  const activeSlotIndexRef = useRef(activeSlotIndex);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    zenModeRef.current = zenMode;
    sceneHandleRef.current?.applyShadowQuality(zenMode);
  }, [zenMode]);

  useEffect(() => {
    onSelectSlotRef.current = onSelectSlot;
  }, [onSelectSlot]);

  useEffect(() => {
    isTimerRunningRef.current = isTimerRunningOrPaused;
  }, [isTimerRunningOrPaused]);

  useEffect(() => {
    activeSlotIndexRef.current = activeSlotIndex;
  }, [activeSlotIndex]);

  useEffect(() => {
    const now = Date.now();
    let nextExpiry = Infinity;
    for (const slot of nurserySlots) {
      if (slot.lastBoostAtMs) {
        const exp = slot.lastBoostAtMs + 15000;
        if (exp > now && exp < nextExpiry) nextExpiry = exp;
      }
      if (slot.beesActiveUntilMs && slot.beesActiveUntilMs > now && slot.beesActiveUntilMs < nextExpiry) {
        nextExpiry = slot.beesActiveUntilMs;
      }
    }
    if (!Number.isFinite(nextExpiry)) return;
    const delay = Math.max(80, nextExpiry - now + 40);
    const id = window.setTimeout(() => setBoostTick(v => v + 1), delay);
    return () => window.clearTimeout(id);
  }, [nurserySlots, boostTick]);

  const nurserySeedKey = nurserySlots.map(s => `${s.slotIndex}:${s.plotSeed ?? s.slotIndex}`).join('|');
  const nurseryPositions = useMemo(
    () => computeNurseryPositions(nurserySlots, CANONICAL_ISLAND_RADIUS, POND_POS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nurserySeedKey]
  );

  // Consolida árvores maduras reais OU carga determinística de benchmark (?bench=1)
  const permanentTrees = useMemo<PermanentTreeItem[]>(() => {
    if (benchConfig.active) {
      return buildDeterministicBenchTrees(benchConfig.trees, 6, nurseryPositions);
    }

    const items: PermanentTreeItem[] = [];
    const extraMatured = getExtraMaturedGardenTrees(sessions, maturedFromGarden);

    for (const sess of sessions) {
      const style = getAreaStyle(sess.area, areas);
      if (sess.status === 'withered') {
        const treeId = `${sess.id}-withered`;
        const placement = computeDeterministicTreePlacement(treeId, nurseryPositions);
        items.push({
          id: treeId,
          colorHex: '#78716c',
          isWithered: true,
          area: sess.area,
          subjectName: sess.subject_name || 'Sessão interrompida',
          sessionDate: sess.session_date,
          durationSeconds: sess.duration_seconds,
          modeLabel: 'Galho seco',
          species: 'broad_oak',
          scale: 0.84,
          rotationY: placement.rotationY,
          x: placement.x,
          z: placement.z,
        });
      } else {
        const count = Math.max(0, sess.trees_earned || 0);
        for (let i = 0; i < count; i++) {
          const treeId = `${sess.id}-t-${i}`;
          const h = hashSeed(treeId);
          const placement = computeDeterministicTreePlacement(treeId, nurseryPositions);
          items.push({
            id: treeId,
            colorHex: style.primary,
            isWithered: false,
            area: sess.area,
            subjectName: sess.subject_name || null,
            sessionDate: sess.session_date,
            durationSeconds: sess.duration_seconds,
            modeLabel: sess.mode === 'pomodoro' ? 'Pomodoro' : 'Cronômetro',
            species: getSpeciesForArea(sess.area, h),
            scale: placement.scaleJitter,
            rotationY: placement.rotationY,
            x: placement.x,
            z: placement.z,
          });
        }
      }
    }

    for (const matured of extraMatured) {
      const style = getAreaStyle(matured.area, areas);
      const h = hashSeed(matured.id);
      const placement = computeDeterministicTreePlacement(matured.id, nurseryPositions);
      items.push({
        id: matured.id,
        colorHex: style.primary,
        isWithered: false,
        area: matured.area,
        subjectName: matured.subjectName || null,
        sessionDate: matured.sessionDate,
        durationSeconds: matured.durationSeconds ?? FULL_TREE_SECONDS,
        modeLabel: matured.source === 'session' ? 'Foco' : 'Boost',
        species: getSpeciesForArea(matured.area, h),
        scale: placement.scaleJitter,
        rotationY: placement.rotationY,
        x: placement.x,
        z: placement.z,
      });
    }

    return items.slice(0, 96);
  }, [sessions, maturedFromGarden, areas, nurseryPositions, benchConfig]);

  // Canteiros efetivos (no modo bench garantimos estágios variados 1, 2 e 3 para validação visual)
  const effectiveNurserySlots = useMemo<[NurserySlotState, NurserySlotState, NurserySlotState]>(() => {
    if (!benchConfig.active) return nurserySlots;
    return [
      { ...nurserySlots[0], area: 'Clínica Médica', accumulatedSeconds: 900 },
      { ...nurserySlots[1], area: 'Cirurgia', accumulatedSeconds: 2400 },
      { ...nurserySlots[2], area: 'Pediatria', accumulatedSeconds: 4200 },
    ];
  }, [benchConfig.active, nurserySlots]);

  const nurserySignature = useMemo(() => {
    const now = Date.now();
    return effectiveNurserySlots
      .map((slot, idx) => {
        const secs =
          !benchConfig.active && idx === activeSlotIndex
            ? activeSlotLiveSeconds
            : slot.accumulatedSeconds;
        const prog = getNurserySlotProgress(secs);
        const stepBucket = Math.floor(prog.progressRatio * 16);
        const hasBees = Boolean(slot.beesActiveUntilMs && slot.beesActiveUntilMs > now);
        const recentBoost = Boolean(slot.lastBoostAtMs && now - slot.lastBoostAtMs < 15000);
        return `${slot.area}:${slot.plotSeed ?? idx}:${prog.stageNumber}:${stepBucket}:${hasBees}:${recentBoost}`;
      })
      .join('|');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveNurserySlots, activeSlotIndex, activeSlotLiveSeconds, boostTick, benchConfig.active]);

  const sceneHandleRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    composer: EffectComposer;
    bloomPass: UnrealBloomPass;
    skyDomeMat: THREE.MeshBasicMaterial;
    envLightRT: THREE.WebGLRenderTarget;
    envDarkRT: THREE.WebGLRenderTarget;
    hemiLight: THREE.HemisphereLight;
    sunLight: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
    grassMat: THREE.MeshStandardMaterial;
    cliffMat: THREE.MeshStandardMaterial;
    pondBedMat: THREE.MeshStandardMaterial;
    barkMat: THREE.MeshStandardMaterial;
    stoneMat: THREE.MeshStandardMaterial;
    bladeMat: THREE.MeshStandardMaterial;
    soilMat: THREE.MeshStandardMaterial;
    canopyUniforms: SharedCanopyUniforms;
    particleField: ReturnType<typeof createParticleField>;
    lakeResources: ReturnType<typeof createInteractiveLakeMaterial>;
    godRays: ReturnType<typeof createVolumetricGodRays>;
    textures: ReturnType<typeof createProceduralTexturePack>;
    syncPermanentTrees: () => void;
    syncNurserySlots: () => void;
    applyShadowQuality: (zen: boolean) => void;
  } | null>(null);

  const latestDataRef = useRef({
    permanentTrees,
    nurserySlots: effectiveNurserySlots,
    nurseryPositions,
    activeSlotIndex,
    activeSlotLiveSeconds,
    isTimerRunningOrPaused,
    areas,
    resolvedTheme,
    benchActive: benchConfig.active,
  });

  latestDataRef.current = {
    permanentTrees,
    nurserySlots: effectiveNurserySlots,
    nurseryPositions,
    activeSlotIndex,
    activeSlotLiveSeconds,
    isTimerRunningOrPaused,
    areas,
    resolvedTheme,
    benchActive: benchConfig.active,
  };

  // =========================================================================
  // 1. INICIALIZAÇÃO ÚNICA DA CENA WEBGL PERSISTENTE (ZERO REBUILD)
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initStartMs = performance.now();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 420;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Controle explícito para telemetria exata de draw calls / triângulos por frame
    renderer.info.autoReset = false;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const isWebGL2 = renderer.capabilities.isWebGL2;
    const maxSamples = renderer.capabilities.maxSamples || 0;
    const msaaSamples = isWebGL2 ? Math.min(4, maxSamples) : 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
    const baseDist = CANONICAL_ISLAND_RADIUS * 2.24;
    const defaultCameraPos = new THREE.Vector3(0, baseDist * 0.44, baseDist * 0.9);
    camera.position.copy(defaultCameraPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 20.5;
    controls.minPolarAngle = 0.24;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    const baseTarget = new THREE.Vector3(0, 0.34, 0.12);
    controls.target.copy(baseTarget);
    controls.autoRotateSpeed = 0.55;
    controls.update();

    // EffectComposer com MSAA 4x corrigido (WebGLRenderTarget em dimensões lógicas + setPixelRatio/setSize)
    const composerRT = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      samples: msaaSamples,
    });
    const composer = new EffectComposer(renderer, composerRT);

    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.46,
      0.52,
      0.84
    );
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);

    // Texturas procedurais PBR 1024x1024 + IBL real via PMREMGenerator
    const textures = createProceduralTexturePack();
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envLightRT = pmrem.fromEquirectangular(textures.skyLightEnv);
    const envDarkRT = pmrem.fromEquirectangular(textures.skyDarkEnv);
    pmrem.dispose();

    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];
    const dynamicGeos: THREE.BufferGeometry[] = [];
    const cachedAreaAccentMats = new Map<string, THREE.MeshStandardMaterial>();

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposableGeos.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposableMats.push(m);
      return m;
    };

    // Cúpula atmosférica do céu
    const skyGeo = trackGeo(new THREE.SphereGeometry(52, 32, 20));
    const skyDomeMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: textures.skyDarkEnv,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    const skyDome = new THREE.Mesh(skyGeo, skyDomeMat);
    scene.add(skyDome);

    // Iluminação atmosférica PBR
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const sunPosition = new THREE.Vector3(7.5, 13.0, 8.5);
    const sunDirNorm = sunPosition.clone().normalize();
    const resolveShadowSize = (zen: boolean) => (zen || window.innerWidth < 768 ? 1024 : 2048);
    let currentShadowMapSize = resolveShadowSize(zenModeRef.current);

    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 1.38);
    sunLight.position.copy(sunPosition);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = currentShadowMapSize;
    sunLight.shadow.mapSize.height = currentShadowMapSize;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 34;
    const shadowBox = CANONICAL_ISLAND_RADIUS + 1.8;
    sunLight.shadow.camera.left = -shadowBox;
    sunLight.shadow.camera.right = shadowBox;
    sunLight.shadow.camera.top = shadowBox;
    sunLight.shadow.camera.bottom = -shadowBox;
    sunLight.shadow.bias = -0.00045;
    sunLight.shadow.normalBias = 0.024;
    scene.add(sunLight);

    const applyShadowQuality = (zen: boolean) => {
      const nextSize = resolveShadowSize(zen);
      if (nextSize !== currentShadowMapSize) {
        currentShadowMapSize = nextSize;
        sunLight.shadow.mapSize.set(nextSize, nextSize);
        if (sunLight.shadow.map) {
          sunLight.shadow.map.dispose();
          sunLight.shadow.map = null;
        }
        sunLight.shadow.needsUpdate = true;
      }
    };

    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.55);
    rimLight.position.set(-8.5, 5.5, -7.5);
    scene.add(rimLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Uniforms compartilhados entre troncos, folhas, acentos, sombras, relva e juncos
    const canopyUniforms: SharedCanopyUniforms = {
      uTime: { value: 0 },
      uMouse3D: { value: new THREE.Vector3(0, 0.5, 0) },
      uMouseVelocity: { value: new THREE.Vector3(0, 0, 0) },
      uMouseActive: { value: 0 },
      uMotionScale: { value: 1 },
      uIsDark: { value: 1 },
      uSunDir: { value: sunDirNorm.clone() },
    };

    // =========================================================================
    // DIORAMA: TERRENO RADIAL SUBDIVIDIDO + BACIA ESCAVADA + SEIXOS + ÁGUA
    // =========================================================================
    const topGeo = trackGeo(createSubdividedIslandTopGeo(CANONICAL_ISLAND_RADIUS, 22, 52));
    const grassMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.grassDarkMap,
        normalMap: textures.grassNormalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        vertexColors: true,
        roughness: 0.88,
        metalness: 0.02,
      })
    );
    const grassMesh = new THREE.Mesh(topGeo, grassMat);
    grassMesh.receiveShadow = true;
    worldGroup.add(grassMesh);

    const cliffGeo = trackGeo(
      new THREE.CylinderGeometry(
        CANONICAL_ISLAND_RADIUS * 0.955,
        CANONICAL_ISLAND_RADIUS * 0.6,
        0.92,
        48,
        3
      )
    );
    const cliffPos = cliffGeo.attributes.position;
    for (let i = 0; i < cliffPos.count; i++) {
      const vx = cliffPos.getX(i);
      const vy = cliffPos.getY(i);
      const vz = cliffPos.getZ(i);
      const n = 1 + 0.045 * Math.sin(Math.atan2(vz, vx) * 6 + vy * 3);
      cliffPos.setX(i, vx * n);
      cliffPos.setZ(i, vz * n);
    }
    cliffGeo.computeVertexNormals();

    const cliffMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.cliffDarkMap,
        normalMap: textures.cliffNormalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: 0.94,
        metalness: 0.04,
      })
    );
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
    cliffMesh.position.y = -0.88;
    cliffMesh.receiveShadow = true;
    worldGroup.add(cliffMesh);

    // Fundo de seixos submersos na bacia escavada (-0.24m)
    const pondBedGeo = trackGeo(createPondBedGeo(CANONICAL_ISLAND_RADIUS));
    const pondBedMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.pebbleBedMap,
        normalMap: textures.rockNormalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughness: 0.9,
        metalness: 0.02,
      })
    );
    const pondBedMesh = new THREE.Mesh(pondBedGeo, pondBedMat);
    pondBedMesh.receiveShadow = true;
    worldGroup.add(pondBedMesh);

    // Superfície interativa do lago com Fresnel + caustics + borda úmida + ripples
    const pondGeo = trackGeo(new THREE.CircleGeometry(1.0, 44));
    const lakeResources = createInteractiveLakeMaterial();
    lakeResources.uniforms.uSunDir.value.copy(sunDirNorm);
    trackMat(lakeResources.material);

    const pondMesh = new THREE.Mesh(pondGeo, lakeResources.material);
    pondMesh.rotation.x = -Math.PI / 2;
    pondMesh.scale.set(POND_RX * 0.98, POND_RZ * 0.98, 1);
    pondMesh.position.set(POND_POS.x, POND_WATER_Y, POND_POS.y);
    worldGroup.add(pondMesh);

    // Pedras facetadas PBR com musgo (InstancedMesh - 1 draw call)
    const stoneGeo = trackGeo(createFacetedRockGeo(17));
    const stoneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.rockMossMap,
        normalMap: textures.rockNormalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.84,
        metalness: 0.04,
      })
    );
    const stoneCount = 12;
    const stoneInst = new THREE.InstancedMesh(stoneGeo, stoneMat, stoneCount);
    stoneInst.castShadow = true;
    stoneInst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let s = 0; s < stoneCount; s++) {
      let sx: number;
      let sz: number;
      if (s < 9) {
        const ang = (s / 9) * Math.PI * 2 + 0.18;
        sx = POND_POS.x + Math.cos(ang) * POND_RX * (0.94 + (s % 3) * 0.08);
        sz = POND_POS.y + Math.sin(ang) * POND_RZ * (0.94 + ((s + 1) % 3) * 0.08);
      } else {
        const ang = (s - 9) * 2.1 + 1.4;
        const rad = CANONICAL_ISLAND_RADIUS * 0.78;
        sx = Math.cos(ang) * rad;
        sz = Math.sin(ang) * rad;
      }
      const sy = terrainHeightAt(sx, sz, CANONICAL_ISLAND_RADIUS);
      dummy.position.set(sx, sy + 0.045, sz);
      dummy.rotation.set(((s % 3) - 1) * 0.1, s * 1.15, (((s + 1) % 3) - 1) * 0.08);
      dummy.scale.set(0.18 + (s % 3) * 0.06, 0.11 + (s % 2) * 0.045, 0.15 + ((s + 1) % 3) * 0.05);
      dummy.updateMatrix();
      stoneInst.setMatrixAt(s, dummy.matrix);
    }
    stoneInst.instanceMatrix.needsUpdate = true;
    worldGroup.add(stoneInst);

    // Nenúfares (lily pads + flores) flutuando e reagindo aos ripples da água
    const lilyPadGeo = trackGeo(createLilyPadGeo());
    const lilyPadMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.lilyPadMap,
        side: THREE.DoubleSide,
        alphaTest: 0.42,
        alphaToCoverage: isWebGL2 && msaaSamples >= 2,
        roughness: 0.52,
        metalness: 0.02,
      })
    );
    const lilyFlowerGeo = trackGeo(createLilyFlowerGeo());
    const lilyFlowerMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfdf2f8,
        emissive: 0xf472b6,
        emissiveIntensity: 0.14,
        map: textures.lilyFlowerMap,
        side: THREE.DoubleSide,
        alphaTest: 0.35,
        roughness: 0.38,
      })
    );

    const lilyConfigs: Array<{ x: number; z: number; rot: number; scale: number; hasFlower: boolean }> = [];
    const lilyTotal = 14;
    for (let i = 0; i < lilyTotal; i++) {
      const a = i * 2.39996 + 0.4;
      const rNorm = 0.22 + ((i * 37) % 100) / 100 * 0.56;
      const lx = POND_POS.x + Math.cos(a) * POND_RX * rNorm;
      const lz = POND_POS.y + Math.sin(a) * POND_RZ * rNorm;
      lilyConfigs.push({
        x: lx,
        z: lz,
        rot: a * 1.7,
        scale: 0.65 + (i % 4) * 0.16,
        hasFlower: i % 3 === 0,
      });
    }
    const lilyInst = new THREE.InstancedMesh(lilyPadGeo, lilyPadMat, lilyConfigs.length);
    lilyInst.receiveShadow = true;
    const flowerLilies = lilyConfigs.filter(l => l.hasFlower);
    const lilyFlowerInst = new THREE.InstancedMesh(lilyFlowerGeo, lilyFlowerMat, flowerLilies.length);

    lilyConfigs.forEach((cfg, idx) => {
      dummy.position.set(cfg.x, POND_WATER_Y + 0.008, cfg.z);
      dummy.rotation.set(0, cfg.rot, 0);
      dummy.scale.setScalar(cfg.scale);
      dummy.updateMatrix();
      lilyInst.setMatrixAt(idx, dummy.matrix);
    });
    lilyInst.instanceMatrix.needsUpdate = true;

    flowerLilies.forEach((cfg, idx) => {
      dummy.position.set(cfg.x, POND_WATER_Y + 0.012, cfg.z);
      dummy.rotation.set(0, cfg.rot + 0.4, 0);
      dummy.scale.setScalar(cfg.scale);
      dummy.updateMatrix();
      lilyFlowerInst.setMatrixAt(idx, dummy.matrix);
    });
    lilyFlowerInst.instanceMatrix.needsUpdate = true;
    worldGroup.add(lilyInst, lilyFlowerInst);

    // Juncos e samambaias na margem do lago (InstancedMesh - 1 draw call)
    const reedGeo = trackGeo(createReedClusterGeo());
    const reedMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.reedMap,
        side: THREE.DoubleSide,
        alphaTest: 0.42,
        alphaToCoverage: isWebGL2 && msaaSamples >= 2,
        vertexColors: true,
        roughness: 0.72,
      })
    );
    applyGrassWindShader(reedMat, canopyUniforms, {
      swayStrength: 0.065,
      cacheKey: 'forest-reed-wind-v1',
    });
    const reedCount = 26;
    const reedInst = new THREE.InstancedMesh(reedGeo, reedMat, reedCount);
    reedInst.castShadow = true;
    reedInst.receiveShadow = true;
    for (let i = 0; i < reedCount; i++) {
      const ang = (i / reedCount) * Math.PI * 2 + ((i % 3) - 1) * 0.09;
      const distMult = 0.92 + ((i * 29) % 10) * 0.022;
      const rx = POND_POS.x + Math.cos(ang) * POND_RX * distMult;
      const rz = POND_POS.y + Math.sin(ang) * POND_RZ * distMult;
      const ry = terrainHeightAt(rx, rz, CANONICAL_ISLAND_RADIUS);
      dummy.position.set(rx, ry - 0.02, rz);
      dummy.rotation.set(0, ang + i * 0.7, 0);
      dummy.scale.setScalar(0.62 + (i % 4) * 0.16);
      dummy.updateMatrix();
      reedInst.setMatrixAt(i, dummy.matrix);
    }
    reedInst.instanceMatrix.needsUpdate = true;
    worldGroup.add(reedInst);

    // 360 tufos de relva curva com gradiente e vento (InstancedMesh - 1 draw call)
    const grassTuftGeo = trackGeo(createGrassTuftGeo());
    const bladeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x3f8f45,
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0.0,
      })
    );
    applyGrassWindShader(bladeMat, canopyUniforms, {
      swayStrength: 0.052,
      cacheKey: 'forest-grass-wind-v1',
    });
    const grassCount = 360;
    const grassInst = new THREE.InstancedMesh(grassTuftGeo, bladeMat, grassCount);
    grassInst.receiveShadow = true;
    const initialBeds = latestDataRef.current.nurseryPositions;
    for (let i = 0; i < grassCount; i++) {
      const a = (i * 2.3999632) % (Math.PI * 2);
      const r = 0.55 + Math.sqrt(((i + 0.5) / grassCount)) * (CANONICAL_ISLAND_RADIUS - 0.88);
      const gx = Math.cos(a) * r;
      const gz = Math.sin(a) * r;
      const inPond =
        Math.hypot((gx - POND_POS.x) / (POND_RX * 1.18), (gz - POND_POS.y) / (POND_RZ * 1.18)) < 1.0;
      const inBed = initialBeds.some(b => Math.hypot(gx - b.x, gz - b.z) < 0.62);
      if (inPond || inBed) {
        dummy.position.set(0, -10, 0);
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(gx, terrainHeightAt(gx, gz, CANONICAL_ISLAND_RADIUS) - 0.01, gz);
        dummy.rotation.set(((i % 5) - 2) * 0.05, a + i * 0.37, ((i % 3) - 1) * 0.05);
        dummy.scale.setScalar(0.76 + (i % 5) * 0.14);
      }
      dummy.updateMatrix();
      grassInst.setMatrixAt(i, dummy.matrix);
    }
    grassInst.instanceMatrix.needsUpdate = true;
    worldGroup.add(grassInst);

    // Campo de partículas GPU interativo (estilo Gemini Hidrogênio)
    const particleField = createParticleField(CANONICAL_ISLAND_RADIUS, 460, 130);
    particleField.uniforms.uPixelRatio.value = pixelRatio;
    trackGeo(particleField.geometry);
    trackMat(particleField.material);
    worldGroup.add(particleField.points);

    // God-rays volumétricos suaves (1 draw call aditivo, desligado no Modo Zen)
    const godRays = createVolumetricGodRays(sunDirNorm);
    trackGeo(godRays.geometry);
    trackMat(godRays.material);
    godRays.mesh.visible = !zenModeRef.current;
    worldGroup.add(godRays.mesh);

    // =========================================================================
    // MATERIAIS PBR BOTÂNICOS ACOPLADOS (CASCA + 5 FOLHAGENS + 5 ACENTOS + SOMBRAS)
    // =========================================================================
    const TREE_SWAY_STRENGTH = 0.048;

    const barkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.barkMap,
        normalMap: textures.barkNormalMap,
        normalScale: new THREE.Vector2(0.92, 0.92),
        roughnessMap: textures.barkRoughnessMap,
        roughness: 1.0,
        metalness: 0.0,
        vertexColors: true,
      })
    );
    applyBotanicalShader(barkMat, canopyUniforms, {
      swayStrength: TREE_SWAY_STRENGTH,
      enableFlutter: false,
      enableSSS: false,
      glowIntensity: 0.1,
      cacheKey: 'botanical-bark-v2',
    });

    const witheredBarkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.witheredBarkMap,
        normalMap: textures.barkNormalMap,
        normalScale: new THREE.Vector2(0.88, 0.88),
        roughnessMap: textures.barkRoughnessMap,
        roughness: 1.0,
        metalness: 0.0,
        vertexColors: true,
      })
    );
    applyBotanicalShader(witheredBarkMat, canopyUniforms, {
      swayStrength: TREE_SWAY_STRENGTH * 0.7,
      enableFlutter: false,
      enableSSS: false,
      glowIntensity: 0.08,
      cacheKey: 'botanical-withered-bark-v2',
    });

    const barkDepthMat = trackMat(
      createCoupledDepthMaterial(canopyUniforms, {
        swayStrength: TREE_SWAY_STRENGTH,
        enableFlutter: false,
        cacheKey: 'botanical-bark-depth-v2',
      })
    );

    const witheredDepthMat = trackMat(
      createCoupledDepthMaterial(canopyUniforms, {
        swayStrength: TREE_SWAY_STRENGTH * 0.7,
        enableFlutter: false,
        cacheKey: 'botanical-withered-depth-v2',
      })
    );

    const foliageMats = {} as Record<BotanicalSpecies, THREE.MeshStandardMaterial>;
    const foliageDepthMats = {} as Record<BotanicalSpecies, THREE.MeshDepthMaterial>;
    const accentMats = {} as Record<BotanicalSpecies, THREE.MeshStandardMaterial>;
    const accentDepthMats = {} as Record<BotanicalSpecies, THREE.MeshDepthMaterial>;

    const useAlphaToCoverage = isWebGL2 && msaaSamples >= 2;

    for (const species of ALL_SPECIES) {
      const fMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: textures.foliageMaps[species],
          side: THREE.DoubleSide,
          alphaTest: 0.45,
          alphaToCoverage: useAlphaToCoverage,
          roughness: 0.68,
          metalness: 0.0,
          vertexColors: true,
        })
      );
      applyBotanicalShader(fMat, canopyUniforms, {
        swayStrength: TREE_SWAY_STRENGTH,
        enableFlutter: true,
        flutterStrength: species === 'tropical_palm' ? 0.026 : 0.017,
        enableSSS: true,
        sssIntensity: 0.44,
        glowIntensity: 0.28,
        cacheKey: `botanical-foliage-${species === 'tropical_palm' ? 'palm' : 'std'}-v2`,
      });
      foliageMats[species] = fMat;

      foliageDepthMats[species] = trackMat(
        createCoupledDepthMaterial(canopyUniforms, {
          map: textures.foliageMaps[species],
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          swayStrength: TREE_SWAY_STRENGTH,
          enableFlutter: true,
          flutterStrength: species === 'tropical_palm' ? 0.026 : 0.017,
          cacheKey: `botanical-foliage-depth-${species === 'tropical_palm' ? 'palm' : 'std'}-v2`,
        })
      );

      const aMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: textures.accentMaps[species],
          side: THREE.DoubleSide,
          alphaTest: 0.42,
          alphaToCoverage: useAlphaToCoverage,
          roughness: 0.44,
          metalness: 0.02,
          vertexColors: true,
        })
      );
      applyBotanicalShader(aMat, canopyUniforms, {
        swayStrength: TREE_SWAY_STRENGTH,
        enableFlutter: true,
        flutterStrength: 0.021,
        enableSSS: true,
        sssIntensity: 0.52,
        glowIntensity: 0.58,
        cacheKey: 'botanical-accent-v2',
      });
      accentMats[species] = aMat;

      accentDepthMats[species] = trackMat(
        createCoupledDepthMaterial(canopyUniforms, {
          map: textures.accentMaps[species],
          alphaTest: 0.42,
          side: THREE.DoubleSide,
          swayStrength: TREE_SWAY_STRENGTH,
          enableFlutter: true,
          flutterStrength: 0.021,
          cacheKey: 'botanical-accent-depth-v2',
        })
      );
    }

    const getAreaAccentMat = (species: BotanicalSpecies, colorHex: string) => {
      const key = `${species}:${colorHex.toLowerCase()}`;
      let mat = cachedAreaAccentMats.get(key);
      if (!mat) {
        const tinted = new THREE.Color(colorHex || '#10b981').lerp(new THREE.Color(0xffffff), 0.16);
        mat = trackMat(
          new THREE.MeshStandardMaterial({
            color: tinted,
            map: textures.accentMaps[species],
            side: THREE.DoubleSide,
            alphaTest: 0.42,
            alphaToCoverage: useAlphaToCoverage,
            roughness: 0.44,
            metalness: 0.02,
            vertexColors: true,
          })
        );
        applyBotanicalShader(mat, canopyUniforms, {
          swayStrength: TREE_SWAY_STRENGTH,
          enableFlutter: true,
          flutterStrength: 0.021,
          enableSSS: true,
          sssIntensity: 0.52,
          glowIntensity: 0.58,
          cacheKey: 'botanical-nursery-accent-v2',
        });
        cachedAreaAccentMats.set(key, mat);
      }
      return mat;
    };

    const proxyMat = trackMat(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const stemMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.58 }));
    const soilMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.soilMap,
        normalMap: textures.soilNormalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: 0.94,
      })
    );
    const seedMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.74 }));
    const beeBodyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.35,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.45,
      })
    );
    const beeWingMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    const dropMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.75,
        roughness: 0.15,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.9,
      })
    );

    // Biblioteca botânica compartilhada das 5 espécies + muda jovem + galho seco
    const speciesLib = buildSpeciesGeometryLibrary();
    (Object.keys(speciesLib) as TreeSpeciesKey[]).forEach(k => {
      const s = speciesLib[k];
      trackGeo(s.barkGeo);
      trackGeo(s.proxyGeo);
      if (s.foliageGeo) trackGeo(s.foliageGeo);
      if (s.accentGeo) trackGeo(s.accentGeo);
      if (s.saplingBarkGeo) trackGeo(s.saplingBarkGeo);
      if (s.saplingFoliageGeo) trackGeo(s.saplingFoliageGeo);
      if (s.saplingAccentGeo) trackGeo(s.saplingAccentGeo);
    });

    const cotyledonCardGeo = trackGeo(createBentFoliageCardGeo(0.28, 0.32, 0.036, 0.045));
    const seedPodGeo = trackGeo(new THREE.SphereGeometry(0.105, 12, 10));
    const moundGeo = trackGeo(
      new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)
    );
    const ringGeo = trackGeo(new THREE.RingGeometry(0.55, 0.66, 40));
    const beeBodyGeo = trackGeo(new THREE.CapsuleGeometry(0.025, 0.045, 4, 8));
    const beeWingGeo = trackGeo(new THREE.PlaneGeometry(0.055, 0.03));
    const dropGeo = trackGeo(new THREE.OctahedronGeometry(0.038, 1));

    // Grupos dinâmicos independentes (árvores maduras separadas do viveiro!)
    const treesGroup = new THREE.Group();
    const treeProxyGroup = new THREE.Group();
    const nurseryGroup = new THREE.Group();
    const beesGroup = new THREE.Group();
    const boostDropsGroup = new THREE.Group();
    worldGroup.add(treesGroup, treeProxyGroup, nurseryGroup, beesGroup, boostDropsGroup);

    const hoverRingGeo = trackGeo(new THREE.RingGeometry(0.44, 0.53, 36));
    const hoverRingMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    const hoverRingMesh = new THREE.Mesh(hoverRingGeo, hoverRingMat);
    hoverRingMesh.rotation.x = -Math.PI / 2;
    hoverRingMesh.visible = false;
    worldGroup.add(hoverRingMesh);

    let activeBedRing: THREE.Mesh | null = null;
    let activeBedRingMat: THREE.MeshBasicMaterial | null = null;
    let activeBedPlantGroup: THREE.Group | null = null;
    let clickableBedTargets: THREE.Object3D[] = [];
    let treeHitTargets: THREE.InstancedMesh[] = [];
    let activeTreeInstancedMeshes: THREE.InstancedMesh[] = [];
    let hasRecentBoostGlobal = false;
    let lastSyncTreesMs = 0;
    let lastSyncNurseryMs = 0;
    let latestSpeciesBreakdown: Record<string, ForestBenchSpeciesMetrics> = {};

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

    const clearDynamicGroup = (grp: THREE.Group) => {
      while (grp.children.length > 0) {
        grp.remove(grp.children[0]);
      }
    };

    const disposeActiveTreeInstancedMeshes = () => {
      while (activeTreeInstancedMeshes.length > 0) {
        activeTreeInstancedMeshes.pop()?.dispose();
      }
      clearDynamicGroup(treesGroup);
      clearDynamicGroup(treeProxyGroup);
      treeHitTargets = [];
    };

    // =========================================================================
    // A) SINCRONIZAÇÃO ISOLADA DAS ÁRVORES MADURAS (INSTANCED + PROXY LOW-POLY)
    // =========================================================================
    const syncPermanentTrees = () => {
      const t0 = performance.now();
      const data = latestDataRef.current;

      disposeActiveTreeInstancedMeshes();

      const bySpecies = new Map<TreeSpeciesKey, PermanentTreeItem[]>();
      for (const item of data.permanentTrees) {
        const key: TreeSpeciesKey = item.isWithered ? 'withered' : item.species;
        const arr = bySpecies.get(key) || [];
        arr.push(item);
        bySpecies.set(key, arr);
      }

      const mDummy = new THREE.Object3D();
      const white = new THREE.Color(0xffffff);
      const areaColor = new THREE.Color();
      const foliageTint = new THREE.Color();
      const breakdown: Record<string, ForestBenchSpeciesMetrics> = {};

      bySpecies.forEach((items, key) => {
        if (items.length === 0) return;
        const spec = speciesLib[key];

        const barkInst = new THREE.InstancedMesh(
          spec.barkGeo,
          key === 'withered' ? witheredBarkMat : barkMat,
          items.length
        );
        barkInst.customDepthMaterial = key === 'withered' ? witheredDepthMat : barkDepthMat;
        barkInst.castShadow = true;
        barkInst.receiveShadow = true;
        activeTreeInstancedMeshes.push(barkInst);

        const foliageInst =
          key !== 'withered' && spec.foliageGeo
            ? new THREE.InstancedMesh(spec.foliageGeo, foliageMats[key], items.length)
            : null;
        if (foliageInst && key !== 'withered') {
          foliageInst.customDepthMaterial = foliageDepthMats[key];
          foliageInst.castShadow = true;
          foliageInst.receiveShadow = true;
          activeTreeInstancedMeshes.push(foliageInst);
        }

        const accentInst =
          key !== 'withered' && spec.accentGeo
            ? new THREE.InstancedMesh(spec.accentGeo, accentMats[key], items.length)
            : null;
        if (accentInst && key !== 'withered') {
          accentInst.customDepthMaterial = accentDepthMats[key];
          accentInst.castShadow = true;
          activeTreeInstancedMeshes.push(accentInst);
        }

        // Proxy invisível low-poly (~16 tris/árvore) para raycast <0.5ms com 0 draw calls!
        const proxyInst = new THREE.InstancedMesh(spec.proxyGeo, proxyMat, items.length);
        proxyInst.visible = false;
        proxyInst.userData = { treeItems: items };
        activeTreeInstancedMeshes.push(proxyInst);

        items.forEach((item, idx) => {
          const ty = terrainHeightAt(item.x, item.z, CANONICAL_ISLAND_RADIUS);
          mDummy.position.set(item.x, ty - 0.015, item.z);
          mDummy.rotation.set(0, item.rotationY, 0);
          mDummy.scale.setScalar(item.scale);
          mDummy.updateMatrix();

          barkInst.setMatrixAt(idx, mDummy.matrix);
          proxyInst.setMatrixAt(idx, mDummy.matrix);

          if (foliageInst) {
            foliageInst.setMatrixAt(idx, mDummy.matrix);
            // Folhagem verde natural botânica com variação orgânica sutil por árvore
            const h = hashSeed(item.id);
            const vShift = 0.91 + ((h & 0xff) / 255) * 0.16;
            const warmShift = 0.96 + (((h >>> 8) & 0xff) / 255) * 0.08;
            foliageTint.setRGB(vShift * warmShift, vShift, vShift * (2 - warmShift));
            areaColor.set(item.colorHex || '#10b981');
            // Toque levíssimo (7%) de harmonia tonal sem perder o verde natural da clorofila
            foliageTint.lerp(areaColor, 0.07);
            foliageInst.setColorAt(idx, foliageTint);
          }

          if (accentInst) {
            accentInst.setMatrixAt(idx, mDummy.matrix);
            // Acento vibrante na cor da Grande Área (flores, frutos, brotos de ponta e pinhas!)
            areaColor.set(item.colorHex || '#10b981').lerp(white, 0.15);
            accentInst.setColorAt(idx, areaColor);
          }
        });

        barkInst.instanceMatrix.needsUpdate = true;
        treesGroup.add(barkInst);

        if (foliageInst) {
          foliageInst.instanceMatrix.needsUpdate = true;
          if (foliageInst.instanceColor) foliageInst.instanceColor.needsUpdate = true;
          treesGroup.add(foliageInst);
        }
        if (accentInst) {
          accentInst.instanceMatrix.needsUpdate = true;
          if (accentInst.instanceColor) accentInst.instanceColor.needsUpdate = true;
          treesGroup.add(accentInst);
        }

        proxyInst.instanceMatrix.needsUpdate = true;
        proxyInst.computeBoundingSphere();
        treeProxyGroup.add(proxyInst);
        treeHitTargets.push(proxyInst);

        breakdown[key] = {
          instances: items.length,
          barkTris: getGeometryTriCount(spec.barkGeo),
          foliageTris: getGeometryTriCount(spec.foliageGeo),
          accentTris: getGeometryTriCount(spec.accentGeo),
        };
      });

      latestSpeciesBreakdown = breakdown;
      lastSyncTreesMs = performance.now() - t0;
    };

    // =========================================================================
    // B) SINCRONIZAÇÃO ISOLADA DOS 3 CANTEIROS DO VIVEIRO (ZERO REBUILD DE ÁRVORES!)
    // =========================================================================
    const syncNurserySlots = () => {
      const t0 = performance.now();
      const data = latestDataRef.current;

      while (dynamicGeos.length > 0) {
        dynamicGeos.pop()?.dispose();
      }
      if (activeBedRingMat) {
        activeBedRingMat.dispose();
        activeBedRingMat = null;
      }

      clearDynamicGroup(nurseryGroup);
      clearDynamicGroup(beesGroup);
      clearDynamicGroup(boostDropsGroup);

      activeBedRing = null;
      activeBedPlantGroup = null;
      clickableBedTargets = [];
      animatedBees.length = 0;
      animatedDrops.length = 0;

      const now = Date.now();
      let boostDetected = false;

      data.nurserySlots.forEach((slot, idx) => {
        const slotIdx = idx as 0 | 1 | 2;
        const pos = data.nurseryPositions[slotIdx];
        const groundY = terrainHeightAt(pos.x, pos.z, CANONICAL_ISLAND_RADIUS);
        const isSelected = slotIdx === data.activeSlotIndex;
        const slotStyle = getAreaStyle(slot.area, data.areas);
        const liveSec =
          !data.benchActive && isSelected ? data.activeSlotLiveSeconds : slot.accumulatedSeconds;
        const prog = getNurserySlotProgress(liveSec);

        const bedGroup = new THREE.Group();
        bedGroup.position.set(pos.x, groundY, pos.z);
        bedGroup.userData = { nurserySlotIndex: slotIdx };

        const mound = new THREE.Mesh(moundGeo, soilMat);
        mound.scale.set(1, 0.16, 1);
        mound.position.y = 0.01;
        mound.receiveShadow = true;
        mound.userData = { nurserySlotIndex: slotIdx };
        bedGroup.add(mound);

        if (isSelected) {
          const rMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(slotStyle.primary),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: data.isTimerRunningOrPaused ? 0.92 : 0.65,
          });
          activeBedRingMat = rMat;
          const ring = new THREE.Mesh(ringGeo, rMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.032;
          ring.userData = { nurserySlotIndex: slotIdx };
          bedGroup.add(ring);
          activeBedRing = ring;
        }

        const plant = buildNurseryPlantGroup(
          slotStyle.primary,
          getSpeciesForArea(slot.area, slotIdx),
          liveSec,
          {
            barkMat,
            barkDepthMat,
            stemMat,
            seedMat,
            foliageMats,
            foliageDepthMats,
            getAreaAccentMat,
            accentDepthMats,
          },
          {
            cotyledonCardGeo,
            seedPodGeo,
            speciesLib,
          },
          g => {
            dynamicGeos.push(g);
            return g;
          }
        );
        plant.position.y = 0.055;
        plant.traverse(child => {
          child.userData = { nurserySlotIndex: slotIdx };
        });
        bedGroup.add(plant);
        if (isSelected) {
          activeBedPlantGroup = plant;
        }

        const hasActiveBees =
          Boolean(slot.beesActiveUntilMs && slot.beesActiveUntilMs > now) || prog.stageNumber === 4;
        if (hasActiveBees) {
          const beeCount = slot.beesActiveUntilMs && slot.beesActiveUntilMs > now ? 3 : 1;
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

            beesGroup.add(beeGroup);
            animatedBees.push({
              group: beeGroup,
              wingL,
              wingR,
              center: new THREE.Vector3(pos.x, groundY + 0.58 + prog.stageNumber * 0.14, pos.z),
              radius: 0.44 + b * 0.12,
              speed: 1.75 + b * 0.35,
              phase: slotIdx * 2.1 + b * 2.09,
            });
          }
        }

        if (slot.lastBoostAtMs && now - slot.lastBoostAtMs < 15000) {
          boostDetected = true;
          for (let dIdx = 0; dIdx < 6; dIdx++) {
            const drop = new THREE.Mesh(dropGeo, dropMat);
            boostDropsGroup.add(drop);
            animatedDrops.push({
              mesh: drop,
              center: new THREE.Vector3(pos.x, groundY + 0.25, pos.z),
              phase: dIdx * 1.05,
            });
          }
        }

        nurseryGroup.add(bedGroup);
        clickableBedTargets.push(bedGroup);
      });

      hasRecentBoostGlobal = boostDetected;
      lastSyncNurseryMs = performance.now() - t0;
    };

    sceneHandleRef.current = {
      renderer,
      scene,
      camera,
      controls,
      composer,
      bloomPass,
      skyDomeMat,
      envLightRT,
      envDarkRT,
      hemiLight,
      sunLight,
      rimLight,
      grassMat,
      cliffMat,
      pondBedMat,
      barkMat,
      stoneMat,
      bladeMat,
      soilMat,
      canopyUniforms,
      particleField,
      lakeResources,
      godRays,
      textures,
      syncPermanentTrees,
      syncNurserySlots,
      applyShadowQuality,
    };

    syncPermanentTrees();
    syncNurserySlots();

    const initTotalMs = performance.now() - initStartMs;

    // =========================================================================
    // 2. RAYCASTING CONTÍNUO COM PROXIES LOW-POLY (<0.5ms), RIPPLES & TOOLTIPS
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25);
    const hitPoint = new THREE.Vector3();
    const targetMouse3D = new THREE.Vector3(0, 0.4, 0);
    const prevMouse3D = new THREE.Vector3(0, 0.4, 0);
    const smoothedVel = new THREE.Vector3();

    // Vetores pré-alocados (ZERO alocação dentro de animate()!)
    const tmpInstVel = new THREE.Vector3();
    const tmpProj = new THREE.Vector3();
    const tmpCamRight = new THREE.Vector3();
    const tmpCamUp = new THREE.Vector3();
    const tmpTargetGoal = new THREE.Vector3();
    const tmpLilyDummy = new THREE.Object3D();

    let mouseActiveTarget = 0;
    let mouseOverLakeTarget = 0;
    let rippleCursorIdx = 0;
    let lastRippleTime = -10;
    const lastRipplePos = new THREE.Vector2(999, 999);
    let parallaxNdcX = 0;
    let parallaxNdcY = 0;
    let currentHoveredKey = '';
    let pinnedTreeTooltip = false;
    let activeTooltipWorldPos: { x: number; y: number; z: number } | null = null;
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;
    let elapsedSimTime = 0;
    let cameraOverrideActive = false;

    const domEl = renderer.domElement;
    domEl.style.cursor = 'grab';

    const spawnLakeRipple = (wx: number, wz: number, strength = 1.0) => {
      lakeResources.uniforms.uRipples.value[rippleCursorIdx].set(
        wx,
        wz,
        elapsedSimTime,
        strength
      );
      rippleCursorIdx = (rippleCursorIdx + 1) % MAX_LAKE_RIPPLES;
      lastRippleTime = elapsedSimTime;
      lastRipplePos.set(wx, wz);
    };

    const projectWorldToTooltip = (worldPos: { x: number; y: number; z: number }) => {
      const tip = tooltipRef.current;
      if (!tip || !container) return;
      tmpProj.set(worldPos.x, worldPos.y, worldPos.z).project(camera);
      if (tmpProj.z > 1) {
        tip.style.opacity = '0';
        return;
      }
      tip.style.opacity = '1';
      const cw = container.clientWidth || 720;
      const ch = container.clientHeight || 420;
      const sx = (tmpProj.x * 0.5 + 0.5) * cw;
      const sy = (-tmpProj.y * 0.5 + 0.5) * ch;
      const tipW = tip.offsetWidth || 220;
      const tipH = tip.offsetHeight || 110;
      const clampedX = Math.max(10, Math.min(cw - tipW - 10, sx - tipW * 0.5));
      const clampedY = Math.max(10, Math.min(ch - tipH - 10, sy - tipH - 14));
      tip.style.transform = `translate3d(${Math.round(clampedX)}px, ${Math.round(clampedY)}px, 0)`;
    };

    const evaluateHoverAtPointer = (clientX: number, clientY: number, isClick = false) => {
      const rect = domEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      parallaxNdcX = pointerNdc.x;
      parallaxNdcY = pointerNdc.y;
      mouseActiveTarget = 1;

      raycaster.setFromCamera(pointerNdc, camera);

      const lakeHits = raycaster.intersectObject(pondMesh, false);
      if (lakeHits.length > 0) {
        const pt = lakeHits[0].point;
        targetMouse3D.copy(pt);
        mouseOverLakeTarget = 1;
        const movedDist = Math.hypot(pt.x - lastRipplePos.x, pt.z - lastRipplePos.y);
        if (isClick || (elapsedSimTime - lastRippleTime > 0.09 && movedDist > 0.14)) {
          spawnLakeRipple(pt.x, pt.z, isClick ? 1.35 : 0.82);
        }
      } else {
        mouseOverLakeTarget = 0;
        const terrainHits = raycaster.intersectObject(grassMesh, false);
        if (terrainHits.length > 0) {
          targetMouse3D.copy(terrainHits[0].point);
          targetMouse3D.y += 0.35;
        } else if (raycaster.ray.intersectPlane(interactionPlane, hitPoint)) {
          targetMouse3D.copy(hitPoint);
        }
      }

      if (isPointerDown && !isClick) {
        domEl.style.cursor = 'grabbing';
        return;
      }

      const data = latestDataRef.current;
      const bedHits = raycaster.intersectObjects(clickableBedTargets, true);
      const treeHits = raycaster.intersectObjects(treeHitTargets, false);

      const bedDist = bedHits.length > 0 ? bedHits[0].distance : Infinity;
      const treeDist = treeHits.length > 0 ? treeHits[0].distance : Infinity;

      if (bedDist <= treeDist && bedHits.length > 0) {
        const slotIdx = bedHits[0].object.userData?.nurserySlotIndex;
        if (slotIdx === 0 || slotIdx === 1 || slotIdx === 2) {
          if (isClick) {
            pinnedTreeTooltip = false;
            onSelectSlotRef.current?.(slotIdx);
          }
          const slot = data.nurserySlots[slotIdx];
          const pos = data.nurseryPositions[slotIdx];
          const gy = terrainHeightAt(pos.x, pos.z, CANONICAL_ISLAND_RADIUS);
          const liveSec =
            !data.benchActive && slotIdx === data.activeSlotIndex
              ? data.activeSlotLiveSeconds
              : slot.accumulatedSeconds;
          const prog = getNurserySlotProgress(liveSec);
          const style = getAreaStyle(slot.area, data.areas);
          const key = `slot-${slotIdx}-${prog.stageNumber}-${Math.floor(liveSec / 60)}-${slot.area}-${data.activeSlotIndex}`;

          hoverRingMesh.visible = true;
          hoverRingMesh.position.set(pos.x, gy + 0.04, pos.z);
          hoverRingMesh.scale.setScalar(1.32);
          hoverRingMat.color.set(style.primary);
          hoverRingMat.opacity = 0.78;
          domEl.style.cursor = 'pointer';

          const worldPos = { x: pos.x, y: gy + 0.65 + prog.stageNumber * 0.15, z: pos.z };
          activeTooltipWorldPos = worldPos;
          if (currentHoveredKey !== key) {
            currentHoveredKey = key;
            setHoveredTarget({
              kind: 'slot',
              slotIndex: slotIdx,
              area: slot.area,
              subjectName: slot.subjectName || null,
              stageNumber: prog.stageNumber,
              stageLabel: getTreeStageLabel(prog.stage),
              liveSeconds: liveSec,
              remainingToNextSec: prog.remainingToNextStageSec,
              hasBees: Boolean(slot.beesActiveUntilMs && slot.beesActiveUntilMs > Date.now()),
              isActive: slotIdx === data.activeSlotIndex,
              colorHex: style.primary,
              worldPos,
            });
          }
          projectWorldToTooltip(worldPos);
          return;
        }
      }

      if (treeHits.length > 0) {
        const hit = treeHits[0];
        const instanceId = hit.instanceId;
        const treeItems = hit.object.userData?.treeItems as PermanentTreeItem[] | undefined;
        if (typeof instanceId === 'number' && treeItems && treeItems[instanceId]) {
          const tree = treeItems[instanceId];
          const ty = terrainHeightAt(tree.x, tree.z, CANONICAL_ISLAND_RADIUS);
          const key = `tree-${tree.id}`;
          if (isClick) {
            pinnedTreeTooltip = true;
          }

          hoverRingMesh.visible = true;
          hoverRingMesh.position.set(tree.x, ty + 0.04, tree.z);
          hoverRingMesh.scale.setScalar(0.95);
          hoverRingMat.color.set(tree.isWithered ? '#a8a29e' : tree.colorHex);
          hoverRingMat.opacity = 0.75;
          domEl.style.cursor = 'pointer';

          const worldPos = { x: tree.x, y: ty + 1.2 * tree.scale, z: tree.z };
          activeTooltipWorldPos = worldPos;
          if (currentHoveredKey !== key) {
            currentHoveredKey = key;
            setHoveredTarget({
              kind: 'tree',
              tree,
              worldPos,
            });
          }
          projectWorldToTooltip(worldPos);
          return;
        }
      }

      if (isClick) {
        pinnedTreeTooltip = false;
      }
      if (!pinnedTreeTooltip) {
        activeTooltipWorldPos = null;
        hoverRingMesh.visible = false;
        hoverRingMat.opacity = 0;
        domEl.style.cursor = isPointerDown ? 'grabbing' : 'grab';
        if (currentHoveredKey !== '') {
          currentHoveredKey = '';
          setHoveredTarget(null);
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      domEl.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      evaluateHoverAtPointer(e.clientX, e.clientY, false);
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      isPointerDown = false;
      domEl.style.cursor = 'grab';
      if (dist < 6) {
        evaluateHoverAtPointer(e.clientX, e.clientY, true);
      }
    };

    const onPointerLeave = () => {
      mouseActiveTarget = 0;
      mouseOverLakeTarget = 0;
      parallaxNdcX = 0;
      parallaxNdcY = 0;
      isPointerDown = false;
      domEl.style.cursor = 'grab';
      if (!pinnedTreeTooltip) {
        activeTooltipWorldPos = null;
        hoverRingMesh.visible = false;
        currentHoveredKey = '';
        setHoveredTarget(null);
      }
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('pointerleave', onPointerLeave);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 420;
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h);
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
      particleField.uniforms.uPixelRatio.value = pr;
      applyShadowQuality(zenModeRef.current);
    };
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 3. LOOP DE ANIMAÇÃO (ZERO ALOCAÇÃO DE Vector3 + NENÚFARES REATIVOS + BENCH)
    // =========================================================================
    let rafId = 0;
    let lastFrameMs = performance.now();
    let lastRenderMs = 0;
    let isDisposed = false;

    // Estado de coleta de benchmark em tempo real
    let benchSamplingRemaining = 0;
    let benchRafDeltas: number[] = [];
    let benchPrevSampleMs = 0;
    let benchResolveFn: ((result: ForestBenchResult) => void) | null = null;

    const finalizeBenchmarkSample = () => {
      const zen = zenModeRef.current;
      const deltas = benchRafDeltas;
      const avgDelta =
        deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 16.67;
      const p95Delta = percentile(deltas, 0.95);
      const p99Delta = percentile(deltas, 0.99);

      // Mede separadamente total (main + shadow) vs main-only desabilitando shadowMap.autoUpdate por 1 render
      const prevAutoUpdate = renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate = true;
      renderer.shadowMap.needsUpdate = true;
      renderer.info.reset();
      if (zen) {
        renderer.render(scene, camera);
      } else {
        composer.render();
      }
      const totalDrawCalls = renderer.info.render.calls;
      const totalTriangles = renderer.info.render.triangles;

      renderer.shadowMap.autoUpdate = false;
      renderer.info.reset();
      if (zen) {
        renderer.render(scene, camera);
      } else {
        composer.render();
      }
      const mainDrawCalls = renderer.info.render.calls;
      const mainTriangles = renderer.info.render.triangles;

      renderer.shadowMap.autoUpdate = prevAutoUpdate;
      renderer.shadowMap.needsUpdate = true;

      const shadowDrawCalls = Math.max(0, totalDrawCalls - mainDrawCalls);
      const shadowTriangles = Math.max(0, totalTriangles - mainTriangles);

      // Mede 40 raycasts determinísticos sobre a ilha usando os proxies low-poly
      const raySamples: number[] = [];
      const testNdc = new THREE.Vector2();
      for (let i = 0; i < 40; i++) {
        const gx = ((i % 8) / 7) * 1.2 - 0.6;
        const gy = (Math.floor(i / 8) / 4) * 1.0 - 0.5;
        testNdc.set(gx, gy);
        const rt0 = performance.now();
        raycaster.setFromCamera(testNdc, camera);
        raycaster.intersectObjects(treeHitTargets, false);
        raycaster.intersectObjects(clickableBedTargets, true);
        raySamples.push(performance.now() - rt0);
      }
      const raycastMsAvg = raySamples.reduce((a, b) => a + b, 0) / raySamples.length;
      const raycastMsP95 = percentile(raySamples, 0.95);

      const data = latestDataRef.current;
      const result: ForestBenchResult = {
        timestamp: new Date().toISOString(),
        benchTrees: data.permanentTrees.filter(t => !t.isWithered).length,
        witheredTrees: data.permanentTrees.filter(t => t.isWithered).length,
        pixelRatio: renderer.getPixelRatio(),
        viewport: {
          width: container.clientWidth || width,
          height: container.clientHeight || height,
        },
        isWebGL2,
        msaaSamples,
        shadowMapSize: currentShadowMapSize,
        zenMode: zen,
        initMs: Number(initTotalMs.toFixed(2)),
        syncTreesMs: Number(lastSyncTreesMs.toFixed(2)),
        syncNurseryMs: Number(lastSyncNurseryMs.toFixed(2)),
        raycastMsAvg: Number(raycastMsAvg.toFixed(3)),
        raycastMsP95: Number(raycastMsP95.toFixed(3)),
        mainDrawCalls,
        mainTriangles,
        shadowDrawCalls,
        shadowTriangles,
        totalDrawCalls,
        totalTriangles,
        memory: {
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          programs: renderer.info.programs?.length ?? 0,
        },
        framesSampled: deltas.length,
        fpsAvg: Number((1000 / Math.max(0.5, avgDelta)).toFixed(1)),
        fps1PctLow: Number((1000 / Math.max(0.5, p99Delta)).toFixed(1)),
        rafDeltaAvg: Number(avgDelta.toFixed(2)),
        rafDeltaP95: Number(p95Delta.toFixed(2)),
        speciesBreakdown: { ...latestSpeciesBreakdown },
      };

      if (window.__ADAPTIVEMED_FOREST_BENCH__) {
        window.__ADAPTIVEMED_FOREST_BENCH__.latest = result;
        window.__ADAPTIVEMED_FOREST_BENCH__.ready = true;
      }

      const resolve = benchResolveFn;
      benchResolveFn = null;
      resolve?.(result);
    };

    const runBenchmark = (frames = 90): Promise<ForestBenchResult> => {
      return new Promise(resolve => {
        benchRafDeltas = [];
        benchPrevSampleMs = 0;
        benchSamplingRemaining = Math.max(10, Math.min(600, Math.floor(frames)));
        benchResolveFn = resolve;
      });
    };

    // Expõe API limpa de benchmark em window.__ADAPTIVEMED_FOREST_BENCH__
    window.__ADAPTIVEMED_FOREST_BENCH__ = {
      ready: false,
      latest: null,
      runBenchmark,
      setBenchTrees: (count: number) => {
        setBenchConfig({ active: true, trees: Math.max(0, Math.min(200, Math.floor(count))) });
      },
      setZenMode: (zen: boolean) => {
        setZenMode(zen);
      },
      setCameraCloseUp: (targetTreeIndex = 0) => {
        const trees = latestDataRef.current.permanentTrees.filter(t => !t.isWithered);
        const target = trees[targetTreeIndex % Math.max(1, trees.length)];
        cameraOverrideActive = true;
        setAutoRotate(false);
        if (target) {
          const ty = terrainHeightAt(target.x, target.z, CANONICAL_ISLAND_RADIUS);
          controls.target.set(target.x, ty + 0.85 * target.scale, target.z);
          camera.position.set(target.x + 1.85, ty + 1.35 * target.scale, target.z + 2.15);
          controls.update();
        }
      },
      resetCamera: () => {
        cameraOverrideActive = false;
        controls.target.copy(baseTarget);
        camera.position.copy(defaultCameraPos);
        controls.update();
      },
    };

    const animate = (nowMs: number) => {
      if (isDisposed || document.hidden) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(animate);

      const zen = zenModeRef.current;
      if (zen && nowMs - lastRenderMs < 32) {
        return;
      }
      lastRenderMs = nowMs;

      if (benchSamplingRemaining > 0) {
        if (benchPrevSampleMs > 0) {
          benchRafDeltas.push(nowMs - benchPrevSampleMs);
        }
        benchPrevSampleMs = nowMs;
      }

      const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;
      elapsedSimTime += dt * (zen ? 0.45 : 1.0);

      // Interação suave do cursor 3D (zero alocação de Vector3!)
      prevMouse3D.copy(canopyUniforms.uMouse3D.value);
      canopyUniforms.uMouse3D.value.lerp(targetMouse3D, zen ? 0.1 : 0.22);
      tmpInstVel
        .copy(canopyUniforms.uMouse3D.value)
        .sub(prevMouse3D)
        .divideScalar(Math.max(0.008, dt))
        .multiplyScalar(0.18);
      smoothedVel.lerp(tmpInstVel, 0.22);

      canopyUniforms.uTime.value = elapsedSimTime;
      canopyUniforms.uMouseVelocity.value.copy(smoothedVel);
      canopyUniforms.uMouseActive.value = THREE.MathUtils.lerp(
        canopyUniforms.uMouseActive.value,
        zen ? mouseActiveTarget * 0.45 : mouseActiveTarget,
        0.12
      );
      canopyUniforms.uMotionScale.value = zen ? 0.28 : 1.0;

      particleField.geometry.setDrawRange(
        0,
        zen ? particleField.zenCount : particleField.maxCount
      );
      particleField.uniforms.uTime.value = elapsedSimTime;
      particleField.uniforms.uMouse3D.value.copy(canopyUniforms.uMouse3D.value);
      particleField.uniforms.uMouseVelocity.value.copy(smoothedVel);
      particleField.uniforms.uMouseActive.value = canopyUniforms.uMouseActive.value;
      particleField.uniforms.uMotionScale.value = zen ? 0.3 : 1.0;
      particleField.uniforms.uBoostPulse.value = THREE.MathUtils.lerp(
        particleField.uniforms.uBoostPulse.value,
        hasRecentBoostGlobal ? 1.0 : 0.0,
        0.06
      );

      lakeResources.uniforms.uTime.value = elapsedSimTime;
      lakeResources.uniforms.uMouse3D.value.copy(canopyUniforms.uMouse3D.value);
      lakeResources.uniforms.uMouseOverLake.value = THREE.MathUtils.lerp(
        lakeResources.uniforms.uMouseOverLake.value,
        mouseOverLakeTarget,
        0.15
      );

      godRays.uniforms.uTime.value = elapsedSimTime;
      godRays.mesh.visible = !zen;

      // Nenúfares e flores reagindo dinamicamente às ondas/ripples do lago (zero alocação)
      const ripples = lakeResources.uniforms.uRipples.value;
      let flowerIdx = 0;
      for (let i = 0; i < lilyConfigs.length; i++) {
        const cfg = lilyConfigs[i];
        let waveY = Math.sin(elapsedSimTime * 1.8 + cfg.x * 3.1 + cfg.z * 2.7) * 0.005;
        let tiltX = Math.cos(elapsedSimTime * 1.5 + cfg.x * 2.4) * 0.03;
        let tiltZ = Math.sin(elapsedSimTime * 1.4 + cfg.z * 2.6) * 0.03;

        for (let r = 0; r < MAX_LAKE_RIPPLES; r++) {
          const rip = ripples[r];
          const age = elapsedSimTime - rip.z;
          if (rip.w > 0.001 && age >= 0 && age < 2.8) {
            const dx = cfg.x - rip.x;
            const dz = cfg.z - rip.y;
            const dist = Math.hypot(dx, dz);
            const front = age * 0.85;
            const env = Math.exp(-Math.abs(dist - front) * 4.5) * Math.exp(-age * 1.25) * rip.w;
            if (env > 0.004) {
              const w = Math.sin(dist * 24.0 - age * 11.0) * env;
              waveY += w * 0.026;
              if (dist > 0.001) {
                tiltX += (dz / dist) * w * 0.16;
                tiltZ -= (dx / dist) * w * 0.16;
              }
            }
          }
        }

        tmpLilyDummy.position.set(cfg.x, POND_WATER_Y + 0.008 + waveY, cfg.z);
        tmpLilyDummy.rotation.set(tiltX, cfg.rot, tiltZ);
        tmpLilyDummy.scale.setScalar(cfg.scale);
        tmpLilyDummy.updateMatrix();
        lilyInst.setMatrixAt(i, tmpLilyDummy.matrix);

        if (cfg.hasFlower) {
          tmpLilyDummy.position.y += 0.005;
          tmpLilyDummy.rotation.y = cfg.rot + 0.4;
          tmpLilyDummy.updateMatrix();
          lilyFlowerInst.setMatrixAt(flowerIdx++, tmpLilyDummy.matrix);
        }
      }
      lilyInst.instanceMatrix.needsUpdate = true;
      lilyFlowerInst.instanceMatrix.needsUpdate = true;

      if (activeBedRingMat) {
        const pulse = zen ? 0 : Math.sin(elapsedSimTime * 3.1) * 0.2;
        activeBedRingMat.opacity = (isTimerRunningRef.current ? 0.74 : 0.48) + pulse;
      }
      if (activeBedRing && !zen) {
        const s = 1 + Math.sin(elapsedSimTime * 2.4) * 0.035;
        activeBedRing.scale.set(s, s, 1);
      }
      if (activeBedPlantGroup && isTimerRunningRef.current && !zen) {
        activeBedPlantGroup.rotation.z = Math.sin(elapsedSimTime * 2.1) * 0.02;
      }

      if (!zen) {
        for (const bee of animatedBees) {
          const ang = elapsedSimTime * bee.speed + bee.phase;
          bee.group.position.set(
            bee.center.x + Math.cos(ang) * bee.radius,
            bee.center.y + Math.sin(ang * 2.1) * 0.11,
            bee.center.z + Math.sin(ang) * bee.radius
          );
          bee.group.rotation.y = -ang + Math.PI / 2;
          const flap = Math.sin(elapsedSimTime * 26 + bee.phase) * 0.55;
          bee.wingL.rotation.x = 0.5 + flap;
          bee.wingR.rotation.x = -0.5 - flap;
        }

        for (const drop of animatedDrops) {
          const cycle = (elapsedSimTime * 0.9 + drop.phase) % 1;
          const ang = drop.phase * 2.4 + elapsedSimTime * 1.4;
          drop.mesh.position.set(
            drop.center.x + Math.cos(ang) * 0.34,
            drop.center.y + cycle * 0.85,
            drop.center.z + Math.sin(ang) * 0.34
          );
          drop.mesh.scale.setScalar(1 - cycle * 0.6);
        }
      }

      if (!cameraOverrideActive) {
        camera.updateMatrixWorld();
        tmpCamRight.setFromMatrixColumn(camera.matrixWorld, 0);
        tmpCamUp.setFromMatrixColumn(camera.matrixWorld, 1);
        tmpTargetGoal.copy(baseTarget);
        if (!zen) {
          tmpTargetGoal.addScaledVector(tmpCamRight, parallaxNdcX * 0.22);
          tmpTargetGoal.addScaledVector(tmpCamUp, parallaxNdcY * 0.11);
        }
        controls.target.lerp(tmpTargetGoal, 0.06);
      }
      controls.autoRotate = autoRotateRef.current && !zen && !cameraOverrideActive;
      controls.update();

      if (activeTooltipWorldPos) {
        projectWorldToTooltip(activeTooltipWorldPos);
      }

      // Reset manual de renderer.info por frame para leitura exata no benchmark
      renderer.info.reset();
      if (zen) {
        renderer.render(scene, camera);
      } else {
        composer.render();
      }

      if (benchSamplingRemaining > 0) {
        benchSamplingRemaining--;
        if (benchSamplingRemaining === 0) {
          finalizeBenchmarkSample();
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (!rafId && !isDisposed) {
        lastFrameMs = performance.now();
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (!document.hidden) {
      rafId = requestAnimationFrame(animate);
    }

    // Se ?bench=1 estiver ativo na URL, roda coleta inicial limpa após estabilização
    let autoBenchTimer: number | null = null;
    const isBenchQuery = new URLSearchParams(window.location.search).get('bench') === '1';
    if (latestDataRef.current.benchActive || isBenchQuery) {
      autoBenchTimer = window.setTimeout(() => {
        if (!isDisposed) {
          runBenchmark(60);
        }
      }, 750);
    }

    return () => {
      isDisposed = true;
      if (autoBenchTimer !== null) window.clearTimeout(autoBenchTimer);
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();

      delete window.__ADAPTIVEMED_FOREST_BENCH__;

      disposeActiveTreeInstancedMeshes();
      stoneInst.dispose();
      grassInst.dispose();
      lilyInst.dispose();
      lilyFlowerInst.dispose();
      reedInst.dispose();

      controls.dispose();
      bloomPass.dispose();
      outputPass.dispose();
      if (typeof renderPass.dispose === 'function') renderPass.dispose();
      composer.dispose();
      envLightRT.dispose();
      envDarkRT.dispose();
      textures.dispose();
      while (dynamicGeos.length > 0) dynamicGeos.pop()?.dispose();
      if (activeBedRingMat) activeBedRingMat.dispose();
      disposableGeos.forEach(g => g.dispose());
      disposableMats.forEach(m => m.dispose());
      renderer.dispose();
      sceneHandleRef.current = null;
      if (container) container.innerHTML = '';
    };
  }, []);

  // =========================================================================
  // 2. SINCRONIZAÇÃO REATIVA DE TEMA (DARK GEMINI HIDROGÊNIO vs LIGHT SOLAR)
  // =========================================================================
  useEffect(() => {
    const h = sceneHandleRef.current;
    if (!h) return;
    const isDark = resolvedTheme === 'dark';

    h.scene.environment = isDark ? h.envDarkRT.texture : h.envLightRT.texture;
    h.scene.environmentIntensity = isDark ? 1.08 : 0.94;
    h.skyDomeMat.map = isDark ? h.textures.skyDarkEnv : h.textures.skyLightEnv;
    h.skyDomeMat.needsUpdate = true;

    h.renderer.toneMappingExposure = isDark ? 1.14 : 1.06;

    h.hemiLight.color.setHex(isDark ? 0x7dd3fc : 0xe0f2fe);
    h.hemiLight.groundColor.setHex(isDark ? 0x163042 : 0x4d7c0f);
    h.hemiLight.intensity = isDark ? 1.08 : 1.14;

    h.sunLight.color.setHex(isDark ? 0xe0f2fe : 0xfff4d6);
    h.sunLight.intensity = isDark ? 1.48 : 1.78;

    h.rimLight.color.setHex(isDark ? 0x22d3ee : 0x34d399);
    h.rimLight.intensity = isDark ? 0.72 : 0.28;

    h.grassMat.map = isDark ? h.textures.grassDarkMap : h.textures.grassLightMap;
    h.grassMat.needsUpdate = true;
    h.cliffMat.map = isDark ? h.textures.cliffDarkMap : h.textures.cliffLightMap;
    h.cliffMat.needsUpdate = true;

    // Casca mantém color = 0xffffff (sem dupla multiplicação que escurecia o tronco!)
    h.barkMat.color.setHex(0xffffff);
    h.pondBedMat.color.setHex(isDark ? 0x7c969c : 0xffffff);
    h.stoneMat.color.setHex(isDark ? 0xdbe4ee : 0xffffff);
    h.bladeMat.color.setHex(isDark ? 0x2ca86e : 0x62ab3a);

    h.canopyUniforms.uIsDark.value = isDark ? 1 : 0;
    h.particleField.uniforms.uIsDark.value = isDark ? 1 : 0;
    h.particleField.material.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
    h.lakeResources.uniforms.uIsDark.value = isDark ? 1 : 0;
    h.godRays.uniforms.uIsDark.value = isDark ? 1 : 0;

    h.bloomPass.threshold = isDark ? 0.90 : 0.96;
    h.bloomPass.strength = isDark ? 0.36 : 0.18;
    h.bloomPass.radius = isDark ? 0.42 : 0.32;
  }, [resolvedTheme]);

  // =========================================================================
  // 3. SINCRONIZAÇÃO SEPARADA: ÁRVORES MADURAS vs CANTEIROS DO VIVEIRO
  // =========================================================================
  useEffect(() => {
    sceneHandleRef.current?.syncPermanentTrees();
  }, [permanentTrees]);

  useEffect(() => {
    sceneHandleRef.current?.syncNurserySlots();
  }, [nurserySignature, activeSlotIndex, isTimerRunningOrPaused, areas, benchConfig.active]);

  useEffect(() => {
    const h = sceneHandleRef.current;
    const tip = tooltipRef.current;
    const container = containerRef.current;
    if (!h || !tip || !container || !hoveredTarget) return;
    const proj = new THREE.Vector3(
      hoveredTarget.worldPos.x,
      hoveredTarget.worldPos.y,
      hoveredTarget.worldPos.z
    ).project(h.camera);
    const cw = container.clientWidth || 720;
    const ch = container.clientHeight || 420;
    const sx = (proj.x * 0.5 + 0.5) * cw;
    const sy = (-proj.y * 0.5 + 0.5) * ch;
    const tipW = tip.offsetWidth || 220;
    const tipH = tip.offsetHeight || 110;
    const clampedX = Math.max(10, Math.min(cw - tipW - 10, sx - tipW * 0.5));
    const clampedY = Math.max(10, Math.min(ch - tipH - 10, sy - tipH - 14));
    tip.style.transform = `translate3d(${Math.round(clampedX)}px, ${Math.round(clampedY)}px, 0)`;
  }, [hoveredTarget]);

  const adjustZoom = (factor: number) => {
    const h = sceneHandleRef.current;
    if (!h) return;
    const offset = h.camera.position.clone().sub(h.controls.target);
    const currentDist = offset.length();
    const nextDist = Math.max(
      h.controls.minDistance,
      Math.min(h.controls.maxDistance, currentDist * factor)
    );
    offset.setLength(nextDist);
    h.camera.position.copy(h.controls.target).add(offset);
    h.controls.update();
  };

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
    <div className="relative rounded-2xl border border-border overflow-hidden bg-gradient-to-b from-sky-500/10 via-emerald-500/5 to-card shadow-inner select-none">
      {/* Canvas WebGL 3D Persistente */}
      <div ref={containerRef} className={`w-full ${heightClassName}`} />

      {/* Tooltip Flutuante Interativo (Canteiros e Árvores Maduras) */}
      {hoveredTarget && (
        <div
          ref={tooltipRef}
          className="absolute top-0 left-0 z-20 pointer-events-none max-w-[240px] rounded-xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl text-left transition-opacity duration-100"
        >
          {hoveredTarget.kind === 'slot' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-foreground flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: hoveredTarget.colorHex }}
                  />
                  Canteiro #{hoveredTarget.slotIndex + 1}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    hoveredTarget.isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground border-border'
                  }`}
                >
                  {hoveredTarget.isActive ? 'Ativo' : `Estágio ${hoveredTarget.stageNumber}/4`}
                </span>
              </div>
              <p className="text-[11px] font-bold text-foreground truncate">{hoveredTarget.area}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {hoveredTarget.subjectName || 'Estudo geral da área'}
              </p>
              <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px] text-muted-foreground tabular-nums">
                <span>
                  {Math.round(hoveredTarget.liveSeconds / 60)}/100 min (Estágio{' '}
                  {hoveredTarget.stageNumber}/4)
                </span>
                {hoveredTarget.hasBees && (
                  <span className="text-amber-600 dark:text-amber-300 font-bold">Abelhas</span>
                )}
              </div>
              {!hoveredTarget.isActive && (
                <p className="text-[9.5px] font-semibold text-primary">
                  Clique para selecionar este canteiro
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-foreground flex items-center gap-1.5 truncate">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: hoveredTarget.tree.isWithered
                        ? '#78716c'
                        : hoveredTarget.tree.colorHex,
                    }}
                  />
                  <span className="truncate">{hoveredTarget.tree.area}</span>
                </span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-border bg-muted/60 text-muted-foreground shrink-0">
                  {hoveredTarget.tree.modeLabel}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-foreground truncate">
                {hoveredTarget.tree.subjectName || 'Estudo Geral da Grande Área'}
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {formatDateBR(hoveredTarget.tree.sessionDate)}
                {hoveredTarget.tree.durationSeconds
                  ? ` • ${formatDurationCompact(hoveredTarget.tree.durationSeconds)}`
                  : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay Superior Esquerdo: Contadores */}
      <div className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-19rem)] flex flex-wrap items-center gap-2 pointer-events-none">
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

      {/* Overlay Superior Direito (Desktop) / Inferior Direito (Mobile): Controles de Câmera + Modo Zen/Eco */}
      <div className="absolute bottom-3 right-3 sm:top-3 sm:bottom-auto flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={zenMode ? 'default' : 'outline'}
          onClick={() => setZenMode(prev => !prev)}
          className={`h-7 px-2.5 text-[11px] font-semibold gap-1 backdrop-blur-md ${
            zenMode ? '' : 'bg-card/90'
          }`}
          title="Modo Foco Zen / Eco (desativa bloom, god-rays e reduz partículas/sombras/FPS para poupar bateria)"
        >
          <Leaf className="h-3 w-3" />
          <span className="hidden sm:inline">{zenMode ? 'Eco Ativo' : 'Modo Zen'}</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => adjustZoom(0.84)}
          className="h-7 w-7 bg-card/90 backdrop-blur-md"
          title="Aproximar câmera"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => adjustZoom(1.18)}
          className="h-7 w-7 bg-card/90 backdrop-blur-md"
          title="Afastar câmera"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={autoRotate ? 'default' : 'outline'}
          onClick={() => setAutoRotate(prev => !prev)}
          className={`h-7 px-2.5 text-[11px] font-semibold gap-1 backdrop-blur-md ${
            autoRotate ? '' : 'bg-card/90'
          }`}
          title="Alternar rotação automática"
        >
          <RotateCw className="h-3 w-3" />
          <span className="hidden sm:inline">{autoRotate ? 'Girando' : 'Parado'}</span>
        </Button>
      </div>

      {/* Dica de interação no rodapé */}
      <div className="absolute bottom-3 left-3 max-w-[calc(100%-10.5rem)] sm:max-w-none pointer-events-none">
        <span className="inline-block truncate max-w-full text-[10px] font-medium px-2 py-0.5 rounded-md bg-card/80 backdrop-blur-sm border border-border/60 text-muted-foreground">
          <span className="sm:hidden">Arraste • Zoom • Toque</span>
          <span className="hidden sm:inline">
            Passe o cursor para interagir • Arraste para girar • Scroll para zoom • Clique nos canteiros
          </span>
        </span>
      </div>
    </div>
  );
};
