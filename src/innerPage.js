import './style.css';
import { initAnimations } from './animations.js';
import { initScrubHeadings } from './ixScrub.js';
import { initCtaRing } from './ctaRing.js';
import { initHeroCoil } from './heroCoil.js';

/**
 * Shared bootstrap for every inner page.
 * Page-specific behavior can run immediately before or after the shared UI.
 */
export function initInnerPage({ before, after } = {}) {
  const start = () => {
    before?.();
    initAnimations();
    initScrubHeadings();
    initCtaRing();
    initHeroCoil();
    after?.();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
