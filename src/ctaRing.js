/* ----------------------------------------------------------------
   Contact CTA - the shared 3D plate ring (plateRing.js), framed so
   its glossy plates rise from the bottom of the card, like the
   reference. Starts when the section is near; turns with scroll.
   Without WebGL the card simply shows its soft glow.
   ---------------------------------------------------------------- */
import { mountPlateRing, webglAvailable } from './plateRing.js';

export function initCtaRing() {
  const host = document.querySelector('.fr-ring');
  if (!host || !webglAvailable()) return;

  const starter = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    starter.disconnect();
    mountPlateRing(host, {
      cameraZ: 4.4,
      tilt: [-1.2, 0.45, 0.6],
      offset: [0.9, -2.15, 0],
      spin: 0.08,
      readTurn: () => (window.scrollY || 0) * 0.0012,
      onReady: () => host.classList.add('is-ready'),
    });
  }, { rootMargin: '500px 0px' });
  starter.observe(host);
}
