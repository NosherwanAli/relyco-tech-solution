/* Solutions page - "How can technology help your business move faster?"
   The service cards fade in one by one as they scroll into view; cards
   that enter together are staggered left to right. */
export function initSolutionsShowcase() {
  const cards = [...document.querySelectorAll('.sg-card')];
  if (!cards.length) return;
  const rows = cards.filter((card) => card.closest('.sg--rows'));
  if (rows.length) {
    const setOpen = (card, open) => {
      card.classList.toggle('is-open', open);
      card.querySelector('.sg-toggle').setAttribute('aria-expanded', String(open));
    };
    rows.forEach((card, index) => {
      const title = card.querySelector('.sg-title');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'sg-toggle';
      toggle.textContent = title.textContent;
      toggle.setAttribute('aria-expanded', 'false');
      const panelId = `solution-summary-${index}`;
      card.querySelector('.sg-desc').id = panelId;
      toggle.setAttribute('aria-controls', panelId);
      title.replaceChildren(toggle);
      card.classList.add('is-collapsible');
      card.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: hover)').matches) setOpen(card, true);
      });
      card.addEventListener('mouseleave', () => {
        if (!card.contains(document.activeElement)) setOpen(card, false);
      });
      card.addEventListener('focusin', (event) => {
        if (event.target.matches(':focus-visible')) setOpen(card, true);
      });
      card.addEventListener('focusout', (event) => {
        if (!card.contains(event.relatedTarget)) setOpen(card, false);
      });
      toggle.addEventListener('click', () => setOpen(card, !card.classList.contains('is-open')));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(card, false);
      });
    });
    return;
  }
  if (!('IntersectionObserver' in window)) {
    cards.forEach((c) => c.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .forEach((e, k) => {
        e.target.style.setProperty('--d', `${k * 0.12}s`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  cards.forEach((c) => io.observe(c));
}
