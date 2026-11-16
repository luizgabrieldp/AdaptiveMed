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
  applyCanopyCursorReaction,
  createInteractiveLakeMaterial,
  createParticleField,
} from './forest-3d/shaders';
import {
  CANONICAL_ISLAND_RADIUS,
  POND_POS,
  buildNurseryPlantGroup,
  buildSpeciesGeometryLibrary,
  computeDeterministicTreePlacement,
  computeNurseryPositions,
  createLeafBladeGeo,
  createOrganicCanopyBlobGeo,
  getSpeciesForArea,
  hashSeed,
  terrainHeightAt,
} from './forest-3d/tree-builders';
import {
  BotanicalSpecies,
  HoveredTarget,
  PermanentTreeItem,
  SharedCanopyUniforms,
} from './forest-3d/types';

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
  const [zenMode, setZenMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTarget | null>(null);
  const [boostTick, setBoostTick] = useState(0);

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

  // Agenda timers precisos para expirar efeitos visuais temporários de boost/abelhas sem Date.now() no useMemo
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

  // Posições fixas e determinísticas dos 3 canteiros (baseadas apenas em plotSeed)
  const nurserySeedKey = nurserySlots.map(s => `${s.slotIndex}:${s.plotSeed ?? s.slotIndex}`).join('|');
  const nurseryPositions = useMemo(
    () => computeNurseryPositions(nurserySlots, CANONICAL_ISLAND_RADIUS, POND_POS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nurserySeedKey]
  );

  // Consolida árvores maduras de sessões + árvores de boost deduplicadas, com posicionamento determinístico puro por ID
  const permanentTrees = useMemo<PermanentTreeItem[]>(() => {
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
  }, [sessions, maturedFromGarden, areas, nurseryPositions]);

  // Assinatura reativa leve dos canteiros (sem reconstruir renderer!)
  const nurserySignature = useMemo(() => {
    const now = Date.now();
    return nurserySlots
      .map((slot, idx) => {
        const secs = idx === activeSlotIndex ? activeSlotLiveSeconds : slot.accumulatedSeconds;
        const prog = getNurserySlotProgress(secs);
        const stepBucket = Math.floor(prog.progressRatio * 16);
        const hasBees = Boolean(slot.beesActiveUntilMs && slot.beesActiveUntilMs > now);
        const recentBoost = Boolean(slot.lastBoostAtMs && now - slot.lastBoostAtMs < 15000);
        return `${slot.area}:${slot.plotSeed ?? idx}:${prog.stageNumber}:${stepBucket}:${hasBees}:${recentBoost}`;
      })
      .join('|');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nurserySlots, activeSlotIndex, activeSlotLiveSeconds, boostTick]);

  // Refs internas da cena persistente
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
    barkMat: THREE.MeshStandardMaterial;
    witheredBarkMat: THREE.MeshStandardMaterial;
    stoneMat: THREE.MeshStandardMaterial;
    bladeMat: THREE.MeshStandardMaterial;
    soilMat: THREE.MeshStandardMaterial;
    canopyUniforms: SharedCanopyUniforms;
    particleField: ReturnType<typeof createParticleField>;
    lakeResources: ReturnType<typeof createInteractiveLakeMaterial>;
    textures: ReturnType<typeof createProceduralTexturePack>;
    syncForestData: () => void;
  } | null>(null);

  const latestDataRef = useRef({
    permanentTrees,
    nurserySlots,
    nurseryPositions,
    activeSlotIndex,
    activeSlotLiveSeconds,
    isTimerRunningOrPaused,
    areas,
    resolvedTheme,
  });

  latestDataRef.current = {
    permanentTrees,
    nurserySlots,
    nurseryPositions,
    activeSlotIndex,
    activeSlotLiveSeconds,
    isTimerRunningOrPaused,
    areas,
    resolvedTheme,
  };

  // =========================================================================
  // 1. INICIALIZAÇÃO ÚNICA DA CENA WEBGL PERSISTENTE (ZERO REBUILD)
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
    const baseDist = CANONICAL_ISLAND_RADIUS * 2.24;
    camera.position.set(0, baseDist * 0.44, baseDist * 0.9);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 5.8;
    controls.maxDistance = 20.5;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI / 2 - 0.12;
    const baseTarget = new THREE.Vector3(0, 0.26, 0.12);
    controls.target.copy(baseTarget);
    controls.autoRotateSpeed = 0.55;
    controls.update();

    // Pós-processamento seletivo (EffectComposer + UnrealBloomPass + OutputPass)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.52, 0.55, 0.8);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    // Texturas procedurais + IBL real em GPU via PMREMGenerator
    const textures = createProceduralTexturePack();
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envLightRT = pmrem.fromEquirectangular(textures.skyLightEnv);
    const envDarkRT = pmrem.fromEquirectangular(textures.skyDarkEnv);
    pmrem.dispose();

    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];
    const dynamicGeos: THREE.BufferGeometry[] = [];
    const cachedAreaLeafMats = new Map<string, THREE.MeshPhysicalMaterial>();
    const cachedAreaBlossomMats = new Map<string, THREE.MeshPhysicalMaterial>();

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

    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    sunLight.position.set(7.5, 13.0, 8.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 34;
    const shadowBox = CANONICAL_ISLAND_RADIUS + 1.8;
    sunLight.shadow.camera.left = -shadowBox;
    sunLight.shadow.camera.right = shadowBox;
    sunLight.shadow.camera.top = shadowBox;
    sunLight.shadow.camera.bottom = -shadowBox;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.55);
    rimLight.position.set(-8.5, 5.5, -7.5);
    scene.add(rimLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Uniforms compartilhados de reação ao cursor nas copas
    const canopyUniforms: SharedCanopyUniforms = {
      uTime: { value: 0 },
      uMouse3D: { value: new THREE.Vector3(0, 0.5, 0) },
      uMouseVelocity: { value: new THREE.Vector3(0, 0, 0) },
      uMouseActive: { value: 0 },
      uMotionScale: { value: 1 },
      uIsDark: { value: 1 },
    };

    // Ilha orgânica com texturas PBR procedurais
    const topGeo = trackGeo(
      new THREE.CylinderGeometry(CANONICAL_ISLAND_RADIUS, CANONICAL_ISLAND_RADIUS * 0.96, 0.44, 52, 4)
    );
    const topPos = topGeo.attributes.position;
    for (let i = 0; i < topPos.count; i++) {
      const vx = topPos.getX(i);
      const vy = topPos.getY(i);
      const vz = topPos.getZ(i);
      if (vy > 0) {
        topPos.setY(i, vy + terrainHeightAt(vx, vz, CANONICAL_ISLAND_RADIUS));
      } else {
        topPos.setY(i, vy - 0.05 * Math.sin(vx * 1.4 + vz * 1.2));
      }
    }
    topGeo.computeVertexNormals();

    const grassMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.grassDarkMap,
        bumpMap: textures.grassBump,
        bumpScale: 0.035,
        roughness: 0.86,
        metalness: 0.02,
      })
    );
    const grassMesh = new THREE.Mesh(topGeo, grassMat);
    grassMesh.position.y = -0.22;
    grassMesh.receiveShadow = true;
    worldGroup.add(grassMesh);

    const cliffGeo = trackGeo(
      new THREE.CylinderGeometry(
        CANONICAL_ISLAND_RADIUS * 0.95,
        CANONICAL_ISLAND_RADIUS * 0.6,
        0.88,
        44,
        3
      )
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
        map: textures.cliffDarkMap,
        bumpMap: textures.cliffBump,
        bumpScale: 0.05,
        roughness: 0.94,
        metalness: 0.04,
      })
    );
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
    cliffMesh.position.y = -0.82;
    cliffMesh.receiveShadow = true;
    worldGroup.add(cliffMesh);

    // Lago interativo com Fresnel + ondulações dinâmicas ao passar o cursor
    const pondY = terrainHeightAt(POND_POS.x, POND_POS.y, CANONICAL_ISLAND_RADIUS) + 0.02;
    const pondGeo = trackGeo(new THREE.CircleGeometry(CANONICAL_ISLAND_RADIUS * 0.21, 36));
    const lakeResources = createInteractiveLakeMaterial();
    trackMat(lakeResources.material);

    const pondMesh = new THREE.Mesh(pondGeo, lakeResources.material);
    pondMesh.rotation.x = -Math.PI / 2;
    pondMesh.scale.set(1.25, 0.86, 1);
    pondMesh.position.set(POND_POS.x, pondY, POND_POS.y);
    worldGroup.add(pondMesh);

    // Pedras na margem em InstancedMesh (1 draw call)
    const stoneGeo = trackGeo(createOrganicCanopyBlobGeo(9.4));
    const stoneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x64748b,
        bumpMap: textures.cliffBump,
        bumpScale: 0.03,
        roughness: 0.78,
        metalness: 0.06,
      })
    );
    const stoneInst = new THREE.InstancedMesh(stoneGeo, stoneMat, 8);
    stoneInst.castShadow = true;
    stoneInst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let s = 0; s < 8; s++) {
      const ang = (s / 8) * Math.PI * 2;
      const sx = POND_POS.x + Math.cos(ang) * CANONICAL_ISLAND_RADIUS * 0.23;
      const sz = POND_POS.y + Math.sin(ang) * CANONICAL_ISLAND_RADIUS * 0.17;
      dummy.position.set(sx, terrainHeightAt(sx, sz, CANONICAL_ISLAND_RADIUS) + 0.04, sz);
      dummy.rotation.set(0, s * 0.9, 0);
      dummy.scale.set(0.17 + (s % 3) * 0.05, 0.1, 0.14 + ((s + 1) % 2) * 0.05);
      dummy.updateMatrix();
      stoneInst.setMatrixAt(s, dummy.matrix);
    }
    stoneInst.instanceMatrix.needsUpdate = true;
    worldGroup.add(stoneInst);

    // Relva orgânica em InstancedMesh (1 draw call)
    const bladeGeo = trackGeo(new THREE.ConeGeometry(0.028, 0.19, 4));
    bladeGeo.translate(0, 0.095, 0);
    const bladeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.82,
      })
    );
    const grassCount = 160;
    const grassInst = new THREE.InstancedMesh(bladeGeo, bladeMat, grassCount);
    for (let i = 0; i < grassCount; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);
      const r = 0.7 + (((i * 37) % 100) / 100) * (CANONICAL_ISLAND_RADIUS - 0.85);
      const gx = Math.cos(a) * r;
      const gz = Math.sin(a) * r;
      if (Math.hypot(gx - POND_POS.x, gz - POND_POS.y) < CANONICAL_ISLAND_RADIUS * 0.25) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(gx, terrainHeightAt(gx, gz, CANONICAL_ISLAND_RADIUS), gz);
        dummy.rotation.set(((i % 5) - 2) * 0.08, a, ((i % 3) - 1) * 0.08);
        dummy.scale.setScalar(0.75 + (i % 4) * 0.18);
      }
      dummy.updateMatrix();
      grassInst.setMatrixAt(i, dummy.matrix);
    }
    grassInst.instanceMatrix.needsUpdate = true;
    worldGroup.add(grassInst);

    // Campo de partículas GPU interativo (estilo Gemini Hydrogen)
    const particleField = createParticleField(CANONICAL_ISLAND_RADIUS, 460, 130);
    particleField.uniforms.uPixelRatio.value = pixelRatio;
    trackGeo(particleField.geometry);
    trackMat(particleField.material);
    worldGroup.add(particleField.points);

    // Materiais compartilhados PBR para troncos, copas instanciadas e flores translúcidas
    const barkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x8b6248,
        map: textures.barkMap,
        bumpMap: textures.barkBump,
        bumpScale: 0.04,
        roughness: 0.9,
        metalness: 0.02,
      })
    );
    const witheredBarkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x73675c,
        bumpMap: textures.barkBump,
        bumpScale: 0.03,
        roughness: 0.94,
      })
    );
    const stemMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        roughness: 0.52,
      })
    );
    const soilMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.soilMap,
        bumpMap: textures.soilBump,
        bumpScale: 0.035,
        roughness: 0.94,
      })
    );
    const seedMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xa16207,
        roughness: 0.72,
      })
    );
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

    const instancedCanopyMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        vertexColors: true,
        bumpMap: textures.foliageBump,
        bumpScale: 0.022,
        roughness: 0.62,
        metalness: 0.02,
        clearcoat: 0.16,
        clearcoatRoughness: 0.52,
      })
    );
    applyCanopyCursorReaction(instancedCanopyMat, canopyUniforms, {
      swayStrength: 0.055,
      cacheKey: 'forest-inst-canopy-v1',
    });

    const instancedBlossomMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        vertexColors: false,
        roughness: 0.22,
        metalness: 0.04,
        clearcoat: 0.94,
        clearcoatRoughness: 0.14,
        iridescence: 0.56,
        iridescenceIOR: 1.33,
        sheen: 0.32,
        sheenRoughness: 0.35,
      })
    );
    applyCanopyCursorReaction(instancedBlossomMat, canopyUniforms, {
      swayStrength: 0.075,
      cacheKey: 'forest-inst-blossom-v1',
    });

    const getAreaLeafMat = (colorHex: string) => {
      const key = colorHex.toLowerCase();
      let mat = cachedAreaLeafMats.get(key);
      if (!mat) {
        mat = trackMat(
          new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(colorHex || '#10b981'),
            vertexColors: true,
            bumpMap: textures.foliageBump,
            bumpScale: 0.02,
            roughness: 0.6,
            metalness: 0.02,
            clearcoat: 0.18,
            clearcoatRoughness: 0.48,
          })
        );
        applyCanopyCursorReaction(mat, canopyUniforms, {
          swayStrength: 0.05,
          cacheKey: 'forest-nursery-leaf-v1',
        });
        cachedAreaLeafMats.set(key, mat);
      }
      return mat;
    };

    const getAreaBlossomMat = (colorHex: string) => {
      const key = colorHex.toLowerCase();
      let mat = cachedAreaBlossomMats.get(key);
      if (!mat) {
        const c = new THREE.Color(colorHex || '#10b981').lerp(new THREE.Color(0xffffff), 0.28);
        mat = trackMat(
          new THREE.MeshPhysicalMaterial({
            color: c,
            emissive: c,
            emissiveIntensity: 0.22,
            roughness: 0.22,
            clearcoat: 0.9,
            iridescence: 0.45,
          })
        );
        cachedAreaBlossomMats.set(key, mat);
      }
      return mat;
    };

    // Geometrias compartilhadas das 5 espécies + viveiro
    const speciesLib = buildSpeciesGeometryLibrary();
    (Object.keys(speciesLib) as Array<keyof typeof speciesLib>).forEach(k => {
      trackGeo(speciesLib[k].trunkGeo);
      if (speciesLib[k].canopyGeo) trackGeo(speciesLib[k].canopyGeo!);
      if (speciesLib[k].blossomGeo) trackGeo(speciesLib[k].blossomGeo!);
    });
    const leafBladeGeo = trackGeo(createLeafBladeGeo());
    const seedPodGeo = trackGeo(new THREE.SphereGeometry(0.11, 12, 10));
    const moundGeo = trackGeo(
      new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)
    );
    const ringGeo = trackGeo(new THREE.RingGeometry(0.55, 0.66, 40));
    const beeBodyGeo = trackGeo(new THREE.CapsuleGeometry(0.025, 0.045, 4, 8));
    const beeWingGeo = trackGeo(new THREE.PlaneGeometry(0.055, 0.03));
    const dropGeo = trackGeo(new THREE.OctahedronGeometry(0.038, 1));

    // Grupos dinâmicos sincronizados sem destruir renderer
    const treesGroup = new THREE.Group();
    const nurseryGroup = new THREE.Group();
    const beesGroup = new THREE.Group();
    const boostDropsGroup = new THREE.Group();
    worldGroup.add(treesGroup, nurseryGroup, beesGroup, boostDropsGroup);

    // Anel luminoso de seleção/hover no mapa
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

    // Estado vivo da animação para canteiros / abelhas / gotas
    let activeBedRing: THREE.Mesh | null = null;
    let activeBedRingMat: THREE.MeshBasicMaterial | null = null;
    let activeBedPlantGroup: THREE.Group | null = null;
    let clickableBedTargets: THREE.Object3D[] = [];
    let treeHitTargets: THREE.InstancedMesh[] = [];
    let hasRecentBoostGlobal = false;

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

    const syncForestData = () => {
      const data = latestDataRef.current;

      // Limpa geometrias temporárias da sincronização anterior (estágios 1/2 dos canteiros)
      while (dynamicGeos.length > 0) {
        dynamicGeos.pop()?.dispose();
      }
      if (activeBedRingMat) {
        activeBedRingMat.dispose();
        activeBedRingMat = null;
      }

      clearDynamicGroup(treesGroup);
      clearDynamicGroup(nurseryGroup);
      clearDynamicGroup(beesGroup);
      clearDynamicGroup(boostDropsGroup);

      activeBedRing = null;
      activeBedPlantGroup = null;
      clickableBedTargets = [];
      treeHitTargets = [];
      animatedBees.length = 0;
      animatedDrops.length = 0;

      // A) Sincroniza árvores maduras via InstancedMesh agrupado por espécie (<15 draw calls!)
      const bySpecies = new Map<BotanicalSpecies | 'withered', PermanentTreeItem[]>();
      for (const item of data.permanentTrees) {
        const key: BotanicalSpecies | 'withered' = item.isWithered ? 'withered' : item.species;
        const arr = bySpecies.get(key) || [];
        arr.push(item);
        bySpecies.set(key, arr);
      }

      const mDummy = new THREE.Object3D();
      const white = new THREE.Color(0xffffff);
      const tmpColor = new THREE.Color();

      bySpecies.forEach((items, key) => {
        if (items.length === 0) return;
        const spec = speciesLib[key];

        const trunkInst = new THREE.InstancedMesh(
          spec.trunkGeo,
          key === 'withered' ? witheredBarkMat : barkMat,
          items.length
        );
        trunkInst.castShadow = true;
        trunkInst.receiveShadow = true;
        trunkInst.userData = { treeItems: items };

        const canopyInst = spec.canopyGeo
          ? new THREE.InstancedMesh(spec.canopyGeo, instancedCanopyMat, items.length)
          : null;
        if (canopyInst) {
          canopyInst.castShadow = true;
          canopyInst.receiveShadow = true;
          canopyInst.userData = { treeItems: items };
        }

        const blossomInst = spec.blossomGeo
          ? new THREE.InstancedMesh(spec.blossomGeo, instancedBlossomMat, items.length)
          : null;
        if (blossomInst) {
          blossomInst.castShadow = true;
          blossomInst.userData = { treeItems: items };
        }

        items.forEach((item, idx) => {
          const ty = terrainHeightAt(item.x, item.z, CANONICAL_ISLAND_RADIUS);
          mDummy.position.set(item.x, ty - 0.02, item.z);
          mDummy.rotation.set(0, item.rotationY, 0);
          mDummy.scale.setScalar(item.scale);
          mDummy.updateMatrix();

          trunkInst.setMatrixAt(idx, mDummy.matrix);
          if (canopyInst) {
            canopyInst.setMatrixAt(idx, mDummy.matrix);
            tmpColor.set(item.colorHex || '#10b981');
            canopyInst.setColorAt(idx, tmpColor);
          }
          if (blossomInst) {
            blossomInst.setMatrixAt(idx, mDummy.matrix);
            tmpColor.set(item.colorHex || '#10b981').lerp(white, 0.34);
            blossomInst.setColorAt(idx, tmpColor);
          }
        });

        trunkInst.instanceMatrix.needsUpdate = true;
        treesGroup.add(trunkInst);
        treeHitTargets.push(trunkInst);

        if (canopyInst) {
          canopyInst.instanceMatrix.needsUpdate = true;
          if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
          treesGroup.add(canopyInst);
          treeHitTargets.push(canopyInst);
        }
        if (blossomInst) {
          blossomInst.instanceMatrix.needsUpdate = true;
          if (blossomInst.instanceColor) blossomInst.instanceColor.needsUpdate = true;
          treesGroup.add(blossomInst);
          treeHitTargets.push(blossomInst);
        }
      });

      // B) Sincroniza os 3 Canteiros Paralelos no viveiro
      const now = Date.now();
      let boostDetected = false;

      data.nurserySlots.forEach((slot, idx) => {
        const slotIdx = idx as 0 | 1 | 2;
        const pos = data.nurseryPositions[slotIdx];
        const groundY = terrainHeightAt(pos.x, pos.z, CANONICAL_ISLAND_RADIUS);
        const isSelected = slotIdx === data.activeSlotIndex;
        const slotStyle = getAreaStyle(slot.area, data.areas);
        const liveSec = isSelected ? data.activeSlotLiveSeconds : slot.accumulatedSeconds;
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
            stemMat,
            seedMat,
            getAreaLeafMat,
            getAreaBlossomMat,
          },
          {
            leafBladeGeo,
            seedPodGeo,
            speciesLib,
          },
          g => {
            dynamicGeos.push(g);
            return g;
          }
        );
        plant.position.y = 0.06;
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
      barkMat,
      witheredBarkMat,
      stoneMat,
      bladeMat,
      soilMat,
      canopyUniforms,
      particleField,
      lakeResources,
      textures,
      syncForestData,
    };

    syncForestData();

    // =========================================================================
    // 2. RAYCASTING CONTÍNUO DE CURSOR, RIPPLES NO LAGO, PARALLAX E TOOLTIPS
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25);
    const hitPoint = new THREE.Vector3();
    const targetMouse3D = new THREE.Vector3(0, 0.4, 0);
    const prevMouse3D = new THREE.Vector3(0, 0.4, 0);
    const smoothedVel = new THREE.Vector3();

    let mouseActiveTarget = 0;
    let mouseOverLakeTarget = 0;
    let rippleCursorIdx = 0;
    let lastRippleTime = -10;
    let lastRipplePos = new THREE.Vector2(999, 999);
    let parallaxNdcX = 0;
    let parallaxNdcY = 0;
    let currentHoveredKey = '';
    let pinnedTreeTooltip = false;
    let activeTooltipWorldPos: { x: number; y: number; z: number } | null = null;
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;
    let elapsedSimTime = 0;

    const tmpCamRight = new THREE.Vector3();
    const tmpCamUp = new THREE.Vector3();
    const tmpTargetGoal = new THREE.Vector3();

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
      const proj = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z).project(camera);
      if (proj.z > 1) {
        tip.style.opacity = '0';
        return;
      }
      tip.style.opacity = '1';
      const cw = container.clientWidth || 720;
      const ch = container.clientHeight || 420;
      const sx = (proj.x * 0.5 + 0.5) * cw;
      const sy = (-proj.y * 0.5 + 0.5) * ch;
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

      // 1) Atualiza uMouse3D no lago / plano da ilha para partículas & copas
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

      // Não altera seleção/tooltip nem sobrescreve cursor 'grabbing' durante arraste do OrbitControls
      if (isPointerDown && !isClick) {
        domEl.style.cursor = 'grabbing';
        return;
      }

      // 2) Raycast simultâneo em Canteiros e Árvores Maduras, priorizando o objeto mais próximo da câmera
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
            slotIdx === data.activeSlotIndex ? data.activeSlotLiveSeconds : slot.accumulatedSeconds;
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

          const worldPos = { x: tree.x, y: ty + 1.15 * tree.scale, z: tree.z };
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

      // Sem alvo sob o cursor
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

    // ResizeObserver para acompanhar sidebar/layout responsivo sem depender só de window.resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 420;
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
      particleField.uniforms.uPixelRatio.value = pr;
    };
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 3. LOOP DE ANIMAÇÃO COM PAUSA AUTOMÁTICA EM ABA OCULTA + MODO ZEN/ECO
    // =========================================================================
    let rafId = 0;
    let lastFrameMs = performance.now();
    let lastRenderMs = 0;
    let isDisposed = false;

    const animate = (nowMs: number) => {
      if (isDisposed || document.hidden) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(animate);

      const zen = zenModeRef.current;
      // Modo Eco limita a ~30 FPS para economizar GPU/bateria em sessões longas
      if (zen && nowMs - lastRenderMs < 32) {
        return;
      }
      lastRenderMs = nowMs;

      const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;
      elapsedSimTime += dt * (zen ? 0.45 : 1.0);

      // Atualiza interação suave do cursor 3D e velocidade (estilo Gemini Hydrogen)
      prevMouse3D.copy(canopyUniforms.uMouse3D.value);
      canopyUniforms.uMouse3D.value.lerp(targetMouse3D, zen ? 0.1 : 0.22);
      const instVel = canopyUniforms.uMouse3D.value
        .clone()
        .sub(prevMouse3D)
        .divideScalar(Math.max(0.008, dt));
      smoothedVel.lerp(instVel.multiplyScalar(0.18), 0.22);

      canopyUniforms.uTime.value = elapsedSimTime;
      canopyUniforms.uMouseVelocity.value.copy(smoothedVel);
      canopyUniforms.uMouseActive.value = THREE.MathUtils.lerp(
        canopyUniforms.uMouseActive.value,
        zen ? mouseActiveTarget * 0.45 : mouseActiveTarget,
        0.12
      );
      canopyUniforms.uMotionScale.value = zen ? 0.28 : 1.0;

      // Sincroniza uniforms do campo de partículas e lago
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

      // Pulso do canteiro ativo, abelhas e gotas de boost
      if (activeBedRingMat) {
        const pulse = zen ? 0 : Math.sin(elapsedSimTime * 3.1) * 0.2;
        activeBedRingMat.opacity = (isTimerRunningRef.current ? 0.74 : 0.48) + pulse;
      }
      if (activeBedRing && !zen) {
        const s = 1 + Math.sin(elapsedSimTime * 2.4) * 0.035;
        activeBedRing.scale.set(s, s, 1);
      }
      if (activeBedPlantGroup && isTimerRunningRef.current && !zen) {
        activeBedPlantGroup.rotation.z = Math.sin(elapsedSimTime * 2.1) * 0.024;
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

      // Parallax sutil alinhado à visão atual da câmera (eixos locais right/up, sem inverter ao orbitar)
      camera.updateMatrixWorld();
      tmpCamRight.setFromMatrixColumn(camera.matrixWorld, 0);
      tmpCamUp.setFromMatrixColumn(camera.matrixWorld, 1);
      tmpTargetGoal.copy(baseTarget);
      if (!zen) {
        tmpTargetGoal.addScaledVector(tmpCamRight, parallaxNdcX * 0.22);
        tmpTargetGoal.addScaledVector(tmpCamUp, parallaxNdcY * 0.11);
      }
      controls.target.lerp(tmpTargetGoal, 0.06);
      controls.autoRotate = autoRotateRef.current && !zen;
      controls.update();

      // Mantém tooltip flutuante alinhado ao objeto 3D mesmo durante auto-rotação ou zoom
      if (activeTooltipWorldPos) {
        projectWorldToTooltip(activeTooltipWorldPos);
      }

      // Renderiza com Bloom seletivo (Normal) ou direto sem pós-processamento (Modo Zen/Eco)
      if (zen) {
        renderer.render(scene, camera);
      } else {
        composer.render();
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

    return () => {
      isDisposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();

      controls.dispose();
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
  // 2. SINCRONIZAÇÃO REATIVA DE TEMA (DARK GEMINI HYDROGEN vs LIGHT SOLAR)
  // =========================================================================
  useEffect(() => {
    const h = sceneHandleRef.current;
    if (!h) return;
    const isDark = resolvedTheme === 'dark';

    h.scene.environment = isDark ? h.envDarkRT.texture : h.envLightRT.texture;
    h.scene.environmentIntensity = isDark ? 0.92 : 0.85;
    h.skyDomeMat.map = isDark ? h.textures.skyDarkEnv : h.textures.skyLightEnv;
    h.skyDomeMat.needsUpdate = true;

    h.renderer.toneMappingExposure = isDark ? 1.08 : 1.04;

    h.hemiLight.color.setHex(isDark ? 0x67e8f9 : 0xe0f2fe);
    h.hemiLight.groundColor.setHex(isDark ? 0x0f172a : 0x4d7c0f);
    h.hemiLight.intensity = isDark ? 0.72 : 1.05;

    h.sunLight.color.setHex(isDark ? 0xc7d2fe : 0xfff3d1);
    h.sunLight.intensity = isDark ? 1.18 : 1.65;

    h.rimLight.color.setHex(isDark ? 0x22d3ee : 0x34d399);
    h.rimLight.intensity = isDark ? 0.65 : 0.24;

    h.grassMat.map = isDark ? h.textures.grassDarkMap : h.textures.grassLightMap;
    h.grassMat.needsUpdate = true;
    h.cliffMat.map = isDark ? h.textures.cliffDarkMap : h.textures.cliffLightMap;
    h.cliffMat.needsUpdate = true;

    h.barkMat.color.setHex(isDark ? 0x7c5842 : 0x8f6246);
    h.stoneMat.color.setHex(isDark ? 0x475569 : 0x94a3b8);
    h.bladeMat.color.setHex(isDark ? 0x10b981 : 0x65a30d);

    h.canopyUniforms.uIsDark.value = isDark ? 1 : 0;
    h.particleField.uniforms.uIsDark.value = isDark ? 1 : 0;
    h.particleField.material.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
    h.lakeResources.uniforms.uIsDark.value = isDark ? 1 : 0;

    // Bloom seletivo calibrado por tema (brilha apenas partículas, aura, reflexos e boost)
    h.bloomPass.threshold = isDark ? 0.8 : 0.95;
    h.bloomPass.strength = isDark ? 0.5 : 0.22;
    h.bloomPass.radius = isDark ? 0.5 : 0.35;
  }, [resolvedTheme]);

  // =========================================================================
  // 3. SINCRONIZAÇÃO REATIVA DE DADOS (SEM RECRIAR RENDERER/CONTROLS)
  // =========================================================================
  useEffect(() => {
    sceneHandleRef.current?.syncForestData();
  }, [permanentTrees, nurserySignature, activeSlotIndex, isTimerRunningOrPaused, areas]);

  // Atualiza posição do tooltip quando hoveredTarget muda
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
          title="Modo Foco Zen / Eco (desativa bloom e reduz partículas/FPS para poupar bateria)"
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
