import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SharedCanopyUniforms } from './types';

export const MAX_LAKE_RIPPLES = 8;

export interface ParticleFieldResources {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  uniforms: {
    uTime: { value: number };
    uPixelRatio: { value: number };
    uMouse3D: { value: THREE.Vector3 };
    uMouseVelocity: { value: THREE.Vector3 };
    uMouseActive: { value: number };
    uBoostPulse: { value: number };
    uMotionScale: { value: number };
    uIsDark: { value: number };
  };
  maxCount: number;
  zenCount: number;
}

export function createParticleField(
  islandRadius: number,
  maxCount = 460,
  zenCount = 130
): ParticleFieldResources {
  const positions = new Float32Array(maxCount * 3);
  const seeds = new Float32Array(maxCount * 3);
  const sizes = new Float32Array(maxCount);
  const colorMixes = new Float32Array(maxCount);

  let s = 133791;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < maxCount; i++) {
    const r = Math.sqrt(rand()) * (islandRadius * 1.02);
    const theta = rand() * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const y = 0.25 + rand() * 2.45;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    seeds[i * 3] = rand() * Math.PI * 2;
    seeds[i * 3 + 1] = 0.5 + rand() * 1.3;
    seeds[i * 3 + 2] = rand();

    sizes[i] = 9.0 + rand() * 14.0;
    colorMixes[i] = rand();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMixes, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uMouse3D: { value: new THREE.Vector3(0, 0.5, 0) },
    uMouseVelocity: { value: new THREE.Vector3(0, 0, 0) },
    uMouseActive: { value: 0 },
    uBoostPulse: { value: 0 },
    uMotionScale: { value: 1 },
    uIsDark: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      attribute float aSize;
      attribute float aColorMix;

      uniform float uTime;
      uniform float uPixelRatio;
      uniform vec3 uMouse3D;
      uniform vec3 uMouseVelocity;
      uniform float uMouseActive;
      uniform float uBoostPulse;
      uniform float uMotionScale;

      varying float vColorMix;
      varying float vAlpha;
      varying float vHoverGlow;

      void main() {
        vColorMix = aColorMix;
        float t = uTime * aSeed.y * (0.35 + 0.65 * uMotionScale);
        vec3 pos = position;

        pos.x += sin(t * 0.9 + aSeed.x) * 0.36 * uMotionScale;
        pos.z += cos(t * 0.8 + aSeed.x * 1.3) * 0.36 * uMotionScale;
        pos.y += mod(uTime * 0.14 * aSeed.y * uMotionScale + aSeed.z * 3.2, 3.2) * 0.42 - 0.35;
        pos.y += sin(t * 1.4 + aSeed.z * 6.2831) * 0.16;

        vec3 toMouse = uMouse3D - pos;
        float dist = length(toMouse);
        float influence = uMouseActive * smoothstep(3.8, 0.15, dist);

        vec3 swirlDir = normalize(vec3(-toMouse.z, 0.18, toMouse.x) + vec3(0.0001));
        vec3 pullDir = normalize(toMouse + vec3(0.0001));

        pos += swirlDir * influence * (0.62 + sin(uTime * 2.2 + aSeed.x) * 0.18);
        pos += pullDir * influence * 0.42;
        pos += clamp(uMouseVelocity, -1.6, 1.6) * influence * 0.55;
        pos.y += influence * 0.38;

        float radialPulse = sin(length(pos.xz) * 2.4 - uTime * 5.0) * 0.5 + 0.5;
        pos.y += uBoostPulse * radialPulse * 0.45;

        vHoverGlow = max(influence, uBoostPulse * 0.85);
        float twinkle = 0.58 + 0.42 * sin(uTime * (1.8 + aSeed.y) + aSeed.x * 3.0);
        vAlpha = mix(0.45, 1.0, twinkle) * (0.72 + 0.45 * vHoverGlow);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float distAtten = 11.0 / max(4.2, -mvPosition.z);
        gl_PointSize = clamp(aSize * uPixelRatio * distAtten * (0.56 + vHoverGlow * 0.72) * 0.14, 1.8, 9.5 * uPixelRatio);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uIsDark;

      varying float vColorMix;
      varying float vAlpha;
      varying float vHoverGlow;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv) * 2.0;
        if (d > 1.0) discard;

        float edgeFade = smoothstep(1.0, 0.35, d);
        float halo = exp(-d * d * 6.5) * edgeFade;
        float core = smoothstep(0.36, 0.0, d);

        vec3 darkCyan = vec3(0.13, 0.83, 0.93);
        vec3 darkEmerald = vec3(0.20, 0.89, 0.65);
        vec3 darkViolet = vec3(0.65, 0.55, 0.98);
        vec3 darkColor = vColorMix < 0.5
          ? mix(darkCyan, darkEmerald, vColorMix * 2.0)
          : mix(darkEmerald, darkViolet, (vColorMix - 0.5) * 2.0);
        darkColor = mix(darkColor, vec3(0.88, 0.98, 1.0), core * 0.72);

        vec3 lightAmber = vec3(0.96, 0.68, 0.14);
        vec3 lightGold = vec3(1.0, 0.86, 0.36);
        vec3 lightColor = mix(lightAmber, lightGold, vColorMix * 0.65 + core * 0.35);

        vec3 finalColor = mix(lightColor, darkColor, uIsDark);
        float boostHdr = mix(0.75, 1.32, uIsDark) + vHoverGlow * mix(0.35, 1.15, uIsDark);
        float alpha = (halo * 0.65 + core * 0.62) * vAlpha * mix(0.48, 0.86, uIsDark);

        gl_FragColor = vec4(finalColor * boostHdr, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    geometry,
    material,
    uniforms,
    maxCount,
    zenCount,
  };
}

