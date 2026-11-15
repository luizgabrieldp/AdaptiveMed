import * as THREE from 'three';
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
    const y = 0.25 + rand() * 2.35;

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

        // Deriva orgânica contínua tipo esporos / vagalumes
        pos.x += sin(t * 0.9 + aSeed.x) * 0.36 * uMotionScale;
        pos.z += cos(t * 0.8 + aSeed.x * 1.3) * 0.36 * uMotionScale;
        pos.y += mod(uTime * 0.14 * aSeed.y * uMotionScale + aSeed.z * 3.2, 3.2) * 0.42 - 0.35;
        pos.y += sin(t * 1.4 + aSeed.z * 6.2831) * 0.16;

        // Interação fluida estilo Gemini Hydrogen com o cursor 3D
        vec3 toMouse = uMouse3D - pos;
        float dist = length(toMouse);
        float influence = uMouseActive * smoothstep(3.8, 0.15, dist);

        vec3 swirlDir = normalize(vec3(-toMouse.z, 0.18, toMouse.x) + vec3(0.0001));
        vec3 pullDir = normalize(toMouse + vec3(0.0001));

        pos += swirlDir * influence * (0.62 + sin(uTime * 2.2 + aSeed.x) * 0.18);
        pos += pullDir * influence * 0.42;
        pos += clamp(uMouseVelocity, -1.6, 1.6) * influence * 0.55;
        pos.y += influence * 0.38;

        // Onda luminosa quando há boost ativo
        float radialPulse = sin(length(pos.xz) * 2.4 - uTime * 5.0) * 0.5 + 0.5;
        pos.y += uBoostPulse * radialPulse * 0.45;

        vHoverGlow = max(influence, uBoostPulse * 0.85);
        float twinkle = 0.58 + 0.42 * sin(uTime * (1.8 + aSeed.y) + aSeed.x * 3.0);
        vAlpha = mix(0.45, 1.0, twinkle) * (0.72 + 0.45 * vHoverGlow);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float distAtten = 11.0 / max(3.5, -mvPosition.z);
        gl_PointSize = clamp(aSize * uPixelRatio * distAtten * (0.68 + vHoverGlow * 0.9) * 0.16, 2.0, 22.0 * uPixelRatio);
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

        // Dark: Gemini Hydrogen (ciano, esmeralda, violeta bioluminescente)
        vec3 darkCyan = vec3(0.13, 0.83, 0.93);
        vec3 darkEmerald = vec3(0.20, 0.89, 0.65);
        vec3 darkViolet = vec3(0.65, 0.55, 0.98);
        vec3 darkColor = vColorMix < 0.5
          ? mix(darkCyan, darkEmerald, vColorMix * 2.0)
          : mix(darkEmerald, darkViolet, (vColorMix - 0.5) * 2.0);
        darkColor = mix(darkColor, vec3(0.88, 0.98, 1.0), core * 0.72);

        // Light: pólen dourado/âmbar sutil que não estoura como neve
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

      void main() {
        // Ondas ambientais suaves + ondulações concêntricas interativas do cursor
        float nx = sin(vWorldPos.x * 7.5 + uTime * 1.9) * cos(vWorldPos.z * 6.2 - uTime * 1.4) * 0.035;
        float nz = cos(vWorldPos.z * 7.8 + uTime * 1.6) * sin(vWorldPos.x * 5.9 + uTime * 1.3) * 0.035;
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

        // Realce suave sob o cursor ao sobrevoar o lago
        float cursorDist = length(vWorldPos.xz - uMouse3D.xz);
        float cursorSpot = uMouseOverLake * smoothstep(0.55, 0.0, cursorDist);
        rippleGlow += cursorSpot * 0.32;

        vec3 N = normalize(vec3(nx, 1.0, nz));
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

        // Profundidade radial do lago
        float edgeDist = length(vUv - vec2(0.5)) * 2.0;
        float depthFactor = smoothstep(1.0, 0.2, edgeDist);

        // Cores adaptativas Light / Dark calibradas para não estourar o threshold do Bloom
        vec3 lightShallow = vec3(0.24, 0.72, 0.88);
        vec3 lightDeep = vec3(0.04, 0.36, 0.62);
        vec3 lightSky = vec3(0.76, 0.92, 0.98);

        vec3 darkShallow = vec3(0.04, 0.28, 0.38);
        vec3 darkDeep = vec3(0.01, 0.08, 0.16);
        vec3 darkSky = vec3(0.08, 0.42, 0.56);

        vec3 baseWater = mix(
          mix(lightShallow, lightDeep, depthFactor),
          mix(darkShallow, darkDeep, depthFactor),
          uIsDark
        );
        vec3 skyRefl = mix(lightSky, darkSky, uIsDark);

        vec3 color = mix(baseWater, skyRefl, clamp(fresnel * 0.72 + 0.08, 0.0, 0.86));

        // Reflexo especular do sol / lua + cristas de ripple (apenas estes ultrapassam o threshold do Bloom)
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 84.0);
        vec3 specColor = mix(vec3(1.0, 0.96, 0.85), vec3(0.58, 0.96, 1.0), uIsDark);
        color += specColor * spec * mix(0.85, 1.35, uIsDark);
        color += mix(vec3(0.82, 0.96, 1.0), vec3(0.18, 0.84, 0.94), uIsDark) * rippleGlow * 0.85;

        float alpha = mix(0.78, 0.94, depthFactor * 0.6 + fresnel * 0.4);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  return { material, uniforms };
}

