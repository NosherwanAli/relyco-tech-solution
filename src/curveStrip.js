/* Curved manifesto strip: slide the text along its SVG path, looping one phrase.
   Used on the home page and the services page (.sv-manifesto). */
export function initCurveStrip() {
  const tp = document.querySelector('.sv-curve textPath');
  if (!tp) return;
  const text = tp.parentNode;
  const reps = Number(tp.dataset.reps) || 3;
  let unit = 0;
  const measure = () => { unit = text.getComputedTextLength() / reps; };
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const speed = 70; // px of path per second
  let offset = 0, last = 0, running = false, raf = 0;
  const tick = (t) => {
    if (last && unit) offset = (offset + ((t - last) / 1000) * speed) % unit;
    last = t;
    tp.setAttribute('startOffset', String(-offset));
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = 0; raf = requestAnimationFrame(tick); }
    else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  });
  io.observe(text.closest('.sv-manifesto'));
}
