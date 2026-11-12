/* ----------------------------------------------------------------
   Solutions wheel core - the shared 3D plate ring (plateRing.js),
   centred on the wheel. It turns with the scroll-driven wheel
   (reads --rot from the section). Starts when the section is near;
   if WebGL is missing, the CSS glass disc stays as the fallback.
   ---------------------------------------------------------------- */
import { mountPlateRing, webglAvailable } from './plateRing.js';

export function initSolutionsCore() {
  const host = document.querySelector('.sol-core3d');
  const section = document.querySelector('.solutions--wheel');
  if (!host || !section || !webglAvailable()) return;

  const readTurn = () => {
    const deg = parseFloat(section.style.getPropertyValue('--rot')) || 0;
    return -(deg * Math.PI) / 180 * 1.4;
  };

  const starter = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    starter.disconnect();
    mountPlateRing(host, {
      readTurn,
      onReady: () => {
        host.classList.add('is-ready');
        host.closest('.sol-wheel-wrap')?.classList.add('has-core3d');
      },
    });
  }, { rootMargin: '600px 0px' });
  starter.observe(section);
}
