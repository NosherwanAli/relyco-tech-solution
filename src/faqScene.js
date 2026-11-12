/* ----------------------------------------------------------------
   FAQ stage - a light, realistic WebGL scene: a frosted metal Relyco
   card standing on a dark block between two ribbed metal slabs, lit
   by a slow sweeping light, with an orange glow on the card mark and
   the block edge.

   - three.js loads lazily, only when the section is near view.
   - Renders only while visible; one still frame for reduced motion.
   - Without WebGL the CSS fallback gradient stays visible.
   ---------------------------------------------------------------- */

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

export function initFaqScene() {
  const host = document.querySelector('.faq-scene');
  if (!host || !webglAvailable()) return;
  const starter = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      starter.disconnect();
      build(host).catch(() => {});
    }
  }, { rootMargin: '400px 0px' });
  starter.observe(host);
}

const loadImage = (src) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = rej;
  img.src = src;
});

/* diagonal rib texture (used as colour + bump) */
function ribTexture(THREE, light, dark, lines = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = dark;
  g.fillRect(0, 0, 512, 512);
  g.save();
  g.translate(256, 256);
  g.rotate(-Math.PI / 4);
  g.translate(-256, -256);
  const step = 512 / lines;
  for (let i = -lines; i < lines * 2; i++) {
    const grd = g.createLinearGradient(i * step, 0, i * step + step, 0);
    grd.addColorStop(0, dark);
    grd.addColorStop(0.45, light);
    grd.addColorStop(1, dark);
    g.fillStyle = grd;
    g.fillRect(i * step, -512, step, 1536);
  }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* card face: frosted silver, chip, glowing "?" mark, Relyco logo, FAQ */
async function cardTextures(THREE) {
  const W = 1000, H = 1580;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, '#E9ECF2');
  bg.addColorStop(0.5, '#C9CDD6');
  bg.addColorStop(1, '#A9AEBA');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);

  // chip
  g.save();
  g.translate(W / 2 - 70, 180);
  g.strokeStyle = 'rgba(255,255,255,0.8)';
  g.lineWidth = 5;
  g.beginPath();
  if (g.roundRect) g.roundRect(0, 0, 140, 170, 22); else g.rect(0, 0, 140, 170);
  g.stroke();
  g.beginPath();
  g.moveTo(0, 60); g.lineTo(140, 60);
  g.moveTo(0, 112); g.lineTo(140, 112);
  g.moveTo(48, 0); g.lineTo(48, 170);
  g.moveTo(92, 0); g.lineTo(92, 170);
  g.stroke();
  g.restore();

  // glowing mark: bold "?" with diagonal hatching (colour + emissive)
  const e = document.createElement('canvas');
  e.width = W; e.height = H;
  const eg = e.getContext('2d');
  eg.fillStyle = '#000';
  eg.fillRect(0, 0, W, H);
  const drawMark = (target, glow) => {
    const m = document.createElement('canvas');
    m.width = W; m.height = H;
    const ctx = m.getContext('2d');
    ctx.save();
    ctx.translate(W / 2, 740);
    ctx.font = '800 560px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
        const grd = ctx.createLinearGradient(-160, -280, 160, 280);
    grd.addColorStop(0, glow ? '#FFB27A' : '#FF8A3D');
    grd.addColorStop(0.5, '#FF5A1F');
    grd.addColorStop(1, glow ? '#C8203E' : '#5A160A');
    ctx.fillStyle = grd;
    ctx.fillText('?', 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeStyle = glow ? 'rgba(255,240,225,0.9)' : 'rgba(255,220,190,0.7)';
    ctx.lineWidth = 9;
    for (let i = -14; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 26 + 40, -300);
      ctx.lineTo(i * 26 + 240, -60);
      ctx.stroke();
    }
    ctx.restore();
    if (glow) { target.save(); target.shadowColor = '#FF6A1F'; target.shadowBlur = 70; }
    target.drawImage(m, 0, 0);
    if (glow) target.restore();
  };
  drawMark(g, false);
  drawMark(eg, true);

  // Relyco logo with the white letters recoloured to ink
  try {
    const logo = await loadImage('/imgs/image 2.png');
    const lw = 540, lh = Math.round((logo.height / logo.width) * lw);
    const t = document.createElement('canvas');
    t.width = lw; t.height = lh;
    const tg = t.getContext('2d');
    tg.drawImage(logo, 0, 0, lw, lh);
    const d = tg.getImageData(0, 0, lw, lh);
    for (let i = 0; i < d.data.length; i += 4) {
      const R = d.data[i], G = d.data[i + 1], B = d.data[i + 2];
      if (R > 190 && G > 190 && B > 190) { d.data[i] = 28; d.data[i + 1] = 20; d.data[i + 2] = 32; }
    }
    tg.putImageData(d, 0, 0);
    g.save();
    g.translate(W / 2, 1120);
    g.rotate(-0.04);
    g.drawImage(t, -lw / 2, -lh / 2);
    g.restore();
  } catch (err) { /* logo is optional */ }

  // bottom wordmark
  g.save();
  g.translate(W / 2 + 10, 1395);
  g.rotate(-0.04);
  g.font = 'italic 800 130px Inter, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillText('FAQ', 0, 0);
  g.restore();

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const emissiveMap = new THREE.CanvasTexture(e);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

