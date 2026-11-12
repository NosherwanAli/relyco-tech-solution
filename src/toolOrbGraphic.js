import * as THREE from 'three';

export function initToolOrbGraphic(section) {
  const button = section.querySelector('.tool-orbit-sphere');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'tool-orbit-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  button.append(renderer.domElement);
  button.classList.add('has-graphic');
  const uniforms = {
    uTime: { value: 0 },
    uHover: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uMain: { value: new THREE.Color('#FF5A1F') },
    uLight: { value: new THREE.Color('#FFB881') },
    uDeep: { value: new THREE.Color('#963108') },
  };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime, uHover;
      uniform vec2 uPointer;
      uniform vec3 uMain, uLight, uDeep;
      float hash(vec3 p) {
        p = fract(p * .3183099 + vec3(.1,.2,.3));
        p *= 17.; return fract(p.x * p.y * p.z * (p.x+p.y+p.z));
      }
      float noise(vec3 p) {
        vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float fbm(vec3 p) {
        float sum=0., amplitude=.5;
        for(int i=0;i<5;i++) { sum+=amplitude*noise(p); p=p*2.03+vec3(8.7,3.1,5.4); amplitude*=.5; }
        return sum;
      }
      void main() {
        vec2 uv=(vUv-.5)*2.04;
        float radius=length(uv);
        if(radius>1.) discard;
        float z=sqrt(max(0.,1.-dot(uv,uv)));
        vec3 normal=vec3(uv,z);
        float t=uTime*.13;
        vec3 p=normal*2.2;
        p.xy += uPointer*.17*uHover*z;
        float angle=.65*sin(p.y*1.8+t)+t*.28;
        p.xz=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xz;
        vec3 warp=vec3(fbm(p+vec3(t,0,0)),fbm(p+vec3(4,0,t*.6)),fbm(p+vec3(0,8,-t)));
        float flow=fbm(p+warp*(3.8+uHover*.7)+vec3(0,t*.6,0));
        float bands=sin(flow*12.+p.y*1.7+t*.4)*.5+.5;
        vec3 dark=mix(vec3(.035,.009,.003),uDeep,.23);
        vec3 color=mix(dark,uMain,smoothstep(.13,.5,bands));
        color=mix(color,uLight,smoothstep(.57,.83,bands));
        color=mix(color,vec3(1.,.95,.88),smoothstep(.80,.98,bands));
        float lighting=.73+.27*max(0.,dot(normal,normalize(vec3(-.4,.7,1.))));
        color*=lighting;
        float rim=pow(1.-z,3.);
        color=mix(color,vec3(1.,.89,.81),rim*.7);
        float gloss=pow(max(0.,dot(normal,normalize(vec3(-.38,.5,1.)))),34.);
        color+=vec3(1.,.92,.84)*gloss*.36;
        float grain=hash(vec3(gl_FragCoord.xy,1.))-.5;
        color+=grain*.045;
        float alpha=1.-smoothstep(.985,1.,radius);
        gl_FragColor=vec4(color,alpha);
      }
    `,
  });
  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  const resize = new ResizeObserver(() => {
    renderer.setSize(button.clientWidth, button.clientHeight, false);
    renderer.render(scene, camera);
  });
  resize.observe(button);
  let hover = 0;
  let visible = false;
  let frame = 0;
  let last = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targetPointer = new THREE.Vector2();
  const targets = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
  function readColors() {
    const style = getComputedStyle(section);
    ['--orb-main', '--orb-light', '--orb-deep'].forEach((key, i) => targets[i].set(style.getPropertyValue(key).trim()));
  }
  readColors();
  const colorsObserver = new MutationObserver(() => { readColors(); start(); });
  colorsObserver.observe(section, { attributes: true, attributeFilter: ['style'] });
  button.addEventListener('pointerenter', () => { hover = 1; });
  button.addEventListener('pointerleave', () => { hover = 0; targetPointer.set(0, 0); });
  button.addEventListener('focus', () => { hover = 1; });
  button.addEventListener('blur', () => { hover = 0; });
  button.addEventListener('pointermove', (event) => {
    const rect = button.getBoundingClientRect();
    targetPointer.set((event.clientX-rect.left)/rect.width*2-1, 1-(event.clientY-rect.top)/rect.height*2);
  });
  function draw(now) {
    frame = 0;
    const dt = Math.min((now-last)/1000 || 0, .05);
    last = now;
    uniforms.uHover.value += (hover-uniforms.uHover.value)*.07;
    uniforms.uPointer.value.lerp(targetPointer, .06);
    if (!reduced.matches) uniforms.uTime.value += dt*(1+uniforms.uHover.value*2.6);
    [uniforms.uMain, uniforms.uLight, uniforms.uDeep].forEach((uniform, i) => uniform.value.lerp(targets[i], reduced.matches ? 1 : .07));
    renderer.render(scene, camera);
    if (visible && !document.hidden && !reduced.matches) frame=requestAnimationFrame(draw);
  }
  function start() {
    if (!frame && visible && !document.hidden) { last=performance.now(); frame=requestAnimationFrame(draw); }
  }
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible=entry.isIntersecting;
    if (visible) start(); else { cancelAnimationFrame(frame); frame=0; }
  });
  visibilityObserver.observe(button);
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener('change', start);
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    cancelAnimationFrame(frame);
    resize.disconnect(); visibilityObserver.disconnect(); colorsObserver.disconnect();
    geometry.dispose(); material.dispose(); renderer.dispose();
  }, { once: true });
}
