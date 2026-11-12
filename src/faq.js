/* FAQ section: entrance, accordion and pointer parallax on the sculpture. */
import { initFaqScene } from './faqScene.js';

export function initFaq() {
  const root = document.querySelector('.faq');
  if (!root) return;
  initFaqScene();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* entrance */
  if (reduce || !('IntersectionObserver' in window)) {
    root.classList.add('is-in');
  } else {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        root.classList.add('is-in');
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(root.querySelector('.faq-stage') || root);
  }

  /* photo beside the questions: shows the one for the open question */
  const media = root.querySelector('.fq-media');
  const shots = media ? Array.from(media.querySelectorAll('.fq-shot')) : [];
  const caps = media ? (media.dataset.caps || '').split('|') : [];
  const showShot = (i) => {
    if (!media || !shots[i]) return;
    shots.forEach((s, k) => s.classList.toggle('is-active', k === i));
    const cap = media.querySelector('.fq-cap');
    if (cap) {
      cap.querySelector('b').textContent = String(i + 1).padStart(2, '0');
      cap.querySelector('span').textContent = caps[i] || '';
    }
  };

  /* accordion - one open at a time */
  const items = Array.from(root.querySelectorAll('.faq-item'));
  items.forEach((item, idx) => {
    const btn = item.querySelector('.faq-trigger');
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
      });
      if (open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        showShot(idx);
      }
    });
  });

  /* pointer parallax */
  const art = root.querySelector('.faq-art');
  if (!art || reduce || !window.matchMedia('(pointer: fine)').matches) return;
  let raf = 0;
  root.querySelector('.faq-top').addEventListener('pointermove', (e) => {
    const r = art.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      art.style.setProperty('--px', x.toFixed(3));
      art.style.setProperty('--py', y.toFixed(3));
    });
  });
  root.querySelector('.faq-top').addEventListener('pointerleave', () => {
    art.style.setProperty('--px', '0');
    art.style.setProperty('--py', '0');
  });
}
