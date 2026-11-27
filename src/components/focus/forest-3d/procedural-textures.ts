import * as THREE from 'three';
import { BotanicalSpecies } from './types';

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
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  srgb: boolean,
  clamp = false
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  if (!clamp) {
    tex.repeat.set(repeatX, repeatY);
  }
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Dilatação de cor (alpha bleeding) baseada em fronteira BFS.
 * Preenche pixels transparentes adjacentes com a cor RGB dos vizinhos opacos,
 * preservando o canal alpha original para eliminar halos escuros no mipmapping.
 */
function applyAlphaBleeding(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  passes = 10
): void {
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  const total = width * height;
  // 0 = transparente não preenchido, 1 = tem cor válida
  const filled = new Uint8Array(total);
  let frontier: number[] = [];

  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3] >= 24) {
      filled[i] = 1;
    }
  }

  // Coleta primeira fronteira de pixels transparentes com vizinho opaco
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const idx = row + x;
      if (filled[idx]) continue;
      const hasOpaqueNeighbor =
        (x > 0 && filled[idx - 1]) ||
        (x + 1 < width && filled[idx + 1]) ||
        (y > 0 && filled[idx - width]) ||
        (y + 1 < height && filled[idx + width]);
      if (hasOpaqueNeighbor) {
        frontier.push(idx);
      }
    }
  }

  const dirs = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1];
  const nextMask = new Uint8Array(total);

  for (let p = 0; p < passes && frontier.length > 0; p++) {
    const nextFrontier: number[] = [];
    const writes: Array<[number, number, number, number]> = [];

    for (let f = 0; f < frontier.length; f++) {
      const idx = frontier[f];
      if (filled[idx]) continue;
      const x = idx % width;
      const y = (idx - x) / width;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;

      for (let d = 0; d < dirs.length; d++) {
        const nIdx = idx + dirs[d];
        if (nIdx < 0 || nIdx >= total) continue;
        const nx = nIdx % width;
        if (Math.abs(nx - x) > 1) continue;
        if (filled[nIdx]) {
          const o = nIdx * 4;
          rSum += data[o];
          gSum += data[o + 1];
          bSum += data[o + 2];
          count++;
        }
      }

      if (count > 0) {
        writes.push([idx, Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)]);
        // Enfileira vizinhos ainda vazios
        if (x > 0 && !filled[idx - 1] && !nextMask[idx - 1]) {
          nextMask[idx - 1] = 1;
          nextFrontier.push(idx - 1);
        }
        if (x + 1 < width && !filled[idx + 1] && !nextMask[idx + 1]) {
          nextMask[idx + 1] = 1;
          nextFrontier.push(idx + 1);
        }
        if (y > 0 && !filled[idx - width] && !nextMask[idx - width]) {
          nextMask[idx - width] = 1;
          nextFrontier.push(idx - width);
        }
        if (y + 1 < height && !filled[idx + width] && !nextMask[idx + width]) {
          nextMask[idx + width] = 1;
          nextFrontier.push(idx + width);
        }
      }
    }

    for (let w = 0; w < writes.length; w++) {
      const [idx, r, g, b] = writes[w];
      const o = idx * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      filled[idx] = 1;
    }

    frontier = nextFrontier;
  }

  ctx.putImageData(img, 0, 0);
}

/**
 * Gera normalMap tangent-space via operador Sobel 3x3 sobre um heightfield tileable.
 */
