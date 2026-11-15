import * as THREE from 'three';

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  srgb: boolean
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralTexturePack {
  barkMap: THREE.CanvasTexture;
  barkBump: THREE.CanvasTexture;
  grassLightMap: THREE.CanvasTexture;
  grassDarkMap: THREE.CanvasTexture;
  grassBump: THREE.CanvasTexture;
  cliffLightMap: THREE.CanvasTexture;
  cliffDarkMap: THREE.CanvasTexture;
  cliffBump: THREE.CanvasTexture;
  soilMap: THREE.CanvasTexture;
  soilBump: THREE.CanvasTexture;
  foliageBump: THREE.CanvasTexture;
  skyLightEnv: THREE.CanvasTexture;
  skyDarkEnv: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTexturePack(): ProceduralTexturePack {
  const textures: THREE.CanvasTexture[] = [];
  const reg = (t: THREE.CanvasTexture) => {
    textures.push(t);
    return t;
  };

  // 1. Casca de árvore (Albedo + Bump)
  const [barkC, barkCtx] = makeCanvas(256, 256);
  const [barkBC, barkBCtx] = makeCanvas(256, 256);
  const rngBark = createRng(104729);
  barkCtx.fillStyle = '#6b4732';
  barkCtx.fillRect(0, 0, 256, 256);
  barkBCtx.fillStyle = '#808080';
  barkBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = rngBark() * 256;
    const y = rngBark() * 256;
    const w = 1.5 + rngBark() * 4.5;
    const h = 24 + rngBark() * 90;
    const shade = Math.floor((rngBark() - 0.5) * 44);
    const r = Math.max(40, Math.min(150, 102 + shade));
    const g = Math.max(28, Math.min(110, 68 + Math.floor(shade * 0.7)));
    const b = Math.max(18, Math.min(85, 46 + Math.floor(shade * 0.5)));
    barkCtx.fillStyle = `rgba(${r},${g},${b},0.48)`;
    barkCtx.fillRect(x, y, w, h);
    const bv = Math.max(20, Math.min(240, 128 + shade * 2));
    barkBCtx.fillStyle = `rgba(${bv},${bv},${bv},0.55)`;
    barkBCtx.fillRect(x, y, w, h);
  }
  const barkMap = reg(configureTexture(barkC, 2, 4, true));
  const barkBump = reg(configureTexture(barkBC, 2, 4, false));

  // 2. Relva / Musgo da ilha (Light & Dark Albedo + Bump compartilhado)
  const buildGrassCanvas = (dark: boolean) => {
    const [c, ctx] = makeCanvas(512, 512);
    const rng = createRng(dark ? 9921 : 4412);
    ctx.fillStyle = dark ? '#184236' : '#4a9e49';
    ctx.fillRect(0, 0, 512, 512);

    // Manchas orgânicas de musgo e trevo
    for (let i = 0; i < 360; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const rad = 8 + rng() * 34;
      const grad = ctx.createRadialGradient(x, y, 1, x, y, rad);
      if (dark) {
        const mossTone = rng() > 0.35 ? 'rgba(22, 101, 78, 0.28)' : 'rgba(13, 52, 46, 0.34)';
        grad.addColorStop(0, mossTone);
      } else {
        const meadowTone = rng() > 0.35 ? 'rgba(101, 163, 13, 0.25)' : 'rgba(34, 139, 68, 0.24)';
        grad.addColorStop(0, meadowTone);
      }
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fios sutis de grama/musgo
    for (let i = 0; i < 1800; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      ctx.fillStyle = dark
        ? rng() > 0.2
          ? 'rgba(52, 211, 153, 0.14)'
          : 'rgba(6, 78, 59, 0.28)'
        : rng() > 0.25
        ? 'rgba(163, 230, 53, 0.18)'
        : 'rgba(21, 128, 61, 0.22)';
      ctx.fillRect(x, y, 1.5, 4 + rng() * 4);
    }
    return c;
  };
  const [grassBC, grassBCtx] = makeCanvas(256, 256);
  const rngGB = createRng(7717);
  grassBCtx.fillStyle = '#808080';
  grassBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const v = Math.floor(85 + rngGB() * 90);
    grassBCtx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    grassBCtx.fillRect(rngGB() * 256, rngGB() * 256, 2 + rngGB() * 4, 2 + rngGB() * 4);
  }
  const grassLightMap = reg(configureTexture(buildGrassCanvas(false), 3, 3, true));
  const grassDarkMap = reg(configureTexture(buildGrassCanvas(true), 3, 3, true));
  const grassBump = reg(configureTexture(grassBC, 4, 4, false));

  // 3. Rocha / Penhasco da base (Light & Dark + Bump)
  const buildCliffCanvas = (dark: boolean) => {
    const [c, ctx] = makeCanvas(256, 256);
    const rng = createRng(dark ? 5511 : 3319);
    ctx.fillStyle = dark ? '#2d2420' : '#7b5b43';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 120; i++) {
      const y = rng() * 256;
      const h = 4 + rng() * 14;
      ctx.fillStyle = dark
        ? `rgba(${32 + Math.floor(rng() * 28)}, ${28 + Math.floor(rng() * 24)}, ${34 + Math.floor(rng() * 28)}, 0.42)`
        : `rgba(${100 + Math.floor(rng() * 48)}, ${72 + Math.floor(rng() * 34)}, ${52 + Math.floor(rng() * 28)}, 0.38)`;
      ctx.fillRect(0, y, 256, h);
    }
    return c;
  };
  const [cliffBC, cliffBCtx] = makeCanvas(256, 256);
  const rngCB = createRng(6211);
  cliffBCtx.fillStyle = '#808080';
  cliffBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 320; i++) {
    const v = Math.floor(60 + rngCB() * 140);
    cliffBCtx.fillStyle = `rgba(${v},${v},${v},0.4)`;
    cliffBCtx.fillRect(rngCB() * 256, rngCB() * 256, 12 + rngCB() * 44, 3 + rngCB() * 9);
  }
  const cliffLightMap = reg(configureTexture(buildCliffCanvas(false), 3, 1.5, true));
  const cliffDarkMap = reg(configureTexture(buildCliffCanvas(true), 3, 1.5, true));
  const cliffBump = reg(configureTexture(cliffBC, 3, 2, false));

  // 4. Solo fértil dos canteiros
  const [soilC, soilCtx] = makeCanvas(256, 256);
  const [soilBC, soilBCtx] = makeCanvas(256, 256);
  const rngSoil = createRng(8813);
  soilCtx.fillStyle = '#4c3221';
  soilCtx.fillRect(0, 0, 256, 256);
  soilBCtx.fillStyle = '#808080';
  soilBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const x = rngSoil() * 256;
    const y = rngSoil() * 256;
    const r = 1 + rngSoil() * 3.5;
    const tone = Math.floor(42 + rngSoil() * 58);
    soilCtx.fillStyle = `rgba(${tone + 26},${tone + 10},${tone - 5},0.5)`;
    soilCtx.beginPath();
    soilCtx.arc(x, y, r, 0, Math.PI * 2);
    soilCtx.fill();
    const bv = Math.floor(60 + rngSoil() * 140);
    soilBCtx.fillStyle = `rgba(${bv},${bv},${bv},0.55)`;
    soilBCtx.beginPath();
    soilBCtx.arc(x, y, r, 0, Math.PI * 2);
    soilBCtx.fill();
  }
  const soilMap = reg(configureTexture(soilC, 2, 2, true));
  const soilBump = reg(configureTexture(soilBC, 2, 2, false));

  // 5. Micro-bump de folhagem orgânica
  const [folC, folCtx] = makeCanvas(256, 256);
  const rngFol = createRng(4111);
  folCtx.fillStyle = '#808080';
  folCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    const x = rngFol() * 256;
    const y = rngFol() * 256;
    const v = Math.floor(70 + rngFol() * 115);
    folCtx.fillStyle = `rgba(${v},${v},${v},0.42)`;
    folCtx.beginPath();
    folCtx.ellipse(x, y, 4 + rngFol() * 8, 2 + rngFol() * 5, rngFol() * Math.PI, 0, Math.PI * 2);
    folCtx.fill();
  }
  const foliageBump = reg(configureTexture(folC, 2, 2, false));

  // 6. Sky Domes equiretangular para PMREMGenerator IBL + Cúpula atmosférica
  const buildSkyEnv = (dark: boolean) => {
    const [c, ctx] = makeCanvas(1024, 512);
    const rng = createRng(dark ? 2026 : 1013);
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    if (dark) {
      // Gemini Hydrogen: crepúsculo profundo obsidiana/índigo com aurora bioluminescente
      grad.addColorStop(0.0, '#020512');
      grad.addColorStop(0.32, '#07132c');
      grad.addColorStop(0.55, '#0d2645');
      grad.addColorStop(0.75, '#0b1d35');
      grad.addColorStop(1.0, '#050b16');
    } else {
      // Diorama Solar: manhã dourada límpida
      grad.addColorStop(0.0, '#0284c7');
      grad.addColorStop(0.28, '#38bdf8');
      grad.addColorStop(0.52, '#bae6fd');
      grad.addColorStop(0.68, '#fef3c7');
      grad.addColorStop(1.0, '#d9f99d');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    if (dark) {
      // Nebulosa/Aurora ciano-esmeralda-violeta estilo Gemini Hydrogen (visível na linha do horizonte atrás da ilha)
      const auroras = [
        { x: 680, y: 245, rx: 310, ry: 110, col: 'rgba(34, 211, 238, 0.28)' },
        { x: 340, y: 270, rx: 280, ry: 95, col: 'rgba(52, 211, 153, 0.22)' },
        { x: 520, y: 225, rx: 260, ry: 85, col: 'rgba(139, 92, 246, 0.22)' },
        { x: 140, y: 260, rx: 240, ry: 90, col: 'rgba(56, 189, 248, 0.18)' },
        { x: 900, y: 265, rx: 220, ry: 90, col: 'rgba(16, 185, 129, 0.18)' },
      ];
      for (const a of auroras) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.scale(1, a.ry / a.rx);
        const g = ctx.createRadialGradient(0, 0, 8, 0, 0, a.rx);
        g.addColorStop(0, a.col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, a.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Estrelas sutis no hemisfério superior e médio
      for (let i = 0; i < 280; i++) {
        const sx = rng() * 1024;
        const sy = rng() * 320;
        const size = 0.6 + rng() * 1.4;
        ctx.fillStyle = `rgba(224, 242, 254, ${0.22 + rng() * 0.68})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Disco solar dourado e névoa quente matinal na linha do horizonte
      const sunGrad = ctx.createRadialGradient(710, 205, 12, 710, 205, 210);
      sunGrad.addColorStop(0, 'rgba(255, 251, 235, 0.98)');
      sunGrad.addColorStop(0.24, 'rgba(253, 230, 138, 0.68)');
      sunGrad.addColorStop(1, 'rgba(253, 230, 138, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(710, 205, 210, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 22; i++) {
        const cx = rng() * 1024;
        const cy = 150 + rng() * 165;
        const cr = 50 + rng() * 85;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1.9, 0.45);
        const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, cr);
        cg.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
        cg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(0, 0, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  const skyLightEnv = reg(buildSkyEnv(false));
  const skyDarkEnv = reg(buildSkyEnv(true));

  return {
    barkMap,
    barkBump,
    grassLightMap,
    grassDarkMap,
    grassBump,
    cliffLightMap,
    cliffDarkMap,
    cliffBump,
    soilMap,
    soilBump,
    foliageBump,
    skyLightEnv,
    skyDarkEnv,
    dispose: () => {
      textures.forEach(t => t.dispose());
    },
  };
}
