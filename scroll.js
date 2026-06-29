import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger);

export function setupScrollFade(mat, geo, COUNT) {
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5,
    onUpdate: (self) => {
      const p = self.progress;

      // Fade out particles as user scrolls
      mat.uniforms.uScrollFade.value = p;

      // Drift down — particles slowly fall into next section then vanish
      mat.uniforms.uDriftY.value = p * 1.8;
    },
  });
}
