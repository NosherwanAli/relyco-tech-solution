import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */

/**
 * Wraps each word of an element's text in its own <span class="split-word">,
 * without touching existing child elements (e.g. <br> line breaks stay put).
 * Returns the array of word spans created.
 */
function splitIntoWordSpans(el) {
  const spans = [];

  Array.from(el.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;

    const fragment = document.createDocumentFragment();

    node.textContent.split(/(\s+)/).forEach((chunk) => {
      if (chunk === '') return;

      if (/^\s+$/.test(chunk)) {
        fragment.appendChild(document.createTextNode(chunk));
        return;
      }

      const span = document.createElement('span');
      span.className = 'split-word';
      span.textContent = chunk;
      fragment.appendChild(span);
      spans.push(span);
    });

    el.replaceChild(fragment, node);
  });

  return spans;
}

/** Wraps each character of `text` in a <span class="flip-char"> inside `container`. */
function splitIntoCharSpans(container, text) {
  const spans = [];

  Array.from(text).forEach((char) => {
    const span = document.createElement('span');
    span.className = 'flip-char';
    span.textContent = char === ' ' ? ' ' : char;
    container.appendChild(span);
    spans.push(span);
  });

  return spans;
}

/* ----------------------------------------------------------------
   1. Split-text reveal for the main section headings, on scroll
   ---------------------------------------------------------------- */

function initScrollTextReveals() {
  const headings = document.querySelectorAll(
    '.big-idea-heading, .tech-heading, .ai-heading, .final-cta-heading'
  );

  headings.forEach((heading) => {
    const words = splitIntoWordSpans(heading);
    if (words.length === 0) return;

    if (prefersReducedMotion) {
      gsap.set(words, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(words, { opacity: 0, y: 40 });

    gsap.to(words, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.04,
      scrollTrigger: {
        trigger: heading,
        start: 'top 85%',
        once: true,
      },
    });
  });
}

/* ----------------------------------------------------------------
   2. About Reylco — progressive text reveal
   ---------------------------------------------------------------- */

function initAboutReveal() {
  const body = document.querySelector('.about-body');
  if (!body) return;

  const lead = body.querySelector('.about-lead');
  const paragraphs = body.querySelectorAll('.about-text');

  const wordGroups = [];
  if (lead) wordGroups.push(splitIntoWordSpans(lead));
  paragraphs.forEach((p) => wordGroups.push(splitIntoWordSpans(p)));

  if (wordGroups.length === 0) return;

  if (prefersReducedMotion) {
    wordGroups.forEach((group) => gsap.set(group, { opacity: 1, y: 0 }));
    return;
  }

  wordGroups.forEach((group) => gsap.set(group, { opacity: 0, y: 30 }));

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: body,
      start: 'top 80%',
      once: true,
    },
  });

  wordGroups.forEach((group, i) => {
    tl.to(
      group,
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.02,
      },
      i === 0 ? 0 : '-=0.35'
    );
  });
}

/* ----------------------------------------------------------------
   3. Button hover — split-text flip
   ---------------------------------------------------------------- */

const BUTTON_SELECTORS = [
  '.btn-primary',
  '.btn-secondary',
  '.btn-start',
  '.cta-button',
  '.solutions-cta',
  '.tech-cta',
  '.ai-cta',
  '.about-cta',
  '.final-cta-button',
  '.solutions-detail-btn',
].join(', ');

function initButtonHoverSplit() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(BUTTON_SELECTORS).forEach((button) => {
    const textNode = Array.from(button.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
    );
    if (!textNode) return;

    const label = textNode.textContent.trim();

    if (!button.hasAttribute('aria-label')) {
      button.setAttribute('aria-label', label);
    }

    const flip = document.createElement('span');
    flip.className = 'btn-text-flip';
    flip.setAttribute('aria-hidden', 'true');

    const rowTop = document.createElement('span');
    rowTop.className = 'btn-text-row btn-text-row--top';
    const rowBottom = document.createElement('span');
    rowBottom.className = 'btn-text-row btn-text-row--bottom';

    const topChars = splitIntoCharSpans(rowTop, label);
    const bottomChars = splitIntoCharSpans(rowBottom, label);

    flip.appendChild(rowTop);
    flip.appendChild(rowBottom);
    button.replaceChild(flip, textNode);

    gsap.set(bottomChars, { yPercent: 100 });

    const tl = gsap.timeline({ paused: true });
    tl.to(topChars, { yPercent: -100, duration: 0.4, ease: 'power3.out', stagger: 0.015 }, 0);
    tl.to(bottomChars, { yPercent: 0, duration: 0.4, ease: 'power3.out', stagger: 0.015 }, 0);

    button.addEventListener('mouseenter', () => tl.play());
    button.addEventListener('mouseleave', () => tl.reverse());
    button.addEventListener('focus', () => tl.play());
    button.addEventListener('blur', () => tl.reverse());
  });
}

/* ----------------------------------------------------------------
   Init
   ---------------------------------------------------------------- */

export function initAnimations() {
  initScrollTextReveals();
  initAboutReveal();
  initButtonHoverSplit();

  // Recalculate trigger positions once every asset (images, fonts) has
  // finished loading, since late-loading images can shift section heights.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
