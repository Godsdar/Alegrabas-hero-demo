import * as THREE from 'three';
import { SETTINGS as S } from './settings.js';

let _mat;

export function createParticleSystem(scene) {
  const geo = createGeometry();
  _mat = createMaterial();
  const points = new THREE.Points(geo, _mat);
  scene.add(points);
  return points;
}

export function update(time) {
  if (_mat) _mat.uniforms.uTime.value = time;
}

export function setScroll(progress) {
  if (_mat) {
    _mat.uniforms.uScrollFade.value = progress;
    _mat.uniforms.uDriftY.value = progress * S.DRIFT_Y;
    _mat.uniforms.uDriftX.value = progress * S.DRIFT_X;
  }
}

function safe(v, fallback = 0) {
  return isNaN(v) || !isFinite(v) ? fallback : v;
}

function clamp01(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : Math.max(0, Math.min(1, n));
}

function gaussian() {
  const u = Math.max(1e-10, Math.random());
  const v = Math.max(1e-10, Math.random());
  const r = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * 0.5;
  return isNaN(r) ? 0 : Math.max(-2.5, Math.min(2.5, r));
}

function createGeometry() {
  const count = S.PARTICLE_COUNT;
  const positions = new Float32Array(count * 3);
  const alphas = new Float32Array(count);
  const sizes = new Float32Array(count);
  const types = new Float32Array(count);
  const gradTs = new Float32Array(count); // Static horizontal factor for indestructible gradients
  const localYs = new Float32Array(count); // Static vertical position for stable gold masks
  const coreCount = Math.floor(count * S.CORE_RATIO);

  const numClouds = 45;

  for (let i = 0; i < count; i++) {
    const cloudIndex = Math.floor(Math.random() * numClouds);
    const t = clamp01(
      cloudIndex / (numClouds - 1) + (Math.random() - 0.5) * 0.02,
    );

    // Save horizontal layout index before any noise deformation or scroll drift
    gradTs[i] = t;

    const xBase = (t - 0.5) * S.INK_SCALE_X * 2.0 + S.INK_OFFSET_X;

    // Base wave mathematical trajectory
    let yBase =
      (Math.sin(t * Math.PI * 1.1) * 0.7 +
        Math.sin(t * Math.PI * 2.5 + 0.8) * 0.15 +
        Math.cos(t * Math.PI * 0.6 + 0.3) * 0.12) *
        S.INK_SCALE_Y +
      S.INK_OFFSET_Y;

    // Left silhouette: Shaping the massive ink hill according to design layout
    if (t < 0.45) {
      const normX = (t - 0.16) / 0.12;
      const leftPlume = Math.exp(-normX * normX) * 0.95;
      yBase += leftPlume;
    }

    const isCore = i < coreCount;
    const plumeFactor = 1.5 - t * 1.0;

    let finalY = 0.0;

    if (isCore) {
      const radius = S.CORE_THICKNESS * plumeFactor;
      const ox = gaussian() * radius * 0.38;
      const oy = gaussian() * radius * 0.38;
      const oz = gaussian() * radius * 0.25;

      positions[i * 3] = safe(xBase + ox);
      finalY = safe(yBase + oy);
      positions[i * 3 + 1] = finalY;
      positions[i * 3 + 2] = safe(oz);

      const distFromCenter = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const densityFactor = Math.exp(-distFromCenter * 3.5);

      alphas[i] = clamp01(0.65 + densityFactor * 0.35);
      sizes[i] =
        S.CORE_SIZE_MIN + Math.random() * (S.CORE_SIZE_MAX - S.CORE_SIZE_MIN);
      types[i] = 0.0;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const spread =
        S.SPLATTER_SPREAD * plumeFactor * (0.5 + Math.random() * 0.5);
      const dist = Math.pow(Math.random(), 0.4) * spread;

      positions[i * 3] = safe(xBase + Math.cos(angle) * dist);
      finalY = safe(yBase + Math.sin(angle) * dist * 0.6);
      positions[i * 3 + 1] = finalY;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      alphas[i] = clamp01(
        Math.random() *
          0.35 *
          Math.pow(1.0 - dist / Math.max(spread, 0.001), 1.2),
      );
      sizes[i] =
        S.SPLATTER_SIZE_MIN +
        Math.random() * (S.SPLATTER_SIZE_MAX - S.SPLATTER_SIZE_MIN);
      types[i] = 1.0;
    }

    // Save initial static elevation for safe shader operations
    localYs[i] = finalY;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aType', new THREE.BufferAttribute(types, 1));
  geo.setAttribute('aGradT', new THREE.BufferAttribute(gradTs, 1));
  geo.setAttribute('aLocalY', new THREE.BufferAttribute(localYs, 1));
  return geo;
}

function createMaterial() {
  const cTeal = new THREE.Color(S.COLOR_TEAL);
  const cPurple = new THREE.Color(S.COLOR_PURPLE);
  const cGold = new THREE.Color(S.COLOR_GOLD);
  const cDark = new THREE.Color(S.COLOR_DARK);
  const cBlack = new THREE.Color(S.COLOR_BLACK);

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uScrollFade: { value: 0 },
      uDriftY: { value: 0 },
      uDriftX: { value: 0 },
      uColorTeal: { value: cTeal },
      uColorPurple: { value: cPurple },
      uColorGold: { value: cGold },
      uColorDark: { value: cDark },
      uColorBlack: { value: cBlack },
    },
    vertexShader: `
      attribute float alpha;
      attribute float aSize;
      attribute float aType;
      attribute float aGradT;
      attribute float aLocalY;

      varying float vAlpha;
      varying float vType;
      varying float vGradT;
      varying float vLocalY;

      uniform float uTime;
      uniform float uScrollFade;
      uniform float uDriftY;
      uniform float uDriftX;

      // 3D Simplex Noise implementations
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      vec3 snoiseVec3(vec3 x) {
        float s  = snoise(vec3(x));
        float s1 = snoise(vec3(x.y - 19.31, x.z + 75.63, x.x + 4.12));
        float s2 = snoise(vec3(x.z + 13.19, x.x + 81.21, x.y - 15.32));
        return vec3(s, s1, s2);
      }

      vec3 curlNoise(vec3 p) {
        const float e = 0.1;
        vec3 dx = vec3(e, 0.0, 0.0);
        vec3 dy = vec3(0.0, e, 0.0);
        vec3 dz = vec3(0.0, 0.0, e);

        vec3 p_x0 = snoiseVec3(p - dx); vec3 p_x1 = snoiseVec3(p + dx);
        vec3 p_y0 = snoiseVec3(p - dy); vec3 p_y1 = snoiseVec3(p + dy);
        vec3 p_z0 = snoiseVec3(p - dz); vec3 p_z1 = snoiseVec3(p + dz);

        float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
        float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
        float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

        return normalize(vec3(x, y, z) / (2.0 * e));
      }

      void main() {
        vAlpha = alpha;
        vType  = aType;
        vGradT = aGradT;
        vLocalY = aLocalY;

        vec3 pos = position;

        // Calculate procedural fluid simulation using layered curl noise
        float baseScale = 0.40 + uScrollFade * 0.25;
        vec3 baseNP = pos * baseScale + vec3(0.0, uTime * ${S.NOISE_SPEED}, uTime * 0.02);
        vec3 baseFluid = curlNoise(baseNP);

        float detailScale = 2.0 + uScrollFade * 0.5;
        vec3 detailNP = pos * detailScale + vec3(uTime * 0.04, -uTime * ${S.NOISE_SPEED} * 1.0, uTime * 0.01);
        vec3 detailFluid = curlNoise(detailNP);

        vec3 finalFluid = baseFluid * 0.75 + detailFluid * 0.25;
        float strength = ${S.NOISE_STRENGTH} + (uScrollFade * 0.4);

        // Apply physical fluid displacement and scroll offset drifts
        pos += finalFluid * strength;
        pos.y -= uDriftY;
        pos.x -= uDriftX;

        gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (1.0 - uScrollFade * 0.80);
      }
    `,
    fragmentShader: `
      uniform float uScrollFade;
      uniform vec3  uColorTeal;
      uniform vec3  uColorPurple;
      uniform vec3  uColorGold;
      uniform vec3  uColorDark;
      uniform vec3  uColorBlack;

      varying float vAlpha;
      varying float vType;
      varying float vGradT;
      varying float vLocalY;

      void main() {
        // Shape points into soft anti-aliased circular particles
        vec2  uv   = gl_PointCoord - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;

        float soft = smoothstep(0.5, 0.15, dist);

        // Use pre-baked stable horizontal progress factor
        float t = vGradT;

        // Map core gradient color palettes using precise horizontal limits
        vec3 baseCol;
        if (t < 0.35) {
          baseCol = mix(uColorTeal, uColorPurple, t / 0.35);
        } else if (t < 0.65) {
          baseCol = mix(uColorPurple, uColorDark, (t - 0.35) / 0.30);
        } else {
          baseCol = mix(uColorDark, uColorBlack, (t - 0.65) / 0.35);
        }

        // Apply gold pigment mask within a safe spatial window
        float goldMask = smoothstep(0.10, 0.28, t) * smoothstep(0.50, 0.33, t);

        // Calculate vertical falloff utilizing static local Y coordinates
        float heightFactor = clamp((vLocalY + 0.2) * 0.8, 0.0, 1.0);
        vec3 finalCol = mix(baseCol, uColorGold, goldMask * heightFactor * 0.75);

        // Blend splatter particles with dark background accents for heavy ink style
        if (vType > 0.5) {
          finalCol = mix(finalCol, uColorBlack, 0.30);
          soft *= 0.8;
        }

        float finalAlpha = soft * vAlpha * (1.0 - uScrollFade);
        gl_FragColor = vec4(finalCol, finalAlpha);
      }
    `,
  });
}