export interface InteractiveLakeResources {
  material: THREE.ShaderMaterial;
  uniforms: {
    uTime: { value: number };
    uIsDark: { value: number };
    uSunDir: { value: THREE.Vector3 };
    uMouse3D: { value: THREE.Vector3 };
    uMouseOverLake: { value: number };
    uRipples: { value: THREE.Vector4[] };
  };
}

export function createInteractiveLakeMaterial(): InteractiveLakeResources {
  const ripples = Array.from({ length: MAX_LAKE_RIPPLES }, () => new THREE.Vector4(0, 0, -99, 0));

  const uniforms = {
    uTime: { value: 0 },
    uIsDark: { value: 1 },
    uSunDir: { value: new THREE.Vector3(0.45, 0.78, 0.42).normalize() },
    uMouse3D: { value: new THREE.Vector3(0, 0, 0) },
    uMouseOverLake: { value: 0 },
    uRipples: { value: ripples },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIsDark;
      uniform vec3 uSunDir;
      uniform vec3 uMouse3D;
      uniform float uMouseOverLake;
      uniform vec4 uRipples[${MAX_LAKE_RIPPLES}];

      varying vec3 vWorldPos;
      varying vec2 vUv;

      // Padrão procedural leve de caustics refratadas no fundo raso
      float causticPattern(vec2 p, float t) {
        vec2 p1 = p * 3.8 + vec2(t * 0.42, -t * 0.34);
        vec2 p2 = p * 4.5 + vec2(-t * 0.36, t * 0.48);
        float c1 = sin(p1.x + sin(p1.y * 1.3 + t * 0.6)) * cos(p1.y + cos(p1.x * 1.2 - t * 0.5));
        float c2 = sin(p2.x - cos(p2.y * 1.1 - t * 0.7)) * cos(p2.y + sin(p2.x * 1.4 + t * 0.4));
        float combined = abs(c1 + c2) * 0.5;
        return pow(clamp(1.0 - combined, 0.0, 1.0), 4.2);
      }

      void main() {
        float nx = sin(vWorldPos.x * 7.5 + uTime * 1.9) * cos(vWorldPos.z * 6.2 - uTime * 1.4) * 0.032;
        float nz = cos(vWorldPos.z * 7.8 + uTime * 1.6) * sin(vWorldPos.x * 5.9 + uTime * 1.3) * 0.032;
        float rippleGlow = 0.0;

        for (int i = 0; i < ${MAX_LAKE_RIPPLES}; i++) {
          vec4 rip = uRipples[i];
          float age = uTime - rip.z;
          if (rip.w > 0.001 && age >= 0.0 && age < 2.8) {
            vec2 delta = vWorldPos.xz - rip.xy;
            float dist = length(delta);
            float front = age * 0.85;
            float ringEnvelope = exp(-abs(dist - front) * 4.5) * exp(-age * 1.25) * rip.w;
            float wave = sin(dist * 24.0 - age * 11.0) * ringEnvelope;
            vec2 dir = dist > 0.001 ? delta / dist : vec2(0.0);
            nx += dir.x * wave * 0.28;
            nz += dir.y * wave * 0.28;
            rippleGlow += abs(wave) * 0.65;
          }
        }

        float cursorDist = length(vWorldPos.xz - uMouse3D.xz);
        float cursorSpot = uMouseOverLake * smoothstep(0.55, 0.0, cursorDist);
        rippleGlow += cursorSpot * 0.3;

        vec3 N = normalize(vec3(nx, 1.0, nz));
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

        // Profundidade radial real alinhada à bacia escavada (-0.24m)
        float edgeDist = length(vUv - vec2(0.5)) * 2.0;
        float depthFactor = smoothstep(0.98, 0.16, edgeDist);
        float shoreMask = smoothstep(0.68, 0.96, edgeDist) * (1.0 - smoothstep(0.96, 1.0, edgeDist));

        vec3 lightShallow = vec3(0.22, 0.68, 0.82);
        vec3 lightDeep = vec3(0.03, 0.30, 0.54);
        vec3 lightSky = vec3(0.76, 0.92, 0.98);

        vec3 darkShallow = vec3(0.04, 0.26, 0.36);
        vec3 darkDeep = vec3(0.01, 0.07, 0.15);
        vec3 darkSky = vec3(0.08, 0.42, 0.58);

        vec3 baseWater = mix(
          mix(lightShallow, lightDeep, depthFactor),
          mix(darkShallow, darkDeep, depthFactor),
          uIsDark
        );
        vec3 skyRefl = mix(lightSky, darkSky, uIsDark);

        vec3 color = mix(baseWater, skyRefl, clamp(fresnel * 0.68 + 0.06, 0.0, 0.84));

        // Caustics sutis visíveis na região rasa/média sobre o fundo de seixos
        float caust = causticPattern(vWorldPos.xz + N.xz * 0.35, uTime);
        float caustMask = (1.0 - depthFactor * 0.48) * smoothstep(0.99, 0.72, edgeDist);
        vec3 caustColor = mix(vec3(0.75, 0.96, 1.0), vec3(0.22, 0.88, 0.92), uIsDark);
        color += caustColor * caust * caustMask * mix(0.28, 0.22, uIsDark);

        // Linha úmida / espuma delicada na margem
        float foamWave = sin(edgeDist * 28.0 - uTime * 2.2 + vWorldPos.x * 5.0) * 0.5 + 0.5;
        vec3 shoreTint = mix(vec3(0.86, 0.96, 0.98), vec3(0.26, 0.68, 0.76), uIsDark);
        color = mix(color, shoreTint, shoreMask * (0.18 + foamWave * 0.14));

        // Especular solar/lunar + brilho dos ripples
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 92.0);
        vec3 specColor = mix(vec3(1.0, 0.96, 0.85), vec3(0.58, 0.96, 1.0), uIsDark);
        color += specColor * spec * mix(0.82, 1.28, uIsDark);
        color += mix(vec3(0.82, 0.96, 1.0), vec3(0.18, 0.84, 0.94), uIsDark) * rippleGlow * 0.82;

        // Borda extremamente transparente para revelar os seixos e a margem úmida da bacia!
        float edgeFeather = smoothstep(1.0, 0.86, edgeDist);
        float alpha = mix(0.38, 0.84, depthFactor * 0.62 + fresnel * 0.38) * edgeFeather;
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  return { material, uniforms };
}

// ============================================================================
// GOD-RAYS VOLUMÉTRICOS SUAVES (1 DRAW CALL ADITIVO, DESLIGADO NO MODO ZEN)
// ============================================================================

export interface VolumetricGodRaysResources {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  uniforms: {
    uTime: { value: number };
    uIsDark: { value: number };
  };
}

export function createVolumetricGodRays(sunDirection: THREE.Vector3): VolumetricGodRaysResources {
  const shaftParts: THREE.BufferGeometry[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const alignQ = new THREE.Quaternion().setFromUnitVectors(up, sunDirection.clone().normalize());

  const offsets: Array<[number, number, number, number, number]> = [
    [-2.4, 3.6, -1.6, 2.2, 8.2],
    [-0.5, 4.0, -0.3, 2.8, 9.0],
    [1.6, 3.7, -1.2, 2.3, 8.4],
    [2.5, 3.3, 1.1, 2.0, 7.6],
    [-1.4, 3.5, 1.6, 2.1, 7.8],
  ];

  offsets.forEach(([ox, oy, oz, width, height], idx) => {
    for (let cross = 0; cross < 2; cross++) {
      const p = new THREE.PlaneGeometry(width, height, 1, 1).toNonIndexed();
      const rotY = new THREE.Quaternion().setFromAxisAngle(up, idx * 0.7 + cross * (Math.PI / 2));
      const q = alignQ.clone().multiply(rotY);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(ox, oy, oz), q, new THREE.Vector3(1, 1, 1));
      p.applyMatrix4(m);
      shaftParts.push(p);
    }
  });

  const geometry = mergeGeometries(shaftParts, false)!;
  shaftParts.forEach(p => p.dispose());

  const uniforms = {
    uTime: { value: 0 },
    uIsDark: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDirW;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDirW = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIsDark;

      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDirW;

      void main() {
        // Suavização horizontal nas bordas do feixe e vertical (topo e base)
        float horiz = sin(vUv.x * 3.14159265);
        horiz = pow(max(horiz, 0.0), 2.2);
        float vert = smoothstep(0.0, 0.34, vUv.y) * smoothstep(1.0, 0.16, vUv.y);

        // Estrias volumétricas lentas atravessando a copa
        float streak = 0.65 + 0.35 * sin(vUv.x * 16.0 + uTime * 0.28 + vUv.y * 2.0);
        float shimmer = 0.82 + 0.18 * sin(uTime * 0.65 + vUv.x * 9.0);

        // Evita artefato de quina dura quando visto quase paralelo ao plano
        float facing = pow(abs(dot(normalize(vNormalW), normalize(vViewDirW))), 1.45);

        vec3 lightSun = vec3(1.0, 0.92, 0.66);
        vec3 darkAurora = vec3(0.24, 0.78, 0.94);
        vec3 col = mix(lightSun, darkAurora, uIsDark);

        float intensity = horiz * vert * streak * shimmer * facing * mix(0.075, 0.052, uIsDark);
        if (intensity < 0.001) discard;

        gl_FragColor = vec4(col * intensity, intensity);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;

  return { mesh, geometry, material, uniforms };
}

// ============================================================================
// SHADERS BOTÂNICOS ACOPLADOS EM WORLD SPACE (TRONCO + FOLHAS + ACENTO + SOMBRAS)
// ============================================================================

interface CoupledSwayOptions {
  swayStrength: number;
  enableFlutter: boolean;
  flutterStrength: number;
  includeMouseGlow: boolean;
  includeLeafTipVarying: boolean;
}

function buildCoupledSwayVertexGLSL(opts: CoupledSwayOptions): string {
  const sway = opts.swayStrength.toFixed(4);
  const swayZ = (opts.swayStrength * 0.62).toFixed(4);
  const flutter = opts.flutterStrength.toFixed(4);

  return /* glsl */ `
    #include <begin_vertex>
    #ifdef USE_INSTANCING
      mat4 bLocalToWorld = modelMatrix * instanceMatrix;
    #else
      mat4 bLocalToWorld = modelMatrix;
    #endif

    vec3 bRootWorld = bLocalToWorld[3].xyz;
    vec4 bWorldPos = bLocalToWorld * vec4(transformed, 1.0);

    // Raízes (y <= 0) permanecem 100% ancoradas no solo; balanço cresce suavemente com a altura
    float bH = clamp(max(transformed.y, 0.0) * 0.88, 0.0, 1.48);
    float bHeightWeight = bH * (0.28 + 0.72 * bH);

    // Balanço macro em WORLD SPACE (idêntico no tronco, galhos, folhas, flores e sombras!)
    float bWindPhase = uTime * 1.38 + bRootWorld.x * 0.78 + bRootWorld.z * 0.64;
    float bGust = 0.72 + 0.28 * sin(uTime * 0.42 + bRootWorld.x * 0.25);
    vec2 bWorldWind = vec2(
      sin(bWindPhase) * ${sway} * bGust,
      cos(bWindPhase * 0.82 + 0.7) * ${swayZ} * bGust
    ) * uMotionScale * bHeightWeight;

    // Interação com o cursor 3D em WORLD SPACE
    vec2 bToVertex = bWorldPos.xz - uMouse3D.xz;
    float bMouseDist = length(bToVertex);
    float bMouseBand = uMouseActive * smoothstep(2.25, 0.16, bMouseDist);
    vec2 bPushDir = bMouseDist > 0.001 ? bToVertex / bMouseDist : vec2(0.0);
    vec2 bWorldPush = (bPushDir * 0.115 + clamp(uMouseVelocity.xz, -1.0, 1.0) * 0.085) * bMouseBand * bHeightWeight;

    vec3 bTotalWorldDisp = vec3(bWorldWind.x + bWorldPush.x, 0.0, bWorldWind.y + bWorldPush.y);

    ${
      opts.enableFlutter
        ? /* glsl */ `
    // Micro-tremor (flutter) somente na folhagem/acento proporcional a aLeafTip (0 na junção com o galho -> 1 na borda)
    float bFlPhase = uTime * 3.85 + bWorldPos.x * 4.7 + bWorldPos.z * 5.1 + transformed.y * 3.3;
    float bFlAmp = ${flutter} * aLeafTip * uMotionScale * (0.65 + bMouseBand * 1.25);
    bTotalWorldDisp += vec3(
      sin(bFlPhase) * bFlAmp,
      cos(bFlPhase * 1.17) * bFlAmp * 0.52,
      cos(bFlPhase * 0.93) * bFlAmp
    );
    `
        : ''
    }

    // Projeção exata World Space -> Local Space usando as colunas ortogonais de bLocalToWorld
    // (corrige definitivamente a distorção de direção quando a instância tem rotationY / scale!)
    vec3 bCol0 = bLocalToWorld[0].xyz;
    vec3 bCol1 = bLocalToWorld[1].xyz;
    vec3 bCol2 = bLocalToWorld[2].xyz;
    vec3 bLocalDisp = vec3(
      dot(bTotalWorldDisp, bCol0) / max(dot(bCol0, bCol0), 0.0001),
      dot(bTotalWorldDisp, bCol1) / max(dot(bCol1, bCol1), 0.0001),
      dot(bTotalWorldDisp, bCol2) / max(dot(bCol2, bCol2), 0.0001)
    );
    transformed += bLocalDisp;

    ${opts.includeMouseGlow ? 'vMouseGlow = bMouseBand;' : ''}
    ${opts.includeLeafTipVarying ? 'vLeafTip = aLeafTip;' : ''}
  `;
}

export interface BotanicalShaderOptions {
  swayStrength?: number;
  enableFlutter?: boolean;
  flutterStrength?: number;
  enableSSS?: boolean;
  sssIntensity?: number;
  glowIntensity?: number;
  cacheKey: string;
}

/**
 * Aplica balanço acoplado em world space + flutter + Subsurface Scattering (SSS) backlit
 * e brilho interativo de cursor em materiais MeshStandardMaterial.
 */
export function applyBotanicalShader(
  material: THREE.MeshStandardMaterial,
  sharedUniforms: SharedCanopyUniforms,
  options: BotanicalShaderOptions
): void {
  const swayStrength = options.swayStrength ?? 0.048;
  const enableFlutter = options.enableFlutter ?? false;
  const flutterStrength = options.flutterStrength ?? 0.018;
  const enableSSS = options.enableSSS ?? false;
  const sssIntensity = options.sssIntensity ?? 0.42;
  const glowIntensity = options.glowIntensity ?? 0.32;
  const needsLeafTipAttr = enableFlutter || enableSSS;

  material.customProgramCacheKey = () => options.cacheKey;
  material.onBeforeCompile = shader => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uMouse3D = sharedUniforms.uMouse3D;
    shader.uniforms.uMouseVelocity = sharedUniforms.uMouseVelocity;
    shader.uniforms.uMouseActive = sharedUniforms.uMouseActive;
    shader.uniforms.uMotionScale = sharedUniforms.uMotionScale;
    shader.uniforms.uIsDark = sharedUniforms.uIsDark;
    shader.uniforms.uSunDir = sharedUniforms.uSunDir;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        ${needsLeafTipAttr ? 'attribute float aLeafTip;' : ''}
        uniform float uTime;
        uniform vec3 uMouse3D;
        uniform vec3 uMouseVelocity;
        uniform float uMouseActive;
        uniform float uMotionScale;
        varying float vMouseGlow;
        ${enableSSS ? 'varying float vLeafTip;' : ''}
        `
      )
      .replace(
        '#include <begin_vertex>',
        buildCoupledSwayVertexGLSL({
          swayStrength,
          enableFlutter,
          flutterStrength,
          includeMouseGlow: true,
          includeLeafTipVarying: enableSSS,
        })
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uIsDark;
        uniform vec3 uSunDir;
        varying float vMouseGlow;
        ${enableSSS ? 'varying float vLeafTip;' : ''}
        `
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `
        #include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * vMouseGlow * mix(${(glowIntensity * 0.55).toFixed(3)}, ${(glowIntensity * 1.35).toFixed(3)}, uIsDark);
        `
      );

    if (enableSSS) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_end>',
        /* glsl */ `
        #include <lights_fragment_end>
        // Subsurface Scattering (SSS) backlit barato estilo Gemini Hidrogênio (tudo em view space!)
        vec3 sssSunV = normalize(mat3(viewMatrix) * uSunDir);
        vec3 sssBackDir = normalize(-sssSunV + geometryNormal * 0.35);
        float sssBacklit = pow(clamp(dot(geometryViewDir, sssBackDir), 0.0, 1.0), 3.0);
        float sssWrap = clamp(dot(geometryNormal, sssSunV) * 0.5 + 0.5, 0.0, 1.0);
        vec3 sssTint = mix(vec3(0.76, 1.0, 0.44), vec3(0.30, 0.92, 0.84), uIsDark);
        float sssTipFactor = 0.48 + 0.52 * clamp(vLeafTip, 0.0, 1.0);
        reflectedLight.directDiffuse += diffuseColor.rgb * sssTint * (sssBacklit * ${sssIntensity.toFixed(3)} + sssWrap * 0.15) * sssTipFactor;
        reflectedLight.indirectDiffuse += diffuseColor.rgb * mix(vec3(0.08, 0.12, 0.08), vec3(0.07, 0.16, 0.18), uIsDark);
        `
      );
    }
  };
  material.needsUpdate = true;
}