export function applyCanopyCursorReaction(
  material: THREE.MeshPhysicalMaterial,
  sharedUniforms: SharedCanopyUniforms,
  options: { swayStrength?: number; cacheKey: string }
): void {
  const swayStrength = options.swayStrength ?? 0.065;
  material.customProgramCacheKey = () => options.cacheKey;
  material.onBeforeCompile = shader => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uMouse3D = sharedUniforms.uMouse3D;
    shader.uniforms.uMouseVelocity = sharedUniforms.uMouseVelocity;
    shader.uniforms.uMouseActive = sharedUniforms.uMouseActive;
    shader.uniforms.uMotionScale = sharedUniforms.uMotionScale;
    shader.uniforms.uIsDark = sharedUniforms.uIsDark;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uTime;
        uniform vec3 uMouse3D;
        uniform vec3 uMouseVelocity;
        uniform float uMouseActive;
        uniform float uMotionScale;
        varying float vMouseGlow;
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        vec4 cWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          cWorld = instanceMatrix * cWorld;
        #endif
        cWorld = modelMatrix * cWorld;

        float heightWeight = clamp((transformed.y - 0.22) * 0.9, 0.0, 1.25);
        float wind = sin(uTime * 1.45 + cWorld.x * 1.6 + cWorld.z * 1.3) * ${swayStrength.toFixed(4)} * uMotionScale;
        transformed.x += wind * heightWeight;
        transformed.z += cos(uTime * 1.15 + cWorld.z * 1.5) * ${(swayStrength * 0.6).toFixed(4)} * uMotionScale * heightWeight;

        vec2 toVertex = cWorld.xz - uMouse3D.xz;
        float mouseDist = length(toVertex);
        float mouseBand = uMouseActive * smoothstep(2.15, 0.15, mouseDist);
        vec2 pushDir = mouseDist > 0.001 ? toVertex / mouseDist : vec2(0.0);
        transformed.xz += pushDir * mouseBand * 0.11 * heightWeight;
        transformed.xz += clamp(uMouseVelocity.xz, -1.0, 1.0) * mouseBand * 0.08 * heightWeight;
        vMouseGlow = mouseBand;
        `
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uIsDark;
        varying float vMouseGlow;
        `
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `
        #include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * vMouseGlow * mix(0.24, 0.62, uIsDark);
        `
      );
  };
  material.needsUpdate = true;
}
