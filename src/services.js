import { initInnerPage } from './innerPage.js';
import { initCurveStrip } from './curveStrip.js';

/* Services: card rail + detail panel.
   - click a card -> that service shows in the panel below
   - two underline tabs per service (deliverables / tools)
   - ‹ › scroll the rail; arrow keys move between tabs
   - /services#erp opens with that service selected
   Without JS every service is simply listed in the panel. */
function initServiceCarousel() {
  const root = document.querySelector('.sc');
  if (!root) return;
  const rail = root.querySelector('.sc-rail');
  const cards = [...rail.querySelectorAll('.sc-card')];
  const details = [...root.querySelectorAll('.sc-detail')];

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('sc-js');

  // tabs inside each service
  details.forEach((detail) => {
    const tabs = [...detail.querySelectorAll('.sc-tab')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    panels.forEach((p) => p.querySelectorAll('.sc-item').forEach((it, k) => it.style.setProperty('--k', k)));
    const select = (i, focus) => {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        if (on) {
          panels[k].classList.remove('is-in'); void panels[k].offsetWidth; panels[k].classList.add('is-in');
          if (focus) t.focus();
        }
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        select((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
      });
    });
    select(0);
  });

  const [prev, next] = root.querySelectorAll('.sc-arrow');
  function show(id, { scroll = false } = {}) {
    const detail = details.find((d) => d.dataset.id === id) || details[0];
    details.forEach((d) => { d.hidden = d !== detail; });
    detail.classList.remove('is-in'); void detail.offsetWidth; detail.classList.add('is-in');
    cards.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.id === detail.dataset.id)));
    if (scroll) {
      const panel = root.querySelector('.sc-panel');
      const r = panel.getBoundingClientRect();
      if (r.top < 90 || r.top > window.innerHeight * 0.6) {
        window.scrollTo({ top: r.top + window.scrollY - 110, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
  }
  cards.forEach((card) => card.addEventListener('click', () => {
    show(card.dataset.id, { scroll: true });
    history.replaceState(null, '', `#${card.dataset.id}`);
  }));
  const stepW = () => (cards[0]?.getBoundingClientRect().width || 300) + 20;
  const syncArrows = () => {
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
  };
  prev.addEventListener('click', () => rail.scrollBy({ left: -stepW(), behavior: reduce ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => rail.scrollBy({ left: stepW(), behavior: reduce ? 'auto' : 'smooth' }));
  rail.addEventListener('scroll', syncArrows, { passive: true });
  window.addEventListener('resize', syncArrows);
  syncArrows();
  const fromHash = cards.find((c) => `#${c.dataset.id}` === location.hash);
  show(fromHash ? fromHash.dataset.id : cards[0].dataset.id);
  if (fromHash) {
    fromHash.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    requestAnimationFrame(() => show(fromHash.dataset.id, { scroll: true }));
  }
}
initInnerPage({
  after() {
    initServiceCarousel();
    initCurveStrip();
  },
});
