import { initInnerPage } from './innerPage.js';
import './contactEditorial.css';

initInnerPage({
  after() {
  /* Pre-fill the email field when arriving from the home page CTA (?email=) */
  const email = new URLSearchParams(window.location.search).get('email');
  const field = document.querySelector('.contact-form input[name="email"]');
  if (email && field && !field.value) {
    field.value = email;
    const section = document.getElementById('contact-form');
    if (section) section.scrollIntoView({ block: 'start' });
    const first = document.querySelector('.contact-form input[name="name"]');
    if (first) first.focus({ preventScroll: true });
  }
  },
});