/**
 * Cria MeshDepthMaterial com RGBADepthPacking + alphaTest + exatamente o mesmo
 * vertex displacement (macro sway + flutter) para sombras rendilhadas sincronizadas ao vento!
 */
export function createCoupledDepthMaterial(
  sharedUniforms: SharedCanopyUniforms,
  options: {
    map?: THREE.Texture | null;
    alphaTest?: number;
    side?: THREE.Side;
    swayStrength?: number;
    enableFlutter?: boolean;
    flutterStrength?: number;
    cacheKey: string;
  }
): THREE.MeshDepthMaterial {
  const swayStrength = options.swayStrength ?? 0.048;
  const enableFlutter = options.enableFlutter ?? false;
  const flutterStrength = options.flutterStrength ?? 0.018;

  const depthMat = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: options.map ?? null,
    alphaTest: options.alphaTest ?? 0,
    side: options.side ?? THREE.FrontSide,
  });

  depthMat.customProgramCacheKey = () => options.cacheKey;
  depthMat.onBeforeCompile = shader => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uMouse3D = sharedUniforms.uMouse3D;
    shader.uniforms.uMouseVelocity = sharedUniforms.uMouseVelocity;
    shader.uniforms.uMouseActive = sharedUniforms.uMouseActive;
    shader.uniforms.uMotionScale = sharedUniforms.uMotionScale;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        ${enableFlutter ? 'attribute float aLeafTip;' : ''}
        uniform float uTime;
        uniform vec3 uMouse3D;
        uniform vec3 uMouseVelocity;
        uniform float uMouseActive;
        uniform float uMotionScale;
        `
      )
      .replace(
        '#include <begin_vertex>',
        buildCoupledSwayVertexGLSL({
          swayStrength,
          enableFlutter,
          flutterStrength,
          includeMouseGlow: false,
          includeLeafTipVarying: false,
        })
      );
  };
  depthMat.needsUpdate = true;
  return depthMat;
}

/**
 * Vento suave + reação ao cursor em world space para tufos de relva curva e juncos.
 */
export function applyGrassWindShader(
  material: THREE.MeshStandardMaterial,
  sharedUniforms: SharedCanopyUniforms,
  options: { swayStrength?: number; cacheKey: string }
): void {
  const sway = (options.swayStrength ?? 0.055).toFixed(4);
  material.customProgramCacheKey = () => options.cacheKey;
  material.onBeforeCompile = shader => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uMouse3D = sharedUniforms.uMouse3D;
    shader.uniforms.uMouseActive = sharedUniforms.uMouseActive;
    shader.uniforms.uMotionScale = sharedUniforms.uMotionScale;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        attribute float aLeafTip;
        uniform float uTime;
        uniform vec3 uMouse3D;
        uniform float uMouseActive;
        uniform float uMotionScale;
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          mat4 gLocalToWorld = modelMatrix * instanceMatrix;
        #else
          mat4 gLocalToWorld = modelMatrix;
        #endif
        vec4 gWorld = gLocalToWorld * vec4(transformed, 1.0);
        float gPhase = uTime * 2.2 + gWorld.x * 1.45 + gWorld.z * 1.25;
        vec2 gWind = vec2(sin(gPhase), cos(gPhase * 0.85)) * ${sway} * aLeafTip * uMotionScale;

        vec2 gToCursor = gWorld.xz - uMouse3D.xz;
        float gDist = length(gToCursor);
        float gBand = uMouseActive * smoothstep(1.35, 0.1, gDist);
        vec2 gPush = (gDist > 0.001 ? gToCursor / gDist : vec2(0.0)) * gBand * 0.095 * aLeafTip;

        vec3 gWorldDisp = vec3(gWind.x + gPush.x, 0.0, gWind.y + gPush.y);
        vec3 gCol0 = gLocalToWorld[0].xyz;
        vec3 gCol1 = gLocalToWorld[1].xyz;
        vec3 gCol2 = gLocalToWorld[2].xyz;
        transformed += vec3(
          dot(gWorldDisp, gCol0) / max(dot(gCol0, gCol0), 0.0001),
          dot(gWorldDisp, gCol1) / max(dot(gCol1, gCol1), 0.0001),
          dot(gWorldDisp, gCol2) / max(dot(gCol2, gCol2), 0.0001)
        );
        `
      );

    // Normal voltada para o céu em ambas as faces (DoubleSide sem verso preto — técnica AAA de relva!)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      /* glsl */ `
      #include <normal_fragment_begin>
      normal = normalize(mat3(viewMatrix) * vec3(0.0, 1.0, 0.0));
      `
    );
  };
  material.needsUpdate = true;
}
