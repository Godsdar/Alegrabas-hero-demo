import * as THREE from 'three';

export function createParticleSystem(scene) {
  const COUNT = 7000;

  const positions = new Float32Array(COUNT * 3);
  const alphas    = new Float32Array(COUNT);
  const sizes     = new Float32Array(COUNT);
  const types     = new Float32Array(COUNT); // 0=core wave, 1=splatter

  for (let i = 0; i < COUNT; i++) {
    const t = i / COUNT;
    const isSplatter = Math.random() < 0.30;

    if (!isSplatter) {
      // ── Core ink wave ──
      // Curving path: starts left-center, rises, then sweeps right
      const pathX = (t - 0.5) * 8.0;
      const pathY = Math.sin(t * Math.PI * 0.9 + 0.3) * 1.2 - 0.2;

      // Wave thickness — fattest in left-center (where color gradient is)
      const thickness = (Math.sin(t * Math.PI) * 0.9 + 0.15);

      positions[i * 3]     = pathX + (Math.random() - 0.5) * thickness * 0.5;
      positions[i * 3 + 1] = pathY + (Math.random() - 0.5) * thickness;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      alphas[i] = 0.7 + Math.random() * 0.3;
      sizes[i]  = 3.0 + Math.random() * 7.0 * Math.sin(t * Math.PI);
      types[i]  = 0.0;
    } else {
      // ── Scattered splatter dots ──
      positions[i * 3]     = (Math.random() - 0.5) * 9.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      alphas[i] = 0.15 + Math.random() * 0.35;
      sizes[i]  = 1.0 + Math.random() * 3.5;
      types[i]  = 1.0;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('alpha',    new THREE.BufferAttribute(alphas,    1));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes,     1));
  geo.setAttribute('aType',    new THREE.BufferAttribute(types,     1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  false,
    uniforms: {
      uTime:       { value: 0 },
      uScrollFade: { value: 0 },
      uDriftY:     { value: 0 },
    },
    vertexShader: `
      attribute float alpha;
      attribute float aSize;
      attribute float aType;
      varying   float vAlpha;
      varying   float vType;
      varying   vec3  vPos;
      uniform   float uTime;
      uniform   float uDriftY;

      void main() {
        vAlpha = alpha;
        vType  = aType;
        vPos   = position;

        vec3 pos = position;

        // Organic slow breathing movement
        float wave = sin(uTime * 0.2 + pos.x * 0.7 + pos.y * 0.4) * 0.05;
        pos.x += wave;
        pos.y += cos(uTime * 0.15 + pos.x * 0.5) * 0.03;

        // Scroll: particles drift downward and slightly left (like ink dripping)
        pos.y -= uDriftY;
        pos.x -= uDriftY * 0.15;

        gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize;
      }
    `,
    fragmentShader: `
      uniform float uScrollFade;
      varying float vAlpha;
      varying float vType;
      varying vec3  vPos;

      void main() {
        vec2  uv   = gl_PointCoord - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;

        float soft = 1.0 - smoothstep(0.1, 0.5, dist);

        // Color gradient matching the reference image:
        // Left side: purple-violet glow (#4a2080)
        // Center: deep navy-indigo (#1a1040)
        // Right: near-black ink (#0a0818)
        float t = clamp((vPos.x + 4.0) / 8.0, 0.0, 1.0);

        vec3 colLeft   = vec3(0.29, 0.13, 0.50); // purple-violet
        vec3 colCenter = vec3(0.10, 0.06, 0.25); // deep indigo
        vec3 colRight  = vec3(0.04, 0.03, 0.10); // near black ink

        vec3 col;
        if (t < 0.35) {
          col = mix(colLeft, colCenter, t / 0.35);
        } else {
          col = mix(colCenter, colRight, (t - 0.35) / 0.65);
        }

        // Splatter dots: slightly lighter, more transparent
        if (vType > 0.5) {
          col = mix(col, vec3(0.15, 0.10, 0.30), 0.4);
        }

        float finalAlpha = soft * vAlpha * (1.0 - uScrollFade);
        gl_FragColor = vec4(col, finalAlpha);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return { points, geo, mat };
}
