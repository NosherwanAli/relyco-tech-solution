/* ----------------------------------------------------------------
   Technology Stack - two rows of logo tiles gliding sideways along
   a fixed sine wave (each tile rises and dips as it travels).

   - Top row moves left, bottom row moves right, wave phases offset.
   - Slows to a stop while the pointer is over a row.
   - Pauses off-screen / tab hidden. Reduced motion: tiles are laid
     out on the wave once and stay still.
   ---------------------------------------------------------------- */

export function initTechWave() {
  const section = document.querySelector('.tech-stack--wave');
  if (!section) return;

  const rows = [...section.querySelectorAll('.ts-row')].map((row) => ({
    row,
    tiles: [...row.querySelectorAll('.ts-tile')],
    dir: Number(row.dataset.dir) || 1,
    offset: 0,
    speed: 1,
    target: 1,
  }));
  if (!rows.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gap = 96;
  let amp = 30;
  let wave = 900;
  const SPEED = 26; // px per second

  const measure = () => {
    const w = window.innerWidth;
    gap = w < 720 ? 70 : w < 1100 ? 86 : 98;
    amp = w < 720 ? 16 : w < 1100 ? 24 : 32;
    wave = w < 720 ? 560 : 980;
    rows.forEach((r) => { r.total = r.tiles.length * gap; });
  };

  const place = (r) => {
    const phase = r.dir > 0 ? 0 : Math.PI * 0.85;
    r.tiles.forEach((tile, i) => {
      let x = (i * gap - r.offset) % r.total;
      if (x < 0) x += r.total;
      x -= gap; // let tiles enter from just outside the left edge
      const y = amp * Math.sin((x / wave) * Math.PI * 2 + phase);
      tile.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  };

  measure();
  rows.forEach(place);
  section.classList.add('is-ready');

  window.addEventListener('resize', () => { measure(); rows.forEach(place); });
  if (reduceMotion) return;

  rows.forEach((r) => {
    r.row.addEventListener('pointerenter', () => { r.target = 0; });
    r.row.addEventListener('pointerleave', () => { r.target = 1; });
  });

  let visible = false;
  let raf = 0;
  let last = 0;

  const frame = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    rows.forEach((r) => {
      r.speed += (r.target - r.speed) * 0.08;
      r.offset += r.dir * SPEED * r.speed * dt;
      place(r);
    });
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  }, { rootMargin: '100px 0px' }).observe(section);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) start();
  });
}
