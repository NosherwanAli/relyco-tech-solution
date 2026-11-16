/* Fans the About showcase cards out from a stack as the section
   scrolls into view by driving the --p custom property (0 -> 1). */
export function initAboutShowcase() {
  const show = document.querySelector('.ab-show');
  const stage = show?.querySelector('.ab-show-stage');
  if (!stage) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let queued = false;
  const update = () => {
    queued = false;
    if (reduce.matches) { show.style.setProperty('--p', '1'); return; }
    const vh = window.innerHeight;
    const top = stage.getBoundingClientRect().top;
    // 0 when the stage enters at the bottom, 1 once its top reaches 30% of the viewport
    const raw = Math.min(1, Math.max(0, (vh - top) / (vh * 0.7)));
    const eased = 1 - (1 - raw) ** 3;
    show.style.setProperty('--p', eased.toFixed(3));
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  reduce.addEventListener?.('change', queue);
  update();
}
