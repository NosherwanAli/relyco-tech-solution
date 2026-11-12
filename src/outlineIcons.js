const wrappers = [
  '.sg-go', '.wn-card-go', '.btn-start-icon', '.big-idea-cta-pill-icon',
  '.sol-cta-icon', '.sol-detail-link-icon', '.sol-node-icon', '.ab-cta-icon',
  '.sf-reach-icon', '.ix-note-ico', '.ix-ph-ico', '.ix-cat-ico',
  '.ix-contact-card > span', '.fh-small-ico', '.fh-bar i', '.fh-btn--soft > span',
  '.ix-ind-cta > span', '.sv-explore i', '.sv-fit-btn i', '.sv-detail-close',
  '.faq-btn-ico', '.faq-ico', '.hero-tab-icon', '.hf-card-ico', '.hx-stat-ico',
  '.idea-card-icon', '.nx-ico', '.sc-item-ico', '.fr-badge', '.sc-arrow',
].join(',');

const geometry = {
  globe: '<circle cx="32" cy="32" r="26"/><ellipse cx="32" cy="32" rx="10" ry="26"/><ellipse cx="32" cy="32" rx="26" ry="10"/>',
  circles: '<circle cx="32" cy="22" r="16"/><circle cx="21" cy="41" r="16"/><circle cx="43" cy="41" r="16"/>',
  layers: '<path d="M6 21 32 7 58 21 32 35Z M6 29 32 15 58 29 32 43Z M6 37 32 23 58 37 32 51Z M6 45 32 31 58 45 32 59Z"/>',
  expand: '<path stroke-dasharray="4 4" d="M32 8v48M8 32h48M15 15l34 34M15 49l34-34"/><path d="m27 11 5-5 5 5M27 53l5 5 5-5M11 27l-5 5 5 5M53 27l5 5-5 5M14 21v-7h7M43 14h7v7M14 43v7h7M43 50h7v-7"/>',
};

export function initOutlineIcons() {
  document.querySelectorAll(wrappers).forEach((el) => el.classList.add('outline-icon'));
  // Geometric illustrations for feature cards; controls keep their familiar symbols.
  document.querySelectorAll('.nx-ico, .idea-card-icon, .sol-node-icon, .fh-small-ico, .hf-card-ico, .hx-stat-ico').forEach((el) => {
    const context = el.closest('article, a, button, li')?.textContent.toLowerCase() || '';
    const kind = /web|global|digital|product/.test(context) ? 'globe'
      : /system|enterprise|stack|platform/.test(context) ? 'layers'
      : /team|experience|design|connect/.test(context) ? 'circles' : 'expand';
    el.innerHTML = `<svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" aria-hidden="true">${geometry[kind]}</svg>`;
    el.classList.add('outline-feature');
  });
  document.querySelectorAll('svg').forEach((svg) => {
    const box = svg.getAttribute('viewBox')?.split(/[ ,]+/).map(Number);
    if (svg.closest('.outline-icon') || (box?.length === 4 && box[2] <= 64 && box[3] <= 64)) {
      svg.classList.add('outline-glyph');
    }
  });
}
