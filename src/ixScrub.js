/* ----------------------------------------------------------------
   Shared (Industries, Solutions, Tech Stack, About, Contact) - scroll-scrubbed headings.
   Big headings marked .ix-scrub are split into words; each word
   fades from faint to full ink as the heading scrolls up through
   the viewport (like the reference). <br> line breaks are kept.
   prefers-reduced-motion: headings are shown fully, no scrubbing.
   ---------------------------------------------------------------- */
export function initScrubHeadings() {
  const heads = [...document.querySelectorAll('.ix-scrub')];
  if (!heads.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const groups = heads.map((el) => {
    const words = [];
    const parts = el.innerHTML.split(/(<br\s*\/?>)/i);
    el.innerHTML = parts.map((part) => {
      if (/^<br/i.test(part)) return part;
      return part.split(/(\s+)/).map((w) => {
        if (!w.trim()) return w;
        return `<span class="ix-w">${w}</span>`;
      }).join('');
    }).join('');
    el.querySelectorAll('.ix-w').forEach((w) => words.push(w));
    el.classList.add('is-scrubbing');
    return { el, words };
  });

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    groups.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      // 0 when the heading enters near the bottom, 1 when it reaches ~45% of the screen
      const p = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.5)));
      const lit = p * words.length;
      words.forEach((w, i) => {
        const o = Math.min(1, Math.max(0, lit - i));
        w.style.opacity = (0.18 + 0.82 * o).toFixed(3);
      });
    });
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
