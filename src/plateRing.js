/* ----------------------------------------------------------------
   Shared 3D "plate ring": chunky rounded-triangle plates in glossy
   black (a few in white ceramic with raised bars), glowing orange
   slabs between them, an orange light inside the ring.

   Used by the home hero and the Solutions wheel core.

   mountPlateRing(host, options)
     readTurn()   -> extra ring rotation in radians (e.g. from scroll)
     canvasClass  -> class for the <canvas>
     onReady()    -> called after the first frame is drawn
     cameraZ      -> framing (larger = smaller ring)
     tilt         -> [x, y, z] base tilt of the ring
     spin         -> idle rotation speed (rad/s)

   Motion: turns slowly by itself and with readTurn(). With
   prefers-reduced-motion it draws a still frame and only re-renders
   on scroll, so the ring moves only when the user scrolls.
   Pauses while off-screen or the tab is hidden.
   ---------------------------------------------------------------- */

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

export async function mountPlateRing(host, options = {}) {
  const {
    readTurn = () => 0,
    canvasClass = '',
    onReady = () => {},
    cameraZ = 13,
    tilt: tiltRot = [-0.95, 0.35, 0.2],
    spin = 0.12,
    offset = [0, 0, 0],
  } = options;

  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));
  } catch (e) {
    return; // caller's fallback stays visible
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const canvas = renderer.domElement;
  if (canvasClass) canvas.className = canvasClass;
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, cameraZ);

  /* ---------- plate geometry: thick rounded triangle with bevel ---------- */
  const roundedTriangle = (r, cr) => {
    const pts = [0, 1, 2].map((k) => {
      const a = Math.PI / 2 + (k * Math.PI * 2) / 3;
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

  const plateGeo = new THREE.ExtrudeGeometry(roundedTriangle(1, 0.42), {
    depth: 0.26, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.08,
    bevelSegments: 6, curveSegments: 28,
  });
  plateGeo.center();
  const glowGeo = new THREE.ExtrudeGeometry(roundedTriangle(0.86, 0.36), {
    depth: 0.05, bevelEnabled: false, curveSegments: 28,
  });
  glowGeo.center();
  const ridgeGeo = new THREE.BoxGeometry(0.62, 0.11, 0.08);

  const black = new THREE.MeshPhysicalMaterial({
    color: '#16111a', roughness: 0.2, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.3,
  });
  const white = new THREE.MeshPhysicalMaterial({
    color: '#F6F2EF', roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.1,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: '#FF3D0A', emissive: '#FF3D0A', emissiveIntensity: 0.9, roughness: 0.4, toneMapped: false,
  });
  const glowHot = new THREE.MeshStandardMaterial({
    color: '#FF6A1F', emissive: '#FF6A1F', emissiveIntensity: 1.0, roughness: 0.4, toneMapped: false,
  });

  /* ---------- ring of plates ---------- */
  const N = 18;
  const RING = 2.55;
  const ring = new THREE.Group();
  const up = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const seg = new THREE.Group();
    seg.position.set(Math.cos(a) * RING, Math.sin(a) * RING, 0);
    // plate face (local +z) along the ring tangent, twisting as it goes
    seg.quaternion.setFromUnitVectors(up, new THREE.Vector3(-Math.sin(a), Math.cos(a), 0));
    seg.rotateZ(i * 0.42);

    const isWhite = i % 6 === 2;
    seg.add(new THREE.Mesh(plateGeo, isWhite ? white : black));
    if (isWhite) {
      [[-0.05, 0.12], [0.1, -0.12]].forEach(([x, y], k) => {
        const r = new THREE.Mesh(ridgeGeo, black);
        r.position.set(x, y, 0.2);
        r.rotation.z = k ? 0.5 : -0.2;
        seg.add(r);
      });
    }
    ring.add(seg);

    // glowing slab in the gap after this plate
    const ga = a + Math.PI / N;
    const g = new THREE.Mesh(glowGeo, i % 3 === 0 ? glowHot : glow);
    g.position.set(Math.cos(ga) * RING, Math.sin(ga) * RING, 0);
    g.quaternion.setFromUnitVectors(up, new THREE.Vector3(-Math.sin(ga), Math.cos(ga), 0));
    g.rotateZ(i * 0.42 + 0.21);
    ring.add(g);
  }

  const tilt = new THREE.Group();
  tilt.add(ring);
  tilt.rotation.set(...tiltRot);
  tilt.position.set(...offset);
  scene.add(tilt);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xfff1ea, 0x2a1020, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff3d6e, 1.4);
  rim.position.set(5, -4, -4);
  scene.add(rim);
  const inner = [];
  for (let k = 0; k < 4; k++) {
    const l = new THREE.PointLight(0xff5a1f, 16, 5, 2);
    const a = (k / 4) * Math.PI * 2 + 0.4;
    l.position.set(Math.cos(a) * RING, Math.sin(a) * RING, 0);
    ring.add(l);
    inner.push(l);
  }
  tilt.add(new THREE.PointLight(0xff5a1f, 26, 9, 2));

  /* ---------- sizing ---------- */
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  /* ---------- render loop ---------- */
  const clock = new THREE.Clock();
  let visible = true;
  let rafId = 0;
  let turn = readTurn();

  const renderFrame = () => {
    const t = reduceMotion ? 0 : clock.getElapsedTime();
    turn = reduceMotion ? readTurn() : turn + (readTurn() - turn) * 0.1;
    ring.rotation.z = t * spin + turn;
    tilt.rotation.y = tiltRot[1] + Math.sin(t * 0.3) * 0.08;
    inner.forEach((l, k) => { l.intensity = 15 + Math.sin(t * 1.6 + k * 1.7) * 4; });
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
  onReady();

  new ResizeObserver(() => { resize(); renderFrame(); }).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) startLoop();
  }).observe(host);

  if (reduceMotion) {
    // Still ring that only moves when the user scrolls
    let pending = false;
    window.addEventListener('scroll', () => {
      if (pending || !visible) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; renderFrame(); });
    }, { passive: true });
    return;
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startLoop();
  });
  startLoop();
}
