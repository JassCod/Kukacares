import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -1.05);
  s.bezierCurveTo(-0.35, -0.75, -1.25, -0.25, -1.25, 0.4);
  s.bezierCurveTo(-1.25, 0.95, -0.85, 1.25, -0.45, 1.25);
  s.bezierCurveTo(-0.15, 1.25, 0, 1.05, 0, 0.85);
  s.bezierCurveTo(0, 1.05, 0.15, 1.25, 0.45, 1.25);
  s.bezierCurveTo(0.85, 1.25, 1.25, 0.95, 1.25, 0.4);
  s.bezierCurveTo(1.25, -0.25, 0.35, -0.75, 0, -1.05);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.42, bevelEnabled: true, bevelThickness: 0.32, bevelSize: 0.28,
    bevelSegments: 18, curveSegments: 64,
  });
  g.center();
  g.computeVertexNormals();
  return g;
}

export function initScene(canvas) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.innerWidth < 860;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    return { setScroll() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const brand = new THREE.Color(css('--brand') || '#18a99d');
  const brand2 = new THREE.Color(css('--brand-2') || '#f4a33b');
  const brand3 = new THREE.Color(css('--brand-3') || '#7c5cff');

  // Lights for coloured rim highlights on top of the environment map
  const key = new THREE.PointLight(brand, 60, 30); key.position.set(-4, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(brand2, 50, 30); rim.position.set(4, -2, 3); scene.add(rim);
  const back = new THREE.DirectionalLight(0xffffff, 1.2); back.position.set(0, 5, -5); scene.add(back);

  const group = new THREE.Group();
  scene.add(group);

  // Hero object: glass heart
  const heart = new THREE.Mesh(
    heartGeometry(),
    new THREE.MeshPhysicalMaterial({
      color: brand.clone().lerp(new THREE.Color('#ffffff'), 0.55),
      metalness: 0, roughness: 0.06, transmission: 1, thickness: 1.4, ior: 1.45,
      clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.6, iridescenceIOR: 1.3,
      attenuationColor: brand, attenuationDistance: 2.2, specularIntensity: 1,
      envMapIntensity: 1.4,
    })
  );
  heart.scale.setScalar(1.15);
  group.add(heart);

  // Soft inner glow (sprite, so it reads as light inside the glass)
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: brand2, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
  core.scale.setScalar(2.2);
  group.add(core);

  // Iridescent orbit ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.35, 0.045, 32, 220),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.8, envMapIntensity: 2 })
  );
  ring.rotation.set(1.15, 0.25, 0);
  group.add(ring);
  const ring2 = ring.clone();
  ring2.material = ring.material.clone();
  ring2.scale.setScalar(1.22);
  ring2.rotation.set(1.6, -0.6, 0.4);
  group.add(ring2);

  // Orbiting glossy objects
  const orbiters = [];
  const orbMats = [
    new THREE.MeshPhysicalMaterial({ color: brand, metalness: 0.2, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
    new THREE.MeshPhysicalMaterial({ color: brand2, metalness: 0.25, roughness: 0.18, clearcoat: 1 }),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 0.8, ior: 1.5, iridescence: 1 }),
    new THREE.MeshPhysicalMaterial({ color: brand3, metalness: 0.9, roughness: 0.2, clearcoat: 1 }),
  ];
  const geos = [
    new THREE.SphereGeometry(0.28, 48, 48),
    new RoundedBoxGeometry(0.42, 0.42, 0.42, 6, 0.1),
    new THREE.TorusKnotGeometry(0.18, 0.065, 160, 24),
    new THREE.IcosahedronGeometry(0.26, 0),
  ];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(geos[i % geos.length], orbMats[(i * 3 + 1) % orbMats.length]);
    const radius = 2.6 + (i % 3) * 0.55;
    m.userData = { radius, speed: 0.12 + (i % 4) * 0.035, phase: (i / 9) * Math.PI * 2, tilt: (i % 2 ? 1 : -1) * (0.3 + (i % 3) * 0.2), spin: 0.4 + Math.random() };
    m.scale.setScalar(0.7 + Math.random() * 0.7);
    group.add(m);
    orbiters.push(m);
  }

  // Particle dust
  const count = isSmall ? 500 : 1200;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 4 + Math.random() * 10;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph) - 4;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement('canvas');
  dot.width = dot.height = 64;
  const ctx = dot.getContext('2d');
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,.5)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.07, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: brand.clone().lerp(new THREE.Color('#ffffff'), 0.5),
  }));
  scene.add(particles);

  // Layout: object sits right on desktop, centred behind text on mobile
  function layout() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 860;
    const s = wide ? Math.min(0.82, 0.82 * (w / h) / 1.6) : 0.34;
    group.scale.setScalar(s);
    group.position.set(wide ? 2.9 * Math.min(1, (w / h) / 1.6) : 0.15, wide ? 0.1 : 1.75, 0);
    group.userData.baseX = group.position.x;
    group.userData.baseY = group.position.y;
  }
  layout();
  window.addEventListener('resize', layout);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  let scroll = 0;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = reduce ? 0 : clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    heart.rotation.y = t * 0.35 + mouse.x * 0.6 + scroll * 3;
    heart.rotation.x = Math.sin(t * 0.5) * 0.12 + mouse.y * 0.3;
    heart.position.y = Math.sin(t * 0.9) * 0.12;
    const beat = 1 + Math.max(0, Math.sin(t * 2.4)) ** 8 * 0.06;
    heart.scale.setScalar(1.15 * beat);
    core.position.copy(heart.position);
    core.scale.setScalar(2.2 * beat);

    ring.rotation.z = t * 0.25;
    ring2.rotation.z = -t * 0.18;

    for (const m of orbiters) {
      const d = m.userData;
      const a = d.phase + t * d.speed;
      m.position.set(Math.cos(a) * d.radius, Math.sin(a) * d.radius * 0.35 + Math.sin(a * 2) * d.tilt * 0.4, Math.sin(a) * d.radius * 0.6);
      m.rotation.x = t * d.spin;
      m.rotation.y = t * d.spin * 0.7;
    }

    group.rotation.y = mouse.x * 0.15;
    group.rotation.x = mouse.y * 0.1;
    group.position.x = group.userData.baseX + scroll * 1.2;
    group.position.z = -scroll * 4;
    group.position.y = group.userData.baseY + scroll * 1.5;
    particles.rotation.y = t * 0.02 + mouse.x * 0.05;
    particles.rotation.x = mouse.y * 0.03;
    camera.position.y = -scroll * 1.5;

    renderer.render(scene, camera);
  }
  tick();

  return { setScroll(v) { scroll = v; } };
}