function roundedRect(THREE, w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function radialTex(THREE, rgb, a) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, `rgba(${rgb},${a})`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

async function build(host) {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.className = 'faq-scene-canvas';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.8;

  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.1, 100);
  const camBase = new THREE.Vector3(0, 0.15, 10.5);
  const target = new THREE.Vector3(0, 1.35, 0);

  /* lights */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe8d8cc, 0.6));
  const sweep = new THREE.SpotLight(0xffffff, 70, 30, 0.6, 0.8, 1.6);
  sweep.position.set(4, 6, 6);
  sweep.target.position.set(4, 1, -1);
  scene.add(sweep, sweep.target);
  const fill = new THREE.DirectionalLight(0xfff6ee, 1.4);
  fill.position.set(-4, 5, 6);
  scene.add(fill);
  const lowKey = new THREE.SpotLight(0xffd2b8, 30, 20, 0.7, 0.9, 1.4);
  lowKey.position.set(-6, 3, 5);
  lowKey.target.position.set(-4, -1, 0);
  scene.add(lowKey, lowKey.target);
  const glow = new THREE.PointLight(0xff5a1f, 1.6, 4, 2);
  glow.position.set(0, 2.2, 1.6);
  scene.add(glow);

  /* ---------- card ---------- */
  const CW = 2.1, CH = 3.32, CT = 0.045;
  const cardGeo = new THREE.ExtrudeGeometry(roundedRect(THREE, CW, CH, 0.16), { depth: CT, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16 });
  cardGeo.translate(0, 0, -CT / 2);
  const pos = cardGeo.attributes.position, uv = cardGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + CW / 2) / CW, (pos.getY(i) + CH / 2) / CH);
  const { map, emissiveMap } = await cardTextures(THREE);
  const faceMat = new THREE.MeshPhysicalMaterial({ map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3, color: 0xcfd4dc, clearcoat: 1, clearcoatRoughness: 0.18 });
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: 0xbfc4ce, metalness: 0.9, roughness: 0.25 });
  const card = new THREE.Mesh(cardGeo, [faceMat, edgeMat]);
  const cardPivot = new THREE.Group();
  card.position.y = CH / 2;
  cardPivot.add(card);
  cardPivot.position.set(0.05, 0, 0.1);
  scene.add(cardPivot);

  const haloTex = radialTex(THREE, '255,110,40', 0.55);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.3 }));
  halo.position.set(0, 0.42, CT + 0.03);
  card.add(halo);

  /* ---------- block under the card ---------- */
  const block = new THREE.Mesh(new THREE.BoxGeometry(2.7, 6, 2.4), new THREE.MeshStandardMaterial({ color: 0xddd2ca, metalness: 0.15, roughness: 0.55 }));
  block.position.set(0, -3, -0.2);
  scene.add(block);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.014, 0.014), new THREE.MeshBasicMaterial({ color: 0xff6a24 }));
  edge.position.set(0, 0.003, 1.0);
  scene.add(edge);

  /* ---------- ribbed slabs ---------- */
  const ribDark = ribTexture(THREE, '#FFFFFF', '#C9AE9C', 90);
  ribDark.repeat.set(3, 2);
  const left = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 3), new THREE.MeshStandardMaterial({ map: ribDark, bumpMap: ribDark, bumpScale: 1.5, metalness: 0.2, roughness: 0.45 }));
  left.position.set(-5.5, -2.85, 0.4);
  left.rotation.z = -0.09;
  scene.add(left);

  const ribLight = ribTexture(THREE, '#FFFFFF', '#959AA8', 110);
  ribLight.repeat.set(3, 6);
  const right = new THREE.Mesh(new THREE.BoxGeometry(7, 16, 3), new THREE.MeshStandardMaterial({ map: ribLight, bumpMap: ribLight, bumpScale: 1.5, metalness: 0.55, roughness: 0.32 }));
  right.position.set(6.3, 3.2, -1.2);
  right.rotation.z = 0.42;
  scene.add(right);

  const glint = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 }));
  glint.position.set(4.6, 4.2, 0.5);
  scene.add(glint);

  /* ---------- mount ---------- */
  host.appendChild(renderer.domElement);
  function size() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.9 ? 46 : camera.aspect < 1.3 ? 38 : 32;
    camera.updateProjectionMatrix();
  }
  size();
  new ResizeObserver(size).observe(host);

  const stage = host.closest('.faq-stage') || host;
  let tx = 0, ty = 0, px = 0, py = 0;
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  }

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;
    camera.position.set(camBase.x + px * 0.7, camBase.y - py * 0.4, camBase.z);
    camera.lookAt(target);
    cardPivot.rotation.set(-0.06, -0.32 + Math.sin(t * 0.45) * 0.14 + px * 0.12, 0.05 + Math.sin(t * 0.6) * 0.012);
    card.position.y = CH / 2 + 0.04 + Math.sin(t * 0.9) * 0.035;
    faceMat.emissiveIntensity = 0.85 + Math.sin(t * 1.6) * 0.2;
    glow.intensity = 1.4 + Math.sin(t * 1.6) * 0.4;
    sweep.position.x = 4 + Math.sin(t * 0.35) * 3.5;
    sweep.target.position.x = 3 + Math.sin(t * 0.35 + 0.6) * 4;
    ribLight.offset.x = (t * 0.004) % 1;
    renderer.render(scene, camera);
  }

  host.classList.add('is-ready');
  if (reduce) { frame(); return; }

  let visible = false, raf = 0;
  const loop = () => { frame(); raf = requestAnimationFrame(loop); };
  const setRun = (on) => {
    if (on && !raf) raf = requestAnimationFrame(loop);
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; setRun(visible && !document.hidden); }).observe(host);
  document.addEventListener('visibilitychange', () => setRun(visible && !document.hidden));
  frame();
}
