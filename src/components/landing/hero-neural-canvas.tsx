'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Pause, Play } from 'lucide-react';
import { useTheme } from '@/components/layout/theme-provider';

export const HeroNeuralCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = isPaused || prefersReducedMotion;
  }, [isPaused, prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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

    const isDark = resolvedTheme === 'dark';

    // Grupo principal para rotação suave + reação ao cursor
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Curva 3D da Memória Consolidada (FSRS-6 Ribbon Helix)
    const curvePoints: THREE.Vector3[] = [];
    const totalPts = 96;
    for (let i = 0; i <= totalPts; i++) {
      const t = i / totalPts;
      const x = (t - 0.5) * 9.5;
      // Retenção ascendente modulada em onda sináptica 3D
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
    const nodeGeo = new THREE.SphereGeometry(0.11, 20, 20);
    const ringGeo = new THREE.TorusGeometry(0.21, 0.018, 12, 32);

    for (let r = 0; r <= 8; r++) {
      const t = r / 8;
      const pos = retentionCurve.getPoint(t);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: r >= 6 ? 0x10b981 : r >= 3 ? 0x38bdf8 : 0x818cf8,
      });
      const sphere = new THREE.Mesh(nodeGeo, nodeMat);
      sphere.position.copy(pos);
      rootGroup.add(sphere);
      nodeMeshes.push(sphere);

      const ringMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x60a5fa : 0x3b82f6,
        transparent: true,
        opacity: 0.45,
      });
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

    const cPrimary = new THREE.Color(isDark ? 0x3b82f6 : 0x1d4ed8);
    const cEmerald = new THREE.Color(isDark ? 0x10b981 : 0x059669);
    const cIndigo = new THREE.Color(isDark ? 0x818cf8 : 0x4f46e5);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = (i / particleCount) * Math.PI * 10;
      const radius = 1.6 + ((i * 7) % 100) / 38;
      particlePositions[i3] = ((i / particleCount) - 0.5) * 11.5 + Math.sin(angle) * 0.4;
      particlePositions[i3 + 1] = Math.sin(angle * 0.7) * radius * 0.55;
      particlePositions[i3 + 2] = Math.cos(angle * 0.7) * radius * 0.65 - 0.4;

      const paletteColor = i % 3 === 0 ? cEmerald : i % 3 === 1 ? cPrimary : cIndigo;
      particleColors[i3] = paletteColor.r;
      particleColors[i3 + 1] = paletteColor.g;
      particleColors[i3 + 2] = paletteColor.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

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

    // Estado de interação com cursor
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      if (pausedRef.current) return;
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
    };

    window.addEventListener('resize', handleResize);

    let rafId = 0;
    const clock = new THREE.Clock();

    // Render inicial imediato (garante visualização mesmo com reduced-motion)
    rootGroup.rotation.y = -0.18;
    rootGroup.rotation.x = 0.08;
    renderer.render(scene, camera);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (pausedRef.current) return;

      const elapsed = clock.getElapsedTime();
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      rootGroup.rotation.y = -0.18 + Math.sin(elapsed * 0.22) * 0.18 + currentMouseX;
      rootGroup.rotation.x = 0.08 + Math.cos(elapsed * 0.18) * 0.06 - currentMouseY;
      particleCloud.rotation.y = elapsed * 0.03;

      nodeMeshes.forEach((mesh, idx) => {
        const pulse = 1 + Math.sin(elapsed * 2.2 + idx * 0.65) * 0.16;
        mesh.scale.setScalar(pulse);
      });

      renderer?.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      tubeGeometry.dispose();
      tubeMaterial.dispose();
      echoGeo.dispose();
      echoMat.dispose();
      nodeGeo.dispose();
      ringGeo.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      linesGeo.dispose();
      linesMat.dispose();
      renderer?.dispose();
    };
  }, [resolvedTheme]);

  if (webglFailed) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-60"
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[420px] rounded-full bg-gradient-to-tr from-blue-500/20 via-indigo-500/15 to-emerald-500/20 blur-3xl" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        ref={containerRef}
        aria-hidden="true"
        className="w-full h-full pointer-events-none opacity-85 dark:opacity-95"
      />

      {/* Controle acessível de pausa para animação 3D contínua */}
      {!prefersReducedMotion && (
        <button
          type="button"
          onClick={() => setIsPaused(prev => !prev)}
          aria-pressed={isPaused}
          aria-label={isPaused ? 'Retomar animação 3D' : 'Pausar animação 3D'}
          className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-card/80 backdrop-blur-md text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          <span>{isPaused ? 'Retomar 3D' : 'Pausar 3D'}</span>
        </button>
      )}
    </div>
  );
};
