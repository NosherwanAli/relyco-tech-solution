/* ----------------------------------------------------------------
   Home hero 3D coil: a big arc of chunky, glossy black slabs with
   glowing orange light between them, resting on the white wave.

   - The slabs ripple gently (a travelling wave) and the whole coil
     sways a little; scrolling turns it further.
   - With prefers-reduced-motion it draws a still frame and only
     re-renders on scroll.
   - Pauses while off-screen or the tab is hidden.
   - Without WebGL the CSS glow under the wave still shows.
   ---------------------------------------------------------------- */
import { webglAvailable } from './plateRing.js';

export async function initHeroCoil() {
  const host = document.querySelector('.nx-coil');
  if (!host || !webglAvailable()) return;

  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));
  } catch (e) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const canvas = renderer.domElement;
  canvas.className = 'nx-coil-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  /* ---------- materials ---------- */
  const black = new THREE.MeshPhysicalMaterial({
    color: '#1a1418', roughness: 0.16, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5,
  });

  /* ---------- the coil ----------
     A big ring of thick rounded-triangle plates, their triangular
     faces turned towards the viewer, seen from the front-left so the
     near plates are large and the far ones small. Glossy black with
     one white ceramic plate per eight, and a glowing orange plate in
     every gap with a few light flares. The ring rolls slowly so the
     plates flow along the arc; its lower half sits below the wave. */
  const white = new THREE.MeshPhysicalMaterial({
    color: '#F6F3F1', roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.1,
    emissive: '#FFE6DA', emissiveIntensity: 0.12,
  });

  const roundedTriangle = (r, cr) => {
    const pts = [0, 1, 2].map((k) => {
      const a = Math.PI + (k * Math.PI * 2) / 3;        // apex points inwards (-radial)
      return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
    });
    const s = new THREE.Shape();
    pts.forEach((p, i) => {
      const prev = pts[(i + 2) % 3];
      const next = pts[(i + 1) % 3];
      const a = p.clone().add(prev.clone().sub(p).normalize().multiplyScalar(cr));
      const b = p.clone().add(next.clone().sub(p).normalize().multiplyScalar(cr));
      if (i === 0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y);
      s.quadraticCurveTo(p.x, p.y, b.x, b.y);
    });
    s.closePath();
    return s;
  };
  // shape drawn in (radial, axial); extruded along the tangent
  const plateOf = (r, cr, depth, bevel) => {
    const g = new THREE.ExtrudeGeometry(roundedTriangle(r, cr), {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8,
      bevelSegments: 8, curveSegments: 36,
    });
    g.center();
    g.rotateX(Math.PI / 2);   // shape y -> axial (z), extrusion -> tangent (y)
    g.scale(1, 1, 1.25);      // a little wider across the ring
    return g;
  };
  const slabGeo = plateOf(1.5, 0.55, 0.42, 0.16);
  const glowGeo = plateOf(1.3, 0.5, 0.08, 0);

  const glowA = new THREE.MeshStandardMaterial({
    color: '#FF4A12', emissive: '#FF4A12', emissiveIntensity: 1.25, roughness: 0.45, toneMapped: false,
  });
  const glowB = new THREE.MeshStandardMaterial({
    color: '#FF6A1F', emissive: '#FF6A1F', emissiveIntensity: 0.95, roughness: 0.45, toneMapped: false,
  });

  // additive light flare for a few of the gaps
  const flareTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,236,200,1)');
    gr.addColorStop(0.12, 'rgba(255,150,70,0.85)');
    gr.addColorStop(0.4, 'rgba(255,90,31,0.28)');
    gr.addColorStop(1, 'rgba(255,90,31,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  const N = 46;
  const R = 9;
  const ring = new THREE.Group();
  const lights = [];
  const flares = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const seg = new THREE.Group();
    seg.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    seg.rotation.z = a;                        // local x outwards, y along the ring
    seg.rotateY(Math.sin(i * 0.9) * 0.12);     // slight irregular twist
    ring.add(seg);
    seg.add(new THREE.Mesh(slabGeo, i % 8 === 3 ? white : black));

    // glowing plate in the gap after this one
    const ga = a + Math.PI / N;
    const g = new THREE.Mesh(glowGeo, i % 2 ? glowA : glowB);
    g.position.set(Math.cos(ga) * (R - 0.05), Math.sin(ga) * (R - 0.05), 0);
    g.rotation.z = ga;
    ring.add(g);

    if (i % 4 === 1) {
      const f = new THREE.Sprite(new THREE.SpriteMaterial({
        map: flareTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85,
      }));
      f.position.set(Math.cos(ga) * (R - 0.55), Math.sin(ga) * (R - 0.55), 0.35);
      f.scale.set(1.1, 1.1, 1);
      ring.add(f);
      flares.push(f);
    }
  }
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const l = new THREE.PointLight(0xff5a1f, 16, 4, 2);
    l.position.set(Math.cos(a) * (R - 0.6), Math.sin(a) * (R - 0.6), 0.4);
    ring.add(l);
    lights.push(l);
  }

  // turn the ring so we look at it from the front-left, near side large
  const coil = new THREE.Group();
  coil.add(ring);
  coil.rotation.order = 'YXZ';
  coil.rotation.set(-0.5, 0.95, 0);
  coil.position.set(0.2, -8.4, -3);
  scene.add(coil);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xff6a2a, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-6, 8, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2d0, 0.9);
  fill.position.set(6, 2, 8);
  scene.add(fill);
  const under = new THREE.DirectionalLight(0xff5a1f, 1.8);   // warm bounce from the wave
  under.position.set(0, -6, 4);
  scene.add(under);

  /* ---------- framing ---------- */
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the arc to the canvas width
    const dist = Math.min(14, Math.max(5.5, 19 / camera.aspect));
    camera.position.set(0, 2.2, dist);
    camera.lookAt(0, 1.55, -1);
    camera.updateProjectionMatrix();
  };

  /* ---------- motion ---------- */
  const clock = new THREE.Clock();
  const readTurn = () => Math.min(window.scrollY || 0, 1400) * 0.0012;
  let turn = readTurn();
  let visible = true;
  let rafId = 0;

  const renderFrame = () => {
    const t = reduceMotion ? 0 : clock.getElapsedTime();
    turn = reduceMotion ? readTurn() : turn + (readTurn() - turn) * 0.08;
    ring.rotation.z = -t * 0.07 - turn * 0.6;        // slabs roll over the arc, left to right
    coil.rotation.y = 0.95 + Math.sin(t * 0.3) * 0.04;
    lights.forEach((l, k) => { l.intensity = 16 + Math.sin(t * 1.6 + k * 1.3) * 4; });
    flares.forEach((f, k) => { f.material.opacity = 0.7 + Math.sin(t * 2.1 + k * 1.9) * 0.2; });
    renderer.render(scene, camera);
  };

  const loop = () => {
    rafId = 0;
    if (!visible || document.hidden) return;
    renderFrame();
    rafId = requestAnimationFrame(loop);
  };
  const startLoop = () => {
    if (!rafId && !reduceMotion) rafId = requestAnimationFrame(loop);
  };

  host.appendChild(canvas);
  resize();
  renderFrame();
  host.classList.add('is-ready');

  new ResizeObserver(() => { resize(); renderFrame(); }).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) startLoop();
  }).observe(host);

  if (reduceMotion) {
    let pending = false;
    window.addEventListener('scroll', () => {
      if (pending || !visible) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; renderFrame(); });
    }, { passive: true });
    return;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) startLoop(); });
  startLoop();
}
