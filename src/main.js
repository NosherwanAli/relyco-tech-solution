import './style.css';
import { initAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', function () {
  initAnimations();

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
