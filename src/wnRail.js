/* Big Idea step cards: a horizontal card rail with prev/next buttons
   and a progress track (the thumb shows how much of the rail is in view). */
export function initWnRail() {
  document.querySelectorAll('.wn').forEach((root) => {
    const rail = root.querySelector('.wn-rail');
    const prev = root.querySelector('.wn-prev');
    const next = root.querySelector('.wn-next');
    const thumb = root.querySelector('.wn-thumb');
    if (!rail) return;

    const step = () => {
      const card = rail.querySelector('.wn-card');
      const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      return card ? card.offsetWidth + gap : rail.clientWidth * 0.8;
    };

    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= max - 2;
      root.classList.toggle('is-static', max <= 2);
      if (thumb) {
        const size = rail.clientWidth / rail.scrollWidth;
        thumb.style.width = (size * 100).toFixed(2) + '%';
        thumb.style.transform = `translateX(${max > 0 ? ((x / max) * (1 / size - 1) * 100).toFixed(2) : 0}%)`;
      }
    };

    prev && prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    rail.querySelectorAll('img').forEach((img) => img.addEventListener('load', update, { once: true }));
    update();
  });
}
