'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Pause, Play } from 'lucide-react';
import { useTheme } from '@/components/layout/theme-provider';

interface SceneThemeHandles {
  tubeMaterial: THREE.MeshBasicMaterial;
  echoMat: THREE.MeshBasicMaterial;
  ringMaterials: THREE.MeshBasicMaterial[];
  particlesMat: THREE.PointsMaterial;
  particleColorAttr: THREE.BufferAttribute;
  linesMat: THREE.LineBasicMaterial;
  particleCount: number;
  renderFrame: () => void;
}

function fillParticleColors(target: Float32Array, count: number, isDark: boolean) {
  const cPrimary = new THREE.Color(isDark ? 0x3b82f6 : 0x1d4ed8);
  const cEmerald = new THREE.Color(isDark ? 0x10b981 : 0x059669);
  const cIndigo = new THREE.Color(isDark ? 0x818cf8 : 0x4f46e5);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const paletteColor = i % 3 === 0 ? cEmerald : i % 3 === 1 ? cPrimary : cIndigo;
    target[i3] = paletteColor.r;
    target[i3 + 1] = paletteColor.g;
    target[i3 + 2] = paletteColor.b;
  }
}

export const HeroNeuralCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const initialThemeRef = useRef(resolvedTheme);
  const themeHandlesRef = useRef<SceneThemeHandles | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const userPausedRef = useRef(false);
  const inViewportRef = useRef(true);
  const tabVisibleRef = useRef(true);
  const syncLoopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    userPausedRef.current = isPaused || prefersReducedMotion;
    syncLoopRef.current?.();
  }, [isPaused, prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Cria WebGLRenderer e geometrias apenas uma vez (não destrói renderer na troca de tema)
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

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 8.2);

    const isDark = initialThemeRef.current === 'dark';

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Curva 3D da Memória Consolidada (FSRS-6 Ribbon Helix)
    const curvePoints: THREE.Vector3[] = [];
    const totalPts = 96;
    for (let i = 0; i <= totalPts; i++) {
      const t = i / totalPts;
      const x = (t - 0.5) * 9.5;
      const stabilityWave = Math.sin(t * Math.PI * 3.5) * (0.85 - t * 0.45);
      const y = -1.1 + t * 2.3 + stabilityWave * 0.55;
      const z = Math.cos(t * Math.PI * 3.5) * 0.9;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const retentionCurve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeometry = new THREE.TubeGeometry(retentionCurve, 120, 0.055, 12, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x2563eb,
      transparent: true,
      opacity: isDark ? 0.85 : 0.72,
    });
    const retentionTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    rootGroup.add(retentionTube);

    // Segunda fita complementar (Ebbinghaus vs Consolidação)
    const echoPoints = curvePoints.map(
      (p, idx) =>
        new THREE.Vector3(
          p.x,
          p.y - 0.45 + Math.cos(idx * 0.25) * 0.25,
          -p.z * 0.85
        )
    );
    const echoCurve = new THREE.CatmullRomCurve3(echoPoints);
    const echoGeo = new THREE.TubeGeometry(echoCurve, 100, 0.032, 10, false);
    const echoMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x10b981 : 0x059669,
      transparent: true,
      opacity: isDark ? 0.65 : 0.55,
    });
    const echoTube = new THREE.Mesh(echoGeo, echoMat);
    rootGroup.add(echoTube);

    // 2. Nós Sinápticos de Revisão (R0 -> R8 ao longo da curva)
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeMaterials: THREE.MeshBasicMaterial[] = [];
    const ringMaterials: THREE.MeshBasicMaterial[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.11, 20, 20);
    const ringGeo = new THREE.TorusGeometry(0.21, 0.018, 12, 32);

    for (let r = 0; r <= 8; r++) {
      const t = r / 8;
      const pos = retentionCurve.getPoint(t);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: r >= 6 ? 0x10b981 : r >= 3 ? 0x38bdf8 : 0x818cf8,
      });
      nodeMaterials.push(nodeMat);

      const sphere = new THREE.Mesh(nodeGeo, nodeMat);
      sphere.position.copy(pos);
      rootGroup.add(sphere);
      nodeMeshes.push(sphere);

      const ringMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x60a5fa : 0x3b82f6,
        transparent: true,
        opacity: 0.45,
      });
      ringMaterials.push(ringMat);

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.rotation.x = Math.PI * 0.35;
      ring.rotation.y = r * 0.4;
      rootGroup.add(ring);
    }

    // 3. Nuvem de Partículas Neurais Orbitais (Sinapses em rede)
    const particleCount = 260;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    fillParticleColors(particleColors, particleCount, isDark);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = (i / particleCount) * Math.PI * 10;
      const radius = 1.6 + ((i * 7) % 100) / 38;
      particlePositions[i3] = ((i / particleCount) - 0.5) * 11.5 + Math.sin(angle) * 0.4;
      particlePositions[i3 + 1] = Math.sin(angle * 0.7) * radius * 0.55;
      particlePositions[i3 + 2] = Math.cos(angle * 0.7) * radius * 0.65 - 0.4;
    }

    const particlesGeo = new THREE.BufferGeometry();
    const particleColorAttr = new THREE.BufferAttribute(particleColors, 3);
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeo.setAttribute('color', particleColorAttr);

    const particlesMat = new THREE.PointsMaterial({
      size: isDark ? 0.065 : 0.055,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.78 : 0.55,
    });
    const particleCloud = new THREE.Points(particlesGeo, particlesMat);
    rootGroup.add(particleCloud);

    // 4. Conexões Neurais (LineSegments entre pontos próximos da malha)
    const lineCoords: number[] = [];
    for (let i = 0; i < particleCount; i += 3) {
      const x1 = particlePositions[i * 3];
      const y1 = particlePositions[i * 3 + 1];
      const z1 = particlePositions[i * 3 + 2];
      for (let j = i + 3; j < Math.min(i + 18, particleCount); j += 3) {
        const x2 = particlePositions[j * 3];
        const y2 = particlePositions[j * 3 + 1];
        const z2 = particlePositions[j * 3 + 2];
        const distSq = (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2;
        if (distSq < 4.5) {
          lineCoords.push(x1, y1, z1, x2, y2, z2);
        }
      }
    }

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
    const linesMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x60a5fa : 0x3b82f6,
      transparent: true,
      opacity: isDark ? 0.16 : 0.12,
    });
    const synapseLines = new THREE.LineSegments(linesGeo, linesMat);
    rootGroup.add(synapseLines);

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const isEffectivelyPaused = () =>
      userPausedRef.current || !inViewportRef.current || !tabVisibleRef.current;

    const renderFrame = () => {
      renderer?.render(scene, camera);
    };

    themeHandlesRef.current = {
      tubeMaterial,
      echoMat,
      ringMaterials,
      particlesMat,
      particleColorAttr,
      linesMat,
      particleCount,
      renderFrame,
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isEffectivelyPaused()) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      targetMouseX = nx * 0.35;
      targetMouseY = ny * 0.22;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderFrame();
    };

    window.addEventListener('resize', handleResize);

    let rafId: number | null = null;
    let elapsed = 0;
    let lastFrameMs: number | null = null;

    // Render inicial imediato
    rootGroup.rotation.y = -0.18;
    rootGroup.rotation.x = 0.08;
    renderFrame();

    const animate = (nowMs: number) => {
      if (isEffectivelyPaused()) {
        rafId = null;
        lastFrameMs = null;
        return;
      }

      rafId = requestAnimationFrame(animate);
      if (lastFrameMs !== null) {
        const deltaSec = Math.min(0.1, Math.max(0, (nowMs - lastFrameMs) / 1000));
        elapsed += deltaSec;
      }
      lastFrameMs = nowMs;

      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      rootGroup.rotation.y = -0.18 + Math.sin(elapsed * 0.22) * 0.18 + currentMouseX;
      rootGroup.rotation.x = 0.08 + Math.cos(elapsed * 0.18) * 0.06 - currentMouseY;
      particleCloud.rotation.y = elapsed * 0.03;

      nodeMeshes.forEach((mesh, idx) => {
        const pulse = 1 + Math.sin(elapsed * 2.2 + idx * 0.65) * 0.16;
        mesh.scale.setScalar(pulse);
      });

      renderFrame();
    };

    const syncLoop = () => {
      if (isEffectivelyPaused()) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        lastFrameMs = null;
      } else if (rafId === null) {
        lastFrameMs = null;
        rafId = requestAnimationFrame(animate);
      }
    };

    syncLoopRef.current = syncLoop;

    // Pausa automaticamente quando fora da viewport
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          inViewportRef.current = Boolean(entry?.isIntersecting);
          syncLoop();
        },
        { threshold: 0 }
      );
      observer.observe(container);
    }

    // Pausa automaticamente quando a aba perde visibilidade
    tabVisibleRef.current = typeof document === 'undefined' || document.visibilityState === 'visible';
    const handleVisibilityChange = () => {
      tabVisibleRef.current = document.visibilityState === 'visible';
      syncLoop();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    syncLoop();

    return () => {
      syncLoopRef.current = null;
      themeHandlesRef.current = null;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      tubeGeometry.dispose();
      tubeMaterial.dispose();
      echoGeo.dispose();
      echoMat.dispose();
      nodeGeo.dispose();
      ringGeo.dispose();
      nodeMaterials.forEach(mat => mat.dispose());
      ringMaterials.forEach(mat => mat.dispose());
      particlesGeo.dispose();
      particlesMat.dispose();
      linesGeo.dispose();
      linesMat.dispose();
      renderer?.dispose();
      if (renderer?.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Atualiza cores in-place na troca de tema sem recriar WebGLRenderer
  useEffect(() => {
    const handles = themeHandlesRef.current;
    if (!handles) return;

    const isDark = resolvedTheme === 'dark';
    handles.tubeMaterial.color.setHex(isDark ? 0x38bdf8 : 0x2563eb);
    handles.tubeMaterial.opacity = isDark ? 0.85 : 0.72;

    handles.echoMat.color.setHex(isDark ? 0x10b981 : 0x059669);
    handles.echoMat.opacity = isDark ? 0.65 : 0.55;

    handles.ringMaterials.forEach(mat => {
      mat.color.setHex(isDark ? 0x60a5fa : 0x3b82f6);
    });

    handles.particlesMat.size = isDark ? 0.065 : 0.055;
    handles.particlesMat.opacity = isDark ? 0.78 : 0.55;

    const colorAttr = handles.particleColorAttr;
    if (colorAttr.array instanceof Float32Array) {
      fillParticleColors(colorAttr.array, handles.particleCount, isDark);
      colorAttr.needsUpdate = true;
    }

    handles.linesMat.color.setHex(isDark ? 0x60a5fa : 0x3b82f6);
    handles.linesMat.opacity = isDark ? 0.16 : 0.12;

    handles.renderFrame();
  }, [resolvedTheme]);

  if (webglFailed) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        ref={containerRef}
        aria-hidden="true"
        className="w-full h-full pointer-events-none opacity-85 dark:opacity-95"
      />

      {!prefersReducedMotion && (
        <button
          type="button"
          onClick={() => setIsPaused(prev => !prev)}
          aria-pressed={isPaused}
          aria-label={isPaused ? 'Retomar animação 3D' : 'Pausar animação 3D'}
          className="pointer-events-auto absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-card/80 backdrop-blur-md text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          <span>{isPaused ? 'Retomar 3D' : 'Pausar 3D'}</span>
        </button>
      )}
    </div>
  );
};
