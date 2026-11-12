/* ----------------------------------------------------------------
   Reviews map - fully animated + responsive.

   - Pins, reviewer chips and the highlighted country all select the
     same review card. Cards auto-advance while the section is on
     screen (paused on hover/focus, stopped once the user picks one).
   - Animated layer (built here from the pin positions): flight-path
     arcs from the Riyadh HQ to every client with flowing dashes; the
     selected route draws in and a glowing dot travels along it.
   - Intro: map, countries, pins and routes animate in on first view.
   - Responsive: on tablets/phones the map is zoomed (CSS --zoom),
     glides to the selected pin and can be dragged sideways.
   - prefers-reduced-motion: no auto-advance, intro, flow or travel;
     panning jumps instead of gliding.
   ---------------------------------------------------------------- */
const SVG_NS = 'http://www.w3.org/2000/svg';
const HQ = 'sa';

export function initReviewsMap() {
  const section = document.querySelector('.reviews');
  if (!section) return;

  const stage = section.querySelector('.rv-stage');
  const viewport = section.querySelector('.rv-viewport');
  const map = section.querySelector('.rv-map');
  const cardsLayer = section.querySelector('.rv-cards');
  const markers = [...section.querySelectorAll('.rv-marker')];
  const cards = [...section.querySelectorAll('.rv-card')];
  const chips = [...section.querySelectorAll('.rv-chip')];
  const chipRow = section.querySelector('.rv-chips');
  const regions = [...section.querySelectorAll('.rv-map-active path[data-region]')];
  const order = markers.map((m) => m.dataset.review);
  if (!order.length || !map) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = order[0];
  let userPicked = false;
  let hovering = false;
  let inView = false;
  let timer = 0;

  /* ---------- pin positions (percent -> 1000x500 viewBox) ---------- */
  const pos = {};
  markers.forEach((m, i) => {
    const x = parseFloat(m.style.getPropertyValue('--x'));
    const y = parseFloat(m.style.getPropertyValue('--y'));
    pos[m.dataset.review] = { x, y, vx: x * 10, vy: y * 5 };
    m.style.setProperty('--i', i);
  });
  regions.forEach((p) => p.style.setProperty('--i', order.indexOf(p.dataset.region)));

  /* ---------- flight-path arcs from HQ ---------- */
  const arcs = {};
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'rv-map-arcs');
  svg.setAttribute('viewBox', '0 0 1000 500');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<defs><linearGradient id="rvArcGrad" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#FF8A3D"/><stop offset=".55" stop-color="#FF3D6E"/><stop offset="1" stop-color="#B23A8F"/>' +
    '</linearGradient><radialGradient id="rvDotGlow"><stop offset="0" stop-color="#FF3D6E" stop-opacity=".55"/>' +
    '<stop offset="1" stop-color="#FF3D6E" stop-opacity="0"/></radialGradient></defs>';

  const hq = pos[HQ];
  if (hq) {
    order.forEach((key, i) => {
      if (key === HQ) return;
      const p = pos[key];
      const mx = (hq.vx + p.vx) / 2;
      const my = (hq.vy + p.vy) / 2;
      const dist = Math.hypot(p.vx - hq.vx, p.vy - hq.vy);
      const d = `M${hq.vx} ${hq.vy} Q${mx} ${my - Math.max(14, dist * 0.32)} ${p.vx} ${p.vy}`;
      const track = document.createElementNS(SVG_NS, 'path');
      track.setAttribute('d', d);
      track.setAttribute('class', 'rv-arc');
      track.style.setProperty('--i', i);
      const line = document.createElementNS(SVG_NS, 'path');
      line.setAttribute('d', d);
      line.setAttribute('class', 'rv-arc-line');
      line.setAttribute('pathLength', '1');
      svg.append(track, line);
      arcs[key] = line;
    });
  }
  const glow = document.createElementNS(SVG_NS, 'circle');
  glow.setAttribute('class', 'rv-dot-glow');
  glow.setAttribute('r', '11');
  glow.setAttribute('fill', 'url(#rvDotGlow)');
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('class', 'rv-dot');
  dot.setAttribute('r', '3.2');
  svg.append(glow, dot);
  // arcs sit above the countries but below the pins
  const activeSvg = map.querySelector('.rv-map-active');
  if (activeSvg) activeSvg.after(svg); else map.prepend(svg);

  /* travelling dot along the selected route */
  let travelPath = null;
  let travelStart = 0;
  let rafId = 0;
  const TRAVEL_MS = 2600;
  const travel = (now) => {
    rafId = 0;
    if (!travelPath || !inView || document.hidden) return;
    const t = ((now - travelStart) % TRAVEL_MS) / TRAVEL_MS;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const len = travelPath.getTotalLength();
    const pt = travelPath.getPointAtLength(e * len);
    const fade = Math.min(1, t * 8, (1 - t) * 8);
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    glow.setAttribute('cx', pt.x); glow.setAttribute('cy', pt.y);
    dot.style.opacity = fade; glow.style.opacity = fade;
    rafId = requestAnimationFrame(travel);
  };
  const startTravel = () => {
    if (reduceMotion || rafId || !travelPath || !inView) return;
    rafId = requestAnimationFrame(travel);
  };

  /* ---------- responsive zoom + pan ---------- */
  let pan = 0;
  let dragging = false;
  const zoom = () => parseFloat(getComputedStyle(map).getPropertyValue('--zoom')) || 1;
  const bounds = () => {
    const vw = viewport.clientWidth;
    return { vw, min: Math.min(0, vw - vw * zoom()) };
  };
  const setPan = (px, animate = true) => {
    const { min } = bounds();
    pan = Math.min(0, Math.max(min, px));
    map.classList.toggle('is-gliding', animate && !reduceMotion);
    map.style.setProperty('--pan', `${pan}px`);
  };
  const panTo = (key, animate = true) => {
    const p = pos[key];
    if (!p || !viewport) return;
    const { vw } = bounds();
    if (zoom() <= 1) { setPan(0, false); return; }
    setPan(vw / 2 - (p.x / 100) * vw * zoom(), animate);
  };

  /* ---------- desktop: place the popup card where it covers the
     fewest other pins and stays on the map ---------- */
  const PIN_R = 20;
  const GAP = 26;
  const placeCard = (key) => {
    if (zoom() > 1) return; // tablets/phones show the card under the map
    const card = cards.find((c) => c.dataset.review === key);
    const p = pos[key];
    if (!card || !p) return;
    const W = map.clientWidth;
    const H = map.clientHeight;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    if (!W || !w) return;
    const px = (p.x / 100) * W;
    const py = (p.y / 100) * H;
    const others = order.filter((k) => k !== key).map((k) => [(pos[k].x / 100) * W, (pos[k].y / 100) * H]);
    const candidates = [
      [GAP, -h * 0.3], [-w - GAP, -h * 0.3],
      [-w / 2, GAP + 8], [-w / 2, -h - GAP - 8],
      [GAP * 0.5, GAP], [-w - GAP * 0.5, GAP],
      [GAP * 0.5, -h - GAP], [-w - GAP * 0.5, -h - GAP],
      [GAP, -h * 0.75], [-w - GAP, -h * 0.75],
      [GAP, -h * 0.05], [-w - GAP, -h * 0.05],
    ];
    let best = candidates[0];
    let bestScore = Infinity;
    candidates.forEach(([dx, dy], idx) => {
      const x0 = px + dx;
      const y0 = py + dy;
      const x1 = x0 + w;
      const y1 = y0 + h;
      let score = idx * 0.5; // mild preference for the earlier (nicer) spots
      others.forEach(([ox, oy]) => {
        const cx = Math.max(x0, Math.min(ox, x1));
        const cy = Math.max(y0, Math.min(oy, y1));
        if (Math.hypot(ox - cx, oy - cy) < PIN_R) score += 100;
      });
      // stay inside the map (a little room above it is fine)
      score += Math.max(0, -x0) + Math.max(0, x1 - W) + Math.max(0, -40 - y0) + Math.max(0, y1 - H);
      if (score < bestScore) { bestScore = score; best = [dx, dy]; }
    });
    card.style.setProperty('--tx', `${Math.round(best[0])}px`);
    card.style.setProperty('--ty', `${Math.round(best[1])}px`);
  };

  if (viewport) {
    new ResizeObserver(() => { panTo(current, false); placeCard(current); }).observe(viewport);

    // drag sideways to explore the zoomed map (vertical scrolling still works)
    let startX = 0;
    let startPan = 0;
    let moved = false;
    viewport.addEventListener('pointerdown', (e) => {
      if (zoom() <= 1 || e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startPan = pan;
      stop();
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      if (moved) setPan(startPan + dx, false);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (moved) userPicked = true; // the visitor took over - stop auto-advance
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    // swallow the click that ends a drag so it doesn't select a pin
    viewport.addEventListener('click', (e) => {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);
  }

  /* ---------- selection ---------- */
  const select = (key) => {
    current = key;
    placeCard(key);
    markers.forEach((m) => {
      const on = m.dataset.review === key;
      m.classList.toggle('is-active', on);
      m.setAttribute('aria-pressed', String(on));
    });
    cards.forEach((c) => {
      const on = c.dataset.review === key;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-hidden', String(!on));
    });
    chips.forEach((c) => c.classList.toggle('is-active', c.dataset.review === key));
    regions.forEach((p) => p.classList.toggle('is-active', p.dataset.region === key));

    // routes: HQ selected -> all routes light up; otherwise draw the one route
    Object.entries(arcs).forEach(([k, line]) => line.classList.toggle('is-active', k === key));
    svg.classList.toggle('is-hq', key === HQ);
    travelPath = arcs[key] || null;
    travelStart = performance.now();
    if (!travelPath) { dot.style.opacity = 0; glow.style.opacity = 0; }
    startTravel();

    // keep the active reviewer visible in the row (horizontal scroll only)
    const chip = chips.find((c) => c.dataset.review === key);
    if (chipRow && chip) {
      const rowBox = chipRow.getBoundingClientRect();
      const chipBox = chip.getBoundingClientRect();
      const target = chipRow.scrollLeft + (chipBox.left - rowBox.left) - (rowBox.width - chipBox.width) / 2;
      chipRow.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    panTo(key);
  };

  const pick = (key) => {
    userPicked = true;
    if (cardsLayer) cardsLayer.setAttribute('aria-live', 'polite');
    stop();
    select(key);
  };

  [...markers, ...chips].forEach((el) => {
    el.addEventListener('click', () => pick(el.dataset.review));
  });

  /* ---------- auto-advance ---------- */
  const stop = () => { clearInterval(timer); timer = 0; };
  const start = () => {
    if (timer || reduceMotion || userPicked || hovering || !inView) return;
    timer = setInterval(() => {
      const i = order.indexOf(current);
      select(order[(i + 1) % order.length]);
    }, 5200);
  };

  if (cardsLayer) cardsLayer.setAttribute('aria-live', 'off');
  select(current);

  stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; stop(); } });
  stage.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovering = false; start(); } });
  stage.addEventListener('focusin', () => { hovering = true; stop(); });
  stage.addEventListener('focusout', () => { hovering = false; start(); });

  /* ---------- intro + visibility ---------- */
  if (!reduceMotion) section.classList.add('rv-anim');
  const reveal = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    section.classList.add('is-in');
    reveal.disconnect();
  }, { threshold: 0.2 });
  reveal.observe(stage);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) { start(); startTravel(); } else stop();
  }, { threshold: 0.15 }).observe(stage);

  document.addEventListener('visibilitychange', () => { if (!document.hidden) startTravel(); });
}
