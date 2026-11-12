import { initInnerPage } from './innerPage.js';
import './industries.css';

initInnerPage({
  before() {
  const openIndustry = (hash) => {
    const section = document.getElementById(hash.slice(1));
    if (section?.matches('.industry-accordion')) section.open = true;
  };
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => openIndustry(link.hash));
  });
  window.addEventListener('hashchange', () => openIndustry(location.hash));
  openIndustry(location.hash);
  },
});
