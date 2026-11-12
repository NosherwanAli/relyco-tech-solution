import { initInnerPage } from './innerPage.js';
import { initSolutionsShowcase } from './solutionsShowcase.js';
import { initToolOrbit } from './toolOrbit.js';
import { initSolutionServicesScroll } from './solutionServicesScroll.js';
import { initTechWave } from './techWave.js';

initInnerPage({
  before: initSolutionServicesScroll,
  after() {
    initSolutionsShowcase();
    initToolOrbit();
    initTechWave();
  },
});
