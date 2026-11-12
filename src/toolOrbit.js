import { initToolOrbGraphic } from './toolOrbGraphic.js';

export function initToolOrbit() {
  const section = document.querySelector('.tool-orbit');
  if (!section) return;
  initToolOrbGraphic(section);
  const palettes = [['#FF5A1F', '#FFB881', '#963108'], ['#7061DB', '#D0C8FF', '#30236C'], ['#168B7A', '#A3EEE0', '#06483F'], ['#D83F78', '#FFC4DB', '#74213E']];
  const tools = {
    react: ['React', 'Responsive interfaces and reusable components for fast, intuitive digital products.', 0],
    python: ['Python', 'Data processing, intelligent automation and reliable services built around your workflows.', 1],
    openai: ['OpenAI', 'AI assistants and language-powered experiences connected to your business needs.', 2],
    aws: ['AWS', 'Cloud infrastructure for reliable applications that can scale with your business.', 0],
    fastapi: ['FastAPI', 'Fast, clearly structured APIs that connect your applications, systems and data.', 2],
    javascript: ['JavaScript', 'Interactive experiences that bring your web applications to life.', 0],
    html: ['HTML5', 'Accessible, well-structured foundations for responsive websites and applications.', 3],
    bootstrap: ['Bootstrap', 'Consistent, responsive interface components that work across screen sizes.', 1],
  };
  let palette = 0;
  function changeColor(index) {
    palette = index;
    palettes[index].forEach((color, i) => section.style.setProperty(['--orb-main', '--orb-light', '--orb-deep'][i], color));
  }
  section.querySelector('.tool-orbit-sphere').addEventListener('click', () => changeColor((palette + 1) % palettes.length));
  const buttons = [...section.querySelectorAll('[data-tool]')];
  buttons.forEach((button) => button.addEventListener('click', () => {
    const [name, description, color] = tools[button.dataset.tool];
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    section.querySelector('#tool-orbit-name').textContent = name;
    section.querySelector('#tool-orbit-description').textContent = description;
    changeColor(color);
  }));
}
