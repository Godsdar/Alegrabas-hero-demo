import * as THREE from 'three';
import { createParticleSystem } from './particles.js';
import { heroEntrance, nextSectionReveal } from './animations.js';
import { setupScrollFade } from './scroll.js';

// ── Renderer ──
const canvas = document.getElementById('particle-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ── Scene & Camera ──
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 4;

// ── Particle System ──
const COUNT = 6000;
const { geo, mat } = createParticleSystem(scene);

// ── Scroll ──
setupScrollFade(mat, geo, COUNT);

// ── Animations ──
heroEntrance();
nextSectionReveal();

// ── Render Loop ──
const clock = new THREE.Clock();
(function animate() {
  requestAnimationFrame(animate);
  mat.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
})();

// ── Resize ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
