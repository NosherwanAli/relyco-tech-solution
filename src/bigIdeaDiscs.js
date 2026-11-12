/* ----------------------------------------------------------------
   "The Big Idea" 3D glass discs - a diagonal cascade of glossy,
   translucent coin-like discs in the brand coil palette, drifting
   and slowly turning.

   - Shares the lazily-loaded three.js chunk with the hero coil and
     only starts once the section is about to scroll into view.
   - Pauses while off-screen / tab hidden; one still frame for users
     who prefer reduced motion. Purely decorative (aria-hidden).
   ---------------------------------------------------------------- */

const PALETTE = ['#FF7A2E', '#FF3D6E', '#B23A8F', '#FF5A1F', '#E0457A', '#8E3AB5'];

// Disc layout along the diagonal: t = 0 (top-right) .. 1 (bottom-left).
// [t, size, x-jitter, depth, tiltX, tiltY]
const DISCS = [
  [0.00, 1.20, 0.5, -1.0, 0.70, 0.30],
  [0.08, 1.00, -0.4, 0.6, 0.55, -0.25],
  [0.16, 1.40, 0.3, 1.6, 0.80, 0.40],
  [0.25, 0.80, 0.9, -2.0, 0.60, 0.10],
  [0.33, 1.15, -0.5, 0.8, 0.75, -0.40],
  [0.41, 1.55, 0.1, 2.2, 0.62, 0.20],
  [0.50, 0.95, 0.8, -1.2, 0.85, -0.15],
  [0.58, 1.30, -0.4, 1.0, 0.58, 0.45],
  [0.66, 0.75, 0.6, -2.4, 0.78, 0.05],
  [0.74, 1.10, -0.2, 0.4, 0.66, -0.30],
  [0.83, 1.40, 0.3, 1.8, 0.72, 0.30],
  [0.92, 0.85, -0.7, -1.4, 0.82, -0.10],
  [1.00, 1.15, 0.2, 0.6, 0.64, 0.35],
];

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

export function initBigIdeaDiscs() {
  const host = document.querySelector('.big-idea-visual');
  if (!host || !webglAvailable()) return;

  // Defer all work until the section is close to the viewport
  const starter = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      starter.disconnect();
      build(host);
    }
  }, { rootMargin: '400px 0px' });
  starter.observe(host);
}

async function build(host) {
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
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const canvas = renderer.domElement;
  canvas.className = 'big-idea-discs';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 30);

  /* ---------- Disc geometry: a lathe of a rounded-edge profile ---------- */
  const R = 1;          // radius
  const H = 0.34;       // thickness (chunky, like glass coins)
  const C = 0.15;       // edge rounding
  const profile = [new THREE.Vector2(0, -H / 2)];
  const arc = (cx, cy, from, to) => {
    for (let i = 0; i <= 8; i++) {
      const a = from + (to - from) * (i / 8);
      profile.push(new THREE.Vector2(cx + Math.cos(a) * C, cy + Math.sin(a) * C));
    }
  };
  profile.push(new THREE.Vector2(R - C, -H / 2));
  arc(R - C, -H / 2 + C, -Math.PI / 2, 0);
  arc(R - C, H / 2 - C, 0, Math.PI / 2);
  profile.push(new THREE.Vector2(0, H / 2));
  const geometry = new THREE.LatheGeometry(profile, 72);

  /* ---------- Glassy materials, one per palette colour ---------- */
  const materials = PALETTE.map((hex) => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    transmission: 0.35,
    thickness: 0.6,
    ior: 1.45,
    roughness: 0.12,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    attenuationColor: new THREE.Color(hex),
    attenuationDistance: 0.8,
    emissive: new THREE.Color(hex),
    emissiveIntensity: 0.22,
    envMapIntensity: 1.1,
    transparent: true,
    opacity: 0.94,
  }));

  /* ---------- Lay discs out along the diagonal ----------
     The diagonal runs corner to corner of whatever box the canvas
     has (tall or wide), and disc size follows the box height, so the
     cascade fills its container at any aspect ratio. */
  const group = new THREE.Group();
  const discs = DISCS.map(([t, size, jx, z, tx, ty], i) => {
    const mesh = new THREE.Mesh(geometry, materials[i % materials.length]);
    // Oblique tilt (not face-on) + a diagonal lean so each disc reads
    // as a thick glass coin with its rim showing
    mesh.rotation.set(tx, ty, -0.55 + (i % 2 ? -0.2 : 0.2));
    mesh.userData = {
      t, size, jx, z,
      base: new THREE.Vector3(),
      rot: mesh.rotation.clone(),
      phase: i * 0.73,
      spin: 0.12 + (i % 4) * 0.04,
    };
    group.add(mesh);
    return mesh;
  });
  scene.add(group);

  const layout = () => {
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const start = new THREE.Vector3(halfW * 0.92, halfH * 1.05, 0);
    const end = new THREE.Vector3(-halfW * 0.92, -halfH * 1.05, 0);
    // Wide boxes get bigger discs relative to height, tall boxes smaller
    const scale = (halfH / 8) * THREE.MathUtils.clamp(camera.aspect, 0.8, 1.6) * 1.15;
    discs.forEach((m) => {
      const { t, size, jx, z } = m.userData;
      const p = start.clone().lerp(end, t);
      m.userData.base.set(p.x + jx * scale, p.y, z);
      m.position.copy(m.userData.base);
      m.scale.setScalar(size * scale);
    });
  };

  /* ---------- Lights ---------- */
  scene.add(new THREE.HemisphereLight(0xffe6d8, 0x2a0f2a, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-5, 8, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4d8a, 2.0);
  rim.position.set(6, -3, -6);
  scene.add(rim);
  const warm = new THREE.PointLight(0xff7a1a, 40, 40, 2);
  warm.position.set(2, 2, 8);
  scene.add(warm);

  /* ---------- Sizing ---------- */
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout();
  };

  /* ---------- Pointer parallax ---------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();
  let visible = true;
  let rafId = 0;

  const renderFrame = () => {
    const t = clock.getElapsedTime();
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    discs.forEach((m) => {
      const { base, rot, phase, spin } = m.userData;
      m.position.x = base.x + Math.sin(t * 0.5 + phase) * 0.12;
      m.position.y = base.y + Math.sin(t * 0.7 + phase) * 0.22;
      m.rotation.x = rot.x + Math.sin(t * spin + phase) * 0.18;
      m.rotation.y = rot.y + Math.sin(t * spin * 0.8 + phase) * 0.5;
    });
    group.rotation.y = pointer.x * 0.12;
    group.rotation.x = pointer.y * 0.08;

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

  if (reduceMotion) return;

  new ResizeObserver(() => { resize(); renderFrame(); }).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) startLoop();
  }).observe(host);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startLoop();
  });

  startLoop();
}
