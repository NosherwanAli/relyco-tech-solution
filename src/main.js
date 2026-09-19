import './style.css';
import { initAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', function () {
  initAnimations();

  var revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(function (el) { observer.observe(el); });

  /* Solutions accordion */
  var accordionItems = document.querySelectorAll('.solutions-item');

  accordionItems.forEach(function (item) {
    var trigger = item.querySelector('.solutions-row');

    trigger.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      accordionItems.forEach(function (otherItem) {
        otherItem.classList.remove('is-open');
        otherItem.querySelector('.solutions-row').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
