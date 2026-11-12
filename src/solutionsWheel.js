/* ----------------------------------------------------------------
   Solutions - half-circle wheel driven by scroll.

   The section is tall and its content is pinned (position: sticky).
   Scroll progress through the section rotates the wheel so each
   solution in turn swings to the front (the "active" angle), and
   the matching detail panel fades in.

   - Each solution gets a short resting zone (dwell) so the wheel
     settles on it instead of spinning continuously.
   - Clicking a node scrolls to that solution's position.
   - Rotation is eased toward the scroll target with rAF; with
     reduced motion it follows scroll directly without easing.
   ---------------------------------------------------------------- */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

export function initSolutionsWheel() {
  const section = document.querySelector('.solutions--wheel');
  if (!section) return;

  const nodes = [...section.querySelectorAll('.sol-node')];
  const details = [...section.querySelectorAll('.sol-detail')];
  const dots = [...section.querySelectorAll('.sol-progress-dot')];
  const n = nodes.length;
  if (n < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DWELL = 0.42; // share of each step the wheel rests on a solution

  let stepDeg = 38;
  let target = 0;   // wheel position in "items" (0 .. n-1)
  let current = 0;
  let active = -1;
  let raf = 0;

  const readStep = () => {
    stepDeg = parseFloat(getComputedStyle(section).getPropertyValue('--step')) || 38;
  };

  // Scroll progress 0..1 -> wheel position with resting zones
  const positionFromScroll = () => {
    const rect = section.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    const p = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
    const raw = p * (n - 1);
    const i = Math.min(Math.floor(raw), n - 2);
    const t = raw - i;
    const half = DWELL / 2;
    return i + smooth(clamp((t - half) / (1 - DWELL), 0, 1));
  };

  const setActive = (idx) => {
    if (idx === active) return;
    active = idx;
    nodes.forEach((el, i) => {
      el.classList.toggle('is-active', i === idx);
      if (i === idx) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    details.forEach((el, i) => {
      const on = i === idx;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      el.querySelectorAll('a').forEach((a) => (on ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
    });
    dots.forEach((el, i) => el.classList.toggle('is-active', i === idx));
  };

  const apply = () => {
    section.style.setProperty('--rot', `${(-current * stepDeg).toFixed(3)}deg`);
    nodes.forEach((el, i) => el.style.setProperty('--d', Math.min(Math.abs(i - current), 2).toFixed(3)));
    setActive(Math.round(current));
  };

  const tick = () => {
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.0008) current = target;
    apply();
    raf = current !== target ? requestAnimationFrame(tick) : 0;
  };

  const onScroll = () => {
    target = positionFromScroll();
    if (reduceMotion) {
      current = target;
      apply();
    } else if (!raf) {
      raf = requestAnimationFrame(tick);
    }
  };

  // Click / keyboard on a node: scroll to its resting position
  nodes.forEach((el, i) => {
    el.addEventListener('click', () => {
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const top = window.scrollY + rect.top + (i / (n - 1)) * travel + 1;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  readStep();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { readStep(); onScroll(); });
  target = current = positionFromScroll();
  apply();
}
