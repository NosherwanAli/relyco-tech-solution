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
    '.big-idea-heading, .tech-heading, .ai-heading, .final-cta-heading, .web-dev-heading, .mobile-app-heading, .ai-services-heading, .ux-ui-heading, .ecommerce-heading, .digital-marketing-heading, .erp-heading, .blockchain-heading, .retail-heading, .manufacturing-heading, .real-estate-heading, .bfsi-heading, .hospitality-heading, .healthcare-heading, .logistics-heading, .automotive-heading, .techstack-closing-heading, .about-relyco-heading'
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
   4. Scroll reveal for `.reveal` elements (fade/slide up into view),
      shared by every page's entry file.
   ---------------------------------------------------------------- */

function initRevealObserver() {
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));

  // Elements pinned near the very bottom of a short page can end up
  // permanently just outside the -60px bottom margin, since scrolling
  // can't push them any further up once the page is fully scrolled.
  // Once the page reaches (or is already at) its end, reveal anything
  // still waiting so it never stays hidden.
  function revealRemainingAtBottom() {
    const doc = document.documentElement;
    const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    if (!atBottom) return;

    document.querySelectorAll('.reveal:not(.in-view)').forEach((el) => {
      el.classList.add('in-view');
      observer.unobserve(el);
    });
  }

  window.addEventListener('scroll', revealRemainingAtBottom, { passive: true });
  window.addEventListener('resize', revealRemainingAtBottom);
  window.addEventListener('load', revealRemainingAtBottom);
}

/* ----------------------------------------------------------------
   5. Navbar active-page indicator - determined from the current URL,
      not hardcoded in any page's HTML, so it works the same way on
      every page (including ones not built yet).
   ---------------------------------------------------------------- */

// Shared with initPageLoader() below, so both compare paths the same way
// (e.g. "/contact" and "/contact/" and "/contact/index.html" all match).
function normalizePath(path) {
  return path.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
}

function initActiveNav() {
  const currentPath = normalizePath(window.location.pathname);

  document.querySelectorAll('.nav-links a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    link.classList.toggle('active', normalizePath(href) === currentPath);
  });
}

/* ----------------------------------------------------------------
   6. Mobile navbar menu - toggles the collapsed .nav-links panel
      open/closed via the hamburger button shown at ≤1024px.
   ---------------------------------------------------------------- */

function initNavToggle() {
  document.querySelectorAll('.navbar').forEach((navbar) => {
    const toggle = navbar.querySelector('.nav-toggle');
    const links = navbar.querySelector('.nav-links');
    if (!toggle || !links) return;

    const closeMenu = () => {
      links.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.classList.toggle('is-active', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!links.classList.contains('is-open')) return;
      if (navbar.contains(event.target)) return;
      closeMenu();
    });
  });
}

/* ----------------------------------------------------------------
   7. Global page-loading transition - a full-screen overlay shown by
      default (in the HTML/CSS, so it's already visible the instant a
      page starts rendering, before any JS runs) and hidden once this
      page has finished loading. Clicking a qualifying internal link
      re-shows it immediately, right before the browser's normal,
      unmodified navigation takes over - no preventDefault/manual
      routing involved, so it can never break a link.
   ---------------------------------------------------------------- */

function initPageLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;

  const hide = () => loader.classList.add('is-hidden');

  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('load', hide);
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (e) {
      return;
    }
    if (url.origin !== window.location.origin) return;

    // Same page, just jumping to a different section on it - no real
    // navigation/reload happens, so the loader shouldn't show.
    if (normalizePath(url.pathname) === normalizePath(window.location.pathname) && url.hash) {
      return;
    }

    loader.classList.remove('is-hidden');
  });
}

/* ----------------------------------------------------------------
   Init
   ---------------------------------------------------------------- */

export function initAnimations() {
  initScrollTextReveals();
  initAboutReveal();
  initButtonHoverSplit();
  initRevealObserver();
  initActiveNav();
  initNavToggle();
  initPageLoader();

  // Recalculate trigger positions once every asset (images, fonts) has
  // finished loading, since late-loading images can shift section heights.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
