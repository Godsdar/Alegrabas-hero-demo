import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setScroll } from './particles.js';

gsap.registerPlugin(ScrollTrigger);

export function setupScroll() {
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5,
    onUpdate: (self) => {
      // particles.js knows nothing about ScrollTrigger
      // scroll.js just passes progress (0→1)
      setScroll(self.progress);
    },
  });
}
