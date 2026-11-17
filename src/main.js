import './style.css';
import { initAnimations } from './animations.js';
import { initHeroCoil } from './heroCoil.js';
import { initBigIdeaDiscs } from './bigIdeaDiscs.js';
import { initSolutionsWheel } from './solutionsWheel.js';
import { initSolutionsCore } from './solutionsCore.js';
import { initTechWave } from './techWave.js';
import { initCtaRing } from './ctaRing.js';
import { initReviewsMap } from './reviewsMap.js';
import { initFaq } from './faq.js';
import { initWnRail } from './wnRail.js';
import { initCurveStrip } from './curveStrip.js';

document.addEventListener('DOMContentLoaded', function () {
  initAnimations();
  initHeroCoil();
  initBigIdeaDiscs();
  initSolutionsWheel();
  initSolutionsCore();
  initTechWave();
  initCtaRing();
  initReviewsMap();
  initFaq();
  initWnRail();
  initCurveStrip();

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
