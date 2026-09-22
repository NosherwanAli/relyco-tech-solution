import './style.css';
import { initAnimations } from './animations.js';

// Flags the bottom-most badge in each grid COLUMN with .is-last-row, so CSS
// can draw a closing line under it (mirroring the ::before line every badge
// already has above it). This has to be per-column, not just "whichever
// badges share the grid's last row" - when the last row is only partially
// filled (e.g. a 9-item, 4-column grid leaves a single item alone in row 3),
// the other columns' actual last items sit one row up and would otherwise
// never get a closing line. Done in JS rather than pure CSS because the
// column count itself changes at responsive breakpoints (4/3/2).
function markLastRowBadges() {
  document.querySelectorAll('.tech-category-grid').forEach((grid) => {
    const badges = Array.from(grid.querySelectorAll('.tech-badge'));
    if (badges.length === 0) return;

    badges.forEach((badge) => badge.classList.remove('is-last-row'));

    const numCols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;

    for (let col = 0; col < numCols; col++) {
      let lastInColumn = null;
      for (let i = col; i < badges.length; i += numCols) {
        lastInColumn = badges[i];
      }
      if (lastInColumn) lastInColumn.classList.add('is-last-row');
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initAnimations();
  markLastRowBadges();

  window.addEventListener('resize', markLastRowBadges);
  window.addEventListener('load', markLastRowBadges);
});