function generateSobelNormalCanvas(
  heightField: Float32Array,
  size: number,
  strength: number
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  const img = ctx.createImageData(size, size);
  const out = img.data;
  const mask = size - 1;

  for (let y = 0; y < size; y++) {
    const ym = ((y - 1) & mask) * size;
    const y0 = y * size;
    const yp = ((y + 1) & mask) * size;

    for (let x = 0; x < size; x++) {
      const xm = (x - 1) & mask;
      const xp = (x + 1) & mask;

      const tl = heightField[ym + xm];
      const t = heightField[ym + x];
      const tr = heightField[ym + xp];
      const l = heightField[y0 + xm];
      const r = heightField[y0 + xp];
      const bl = heightField[yp + xm];
      const b = heightField[yp + x];
      const br = heightField[yp + xp];

      const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const invLen = 1 / Math.sqrt(dX * dX + dY * dY + 1);

      const nx = -dX * invLen;
      const ny = dY * invLen;
      const nz = invLen;

      const o = (y0 + x) * 4;
      out[o] = Math.max(0, Math.min(255, Math.round((nx * 0.5 + 0.5) * 255)));
      out[o + 1] = Math.max(0, Math.min(255, Math.round((ny * 0.5 + 0.5) * 255)));
      out[o + 2] = Math.max(0, Math.min(255, Math.round((nz * 0.5 + 0.5) * 255)));
      out[o + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * Value noise 2D periódica (tileable) rápida para FBM de casca e rocha.
 */
function createTileableNoise(seed: number) {
  const rng = createRng(seed);
  const perm = new Uint8Array(512);
  const vals = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    perm[i] = i;
    vals[i] = rng();
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  return (u: number, v: number, periodX: number, periodY: number): number => {
    const x = u * periodX;
    const y = v * periodY;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const xi0 = ((x0 % periodX) + periodX) % periodX;
    const xi1 = (xi0 + 1) % periodX;
    const yi0 = ((y0 % periodY) + periodY) % periodY;
    const yi1 = (yi0 + 1) % periodY;

    const h00 = vals[perm[(perm[xi0 & 255] + (yi0 & 255)) & 255]];
    const h10 = vals[perm[(perm[xi1 & 255] + (yi0 & 255)) & 255]];
    const h01 = vals[perm[(perm[xi0 & 255] + (yi1 & 255)) & 255]];
    const h11 = vals[perm[(perm[xi1 & 255] + (yi1 & 255)) & 255]];

    const ix0 = h00 + (h10 - h00) * sx;
    const ix1 = h01 + (h11 - h01) * sx;
    return ix0 + (ix1 - ix0) * sy;
  };
}

/**
 * Desenha uma folha botânica lanceolada/elíptica detalhada com nervura central,
 * nervuras secundárias pinadas e opcionalmente borda serrilhada.
 */
function drawDetailedLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  width: number,
  angle: number,
  colorBase: string,
  colorMid: string,
  colorTip: string,
  veinColor: string,
  serrated = false
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Sombra sutil sob a folha para dar profundidade ao raminho
  ctx.shadowColor = 'rgba(8, 22, 12, 0.32)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  const grad = ctx.createLinearGradient(0, 0, 0, -length);
  grad.addColorStop(0, colorBase);
  grad.addColorStop(0.55, colorMid);
  grad.addColorStop(1, colorTip);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  if (serrated) {
    const teeth = 7;
    for (let i = 1; i <= teeth; i++) {
      const t = i / (teeth + 1);
      const profile = Math.sin(t * Math.PI);
      const wOut = width * 0.52 * profile;
      const wIn = wOut * 0.84;
      ctx.lineTo(wOut, -length * t);
      ctx.lineTo(wIn, -length * (t + 0.045));
    }
    ctx.lineTo(0, -length);
    for (let i = teeth; i >= 1; i--) {
      const t = i / (teeth + 1);
      const profile = Math.sin(t * Math.PI);
      const wOut = width * 0.52 * profile;
      const wIn = wOut * 0.84;
      ctx.lineTo(-wIn, -length * (t + 0.045));
      ctx.lineTo(-wOut, -length * t);
    }
  } else {
    ctx.bezierCurveTo(width * 0.62, -length * 0.24, width * 0.56, -length * 0.72, 0, -length);
    ctx.bezierCurveTo(-width * 0.56, -length * 0.72, -width * 0.62, -length * 0.24, 0, 0);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // Contorno sutil natural na borda
  ctx.strokeStyle = 'rgba(18, 48, 24, 0.35)';
  ctx.lineWidth = Math.max(1.2, width * 0.025);
  ctx.stroke();

  // Nervura central
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = Math.max(1.8, width * 0.042);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, -length * 0.92);
  ctx.stroke();

  // Nervuras laterais pinadas
  ctx.lineWidth = Math.max(1.0, width * 0.022);
  const pairs = 5;
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1.2);
    const y0 = -length * t;
    const span = width * 0.42 * Math.sin(t * Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.quadraticCurveTo(span * 0.55, y0 - length * 0.04, span * 0.92, y0 - length * 0.11);
    ctx.moveTo(0, y0);
    ctx.quadraticCurveTo(-span * 0.55, y0 - length * 0.04, -span * 0.92, y0 - length * 0.11);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha uma folha lobada de carvalho (Quercus) com nervuras ramificadas nos lóbulos.
 */
function drawOakLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  width: number,
  angle: number,
  colorBase: string,
  colorMid: string,
  colorTip: string,
  veinColor: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.shadowColor = 'rgba(6, 20, 10, 0.34)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  const grad = ctx.createLinearGradient(0, 0, 0, -length);
  grad.addColorStop(0, colorBase);
  grad.addColorStop(0.55, colorMid);
  grad.addColorStop(1, colorTip);

  const lobes: Array<[number, number, number]> = [
    [0.24, 0.36, 0.18],
    [0.48, 0.58, 0.30],
    [0.72, 0.52, 0.24],
    [0.88, 0.30, 0.12],
  ];

  ctx.beginPath();
  ctx.moveTo(0, 0);
  // Lado direito com 4 lóbulos arredondados
  for (let i = 0; i < lobes.length; i++) {
    const [t, outer, inner] = lobes[i];
    const yMid = -length * t;
    const yNext = -length * Math.min(0.95, t + 0.11);
    ctx.quadraticCurveTo(width * outer, yMid, width * inner, yNext);
  }
  ctx.quadraticCurveTo(width * 0.16, -length * 0.99, 0, -length);
  // Lado esquerdo espelhado
  ctx.quadraticCurveTo(-width * 0.16, -length * 0.99, -width * lobes[3][2], -length * 0.95);
  for (let i = lobes.length - 1; i >= 0; i--) {
    const [t, outer, inner] = lobes[i];
    const yMid = -length * t;
    const yPrev = -length * Math.max(0.06, t - 0.11);
    ctx.quadraticCurveTo(-width * outer, yMid, -width * (i === 0 ? 0.04 : inner), yPrev);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(15, 38, 18, 0.38)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Nervura central e ramificações para os lóbulos
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(0, -length * 0.92);
  ctx.stroke();

  ctx.lineWidth = 1.4;
  for (const [t, outer] of lobes) {
    const y0 = -length * (t - 0.07);
    const y1 = -length * (t + 0.02);
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(width * outer * 0.72, y1);
    ctx.moveTo(0, y0);
    ctx.lineTo(-width * outer * 0.72, y1);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha uma flor botânica neutra luminosa (multiplicada depois pela cor da Grande Área).
 */
function drawNeutralBlossom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  petals: number,
  rotation: number,
  notched = false
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.shadowColor = 'rgba(20, 22, 28, 0.24)';
  ctx.shadowBlur = 6;

  for (let p = 0; p < petals; p++) {
    const a = (p / petals) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);

    const g = ctx.createRadialGradient(0, -radius * 0.35, radius * 0.08, 0, -radius * 0.55, radius * 0.95);
    g.addColorStop(0, '#c8ccd4');
    g.addColorStop(0.35, '#eef0f4');
    g.addColorStop(0.82, '#ffffff');
    g.addColorStop(1, '#e6e8ec');

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (notched) {
      ctx.bezierCurveTo(radius * 0.45, -radius * 0.28, radius * 0.46, -radius * 0.82, radius * 0.14, -radius * 0.98);
      ctx.lineTo(0, -radius * 0.84);
      ctx.lineTo(-radius * 0.14, -radius * 0.98);
      ctx.bezierCurveTo(-radius * 0.46, -radius * 0.82, -radius * 0.45, -radius * 0.28, 0, 0);
    } else {
      ctx.bezierCurveTo(radius * 0.56, -radius * 0.24, radius * 0.52, -radius * 0.92, 0, -radius);
      ctx.bezierCurveTo(-radius * 0.52, -radius * 0.92, -radius * 0.56, -radius * 0.24, 0, 0);
    }
    ctx.closePath();
    ctx.fill();

    // Nervura sutil da pétala
    ctx.strokeStyle = 'rgba(160, 165, 175, 0.35)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.12);
    ctx.lineTo(0, -radius * 0.72);
    ctx.stroke();
    ctx.restore();
  }

  ctx.shadowColor = 'transparent';
  // Miolo com estames finos
  const centerG = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 0.28);
  centerG.addColorStop(0, '#b5b8be');
  centerG.addColorStop(1, '#e4e6ea');
  ctx.fillStyle = centerG;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(130, 134, 142, 0.55)';
  ctx.lineWidth = 1.2;
  for (let s = 0; s < 7; s++) {
    const sa = (s / 7) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sa) * radius * 0.36, Math.sin(sa) * radius * 0.36);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(Math.cos(sa) * radius * 0.38, Math.sin(sa) * radius * 0.38, radius * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTwigBase(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, widthStart: number, widthEnd: number) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < points.length - 1; i++) {
    const t = i / Math.max(1, points.length - 2);
    ctx.strokeStyle = i === 0 ? '#5c4635' : '#6e543e';
    ctx.lineWidth = widthStart + (widthEnd - widthStart) * t;
    ctx.beginPath();
    ctx.moveTo(points[i][0], points[i][1]);
    ctx.lineTo(points[i + 1][0], points[i + 1][1]);
    ctx.stroke();
  }
  ctx.restore();
}

export interface ProceduralTexturePack {
  barkMap: THREE.CanvasTexture;
  barkNormalMap: THREE.CanvasTexture;
  barkRoughnessMap: THREE.CanvasTexture;
  witheredBarkMap: THREE.CanvasTexture;
  foliageMaps: Record<BotanicalSpecies, THREE.CanvasTexture>;
  accentMaps: Record<BotanicalSpecies, THREE.CanvasTexture>;
  grassLightMap: THREE.CanvasTexture;
  grassDarkMap: THREE.CanvasTexture;
  grassNormalMap: THREE.CanvasTexture;
  cliffLightMap: THREE.CanvasTexture;
  cliffDarkMap: THREE.CanvasTexture;
  cliffNormalMap: THREE.CanvasTexture;
  soilMap: THREE.CanvasTexture;
  soilNormalMap: THREE.CanvasTexture;
  rockMossMap: THREE.CanvasTexture;
  rockNormalMap: THREE.CanvasTexture;
  pebbleBedMap: THREE.CanvasTexture;
  lilyPadMap: THREE.CanvasTexture;
  lilyFlowerMap: THREE.CanvasTexture;
  reedMap: THREE.CanvasTexture;
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

  // =========================================================================
  // 1. CASCA PBR REALISTA 1024x1024 (Albedo + Sobel NormalMap + RoughnessMap)
  // Calibrada para barkMat.color = 0xffffff (sem dupla multiplicação escura!)
  // =========================================================================
  const barkSize = 1024;
  const barkHeight = new Float32Array(barkSize * barkSize);
  const [barkC, barkCtx] = makeCanvas(barkSize, barkSize);
  const [barkRoughC, barkRoughCtx] = makeCanvas(barkSize, barkSize);
  const [witheredC, witheredCtx] = makeCanvas(512, 512);

  const barkImg = barkCtx.createImageData(barkSize, barkSize);
  const roughImg = barkRoughCtx.createImageData(barkSize, barkSize);
  const barkNoise = createTileableNoise(104729);
  const mossNoise = createTileableNoise(31337);

  for (let y = 0; y < barkSize; y++) {
    const v = y / barkSize;
    // Musgo/líquen natural mais concentrado perto da base (y próximo a barkSize -> v próximo a 0 em Three.js!)
    const baseMossMask = Math.pow(Math.max(0, (v - 0.58) / 0.42), 1.65);

    for (let x = 0; x < barkSize; x++) {
      const u = x / barkSize;

      // Distorção orgânica leve nos sulcos verticais da casca
      const warp = (barkNoise(u, v, 8, 4) - 0.5) * 0.045;
      const uw = u + warp;

      // Multi-oitava anisotrópica (alta frequência em X, alongada em Y)
      const n1 = barkNoise(uw, v, 16, 4);
      const n2 = barkNoise(uw, v, 32, 8);
      const n3 = barkNoise(uw, v, 64, 16);
      const n4 = barkNoise(uw, v, 128, 32);

      // Fissuras profundas tipo ridge noise
      const ridge1 = 1 - Math.abs(n1 * 2 - 1);
      const ridge2 = 1 - Math.abs(n2 * 2 - 1);
      const furrow = Math.pow(ridge1, 1.8) * 0.62 + Math.pow(ridge2, 1.5) * 0.38;

      const hVal = Math.max(0, Math.min(1, furrow * 0.72 + n3 * 0.18 + n4 * 0.1));
      const idx = y * barkSize + x;
      barkHeight[idx] = hVal;

      // Albedo natural calibrado para color = 0xffffff (cristas quentes, fissuras profundas)
      const plate = Math.pow(hVal, 0.85);
      let r = 68 + plate * 92 + (n3 - 0.5) * 18;
      let g = 50 + plate * 72 + (n3 - 0.5) * 14;
      let b = 38 + plate * 54 + (n4 - 0.5) * 12;

      // Liquen cinza-esverdeado e musgo sutil nas cristas e base
      const mPatch = mossNoise(u, v, 12, 12);
      const mossAmt =
        baseMossMask * Math.max(0, (mPatch - 0.42) * 1.9) * (0.4 + 0.6 * plate) +
        Math.max(0, (mPatch - 0.78) * 2.4) * plate * 0.25;
      const clampedMoss = Math.min(0.68, mossAmt);

      if (clampedMoss > 0.001) {
        r = r * (1 - clampedMoss) + 74 * clampedMoss;
        g = g * (1 - clampedMoss) + 104 * clampedMoss;
        b = b * (1 - clampedMoss) + 60 * clampedMoss;
      }

      const o = idx * 4;
      barkImg.data[o] = Math.max(28, Math.min(220, Math.round(r)));
      barkImg.data[o + 1] = Math.max(22, Math.min(205, Math.round(g)));
      barkImg.data[o + 2] = Math.max(18, Math.min(185, Math.round(b)));
      barkImg.data[o + 3] = 255;

      // Roughness 0.78..0.96 (fissuras mais ásperas, placas e musgo ligeiramente menos)
      const rough = Math.max(0.78, Math.min(0.96, 0.96 - plate * 0.14 - clampedMoss * 0.04));
      const rv = Math.round(rough * 255);
      roughImg.data[o] = rv;
      roughImg.data[o + 1] = rv;
      roughImg.data[o + 2] = rv;
      roughImg.data[o + 3] = 255;
    }
  }
  barkCtx.putImageData(barkImg, 0, 0);
  barkRoughCtx.putImageData(roughImg, 0, 0);

  const barkNormalC = generateSobelNormalCanvas(barkHeight, barkSize, 3.6);

  // Casca seca dessaturada (withered) a partir da casca principal
  witheredCtx.drawImage(barkC, 0, 0, 512, 512);
  const wImg = witheredCtx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < wImg.data.length; i += 4) {
    const lum = wImg.data[i] * 0.34 + wImg.data[i + 1] * 0.5 + wImg.data[i + 2] * 0.16;
    wImg.data[i] = Math.min(220, Math.round(lum * 1.06 + 8));
    wImg.data[i + 1] = Math.min(215, Math.round(lum * 1.02 + 5));
    wImg.data[i + 2] = Math.min(210, Math.round(lum * 0.96 + 2));
  }
  witheredCtx.putImageData(wImg, 0, 0);

  const barkMap = reg(configureTexture(barkC, 2, 3.5, true));
  const barkNormalMap = reg(configureTexture(barkNormalC, 2, 3.5, false));
  const barkRoughnessMap = reg(configureTexture(barkRoughC, 2, 3.5, false));
  const witheredBarkMap = reg(configureTexture(witheredC, 2, 3.5, true));

  // =========================================================================
  // 2. 5 ATLAS FOLIARES BOTÂNICOS 1024x1024 (RECORTADOS + ALPHA BLEEDING)
  // =========================================================================
  const buildFoliageAtlas = (species: BotanicalSpecies): THREE.CanvasTexture => {
    const size = 1024;
    const [c, ctx] = makeCanvas(size, size);
    const rng = createRng(
      species === 'ipe_blossom'
        ? 21011
        : species === 'broad_oak'
        ? 32023
        : species === 'sakura_weeping'
        ? 43037
        : species === 'tropical_palm'
        ? 54049
        : 65053
    );
    ctx.clearRect(0, 0, size, size);

    if (species === 'ipe_blossom') {
      // Folhas compostas digitadas de Ipê (grupos de 5 folíolos lanceolados)
      drawTwigBase(
        ctx,
        [
          [512, 995],
          [508, 760],
          [516, 510],
          [510, 290],
        ],
        15,
        5
      );
      const nodes: Array<[number, number, number, number]> = [
        [512, 820, -0.55, 0.85],
        [512, 800, 0.58, 0.85],
        [508, 630, -0.72, 1.02],
        [514, 620, 0.72, 1.02],
        [512, 460, -0.48, 0.96],
        [516, 455, 0.52, 0.96],
        [510, 310, 0.0, 1.04],
      ];
      for (const [nx, ny, baseAng, sc] of nodes) {
        const subX = nx + Math.sin(baseAng) * 145 * sc;
        const subY = ny - Math.cos(baseAng) * 145 * sc;
        drawTwigBase(ctx, [[nx, ny], [subX, subY]], 6, 3);
        // 5 folíolos digitados irradiando do pecíolo
        const fanAngles = [-1.15, -0.56, 0.0, 0.56, 1.15];
        const fanLens = [148, 198, 226, 196, 146];
        for (let k = 0; k < 5; k++) {
          const jitter = (rng() - 0.5) * 0.14;
          const l = fanLens[k] * sc * (0.9 + rng() * 0.18);
          const w = l * (0.34 + rng() * 0.06);
          const tone = rng();
          const cBase = tone > 0.5 ? '#1f4f2a' : '#25582e';
          const cMid = tone > 0.5 ? '#3b7e3c' : '#458b3d';
          const cTip = tone > 0.5 ? '#6db34a' : '#7ec152';
          drawDetailedLeaf(
            ctx,
            subX,
            subY,
            l,
            w,
            baseAng * 0.55 + fanAngles[k] + jitter,
            cBase,
            cMid,
            cTip,
            'rgba(176, 224, 128, 0.52)',
            false
          );
        }
      }
    } else if (species === 'broad_oak') {
      // Folhas lobadas de Carvalho com silhueta recortada e clorofila rica
      drawTwigBase(
        ctx,
        [
          [512, 995],
          [502, 740],
          [520, 480],
          [512, 240],
        ],
        18,
        6
      );
      const placements: Array<[number, number, number, number]> = [
        [506, 860, -1.05, 0.92],
        [516, 850, 1.05, 0.92],
        [502, 730, -0.78, 1.06],
        [518, 715, 0.78, 1.06],
        [455, 635, -1.18, 0.96],
        [565, 625, 1.18, 0.96],
        [508, 560, -0.52, 1.12],
        [520, 550, 0.52, 1.12],
        [420, 480, -0.92, 0.98],
        [604, 470, 0.92, 0.98],
        [514, 400, -0.38, 1.05],
        [516, 395, 0.42, 1.05],
        [480, 315, -0.68, 0.9],
        [545, 310, 0.68, 0.9],
        [512, 255, -0.1, 1.02],
        [512, 250, 0.16, 0.96],
      ];
      for (const [px, py, ang, sc] of placements) {
        const l = (245 + rng() * 55) * sc;
        const w = l * (0.58 + rng() * 0.08);
        const shade = rng();
        const cBase = shade > 0.5 ? '#1b4726' : '#215029';
        const cMid = shade > 0.5 ? '#2f6e33' : '#3a7d37';
        const cTip = shade > 0.5 ? '#5b9e43' : '#6cb04a';
        drawOakLeaf(
          ctx,
          px,
          py,
          l,
          w,
          ang + (rng() - 0.5) * 0.14,
          cBase,
          cMid,
          cTip,
          'rgba(166, 212, 118, 0.55)'
        );
      }
    } else if (species === 'sakura_weeping') {
      // Folhas elípticas finamente serrilhadas de Cerejeira em raminhos delicados
      drawTwigBase(
        ctx,
        [
          [512, 995],
          [518, 740],
          [506, 480],
          [514, 210],
        ],
        13,
        4
      );
      drawTwigBase(ctx, [[514, 720], [340, 560], [210, 440]], 7, 3);
      drawTwigBase(ctx, [[514, 700], [690, 540], [820, 420]], 7, 3);
      drawTwigBase(ctx, [[508, 490], [350, 320]], 6, 3);
      drawTwigBase(ctx, [[508, 480], [670, 310]], 6, 3);

      const leaves: Array<[number, number, number, number]> = [
        [512, 870, -0.9, 0.88],
        [516, 860, 0.9, 0.88],
        [440, 650, -1.15, 0.92],
        [370, 585, -0.82, 0.98],
        [310, 525, -1.25, 0.94],
        [240, 465, -0.78, 0.9],
        [205, 435, -0.45, 0.86],
        [590, 630, 1.15, 0.92],
        [660, 565, 0.82, 0.98],
        [720, 505, 1.25, 0.94],
        [790, 445, 0.78, 0.9],
        [825, 415, 0.45, 0.86],
        [440, 415, -0.98, 0.95],
        [370, 345, -0.62, 0.92],
        [340, 315, -0.28, 0.85],
        [585, 405, 0.98, 0.95],
        [655, 335, 0.62, 0.92],
        [680, 305, 0.28, 0.85],
        [512, 560, -0.42, 1.0],
        [514, 550, 0.42, 1.0],
        [510, 370, -0.5, 0.94],
        [516, 360, 0.5, 0.94],
        [512, 235, -0.35, 0.92],
        [516, 230, 0.35, 0.92],
        [514, 210, 0.02, 0.98],
      ];
      for (const [lx, ly, ang, sc] of leaves) {
        const l = (188 + rng() * 44) * sc;
        const w = l * (0.43 + rng() * 0.06);
        const shade = rng();
        const cBase = shade > 0.5 ? '#265c34' : '#2d683b';
        const cMid = shade > 0.5 ? '#438d4a' : '#4fa052';
        const cTip = shade > 0.5 ? '#7ac964' : '#8dd672';
        drawDetailedLeaf(
          ctx,
          lx,
          ly,
          l,
          w,
          ang + (rng() - 0.5) * 0.14,
          cBase,
          cMid,
          cTip,
          'rgba(196, 240, 152, 0.56)',
          true
        );
      }
    } else if (species === 'tropical_palm') {
      // Fronde pinada completa 1024x1024 com 40 pares de folíolos finos arqueados
      // Raque central indo da base (512, 1005) até o ápice (512, 32)
      const rachisGrad = ctx.createLinearGradient(512, 1005, 512, 32);
      rachisGrad.addColorStop(0, '#5a7a30');
      rachisGrad.addColorStop(0.5, '#6d9938');
      rachisGrad.addColorStop(1, '#8cc047');

      ctx.strokeStyle = rachisGrad;
      ctx.lineCap = 'round';
      for (let seg = 0; seg < 24; seg++) {
        const t0 = seg / 24;
        const t1 = (seg + 1) / 24;
        ctx.lineWidth = 18 * (1 - t0 * 0.84);
        ctx.beginPath();
        ctx.moveTo(512, 1005 - t0 * 970);
        ctx.lineTo(512, 1005 - t1 * 970);
        ctx.stroke();
      }

      const pairs = 40;
      for (let i = 0; i < pairs; i++) {
        const t = 0.08 + (i / (pairs - 1)) * 0.89;
        const y0 = 1005 - t * 970;
        // Perfil de largura da fronde: estreito na base, bem largo no meio, afilando no topo
        const env = Math.sin(Math.pow(t, 0.82) * Math.PI);
        const leafletLen = 95 + env * 370;

        for (const side of [-1, 1]) {
          const jitter = (rng() - 0.5) * 14;
          const len = leafletLen + jitter;
          // Folíolos saem em ângulo agudo apontando para cima e arqueiam levemente para fora/baixo
          const angSweep = 0.32 + (1 - t) * 0.42;
          const tipX = 512 + side * Math.sin(angSweep + 0.55) * len;
          const tipY = y0 - Math.cos(angSweep + 0.55) * len * 0.92 + env * 28;
          const ctrlX = 512 + side * len * 0.56;
          const ctrlY = y0 - len * 0.42;

          const baseW = 7.5 + env * 6.5;
          const shade = rng();
          const lg = ctx.createLinearGradient(512, y0, tipX, tipY);
          lg.addColorStop(0, shade > 0.5 ? '#265c26' : '#2d682a');
          lg.addColorStop(0.58, shade > 0.5 ? '#489336' : '#53a33c');
          lg.addColorStop(1, shade > 0.5 ? '#86c449' : '#95cf54');

          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.moveTo(512, y0 + baseW * 0.45);
          ctx.quadraticCurveTo(ctrlX, ctrlY + baseW * 0.45, tipX, tipY);
          ctx.quadraticCurveTo(ctrlX, ctrlY - baseW * 0.55, 512, y0 - baseW * 0.55);
          ctx.closePath();
          ctx.fill();

          // Nervura central do folíolo
          ctx.strokeStyle = 'rgba(182, 232, 118, 0.45)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(512, y0);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
          ctx.stroke();
        }
      }
    } else {
      // alpine_pine: raminho de conífera com centenas de agulhas radiais recortadas
      const stems: Array<Array<[number, number]>> = [
        [
          [512, 995],
          [512, 650],
          [512, 340],
          [512, 95],
        ],
        [
          [512, 760],
          [340, 560],
          [190, 390],
        ],
        [
          [512, 750],
          [684, 550],
          [834, 380],
        ],
        [
          [512, 520],
          [345, 345],
          [240, 225],
        ],
        [
          [512, 510],
          [680, 335],
          [785, 215],
        ],
        [
          [512, 310],
          [400, 175],
        ],
        [
          [512, 305],
          [625, 170],
        ],
      ];

      // Primeiro desenha galhinhos lenhosos
      for (let s = 0; s < stems.length; s++) {
        drawTwigBase(ctx, stems[s], s === 0 ? 14 : 9, 3);
      }

      // Depois popula agulhas de pinheiro densas ao longo de cada haste
      const drawNeedlesAlongSegment = (x0: number, y0: number, x1: number, y1: number, density: number, needleScale: number) => {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const segLen = Math.hypot(dx, dy);
        const stemAng = Math.atan2(dy, dx);
        const steps = Math.max(8, Math.floor((segLen / 10) * density));

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const px = x0 + dx * t;
          const py = y0 + dy * t;

          for (const side of [-1, 1]) {
            const countAtNode = 2;
            for (let k = 0; k < countAtNode; k++) {
              const spread = side * (0.48 + rng() * 0.62);
              const ang = stemAng + spread;
              const nLen = (68 + rng() * 54) * needleScale * (1 - t * 0.22);
              const ex = px + Math.cos(ang) * nLen;
              const ey = py + Math.sin(ang) * nLen;

              const shade = rng();
              const ng = ctx.createLinearGradient(px, py, ex, ey);
              ng.addColorStop(0, shade > 0.5 ? '#123322' : '#173d29');
              ng.addColorStop(0.55, shade > 0.5 ? '#235e3c' : '#2a6d46');
              ng.addColorStop(1, shade > 0.5 ? '#489362' : '#5aa676');

              ctx.strokeStyle = ng;
              ctx.lineWidth = 3.2 + rng() * 2.2;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(ex, ey);
              ctx.stroke();
            }
          }
        }
      };

      for (let s = 0; s < stems.length; s++) {
        const pts = stems[s];
        for (let p = 0; p < pts.length - 1; p++) {
          drawNeedlesAlongSegment(
            pts[p][0],
            pts[p][1],
            pts[p + 1][0],
            pts[p + 1][1],
            s === 0 ? 1.15 : 1.0,
            s === 0 ? 1.05 : 0.88
          );
        }
      }
    }

    applyAlphaBleeding(ctx, size, size, 10);
    return reg(configureTexture(c, 1, 1, true, true));
  };

  // =========================================================================
  // 3. 5 ATLAS DE ACENTO BOTÂNICO 1024x1024 (FLORES / BROTOS / FRUTOS / PINHAS)
  // Tons claros neutros para multiplicar fielmente pela cor da Grande Área!
  // =========================================================================
  const buildAccentAtlas = (species: BotanicalSpecies): THREE.CanvasTexture => {
    const size = 1024;
    const [c, ctx] = makeCanvas(size, size);
    const rng = createRng(
      species === 'ipe_blossom'
        ? 71011
        : species === 'broad_oak'
        ? 72023
        : species === 'sakura_weeping'
        ? 73037
        : species === 'tropical_palm'
        ? 74049
        : 75053
    );
    ctx.clearRect(0, 0, size, size);

    if (species === 'ipe_blossom') {
      // Cacho exuberante de flores trombeta de Ipê
      drawTwigBase(ctx, [[512, 970], [512, 640], [450, 420]], 10, 4);
      drawTwigBase(ctx, [[512, 680], [595, 450]], 8, 4);
      const blossoms: Array<[number, number, number]> = [
        [512, 230, 128],
        [370, 315, 118],
        [654, 315, 118],
        [275, 450, 112],
        [455, 420, 125],
        [585, 430, 122],
        [750, 455, 110],
        [345, 585, 114],
        [512, 560, 124],
        [675, 580, 114],
        [425, 705, 102],
        [595, 705, 102],
        [512, 770, 96],
      ];
      for (const [bx, by, rad] of blossoms) {
        drawNeutralBlossom(ctx, bx, by, rad * (0.9 + rng() * 0.16), 5, rng() * Math.PI * 2, false);
      }
    } else if (species === 'broad_oak') {
      // Coroa de brotos foliares jovens e flores delicadas de ponta para identificar a Grande Área no Carvalho
      drawTwigBase(ctx, [[512, 980], [512, 620], [512, 340]], 10, 4);
      drawTwigBase(ctx, [[512, 680], [340, 500]], 7, 3);
      drawTwigBase(ctx, [[512, 670], [685, 495]], 7, 3);

      const buds: Array<[number, number, number, number]> = [
        [512, 340, 0.0, 1.1],
        [512, 360, -0.58, 1.0],
        [512, 360, 0.58, 1.0],
        [340, 500, -0.78, 0.96],
        [340, 500, -0.24, 0.92],
        [340, 500, -1.25, 0.85],
        [685, 495, 0.78, 0.96],
        [685, 495, 0.24, 0.92],
        [685, 495, 1.25, 0.85],
        [512, 610, -0.82, 0.9],
        [512, 610, 0.82, 0.9],
      ];
      for (const [bx, by, ang, sc] of buds) {
        drawDetailedLeaf(
          ctx,
          bx,
          by,
          215 * sc,
          108 * sc,
          ang + (rng() - 0.5) * 0.12,
          '#c9cdd4',
          '#eef0f4',
          '#ffffff',
          'rgba(255,255,255,0.85)',
          false
        );
      }
      // Pequenas flores delicadas no centro dos brotos
      drawNeutralBlossom(ctx, 512, 305, 76, 5, 0.4, false);
      drawNeutralBlossom(ctx, 340, 480, 64, 5, 1.1, false);
      drawNeutralBlossom(ctx, 685, 475, 64, 5, 2.2, false);
    } else if (species === 'sakura_weeping') {
      // Cachos pendentes de flores de cerejeira (pétalas chanfradas)
      drawTwigBase(ctx, [[512, 975], [505, 680], [520, 380], [510, 175]], 10, 3);
      drawTwigBase(ctx, [[508, 690], [310, 510]], 6, 3);
      drawTwigBase(ctx, [[512, 660], [715, 490]], 6, 3);
      const flowers: Array<[number, number, number]> = [
        [510, 195, 98],
        [400, 270, 92],
        [625, 275, 94],
        [518, 365, 108],
        [310, 445, 96],
        [435, 475, 94],
        [605, 465, 98],
        [720, 445, 96],
        [255, 560, 88],
        [375, 600, 96],
        [515, 590, 106],
        [650, 590, 96],
        [765, 555, 86],
        [440, 725, 90],
        [585, 720, 90],
        [510, 815, 84],
      ];
      for (const [fx, fy, rad] of flowers) {
        drawNeutralBlossom(ctx, fx, fy, rad * (0.9 + rng() * 0.16), 5, rng() * Math.PI * 2, true);
      }
    } else if (species === 'tropical_palm') {
      // Cacho pendente de frutos tropicais / inflorescência luminosa
      drawTwigBase(ctx, [[512, 950], [512, 560], [420, 320]], 16, 6);
      drawTwigBase(ctx, [[512, 620], [600, 340]], 12, 6);
      drawTwigBase(ctx, [[512, 580], [512, 240]], 12, 6);

      const fruits: Array<[number, number, number]> = [
        [512, 260, 86],
        [410, 340, 92],
        [615, 345, 92],
        [340, 470, 96],
        [465, 455, 102],
        [575, 460, 100],
        [685, 475, 94],
        [400, 600, 96],
        [515, 595, 104],
        [630, 605, 96],
        [455, 725, 90],
        [575, 725, 90],
        [512, 815, 84],
      ];
      for (const [fx, fy, rad] of fruits) {
        ctx.save();
        ctx.shadowColor = 'rgba(15, 18, 24, 0.28)';
        ctx.shadowBlur = 8;
        const g = ctx.createRadialGradient(fx - rad * 0.28, fy - rad * 0.3, rad * 0.1, fx, fy, rad);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.55, '#eceef2');
        g.addColorStop(1, '#aeb4be');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(fx, fy, rad * 0.86, rad * 1.04, (rng() - 0.5) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // alpine_pine: pinhas detalhadas com escamas + velas/brotos terminais na cor da Grande Área
      drawTwigBase(ctx, [[512, 975], [512, 580], [512, 260]], 12, 5);
      drawTwigBase(ctx, [[512, 660], [335, 465]], 8, 4);
      drawTwigBase(ctx, [[512, 650], [690, 460]], 8, 4);

      const drawPineCone = (cx: number, cy: number, rx: number, ry: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        const rows = 6;
        for (let r = rows - 1; r >= 0; r--) {
          const t = r / (rows - 1);
          const yOff = (t - 0.5) * ry * 1.6;
          const rowSpan = rx * Math.sin(0.2 + t * 2.75);
          const scales = r === 0 || r === rows - 1 ? 2 : 3;
          for (let s = 0; s < scales; s++) {
            const sx = ((s / (scales - 1)) - 0.5) * rowSpan * 1.45;
            const sg = ctx.createRadialGradient(sx, yOff - 10, 4, sx, yOff, rx * 0.58);
            sg.addColorStop(0, '#ffffff');
            sg.addColorStop(0.65, '#e2e5eb');
            sg.addColorStop(1, '#a9b0bc');
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.ellipse(sx, yOff, rx * 0.44, ry * 0.24, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(110, 116, 128, 0.4)';
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
        }
        ctx.restore();
      };

      drawPineCone(512, 310, 108, 155, 0.04);
      drawPineCone(335, 480, 96, 138, -0.42);
      drawPineCone(690, 475, 96, 138, 0.42);
      drawPineCone(430, 680, 88, 126, -0.24);
      drawPineCone(595, 675, 88, 126, 0.24);
    }

    applyAlphaBleeding(ctx, size, size, 10);
    return reg(configureTexture(c, 1, 1, true, true));
  };

  const foliageMaps: Record<BotanicalSpecies, THREE.CanvasTexture> = {
    ipe_blossom: buildFoliageAtlas('ipe_blossom'),
    broad_oak: buildFoliageAtlas('broad_oak'),
    sakura_weeping: buildFoliageAtlas('sakura_weeping'),
    tropical_palm: buildFoliageAtlas('tropical_palm'),
    alpine_pine: buildFoliageAtlas('alpine_pine'),
  };

  const accentMaps: Record<BotanicalSpecies, THREE.CanvasTexture> = {
    ipe_blossom: buildAccentAtlas('ipe_blossom'),
    broad_oak: buildAccentAtlas('broad_oak'),
    sakura_weeping: buildAccentAtlas('sakura_weeping'),
    tropical_palm: buildAccentAtlas('tropical_palm'),
    alpine_pine: buildAccentAtlas('alpine_pine'),
  };

  // =========================================================================
  // 4. RELVA / MUSGO DA ILHA (Light & Dark + Sobel NormalMap)
  // =========================================================================
  const buildGrassCanvas = (dark: boolean) => {
    const [c, ctx] = makeCanvas(512, 512);
    const rng = createRng(dark ? 9921 : 4412);
    ctx.fillStyle = dark ? '#1a4236' : '#4a9445';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 420; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const rad = 10 + rng() * 36;
      const grad = ctx.createRadialGradient(x, y, 1, x, y, rad);
      if (dark) {
        const tone = rng() > 0.35 ? 'rgba(22, 98, 74, 0.30)' : 'rgba(12, 48, 42, 0.36)';
        grad.addColorStop(0, tone);
      } else {
        const tone = rng() > 0.35 ? 'rgba(98, 158, 32, 0.28)' : 'rgba(34, 128, 62, 0.26)';
        grad.addColorStop(0, tone);
      }
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 2400; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      ctx.fillStyle = dark
        ? rng() > 0.25
          ? 'rgba(52, 200, 145, 0.14)'
          : 'rgba(6, 68, 52, 0.30)'
        : rng() > 0.28
        ? 'rgba(158, 218, 58, 0.20)'
        : 'rgba(24, 114, 52, 0.24)';
      ctx.fillRect(x, y, 1.6, 4 + rng() * 5);
    }
    return c;
  };
  const grassHSize = 256;
  const grassH = new Float32Array(grassHSize * grassHSize);
  const gNoise = createTileableNoise(7717);
  for (let y = 0; y < grassHSize; y++) {
    for (let x = 0; x < grassHSize; x++) {
      const u = x / grassHSize;
      const v = y / grassHSize;
      grassH[y * grassHSize + x] = gNoise(u, v, 16, 16) * 0.6 + gNoise(u, v, 48, 48) * 0.4;
    }
  }
  const grassLightMap = reg(configureTexture(buildGrassCanvas(false), 3.5, 3.5, true));
  const grassDarkMap = reg(configureTexture(buildGrassCanvas(true), 3.5, 3.5, true));
  const grassNormalMap = reg(configureTexture(generateSobelNormalCanvas(grassH, grassHSize, 1.8), 4, 4, false));

  // =========================================================================
  // 5. PENHASCO ROCHOSO DA BASE (Light & Dark + Sobel NormalMap)
  // =========================================================================
  const buildCliffCanvas = (dark: boolean) => {
    const [c, ctx] = makeCanvas(512, 512);
    const rng = createRng(dark ? 5511 : 3319);
    ctx.fillStyle = dark ? '#2c2524' : '#7a5f49';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 200; i++) {
      const y = rng() * 512;
      const h = 6 + rng() * 20;
      ctx.fillStyle = dark
        ? `rgba(${34 + Math.floor(rng() * 32)}, ${30 + Math.floor(rng() * 26)}, ${38 + Math.floor(rng() * 30)}, 0.44)`
        : `rgba(${98 + Math.floor(rng() * 52)}, ${74 + Math.floor(rng() * 38)}, ${54 + Math.floor(rng() * 30)}, 0.40)`;
      ctx.fillRect(0, y, 512, h);
    }
    return c;
  };
  const cliffHSize = 256;
  const cliffH = new Float32Array(cliffHSize * cliffHSize);
  const cNoise = createTileableNoise(6211);
  for (let y = 0; y < cliffHSize; y++) {
    for (let x = 0; x < cliffHSize; x++) {
      const u = x / cliffHSize;
      const v = y / cliffHSize;
      cliffH[y * cliffHSize + x] = cNoise(u, v, 8, 24) * 0.65 + cNoise(u, v, 24, 48) * 0.35;
    }
  }
  const cliffLightMap = reg(configureTexture(buildCliffCanvas(false), 3, 1.5, true));
  const cliffDarkMap = reg(configureTexture(buildCliffCanvas(true), 3, 1.5, true));
  const cliffNormalMap = reg(configureTexture(generateSobelNormalCanvas(cliffH, cliffHSize, 2.8), 3, 2, false));

  // =========================================================================
  // 6. SOLO FÉRTIL DOS CANTEIROS (Albedo + Sobel NormalMap)
  // =========================================================================
  const [soilC, soilCtx] = makeCanvas(256, 256);
  const rngSoil = createRng(8813);
  soilCtx.fillStyle = '#4e3422';
  soilCtx.fillRect(0, 0, 256, 256);
  const soilH = new Float32Array(256 * 256);
  const sNoise = createTileableNoise(8819);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      soilH[y * 256 + x] = sNoise(x / 256, y / 256, 18, 18) * 0.55 + sNoise(x / 256, y / 256, 48, 48) * 0.45;
    }
  }
  for (let i = 0; i < 1400; i++) {
    const x = rngSoil() * 256;
    const y = rngSoil() * 256;
    const r = 1 + rngSoil() * 3.5;
    const tone = Math.floor(42 + rngSoil() * 60);
    soilCtx.fillStyle = `rgba(${tone + 26},${tone + 10},${tone - 4},0.52)`;
    soilCtx.beginPath();
    soilCtx.arc(x, y, r, 0, Math.PI * 2);
    soilCtx.fill();
  }
  const soilMap = reg(configureTexture(soilC, 2, 2, true));
  const soilNormalMap = reg(configureTexture(generateSobelNormalCanvas(soilH, 256, 2.2), 2, 2, false));

  // =========================================================================
  // 7. PEDRAS FACETADAS PBR COM MUSGO + SEIXOS DO FUNDO DO LAGO
  // =========================================================================
  const rockSize = 512;
  const rockH = new Float32Array(rockSize * rockSize);
  const [rockC, rockCtx] = makeCanvas(rockSize, rockSize);
  const rockImg = rockCtx.createImageData(rockSize, rockSize);
  const rNoise = createTileableNoise(44921);
  for (let y = 0; y < rockSize; y++) {
    const v = y / rockSize;
    // Musgo natural mais presente no topo (y perto de 0)
    const topMoss = Math.pow(Math.max(0, 1 - v * 1.45), 1.4);
    for (let x = 0; x < rockSize; x++) {
      const u = x / rockSize;
      const n1 = rNoise(u, v, 10, 10);
      const n2 = rNoise(u, v, 28, 28);
      const n3 = rNoise(u, v, 64, 64);
      const h = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;
      rockH[y * rockSize + x] = h;

      let r = 104 + h * 70;
      let g = 110 + h * 68;
      let b = 118 + h * 64;

      const moss = Math.min(0.82, topMoss * Math.max(0, (n2 - 0.32) * 2.1));
      if (moss > 0.01) {
        r = r * (1 - moss) + 64 * moss;
        g = g * (1 - moss) + 116 * moss;
        b = b * (1 - moss) + 56 * moss;
      }

      const o = (y * rockSize + x) * 4;
      rockImg.data[o] = Math.round(r);
      rockImg.data[o + 1] = Math.round(g);
      rockImg.data[o + 2] = Math.round(b);
      rockImg.data[o + 3] = 255;
    }
  }
  rockCtx.putImageData(rockImg, 0, 0);
  const rockMossMap = reg(configureTexture(rockC, 1, 1, true));
  const rockNormalMap = reg(configureTexture(generateSobelNormalCanvas(rockH, rockSize, 2.8), 1, 1, false));

  // Fundo de seixos submersos para a bacia do lago
  const [pebbleC, pebbleCtx] = makeCanvas(512, 512);
  const rngPeb = createRng(51923);
  pebbleCtx.fillStyle = '#3c4a46';
  pebbleCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 650; i++) {
    const px = rngPeb() * 512;
    const py = rngPeb() * 512;
    const rx = 5 + rngPeb() * 16;
    const ry = 4 + rngPeb() * 12;
    const rot = rngPeb() * Math.PI;
    const tone = rngPeb();
    const baseR = tone < 0.33 ? 98 : tone < 0.66 ? 124 : 82;
    const baseG = tone < 0.33 ? 96 : tone < 0.66 ? 114 : 96;
    const baseB = tone < 0.33 ? 88 : tone < 0.66 ? 98 : 88;
    const g = pebbleCtx.createRadialGradient(px - rx * 0.25, py - ry * 0.25, 1, px, py, Math.max(rx, ry));
    g.addColorStop(0, `rgb(${baseR + 34}, ${baseG + 32}, ${baseB + 26})`);
    g.addColorStop(0.75, `rgb(${baseR}, ${baseG}, ${baseB})`);
    g.addColorStop(1, `rgb(${Math.max(20, baseR - 38)}, ${Math.max(20, baseG - 36)}, ${Math.max(20, baseB - 34)})`);
    pebbleCtx.save();
    pebbleCtx.translate(px, py);
    pebbleCtx.rotate(rot);
    pebbleCtx.fillStyle = g;
    pebbleCtx.beginPath();
    pebbleCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    pebbleCtx.fill();
    pebbleCtx.restore();
  }
  const pebbleBedMap = reg(configureTexture(pebbleC, 2.5, 2.5, true));

  // =========================================================================
  // 8. NENÚFARES (LILY PAD + FLOR) E JUNCOS/SAMAMBAIAS DA MARGEM
  // =========================================================================
  const [lilyC, lilyCtx] = makeCanvas(512, 512);
  lilyCtx.clearRect(0, 0, 512, 512);
  lilyCtx.save();
  lilyCtx.translate(256, 256);
  const lilyGrad = lilyCtx.createRadialGradient(0, 0, 12, 0, 0, 232);
  lilyGrad.addColorStop(0, '#5ea844');
  lilyGrad.addColorStop(0.55, '#3b8238');
  lilyGrad.addColorStop(0.92, '#275f2b');
  lilyGrad.addColorStop(1, '#4b7a34');
  lilyCtx.fillStyle = lilyGrad;
  lilyCtx.beginPath();
  lilyCtx.moveTo(0, 0);
  // Folha circular com entalhe radial característico
  lilyCtx.arc(0, 0, 230, 0.24, Math.PI * 2 - 0.24);
  lilyCtx.closePath();
  lilyCtx.fill();

  // Nervuras radiais do nenúfar
  lilyCtx.strokeStyle = 'rgba(154, 214, 108, 0.45)';
  lilyCtx.lineWidth = 2.6;
  for (let v = 0; v < 15; v++) {
    const a = 0.36 + (v / 14) * (Math.PI * 2 - 0.72);
    lilyCtx.beginPath();
    lilyCtx.moveTo(0, 0);
    lilyCtx.lineTo(Math.cos(a) * 212, Math.sin(a) * 212);
    lilyCtx.stroke();
  }
  lilyCtx.restore();
  applyAlphaBleeding(lilyCtx, 512, 512, 8);
  const lilyPadMap = reg(configureTexture(lilyC, 1, 1, true, true));

  const [lilyFlC, lilyFlCtx] = makeCanvas(256, 256);
  lilyFlCtx.clearRect(0, 0, 256, 256);
  drawNeutralBlossom(lilyFlCtx, 128, 128, 108, 8, 0.2, false);
  drawNeutralBlossom(lilyFlCtx, 128, 128, 72, 8, 0.6, false);
  applyAlphaBleeding(lilyFlCtx, 256, 256, 6);
  const lilyFlowerMap = reg(configureTexture(lilyFlC, 1, 1, true, true));

  // Juncos e samambaias da margem do lago
  const [reedC, reedCtx] = makeCanvas(512, 512);
  const rngReed = createRng(91234);
  reedCtx.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    const bx = 140 + (i / 15) * 232 + (rngReed() - 0.5) * 18;
    const h = 290 + rngReed() * 195;
    const lean = (bx - 256) * 0.58 + (rngReed() - 0.5) * 55;
    const rg = reedCtx.createLinearGradient(bx, 504, bx + lean, 504 - h);
    rg.addColorStop(0, '#1e4b28');
    rg.addColorStop(0.6, '#3f843a');
    rg.addColorStop(1, '#79ba52');
    reedCtx.fillStyle = rg;
    reedCtx.beginPath();
    reedCtx.moveTo(bx - 7, 506);
    reedCtx.quadraticCurveTo(bx + lean * 0.42 - 4, 506 - h * 0.52, bx + lean, 506 - h);
    reedCtx.quadraticCurveTo(bx + lean * 0.42 + 6, 506 - h * 0.52, bx + 7, 506);
    reedCtx.closePath();
    reedCtx.fill();

    // Espiga marrom de taboa em alguns juncos
    if (i % 4 === 1) {
      const tx = bx + lean * 0.84;
      const ty = 506 - h * 0.84;
      reedCtx.save();
      reedCtx.translate(tx, ty);
      reedCtx.rotate(Math.atan2(lean, h));
      reedCtx.fillStyle = '#5c3c24';
      reedCtx.beginPath();
      reedCtx.ellipse(0, 0, 9, 34, 0, 0, Math.PI * 2);
      reedCtx.fill();
      reedCtx.restore();
    }
  }
  applyAlphaBleeding(reedCtx, 512, 512, 8);
  const reedMap = reg(configureTexture(reedC, 1, 1, true, true));

  // =========================================================================
  // 9. SKY DOMES EQUIRETANGULARES (PMREM IBL + CÚPULA ATMOSFÉRICA)
  // =========================================================================
  const buildSkyEnv = (dark: boolean) => {
    const skyW = dark ? 2048 : 1024;
    const skyH = dark ? 1024 : 512;
    const [c, ctx] = makeCanvas(skyW, skyH);
    const rng = createRng(dark ? 2026 : 1013);
    const grad = ctx.createLinearGradient(0, 0, 0, skyH);
    if (dark) {
      grad.addColorStop(0.0, '#030716');
      grad.addColorStop(0.32, '#081836');
      grad.addColorStop(0.55, '#0f2d52');
      grad.addColorStop(0.75, '#0d223e');
      grad.addColorStop(1.0, '#060d1c');
    } else {
      grad.addColorStop(0.0, '#0284c7');
      grad.addColorStop(0.28, '#38bdf8');
      grad.addColorStop(0.52, '#bae6fd');
      grad.addColorStop(0.68, '#fef3c7');
      grad.addColorStop(1.0, '#d9f99d');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, skyW, skyH);

    if (dark) {
      const auroras = [
        { x: 1360, y: 490, rx: 620, ry: 220, col: 'rgba(34, 211, 238, 0.26)' },
        { x: 680, y: 540, rx: 560, ry: 190, col: 'rgba(52, 211, 153, 0.20)' },
        { x: 1040, y: 450, rx: 520, ry: 170, col: 'rgba(139, 92, 246, 0.20)' },
        { x: 280, y: 520, rx: 480, ry: 180, col: 'rgba(56, 189, 248, 0.16)' },
        { x: 1800, y: 530, rx: 440, ry: 180, col: 'rgba(16, 185, 129, 0.16)' },
      ];
      for (const a of auroras) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.scale(1, a.ry / a.rx);
        const g = ctx.createRadialGradient(0, 0, 16, 0, 0, a.rx);
        g.addColorStop(0, a.col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, a.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 320; i++) {
        const sx = rng() * skyW;
        const sy = rng() * (skyH * 0.6);
        const size = 0.55 + rng() * 0.95;
        ctx.fillStyle = `rgba(214, 236, 252, ${0.18 + rng() * 0.44})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
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
    barkNormalMap,
    barkRoughnessMap,
    witheredBarkMap,
    foliageMaps,
    accentMaps,
    grassLightMap,
    grassDarkMap,
    grassNormalMap,
    cliffLightMap,
    cliffDarkMap,
    cliffNormalMap,
    soilMap,
    soilNormalMap,
    rockMossMap,
    rockNormalMap,
    pebbleBedMap,
    lilyPadMap,
    lilyFlowerMap,
    reedMap,
    skyLightEnv,
    skyDarkEnv,
    dispose: () => {
      textures.forEach(t => t.dispose());
    },
  };
}
