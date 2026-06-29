import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function heroEntrance() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl
    .to('#hero-title',  { opacity: 1, y: 0, duration: 1.6, delay: 0.3 })
    .to('.line2',       { opacity: 1, duration: 1.2 }, '-=0.8');
}

export function nextSectionReveal() {
  const trigger = { trigger: '#next-section', start: 'top 75%' };

  gsap.to('.section-label', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
    scrollTrigger: trigger,
  });
  gsap.to('.section-title', {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.1,
    scrollTrigger: trigger,
  });
  gsap.to('.section-body', {
    opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.25,
    scrollTrigger: trigger,
  });
}
