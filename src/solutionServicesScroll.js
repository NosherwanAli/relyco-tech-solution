export function initSolutionServicesScroll() {
  const services = [...document.querySelectorAll('body > .ix-ind')];
  if (!services.length) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'solution-services-scroll';
  const aside = document.createElement('aside');
  aside.className = 'solution-services-aside';
  aside.innerHTML = '<span class="solution-services-kicker">Our services <span class="solution-services-count"></span></span><h2 class="solution-services-title"></h2><p class="solution-services-description"></p><nav class="solution-services-progress" aria-label="Explore services"></nav>';
  const panels = document.createElement('div');
  panels.className = 'solution-services-panels';
  services[0].before(wrapper);
  wrapper.append(aside, panels);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = services.map((service, i) => {
    panels.append(service);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(i + 1).padStart(2, '0');
    const name = service.querySelector('.ix-ind-title').childNodes[0].textContent.replace(/\.$/, '');
    button.setAttribute('aria-label', `View ${name}`);
    button.addEventListener('click', () => {
      service.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${service.id}`);
    });
    aside.querySelector('nav').append(button);
    return button;
  });
  let active = -1;
  function update() {
    let index = 0;
    services.forEach((service, i) => {
      if (service.getBoundingClientRect().top <= window.innerHeight * .35) index = i;
    });
    if (active === index) return;
    active = index;
    aside.querySelector('.solution-services-title').textContent = services[index].querySelector('.ix-ind-title').childNodes[0].textContent.replace(/\.$/, '');
    aside.querySelector('.solution-services-description').textContent = services[index].querySelector('.ix-ind-intro').textContent;
    aside.querySelector('.solution-services-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(services.length).padStart(2, '0')}`;
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}
