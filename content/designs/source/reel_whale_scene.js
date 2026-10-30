// Browser-side scene for reel_whale.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// Three places in one world (1 unit = 1 m): the deep sea round the origin (a sperm whale, nose at (0, -9, 0), its body
// along -x, the surface at y = 0), the sea surface (a lump floating at the origin; a fishing boat beside a floating
// carcass to the north-west) and a dark studio far off at x = 500 (the lump on a velvet pedestal, a perfume bottle on
// another, a platform scale). Each camera set-up says which place it is in.

const BLUE = '#2F80FF', RED = '#FF3B30', GREEN = '#22B455', GOLD = '#E8B44A';
const v3 = (a) => new X.Vector3(...a);
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };
const mixHex = (a, b, k) => { const A = new X.Color(a), B = new X.Color(b); return A.lerp(B, clamp(k)); };

// ---------- renderer, an environment for glass and wet things, lights ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
const cam = new X.PerspectiveCamera(40, W / H, 0.02, 1200);
{
  const env = new X.Scene();
  const [c, x] = mkc(256, 256), q = x.createLinearGradient(0, 0, 0, 256);
  q.addColorStop(0, '#9FB6C8'); q.addColorStop(0.5, '#2B3540'); q.addColorStop(1, '#0B0D10'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, col, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(col).multiplyScalar(v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(30, 10, [-6, 30, 14], '#FFF1DE', 5); panel(8, 26, [-34, 8, 10], '#FFD9A8', 2.4); panel(14, 8, [26, 12, -24], '#CFE2FF', 2.4); panel(6, 18, [32, 6, 18], '#FFFFFF', 1.8);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.03).texture;
}
const hemi = new X.HemisphereLight('#CFE8FF', '#0A1622', 0.6); scene.add(hemi);
const sun = new X.DirectionalLight('#FFF0D8', 2.4); sun.position.set(-20, 40, 18); scene.add(sun);
const rim = new X.DirectionalLight('#8FC4FF', 1.4); rim.position.set(16, 10, -20); scene.add(rim);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1, side: o.side ?? X.FrontSide, transparent: !!o.tr, opacity: o.op ?? 1, depthWrite: o.dw ?? true });
const glowTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.3, 'rgba(255,240,215,.7)'); q.addColorStop(1, 'rgba(255,200,140,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const bubbleTex = (() => { const [c, x] = mkc(64, 64); x.strokeStyle = 'rgba(220,245,255,.95)'; x.lineWidth = 3; x.beginPath(); x.arc(32, 32, 26, 0, TAU); x.stroke(); x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(22, 22, 6, 0, TAU); x.fill(); x.fillStyle = 'rgba(180,230,255,.15)'; x.beginPath(); x.arc(32, 32, 25, 0, TAU); x.fill(); return tex(c); })();
const glowMat = (c, op = 1) => new X.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, blending: X.AdditiveBlending, depthWrite: false, fog: false });
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = R(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * R(seed * 100000 + i + 7)})`; x.fillRect(R(seed * 100000 + i + 3) * w, R(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};

// ---------- the deep sea: light from the surface, god rays, drifting specks ----------
const UNDER = new X.Group(); scene.add(UNDER);
const rippleTex = (() => {
  const [c, x] = mkc(512, 512); x.fillStyle = '#4FA9D6'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(220,248,255,${0.15 + 0.35 * R(i + 11)})`; x.lineWidth = 1 + 4 * R(i + 12); x.beginPath(); const cx = 512 * R(i + 13), cy = 512 * R(i + 14), r = 10 + 40 * R(i + 15); x.ellipse(cx, cy, r * 1.6, r, R(i + 16) * 3, 0, TAU); x.stroke(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(8, 8); return t0;
})();
const CEILING = new X.Mesh(new X.PlaneGeometry(400, 400), new X.MeshBasicMaterial({ map: rippleTex, color: '#BFEFFF', side: X.BackSide, fog: true }));
CEILING.rotation.x = -Math.PI / 2; CEILING.position.y = 0; UNDER.add(CEILING);
const SUNSPOT = new X.Sprite(glowMat('#FFFFFF', 0.95)); SUNSPOT.scale.setScalar(26); SUNSPOT.position.set(-8, -0.5, -6); UNDER.add(SUNSPOT);
const rayTex = (() => { const [c, x] = mkc(64, 512), q = x.createLinearGradient(0, 0, 0, 512); q.addColorStop(0, 'rgba(255,255,255,.55)'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 512); return tex(c); })();
const RAYS = Array.from({ length: 10 }, (_, i) => {
  const m = new X.Mesh(new X.PlaneGeometry(2 + 3 * R(i + 300), 40), new X.MeshBasicMaterial({ map: rayTex, color: '#CFF4FF', transparent: true, opacity: 0.22, blending: X.AdditiveBlending, depthWrite: false, side: X.DoubleSide, fog: false }));
  m.position.set(-24 + 5 * i + 3 * R(i + 301), -20, -8 + 10 * R(i + 302)); m.rotation.set(0, R(i + 303) * 3, 0.25); UNDER.add(m); return m;
});
const SNOW = (() => {
  const n = 500, geo = new X.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) p.set([(R(i + 1000) - 0.5) * 60 - 6, -2 - 30 * R(i + 2000), (R(i + 3000) - 0.5) * 50], i * 3);
  geo.setAttribute('position', new X.BufferAttribute(p, 3));
  const m = new X.Points(geo, new X.PointsMaterial({ color: '#D8F2FF', size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.6, depthWrite: false }));
  UNDER.add(m); return { m, base: p.slice() };
})();

// ---------- the sperm whale ----------
// a grid over s (nose 0 to tail stock 1) and the angle round the body: a blunt, boxy head a third of its length, the
// body widest behind it, tapering to a narrow tail stock; a hump and knuckles on the back; wrinkled dark skin
const WL = 16, NS = 140, NT = 44;
function wProfile(s) {
  const cap = Math.sqrt(Math.max(0, 1 - (1 - Math.min(1, s / 0.035)) ** 2)), end = Math.sqrt(Math.max(0, 1 - (Math.max(0, s - 0.965) / 0.035) ** 2));
  const Hh = (s < 0.32 ? 1.5 : 1.5 - 1.1 * Math.pow(sstep((s - 0.32) / 0.68), 0.9)) * cap * end;
  const Wd = (s < 0.3 ? 1.25 : s < 0.45 ? lerp(1.25, 1.36, sstep((s - 0.3) / 0.15)) : lerp(1.36, 0.2, sstep((s - 0.45) / 0.55))) * cap * end;
  const n = lerp(3.6, 2.2, sstep((s - 0.24) / 0.16));
  const yc = -0.1 * sstep((s - 0.3) / 0.3) + 0.12 * sstep((s - 0.8) / 0.2);
  return { Hh, Wd, n, yc };
}
const hump = (s) => 0.38 * Math.exp(-(((s - 0.64) / 0.045) ** 2)) + [0.72, 0.78, 0.84].reduce((a, k) => a + 0.12 * Math.exp(-(((s - k) / 0.015) ** 2)), 0);
function whaleGeometry() {
  const pos = new Float32Array((NS + 1) * (NT + 1) * 3), uv = new Float32Array((NS + 1) * (NT + 1) * 2), idx = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, { Hh, Wd, n, yc } = wProfile(s), hu = hump(s);
    for (let j = 0; j <= NT; j++) {
      const th = (j / NT) * TAU, c = Math.cos(th), sn = Math.sin(th), e = 2 / n;
      const y = yc + Hh * Math.sign(sn) * Math.pow(Math.abs(sn), e) + hu * Math.pow(Math.max(0, sn), 8);
      const z = Wd * Math.sign(c) * Math.pow(Math.abs(c), e);
      const k = i * (NT + 1) + j; pos.set([-s * WL, y, z], k * 3); uv.set([s, j / NT], k * 2);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) { const a = i * (NT + 1) + j, b = a + 1, c = a + NT + 1, d = c + 1; idx.push(a, d, b, a, c, d); }
  const geo = new X.BufferGeometry(); geo.setAttribute('position', new X.BufferAttribute(pos, 3)); geo.setAttribute('uv', new X.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
const skinTex = (() => {
  const [c, x] = noiseCanvas(1024, 256, '#6A635D', 0.06, 16000, 7);
  const q = x.createLinearGradient(0, 0, 1024, 0); q.addColorStop(0, 'rgba(110,104,98,.55)'); q.addColorStop(0.3, 'rgba(70,64,60,.15)'); q.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = q; x.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 520; i++) {                  // wrinkles round the body behind the head
    const u = 280 + 720 * R(i + 50), v = 256 * R(i + 51); x.strokeStyle = `rgba(${R(i + 52) < 0.5 ? '20,18,16' : '120,112,104'},${0.15 + 0.25 * R(i + 53)})`; x.lineWidth = 1 + 2 * R(i + 54);
    x.beginPath(); x.moveTo(u, v); x.quadraticCurveTo(u + 6 * (R(i + 55) - 0.5), v + 14, u + 10 * (R(i + 56) - 0.5), v + 28 + 20 * R(i + 57)); x.stroke();
  }
  for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(220,214,206,.45)'; x.lineWidth = 2; x.beginPath(); x.arc(40 + 260 * R(i + 70), 256 * R(i + 71), 3 + 7 * R(i + 72), 0, TAU); x.stroke(); }   // old sucker scars
  for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(225,220,212,.4)'; x.lineWidth = 1.5; x.beginPath(); const u = 30 + 300 * R(i + 80), v = 256 * R(i + 81); x.moveTo(u, v); x.lineTo(u + 40 * (R(i + 82) - 0.5), v + 30 * (R(i + 83) - 0.5)); x.stroke(); }
  return tex(c);
})();
function makeWhale(o = {}) {
  const G = new X.Group(), geo = whaleGeometry();
  const skin = MAT(o.col || '#FFFFFF', { map: skinTex, r: 0.5, env: 0.8 });
  const body = new X.Mesh(geo, skin); G.add(body);
  const jaw = new X.Mesh(new X.SphereGeometry(1, 32, 16), MAT('#DCD5CC', { r: 0.6 })); jaw.scale.set(2.2, 0.16, 0.34); jaw.position.set(-2.75, -1.42, 0); G.add(jaw);
  const lip = jaw;
  [-1, 1].forEach((sz) => {
    const eye = new X.Mesh(new X.SphereGeometry(0.07, 12, 8), MAT('#0A0807', { r: 0.2 })); eye.position.set(-4.6, -0.95, sz * 1.17); G.add(eye);
    const fin = new X.Mesh(new X.SphereGeometry(1, 20, 12), skin); fin.scale.set(0.95, 0.07, 0.38); fin.position.set(-5.4, -1.1, sz * 1.25); fin.rotation.set(sz * 0.5, sz * 0.4, -0.35); G.add(fin);
  });
  const fs0 = new X.Shape(); fs0.moveTo(0, 0); fs0.quadraticCurveTo(-0.6, 1.2, -1.3, 2.4); fs0.quadraticCurveTo(-1.5, 1.2, -1.05, 0.12); fs0.lineTo(-1.2, 0); fs0.lineTo(-1.05, -0.12);
  fs0.quadraticCurveTo(-1.5, -1.2, -1.3, -2.4); fs0.quadraticCurveTo(-0.6, -1.2, 0, 0);
  const fluke = new X.Mesh(new X.ExtrudeGeometry(fs0, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 }), skin);
  fluke.geometry.translate(0, 0, -0.06); fluke.geometry.rotateX(Math.PI / 2);
  const FL = new X.Group(); FL.position.set(-WL + 0.1, 0.12, 0); FL.add(fluke); G.add(FL);
  return { G, body, geo, base: geo.attributes.position.array.slice(), skin, FL, jaw, lip };
}
const WH = makeWhale(); WH.G.position.set(0, -9, 0); UNDER.add(WH.G);
function swim(t, amp = 0.3) {                         // the tail beats up and down; the head barely moves
  const p = WH.geo.attributes.position.array, b = WH.base;
  for (let k = 0; k < p.length; k += 3) { const s = -b[k] / WL; p[k + 1] = b[k + 1] + amp * s * s * Math.sin(t * 2.6 - s * 5); }
  WH.geo.attributes.position.needsUpdate = true; WH.geo.computeVertexNormals();
  WH.FL.position.y = 0.12 + amp * Math.sin(t * 2.6 - 5); WH.FL.rotation.z = -0.5 * amp * Math.cos(t * 2.6 - 5);
}
// X-ray: the skin goes see-through with a blue rim; inside, the gut, squid beaks and the lump forming round them
const XRM = new X.ShaderMaterial({ uniforms: { col: { value: new X.Color('#7CC4FF') }, op: { value: 0 } }, transparent: true, depthWrite: false, blending: X.AdditiveBlending, side: X.DoubleSide,
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 col; uniform float op; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0); gl_FragColor = vec4(col * (0.06 + 1.3 * f), op); }' });
const RIMW = new X.Mesh(WH.geo, XRM); WH.G.add(RIMW);
const GUT = new X.Group(); WH.G.add(GUT);
{
  const pts = [[-4.6, -0.2, 0], [-5.6, -0.6, 0.25], [-6.6, -0.7, -0.3], [-7.6, -0.5, 0.3], [-8.5, -0.75, 0.05], [-9.5, -0.55, -0.25], [-10.8, -0.5, 0.15], [-12.5, -0.3, 0]];
  const tube = new X.Mesh(new X.TubeGeometry(new X.CatmullRomCurve3(pts.map(v3)), 160, 0.24, 14, false),
    new X.MeshStandardMaterial({ color: '#E87A86', emissive: '#C2405A', emissiveIntensity: 0.5, roughness: 0.4, transparent: true, opacity: 0.55, depthWrite: false }));
  GUT.add(tube);
}
const LUMP_IN = [-8.5, -0.75, 0.05];                  // where the lump forms (whale coordinates)
const BEAKS = Array.from({ length: 26 }, (_, i) => {
  const m = new X.Mesh(new X.TorusGeometry(0.055, 0.018, 6, 12, Math.PI * 0.85), MAT('#2A1A10', { r: 0.25, m: 0.1 }));
  const a = R(i + 500) * TAU, r = 0.04 + 0.16 * R(i + 501), h = (R(i + 502) - 0.5) * 0.3;
  m.position.set(LUMP_IN[0] + Math.cos(a) * r, LUMP_IN[1] + h, LUMP_IN[2] + Math.sin(a) * r); m.rotation.set(R(i + 503) * 6, R(i + 504) * 6, R(i + 505) * 6);
  GUT.add(m); return m;
});
function lumpGeometry(rad, seed) {
  const geo = new X.SphereGeometry(rad, 80, 60), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = v3([p.getX(i), p.getY(i), p.getZ(i)]).normalize();
    const n = 0.12 * Math.sin(v.x * 4.3 + seed) * Math.cos(v.y * 3.7 - seed * 1.3 + v.z * 2.1) + 0.07 * Math.sin(v.z * 8.9 + v.x * 6.1 + seed) * Math.cos(v.y * 5.3 + 1.7)
      + 0.05 * Math.sin(v.y * 13.7 + v.x * 9.1 + seed * 2) + 0.03 * Math.cos(v.x * 21.3 - v.z * 17.9 + v.y * 11.1);
    p.setXYZ(i, v.x * rad * (1 + n), v.y * rad * (0.85 + n), v.z * rad * (1 + n * 0.8));
  }
  geo.computeVertexNormals(); return geo;
}
const lumpTex = (() => { const [c, x] = noiseCanvas(512, 512, '#FFFFFF', 0.35, 22000, 13); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(60,50,40,${0.2 * R(i + 900)})`; x.beginPath(); x.arc(512 * R(i + 901), 512 * R(i + 902), 2 + 6 * R(i + 903), 0, TAU); x.fill(); } return tex(c); })();
const GROW = new X.Mesh(lumpGeometry(0.26, 2), MAT('#B9A98C', { map: lumpTex, r: 0.7, tr: true, op: 0.92 })); GROW.position.set(...LUMP_IN); GUT.add(GROW);

// ---------- the surface: water, a floating lump, a boat beside a floating carcass ----------
const SURF = new X.Group(); scene.add(SURF);
const waterNormal = (() => {                          // a tileable wave normal map, from a height field
  const N = 256, hgt = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let h = 0; for (let k = 1; k <= 6; k++) h += Math.sin((x * (k + 1) + y * (k % 3)) * TAU / N + k * 1.7) / k + Math.cos((y * (k + 2) - x * (k % 2)) * TAU / N + k) / (k + 1); hgt[y * N + x] = h; }
  const [c, x] = mkc(N, N), img = x.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
    const hx = hgt[y * N + (xx + 1) % N] - hgt[y * N + (xx + N - 1) % N], hy = hgt[((y + 1) % N) * N + xx] - hgt[((y + N - 1) % N) * N + xx];
    const nx = -hx * 0.9, ny = -hy * 0.9, nz = 1, l = Math.hypot(nx, ny, nz), o = (y * N + xx) * 4;
    img.data[o] = (nx / l * 0.5 + 0.5) * 255; img.data[o + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[o + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0); const t0 = new X.CanvasTexture(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(60, 60); return t0;
})();
const WATER = new X.Mesh(new X.PlaneGeometry(1000, 1000), new X.MeshStandardMaterial({ color: '#0D4466', roughness: 0.16, metalness: 0.1, normalMap: waterNormal, normalScale: new X.Vector2(0.6, 0.6), envMapIntensity: 1.3 }));
WATER.rotation.x = -Math.PI / 2; SURF.add(WATER);
const FLOAT = new X.Mesh(lumpGeometry(0.33, 5), MAT('#FFFFFF', { map: lumpTex, r: 0.7 })); SURF.add(FLOAT);
const FOAM = new X.Mesh(new X.RingGeometry(0.36, 0.55, 40), new X.MeshBasicMaterial({ color: '#E8F6FF', transparent: true, opacity: 0.35, depthWrite: false })); FOAM.rotation.x = -Math.PI / 2; FOAM.position.y = 0.01; SURF.add(FOAM);
const SKYSUN = new X.Sprite(glowMat('#FFF4D6', 1)); SKYSUN.scale.setScalar(70); SURF.add(SKYSUN);
const CARC = makeWhale({ col: '#E4DED6' }); CARC.G.position.set(-19, -0.3, -22); CARC.G.rotation.order = 'YXZ'; CARC.G.rotation.set(Math.PI, 0.35, 0); SURF.add(CARC.G);   // belly up
const BOAT = (() => {
  const G = new X.Group(), geo = new X.BoxGeometry(2.2, 0.8, 6.2, 4, 2, 12), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i), y = p.getY(i), k = clamp((z - 1.2) / 1.9); p.setX(i, p.getX(i) * (1 - 0.85 * k * k) * (y < 0 ? 0.8 : 1)); p.setY(i, y + 0.25 * k * k); }
  geo.computeVertexNormals();
  const hull = new X.Mesh(geo, MAT('#E9EEF2', { r: 0.5 })); hull.position.y = 0.2; G.add(hull);
  const band = new X.Mesh(new X.BoxGeometry(2.25, 0.18, 5.4), MAT('#2F6FB5', { r: 0.5 })); band.position.set(0, 0.45, -0.3); G.add(band);
  const cab = new X.Mesh(new X.BoxGeometry(1.4, 0.9, 1.4), MAT('#F4F4F2', { r: 0.6 })); cab.position.set(0, 1.0, -0.8); G.add(cab);
  const mot = new X.Mesh(new X.BoxGeometry(0.4, 0.7, 0.4), MAT('#1C1D20', { r: 0.4 })); mot.position.set(0, 0.6, -3.2); G.add(mot);
  G.position.set(-20.5, 0, -15.5); G.rotation.y = 1.2; SURF.add(G); return G;
})();
const WAKE = Array.from({ length: 14 }, (_, i) => { const s0 = new X.Mesh(new X.RingGeometry(0.2, 0.4, 24), new X.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false })); s0.rotation.x = -Math.PI / 2; s0.position.y = 0.02; SURF.add(s0); return s0; });

// ---------- the studio: a velvet pedestal with the lump, a perfume bottle on another, a platform scale ----------
const SX = 500;
const STUDIO = new X.Group(); scene.add(STUDIO);
{
  const fl = new X.Mesh(new X.PlaneGeometry(60, 60), MAT('#0B0A0C', { r: 0.28, m: 0.4, env: 0.5 })); fl.rotation.x = -Math.PI / 2; fl.position.set(SX, 0, 0); STUDIO.add(fl);
  const wall = new X.Mesh(new X.PlaneGeometry(60, 30), MAT('#120F0E', { r: 0.9 })); wall.position.set(SX, 15, -6); STUDIO.add(wall);
}
const pedestal = (x, z, h, r) => {
  const G = new X.Group(); G.position.set(x, 0, z);
  const col = new X.Mesh(new X.CylinderGeometry(r, r * 1.05, h, 48), MAT('#141215', { r: 0.35, m: 0.3 })); col.position.y = h / 2; G.add(col);
  const top = new X.Mesh(new X.CylinderGeometry(r * 1.02, r * 1.02, 0.04, 48), MAT('#4A0E18', { r: 1, env: 0.2 })); top.position.y = h + 0.02; G.add(top);
  const trim = new X.Mesh(new X.TorusGeometry(r * 1.03, 0.012, 8, 64), MAT('#C9A050', { m: 1, r: 0.25 })); trim.rotation.x = Math.PI / 2; trim.position.y = h + 0.04; G.add(trim);
  STUDIO.add(G); return G;
};
const PED_L = [SX - 0.62, 0], PED_B = [SX + 0.62, 0.15], PH_L = 1.0, PH_B = 1.15, SCL = [SX + 7, -1.5];
pedestal(PED_L[0], PED_L[1], PH_L, 0.48); pedestal(PED_B[0], PED_B[1], PH_B, 0.32);
const HERO = new X.Mesh(lumpGeometry(0.33, 5), MAT('#FFFFFF', { map: lumpTex, r: 0.7 })); STUDIO.add(HERO);
const SCALE = (() => {
  const G = new X.Group(); G.position.set(SCL[0], 0, SCL[1]);
  const base = new X.Mesh(new X.BoxGeometry(1.3, 0.12, 1.0), MAT('#2C2F34', { m: 0.6, r: 0.4 })); base.position.y = 0.06; G.add(base);
  const plate = new X.Mesh(new X.BoxGeometry(1.2, 0.04, 0.9), MAT('#B9BEC6', { m: 0.9, r: 0.25 })); plate.position.y = 0.14; G.add(plate);
  const post = new X.Mesh(new X.BoxGeometry(0.08, 1.0, 0.08), MAT('#2C2F34', { m: 0.6, r: 0.4 })); post.position.set(0.5, 0.6, -0.4); G.add(post);
  const disp = new X.Mesh(new X.BoxGeometry(0.42, 0.26, 0.1), MAT('#16181B', { r: 0.4, e: '#0F2A12', ei: 1 })); disp.position.set(0.5, 1.15, -0.38); G.add(disp);
  STUDIO.add(G); return G;
})();
// the perfume bottle: thick clear glass, amber inside, a gold cap
const BOT = new X.Group(); BOT.position.set(PED_B[0], PH_B + 0.04, PED_B[1]); STUDIO.add(BOT);
{
  const rr = (w, h, r) => { const s0 = new X.Shape(); s0.moveTo(-w / 2 + r, -h / 2); s0.lineTo(w / 2 - r, -h / 2); s0.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s0.lineTo(w / 2, h / 2 - r); s0.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s0.lineTo(-w / 2 + r, h / 2); s0.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s0.lineTo(-w / 2, -h / 2 + r); s0.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s0; };
  const glassG = new X.ExtrudeGeometry(rr(0.34, 0.4, 0.07), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 10 }); glassG.translate(0, 0.23, -0.08);
  const glass = new X.Mesh(glassG, new X.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.34, envMapIntensity: 3.2, depthWrite: false }));
  const liqG = new X.ExtrudeGeometry(rr(0.27, 0.27, 0.05), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }); liqG.translate(0, 0.18, -0.05);
  const liq = new X.Mesh(liqG, MAT('#E8A240', { r: 0.15, e: '#7A3C08', ei: 0.6, tr: true, op: 0.9 }));
  const neck = new X.Mesh(new X.CylinderGeometry(0.035, 0.04, 0.06, 20), MAT('#D4AF5A', { m: 1, r: 0.22 })); neck.position.y = 0.48;
  const cap = new X.Mesh(new X.CylinderGeometry(0.075, 0.075, 0.13, 40), MAT('#D9B566', { m: 1, r: 0.18 })); cap.position.y = 0.575;
  const capTop = new X.Mesh(new X.SphereGeometry(0.075, 24, 10, 0, TAU, 0, Math.PI / 2), MAT('#D9B566', { m: 1, r: 0.18 })); capTop.position.y = 0.64; capTop.scale.y = 0.4;
  BOT.add(liq, glass, neck, cap, capTop); glass.renderOrder = 2;
}
const BOTTOP = [PED_B[0], PH_B + 0.04 + 0.66, PED_B[1]];
const MIST = Array.from({ length: 40 }, (_, i) => { const s0 = new X.Sprite(glowMat(i % 3 ? '#FFE9C4' : '#FFFFFF', 0)); STUDIO.add(s0); return s0; });
const SCENT = Array.from({ length: 70 }, (_, i) => { const s0 = new X.Sprite(glowMat(i % 4 ? '#FFD38A' : '#FFFFFF', 0)); STUDIO.add(s0); return s0; });
const SPOT_L = new X.SpotLight('#FFF0DC', 0, 9, 0.24, 0.5, 1.2); SPOT_L.position.set(PED_L[0] + 0.3, 4.2, 1.0); SPOT_L.target.position.set(PED_L[0], PH_L, PED_L[1]); STUDIO.add(SPOT_L, SPOT_L.target);
const SPOT_B = new X.SpotLight('#FFE8C8', 0, 9, 0.2, 0.5, 1.2); SPOT_B.position.set(PED_B[0] - 0.3, 4.2, 1.2); SPOT_B.target.position.set(PED_B[0], PH_B + 0.3, PED_B[1]); STUDIO.add(SPOT_B, SPOT_B.target);
const SPOT_S = new X.SpotLight('#FFF4E4', 0, 9, 0.5, 0.6, 1.2); SPOT_S.position.set(SCL[0] + 0.4, 4.2, SCL[1] + 1.2); SPOT_S.target.position.set(SCL[0], 0.3, SCL[1]); STUDIO.add(SPOT_S, SPOT_S.target);
const BOKEH = Array.from({ length: 22 }, (_, i) => { const s0 = new X.Sprite(glowMat(i % 3 ? '#E8B060' : '#FFE3B0', 0.25 + 0.3 * R(i + 40))); s0.scale.setScalar(0.6 + 1.4 * R(i + 41)); s0.position.set(SX + (R(i + 42) - 0.5) * 14, 1 + 5 * R(i + 43), -5.5); STUDIO.add(s0); return s0; });

// ---------- the camera: a new set-up on almost every line ----------
const WP = (x, y, z) => [WH.G.position.x + x, WH.G.position.y + y, WH.G.position.z + z];
const LIN = WP(...LUMP_IN);
const VIEW = {
  up0: [WP(9.5, -3.2, 8.5), WP(-3.5, 0.2, 0), 46], up1: [WP(7.0, -2.4, 6.6), WP(-3.0, 0.3, 0), 44],
  ped0: [[PED_L[0] + 1.55, 1.62, 2.55], [PED_L[0], PH_L + 0.28, 0], 34], ped1: [[PED_L[0] + 1.05, 1.48, 1.95], [PED_L[0], PH_L + 0.3, 0], 32],
  eye0: [WP(5.0, -0.6, 10.0), WP(-3.2, -0.6, 0), 38], eye1: [WP(4.0, -0.7, 8.8), WP(-3.4, -0.7, 0), 38],
  bot0: [[PED_B[0] - 0.95, 1.7, 2.0], [PED_B[0], PH_B + 0.36, PED_B[1]], 32], bot1: [[PED_B[0] - 0.7, 1.62, 1.6], [PED_B[0], PH_B + 0.4, PED_B[1]], 30],
  side0: [WP(7.5, 1.8, 10.5), WP(-5.5, -0.2, 0), 42], side1: [WP(6.2, 1.2, 9.2), WP(-5.8, -0.4, 0), 42],
  xr0: [WP(-3.0, 4.0, 16.5), WP(-7.0, -0.5, 0), 44], xr1: [WP(-7.6, 1.6, 7.6), WP(-8.4, -0.7, 0), 40],
  beak0: [WP(-8.15, -0.35, 1.05), LIN, 36], beak1: [WP(-8.3, -0.45, 0.85), LIN, 34],
  fresh0: [[PED_L[0] + 0.95, 1.52, 1.3], [PED_L[0], PH_L + 0.3, 0], 34], fresh1: [[PED_L[0] + 0.72, 1.46, 1.0], [PED_L[0], PH_L + 0.3, 0], 32],
  sea0: [[2.6, 0.62, 4.2], [0, 0.12, 0], 34], sea1: [[1.9, 0.5, 3.3], [0, 0.12, 0], 32],
  air0: [[-14, 34, -4], [-26.5, 0, -18.5], 42], air1: [[-17, 29, -8], [-27, 0, -19], 42],
  scale0: [[SCL[0] + 2.1, 1.35, SCL[1] + 3.0], [SCL[0], 0.5, SCL[1]], 38], scale1: [[SCL[0] + 1.55, 1.12, SCL[1] + 2.35], [SCL[0], 0.48, SCL[1]], 36],
  carc0: [[-24, 2.4, -28.5], [-26.5, 0.3, -19.5], 40], carc1: [[-25, 2.0, -27], [-27, 0.3, -19.5], 38],
  cash0: [[PED_L[0] - 1.5, 0.62, 2.2], [PED_L[0], PH_L + 0.3, 0], 40], cash1: [[PED_L[0] - 1.1, 0.72, 1.75], [PED_L[0], PH_L + 0.32, 0], 38],
  orb0: [[PED_L[0] + 1.8, 1.72, 1.2], [PED_L[0], PH_L + 0.3, 0], 36], orb1: [[PED_L[0] + 0.4, 1.62, 2.2], [PED_L[0], PH_L + 0.3, 0], 36],
  bot2: [[PED_B[0] + 0.55, 1.0, 1.25], [PED_B[0], PH_B + 0.42, PED_B[1]], 34], bot3: [[PED_B[0] + 0.35, 1.05, 0.95], [PED_B[0], PH_B + 0.45, PED_B[1]], 32],
  scent0: [[PED_B[0], 1.75, 2.3], [PED_B[0], PH_B + 0.45, PED_B[1]], 38], scent1: [[PED_B[0] - 0.3, 1.66, 1.95], [PED_B[0], PH_B + 0.45, PED_B[1]], 36],
  spot0: [[PED_L[0] + 0.2, 1.85, 3.0], [PED_L[0], PH_L + 0.2, 0], 36], spot1: [[PED_L[0] + 0.1, 1.72, 2.6], [PED_L[0], PH_L + 0.2, 0], 36],
  duo0: [[SX + 0.2, 1.75, 4.6], [SX + 0.1, 1.2, 0], 40], duo1: [[SX + 0.5, 1.65, 3.9], [SX + 0.35, 1.25, 0.05], 40],
};
const PLACE = (name) => ({ up: 'under', eye: 'under', side: 'under', xr: 'under', beak: 'under', sea: 'surface', air: 'surface', carc: 'surface' })[name.replace(/\d+$/, '')] || 'studio';
function cutAt(t) { let i = 0; while (i < CUTS.length - 1 && t >= CUTS[i + 1][0]) i++; return i; }
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  const i = cutAt(t), [t0, a, b] = CUTS[i], t1 = i < CUTS.length - 1 ? CUTS[i + 1][0] : T0.feed;
  const u = clamp((t - t0) / Math.max(0.05, t1 - t0)), k = 0.6 * ease(u) + 0.4 * u, A = VIEW[a], B = VIEW[b];
  return [...lerp3(A[0], B[0], k), ...lerp3(A[1], B[1], k), lerp(A[2], B[2], k)];
}
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }

// ---------- the timeline of the world ----------
const AGED = '#D8CDB4', GREYL = '#8E877B', FRESH = '#241A12';
const lumpColor = (t) => (t >= K.stinksL && t < K.sweetL ? FRESH : AGED);
function placeOf(t) { return DEBUGCAM ? (window.PLACE_OVERRIDE || 'under') : PLACE(CUTS[cutAt(t)][1]); }
function setWorld(t) {
  const c = camAt(t); cam.position.set(c[0], c[1], c[2]); cam.fov = c[6]; cam.updateProjectionMatrix(); cam.lookAt(c[3], c[4], c[5]);
  const where = placeOf(t);
  UNDER.visible = where === 'under'; SURF.visible = where === 'surface'; STUDIO.visible = where === 'studio';
  // light and air for each place
  if (where === 'under') { scene.fog = new X.Fog('#0B4566', 6, 80); hemi.intensity = 1.25; hemi.color.set('#B4E6FF'); hemi.groundColor.set('#0A2232'); sun.intensity = 2.8; sun.color.set('#D6F1FF'); sun.position.set(-4, 40, 10); rim.intensity = 1.1; rim.position.set(12, 6, -14); }
  else if (where === 'surface') { const gold = t >= K.found; scene.fog = new X.Fog(gold ? '#E7A879' : '#9CC6E2', 60, 420); hemi.intensity = 0.8; hemi.color.set(gold ? '#FFD9B0' : '#DDEEFF'); hemi.groundColor.set('#0B2638'); sun.intensity = 2.4; sun.color.set(gold ? '#FFC58A' : '#FFF4E0'); sun.position.set(gold ? -60 : -20, gold ? 14 : 40, gold ? -40 : 18); rim.intensity = 0.6; }
  else { scene.fog = null; hemi.intensity = 0.12; hemi.color.set('#FFE7CC'); hemi.groundColor.set('#050405'); sun.intensity = 0.25; rim.intensity = 0.5; rim.position.set(SX + 6, 5, -8); }
  // the whale swims; X-ray from "It forms" to the cut to the fresh lump
  const xr = where === 'under' ? win(t, K.forms - 0.05, K.stinksL, 0.35, 0.05) : 0;
  if (UNDER.visible) swim(t, 0.32);
  WH.G.position.x = t < K.pay ? lerp(-3.2, 1.6, t / K.pay) : 0;          // in the first second it glides at the camera
  [WH.skin, WH.jaw.material, WH.lip.material].forEach((m) => {   // opaque materials stay in the opaque pass until the X-ray starts
    const see = xr > 0.01; if (m.transparent !== see) { m.transparent = see; m.needsUpdate = true; } m.opacity = lerp(1, 0.0, xr); m.depthWrite = !see;
  });
  XRM.uniforms.op.value = xr; RIMW.visible = xr > 0.01; GUT.visible = xr > 0.02;
  const gk = clamp((t - K.gut + 0.2) / (K.beaks - K.gut + 0.6));
  GROW.scale.setScalar(0.15 + 0.85 * ease(gk)); GROW.material.opacity = 0.35 + 0.6 * gk;
  BEAKS.forEach((m, i) => { m.visible = t > K.forms + 0.25 * (i / BEAKS.length); m.rotation.y += 0; });
  const sp = SNOW.m.geometry.attributes.position.array;
  for (let i = 0; i < sp.length; i += 3) { sp[i] = SNOW.base[i] + ((t * 0.9 + R(i)) % 1) * 3; sp[i + 1] = SNOW.base[i + 1] - ((t * 0.25 + R(i + 1)) % 1) * 1.2; }
  SNOW.m.geometry.attributes.position.needsUpdate = true;
  RAYS.forEach((m, i) => { m.rotation.y = R(i + 303) * 3 + t * 0.08; m.material.opacity = 0.16 + 0.08 * Math.sin(t * 0.7 + i); });
  rippleTex.offset.set(t * 0.03, t * 0.02);
  // the surface: waves move; the lump bobs and pales as years pass; a boat idles by the carcass
  waterNormal.offset.set(t * 0.012, t * 0.008);
  const yk = clamp((t - K.sweetL) / (L_SWEET_E - K.sweetL));
  FLOAT.position.set(0, 0.06 + 0.05 * Math.sin(t * 2.2), 0); FLOAT.rotation.set(0.15 * Math.sin(t * 1.3), t * 0.4, 0.1 * Math.cos(t * 1.7));
  FLOAT.material.color.copy(t < K.sweetL ? new X.Color(FRESH) : mixHex(FRESH, AGED, Math.pow(clamp(yk * 1.1), 1.4)));
  FOAM.scale.setScalar(1 + 0.08 * Math.sin(t * 3));
  const cyc = yk * 3 * TAU;                           // three days and nights in the shot
  SKYSUN.position.set(Math.cos(cyc) * -260, 30 + Math.sin(cyc) * 180, -320); SKYSUN.visible = where === 'surface' && (t < K.found ? Math.sin(cyc) > -0.1 : true);
  if (t >= K.found) SKYSUN.position.set(-300, 25, -240);
  WAKE.forEach((m, i) => { const u = ((t * 0.5 + i / WAKE.length) % 1); m.position.set(BOAT.position.x - 1.5 - u * 6, 0.02, BOAT.position.z + 2 - u * 4); m.scale.setScalar(1 + u * 5); m.material.opacity = 0.25 * (1 - u); });
  BOAT.position.y = 0.04 * Math.sin(t * 1.8); BOAT.rotation.z = 0.03 * Math.sin(t * 1.4);
  // the studio: the lump on its pedestal (or the scale), the perfume bottle, the spotlights
  const onScale = t >= K.n127 - 0.06 && t < K.inside - 0.05;
  HERO.position.set(onScale ? SCL[0] : PED_L[0], onScale ? 0.16 + 0.28 : PH_L + 0.04 + 0.28, onScale ? SCL[1] : PED_L[1]);
  HERO.rotation.set(0.2, t * 0.25, 0.1); HERO.material.color.set(lumpColor(t)); HERO.material.roughness = t >= K.stinksL && t < K.sweetL ? 0.32 : 0.72;
  const off = t >= K.lumpW && t < T0.feed;
  SPOT_L.intensity = off ? 0 : 38; SPOT_B.intensity = 30 + 40 * bump(t, K.they - 0.06, 0.6) + (t >= K.they ? 22 : 0); SPOT_S.intensity = onScale ? 40 : 0;
  HERO.material.envMapIntensity = off ? 0.1 : 1; hemi.intensity = where === 'studio' && off ? 0.04 : hemi.intensity;
  // a burst of mist on "perfume", and on "makes perfume"; then scent that lingers and swirls
  const mistAt = [K.perfume - 0.05, K.perfume2 - 0.05].find((m) => t >= m && t < m + 1.2);
  MIST.forEach((s0, i) => {
    const u = mistAt === undefined ? -1 : t - mistAt; s0.visible = u >= 0 && u < 1.2; if (!s0.visible) return;
    const a = (R(i + 600) - 0.5) * 0.9, sp2 = 0.6 + 0.9 * R(i + 601), d = sp2 * (1 - Math.exp(-u / 0.25));
    s0.position.set(BOTTOP[0] - d * Math.cos(a) * 1.2, BOTTOP[1] + 0.02 + d * Math.sin(a) * 0.5 + 0.1 * u, BOTTOP[2] + d * Math.sin(a * 2) * 0.4);
    s0.scale.setScalar(0.04 + 0.22 * u); s0.material.opacity = 0.8 * (1 - u / 1.2);
  });
  const sc = win(t, K.lastW - 0.1, T0.feed + 1, 0.3, 0.1) * (t >= K.lump && t < K.they ? 0.25 : 1);
  SCENT.forEach((s0, i) => {
    s0.visible = sc > 0.01; if (!s0.visible) return;
    const ph = R(i + 700) * TAU + t * (0.6 + 0.5 * R(i + 701)), h = ((R(i + 702) + t * 0.12) % 1), r = 0.25 + 0.35 * R(i + 703) + 0.2 * h;
    s0.position.set(BOT.position.x + Math.cos(ph) * r, BOT.position.y + 0.2 + h * 1.0, BOT.position.z + Math.sin(ph) * r);
    s0.scale.setScalar(0.03 + 0.05 * R(i + 704)); s0.material.opacity = sc * 0.85 * Math.sin(Math.PI * h);
  });
}
const L_SWEET_E = LN.sweet.e;

// ---------- 2D: backdrops, labels, cards, small print ----------
function backdrop(x, t) {
  const where = placeOf(t);
  if (where === 'under') {
    const q = x.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#2D8DBA'); q.addColorStop(0.45, '#0B4A6E'); q.addColorStop(1, '#03141F'); x.fillStyle = q; x.fillRect(0, 0, W, H);
  } else if (where === 'surface') {
    const gold = t >= K.found, yk = clamp((t - K.sweetL) / (L_SWEET_E - K.sweetL)), day = gold ? 1 : 0.5 + 0.5 * Math.sin(yk * 3 * TAU + 0.3);
    const top = gold ? '#4B6C9A' : mixc('#0A1430', '#5BA8E6', day), mid = gold ? '#F2A46E' : mixc('#1A2450', '#BFE2F7', day), bot = gold ? '#FFD2A0' : mixc('#2A3060', '#EAF6FF', day);
    const q = x.createLinearGradient(0, 0, 0, H); q.addColorStop(0, top); q.addColorStop(0.55, mid); q.addColorStop(1, bot); x.fillStyle = q; x.fillRect(0, 0, W, H);
    if (!gold && day < 0.4) { x.fillStyle = 'rgba(255,255,255,' + (0.4 - day) * 1.5 + ')'; for (let i = 0; i < 70; i++) x.fillRect(W * R(i + 80), H * 0.45 * R(i + 81), 2, 2); }
  } else {
    x.fillStyle = '#070607'; x.fillRect(0, 0, W, H);
    const q = x.createRadialGradient(540, 820, 60, 540, 900, 1250); q.addColorStop(0, 'rgba(110,70,40,.38)'); q.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = q; x.fillRect(0, 0, W, H);
  }
}
const pillHalf = (str, size) => { setF(g, '600 ' + size + 'px Body', -size * 0.02); return (g.measureText(str).width + size * 1.05) / 2; };
function label(x, p3, dx, dy, str, k, o = {}) {
  if (k <= 0) return; const [ax, ay, vis] = project(p3); if (!vis) return;
  const hw = pillHalf(str, o.size || 40), ex = clamp(ax + dx, 30 + (dx < 0 ? 2 * hw : dx ? 0 : hw), W - 30 - (dx > 0 ? 2 * hw : dx ? 0 : hw)), ey = ay + dy, kk2 = clamp(k);
  x.save(); x.strokeStyle = o.col || WHT; x.lineWidth = 3.5; x.lineCap = 'round'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 10;
  x.beginPath(); x.arc(ax, ay, 9 * back(kk2 / 0.4), 0, TAU); x.stroke();
  const lk = ease((kk2 - 0.15) / 0.45); x.beginPath(); x.moveTo(ax + (dx ? Math.sign(dx) * 9 : 0), ay + (dx ? 0 : Math.sign(dy) * 9)); x.lineTo(lerp(ax, ex, lk), lerp(ay, ey, lk)); x.stroke();
  x.restore();
  pill(x, str, ex + (dx > 0 ? 1 : dx < 0 ? -1 : 0) * hw, ey + (dx === 0 ? Math.sign(dy) * 36 : 0), o.size || 40, !!o.dark, (kk2 - 0.35) / 0.4, { f: 'Body', w: 600, ...(o.bg ? { bg: o.bg, fg: o.fg } : {}) });
}
function smallPrint(x, str, a) {
  if (a <= 0 || !str) return; x.save();
  const bq = x.createLinearGradient(0, 1700, 0, 1920); bq.addColorStop(0, 'rgba(0,0,0,0)'); bq.addColorStop(1, 'rgba(0,0,0,.7)'); x.globalAlpha = a; x.fillStyle = bq; x.fillRect(0, 1700, W, 220);
  x.globalAlpha = a * 0.8; setF(x, '500 25px Body', 0); x.fillStyle = '#B4B4B9'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function bigNumber(x, t, t0, t1, tEnd, to, fmt, unit, Y = 1420) {   // a counter that runs up and lands
  const a = win(t, t0 - 0.02, tEnd, 0.12, 0.15); if (a <= 0) return;
  const n = to * eio(clamp((t - t0) / (t1 - t0))), land = t >= t1, s0 = land ? 1 + 0.22 * Math.exp(-(t - t1) / 0.09) : 1;
  x.save(); x.globalAlpha = a; x.translate(540, Y); x.scale(s0, s0); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 40;
  const str = fmt(n); setF(x, '800 210px Logo', -8); const fsz = Math.min(210, 210 * 900 / x.measureText(fmt(to)).width); setF(x, '800 ' + fsz + 'px Logo', -8); x.fillStyle = WHT; const tw = x.measureText(str).width;
  x.fillText(str, unit ? -50 : 0, 75);
  if (unit) { setF(x, '700 100px Logo', -2); x.fillStyle = land ? GOLD : 'rgba(255,255,255,.75)'; x.textAlign = 'left'; x.fillText(unit, -50 + tw / 2 + 16, 75); }
  x.restore();
}
// "a million dollars": a price tag swings in beside the lump
function priceTag(x, t) {
  const a = win(t, K.million - 0.12, K.whale - 0.06, 0.1, 0.08); if (a <= 0) return;
  const [px, py] = project([PED_L[0] + 0.2, PH_L + 0.55, 0.1]);
  const sw = 0.3 * Math.exp(-(t - K.million) * 3) * Math.sin((t - K.million) * 11);
  x.save(); x.globalAlpha = a; x.translate(Math.min(px + 60, W - 280), py - 380); x.rotate(-0.1 + sw);
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -220); x.lineTo(0, 0); x.stroke();
  x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 30; x.fillStyle = '#F4E3B8';
  x.beginPath(); x.moveTo(-40, 0); x.lineTo(40, 0); x.lineTo(210, 60); x.lineTo(210, 190); x.lineTo(-210, 190); x.lineTo(-210, 60); x.closePath(); x.fill();
  x.shadowBlur = 0; x.fillStyle = '#7A5A1E'; x.beginPath(); x.arc(0, 30, 12, 0, TAU); x.fill();
  setF(x, '800 78px Logo', -3); x.fillStyle = '#1D1D1F'; x.textAlign = 'center'; x.fillText('$1,000,000', 0, 152);
  x.restore();
}
// "And it isn't even vomit": the word, struck out
function notVomit(x, t) {
  const a = win(t, K.isntL - 0.05, K.forms - 0.08, 0.15, 0.12); if (a <= 0) return;
  x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 36;
  setF(x, '900 170px Hook', -4); x.fillStyle = WHT; x.fillText('“VOMIT”', 540, 1450);
  const k = ease((t - K.isnt + 0.05) / 0.25); x.shadowBlur = 0; x.strokeStyle = RED; x.lineWidth = 22; x.lineCap = 'round';
  x.beginPath(); x.moveTo(170, 1395); x.lineTo(170 + 740 * k, 1395 - 30 * k); x.stroke();
  x.restore();
  if (t > K.vomit2 - 0.05) pill(x, 'not vomit at all', 540, 1590, 46, false, (t - K.vomit2 + 0.05) / 0.3, { f: 'Body', w: 700, bg: RED, fg: WHT });
}
// "Fresh, it stinks!": wavy lines rising off the lump, and flies
function stink(x, t) {
  const a = win(t, K.stinksL + 0.05, K.sweetL - 0.02, 0.15, 0.08); if (a <= 0) return;
  const [px, py, vis] = project(HERO.position.toArray()); if (!vis) return;
  x.save(); x.globalAlpha = a; x.lineWidth = 12; x.lineCap = 'round'; x.strokeStyle = '#8BCB3E'; x.shadowColor = 'rgba(40,80,0,.6)'; x.shadowBlur = 18;
  for (let k = -1; k <= 1; k++) {
    x.beginPath();
    for (let j = 0; j <= 20; j++) { const u = j / 20, yy = py - 120 - u * 360 - ((t * 260) % 90), xx = px + k * 150 + Math.sin(u * 9 + t * 8 + k) * 34; j ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
    x.globalAlpha = a * 0.85; x.stroke();
  }
  x.shadowBlur = 0; x.fillStyle = '#111';
  for (let i = 0; i < 5; i++) { const ph = t * (5 + i) + i * 2; x.beginPath(); x.arc(px + Math.cos(ph) * (150 + 30 * i), py - 160 + Math.sin(ph * 1.3) * 110, 7, 0, TAU); x.fill(); }
  x.restore();
}
// cash raining for $1.5 million
function bills(x, t) {
  const u = t - K.million2; if (u < -0.05 || t > K.last) return;
  x.save();
  for (let i = 0; i < 26; i++) {
    const t0 = R(i + 1200) * 0.35, uu = u - t0; if (uu < 0) continue;
    const X0 = 60 + 960 * R(i + 1201), Y0 = -120 + uu * (520 + 300 * R(i + 1202)), rot = uu * (2 + 3 * R(i + 1203)) + i;
    x.save(); x.translate(X0 + Math.sin(uu * 4 + i) * 40, Y0); x.rotate(rot); x.scale(1, Math.cos(uu * 6 + i)); x.globalAlpha = 0.9 * win(t, K.million2, K.last - 0.05, 0.05, 0.2);
    rrx(x, -70, -32, 140, 64, 6); x.fillStyle = '#7DBF7A'; x.fill(); x.strokeStyle = '#3E7A3B'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#3E7A3B'; setF(x, '800 30px Logo', 0); x.textAlign = 'center'; x.fillText('$', 0, 11); x.restore();
  }
  x.restore();
}
function flash(x, t, t0, a = 0.85, d = 0.2) { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = 'rgba(255,248,235,' + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }

// ---------- the 3D shot ----------
function three(x, t) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, K.million, 12) + jolt(t, K.stinks, 14) + jolt(t, K.kilos, 16) + jolt(t, K.million2, 18) + jolt(t, K.lumpW, 8);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  // bubbles: the whale "burps" on "vomit"
  const bu = t - K.vomit;
  if (placeOf(t) === 'under' && bu > -0.05 && bu < 1.2) {
    for (let i = 0; i < 26; i++) {
      const t0 = R(i + 1300) * 0.25, uu = bu - t0; if (uu < 0) continue;
      const p = WP(-1.0 - 2.6 * R(i + 1301), -1.3 + uu * (1.6 + 1.6 * R(i + 1302)), 0.9 + 0.5 * R(i + 1303));
      const [bx, by, vis] = project(p); if (!vis) continue; const r = (12 + 26 * R(i + 1304)) * (1 + uu * 0.4);
      x.save(); x.globalAlpha = 0.9 * (1 - uu / 1.2); x.drawImage(bubbleTex.image, bx - r, by - r, 2 * r, 2 * r); x.restore();
    }
  }
  // labels
  label(x, WP(-6.3, -0.55, 0.2), 60, -260, 'gut', win(t, K.gut - 0.1, K.around - 0.08, 0.25, 0.12), { bg: BLUE, fg: WHT });
  label(x, LIN, -40, 260, 'squid beaks', win(t, K.squid - 0.12, K.stinksL - 0.05, 0.25, 0.1));
  label(x, LIN, 40, -280, 'ambergris, forming', win(t, K.beaks - 0.05, K.stinksL - 0.05, 0.25, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  label(x, [0, 0.3, 0], 0, -300, 'years at sea', win(t, K.years - 0.1, K.found - 0.05, 0.25, 0.1));
  label(x, CARC.G.localToWorld(v3([-6, 0, 0])).toArray(), 0, -260, 'a dead sperm whale', win(t, K.dead - 0.15, K.sold - 0.05, 0.25, 0.1), { size: 44 });
  label(x, HERO.position.toArray(), -40, 300, 'the lump', win(t, K.lumpW - 0.25, K.they - 0.05, 0.25, 0.1), { size: 46 });
  label(x, [BOT.position.x, BOT.position.y + 0.5, BOT.position.z], 0, -330, 'what it does: makes scent last', win(t, K.does - 0.15, 99, 0.3, 0.1), { bg: GOLD, fg: '#1D1D1F', size: 42 });
  x.restore();
  priceTag(x, t); notVomit(x, t); stink(x, t);
  bigNumber(x, t, K.n127, K.kilos, K.inside - 0.08, 127, (n) => String(Math.round(n)), 'kg');
  bigNumber(x, t, K.one, K.million2, K.last - 0.06, 1500000, (n) => '$' + Math.round(n).toLocaleString('en-US'), null, 1440);
  bills(x, t);
  if (t >= K.lastW - 0.1 && t < K.lump) pill(x, 'lasts longer', 540, 1500, 54, false, (t - K.longer + 0.1) / 0.3, { f: 'Body', w: 700, bg: GOLD, fg: '#1D1D1F' });
  flash(x, t, K.million, 0.25, 0.1); flash(x, t, K.million2, 0.35, 0.14); flash(x, t, K.sweet, 0.2, 0.25); flash(x, t, K.does, 0.18, 0.2);
  const FP = [[K.perfumeL + 0.4, K.stinksL, 'Ambergris forms in the gut of a few sperm whales in a hundred, round squid beaks; the evidence says it is not vomit (BBC Science Focus).'],
    [K.found, K.last, 'February 2021, 26 km off Aden, Yemen: 127 kg found in a floating sperm whale, sold for more than $1.5 million (Gulf News, The National).'],
    [K.last + 0.2, T0.feed, 'Prized because it makes perfume last longer (The National). Its trade is illegal in some countries, including the US. Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.ocean = three;

// ---------- the switch: our reel in a phone; flicks past ads that sell the lump; it stops on one that sells what it does ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null, DOESIMG = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
function doesImg() {                                 // the good ad: the bottle, lit, scent swirling
  if (!DOESIMG) {
    const [c, x] = mkc(1080, 1920); setWorld(K.does + 0.4); backdrop(x, K.does + 0.4);
    cam.position.set(PED_B[0] + 0.15, 1.62, 1.55); cam.fov = 30; cam.updateProjectionMatrix(); cam.lookAt(PED_B[0], PH_B + 0.4, PED_B[1]);
    R3.render(scene, cam); x.drawImage(glc, 0, 0); DOESIMG = c;
  }
  return DOESIMG;
}
function heart(c, X0, Y, r) { c.beginPath(); c.moveTo(X0, Y + r * 0.9); c.bezierCurveTo(X0 - r * 1.6, Y - r * 0.1, X0 - r * 0.8, Y - r * 1.3, X0, Y - r * 0.45); c.bezierCurveTo(X0 + r * 0.8, Y - r * 1.3, X0 + r * 1.6, Y - r * 0.1, X0, Y + r * 0.9); c.fill(); }
function rail(c, liked) {
  c.save(); c.fillStyle = WHT; c.strokeStyle = WHT; c.lineWidth = 6; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10;
  if (liked > 0) { c.save(); c.fillStyle = RED; c.translate(544, 690); const s0 = 1 + 0.4 * bump(liked, 0, 0.6); c.scale(s0, s0); heart(c, 0, 0, 32); c.restore(); } else heart(c, 544, 690, 32);
  c.beginPath(); c.arc(544, 806, 28, 0.35 * Math.PI, 2.25 * Math.PI); c.lineTo(522, 840); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(514, 902); c.lineTo(576, 880); c.lineTo(554, 942); c.lineTo(543, 914); c.closePath(); c.stroke();
  c.restore();
}
function acct(c, name, sub, letter, col) {
  c.save(); c.textAlign = 'left';
  c.beginPath(); c.arc(60, 1010, 31, 0, TAU); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = WHT; c.stroke();
  setF(c, '700 28px Logo', 0); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText(letter, 60, 1020); c.textAlign = 'left';
  setF(c, '600 33px Body', 0); c.fillText(name, 106, sub ? 1004 : 1022);
  if (sub) { setF(c, '500 27px Body', 0); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(sub, 106, 1040); }
  c.restore();
}
// ads that sell the lump: a product on a plain background and its specs
function productShape(c, kind) {
  c.save(); c.translate(300, 470); c.fillStyle = '#9EA2A8'; c.strokeStyle = '#7E8288'; c.lineWidth = 4;
  if (kind === 0) { rrx(c, -80, -150, 160, 260, 26); c.fill(); rrx(c, -28, -190, 56, 46, 8); c.fill(); }
  else if (kind === 1) { rrx(c, -130, -110, 260, 220, 14); c.fill(); c.fillStyle = '#B4B8BE'; c.fillRect(-130, -20, 260, 30); }
  else { rrx(c, -70, -160, 140, 300, 60); c.fill(); c.fillStyle = '#B4B8BE'; rrx(c, -70, -40, 140, 70, 4); c.fill(); }
  c.restore();
}
const REELS = [
  { kind: 'ours' },
  { kind: 'lump', shape: 0, lines: ['NEW FORMULA.', '100 ML.'], name: 'brand_a' },
  { kind: 'lump', shape: 1, lines: ['12 INGREDIENTS.', 'NOW IN GREY.'], name: 'brand_b' },
  { kind: 'lump', shape: 2, lines: ['PREMIUM.', '3 SIZES.'], name: 'brand_c' },
  { kind: 'does', name: 'yourbrand' },
];
function reelPage(c, r, t) {                         // one full-screen reel, 600 x 1280
  if (r.kind === 'ours') c.drawImage(frozen(), -60, 0, 720, 1280);
  else if (r.kind === 'does') {
    c.drawImage(doesImg(), -60, 0, 720, 1280);
    c.save(); c.textAlign = 'center'; c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 24; c.fillStyle = WHT; setF(c, '800 56px Logo', -1);
    c.fillText('Still smells amazing', 300, 250); c.fillText('at midnight.', 300, 316); c.restore();
  } else {
    c.fillStyle = '#ECECEF'; c.fillRect(0, 0, 600, 1280); productShape(c, r.shape);
    c.save(); c.textAlign = 'center'; c.fillStyle = '#3A3A3C'; r.lines.forEach((l, i) => { setF(c, '900 60px Hook', -1); c.fillText(l, 300, 760 + i * 70); }); c.restore();
  }
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 760, 600, 520);
  rail(c, r.kind === 'does' ? t - K.does2 : -1);
  if (r.kind === 'ours') acct(c, 'mezmedia_0', null, 'm.', '#111');
  else acct(c, r.name, 'Sponsored', r.name[0].toUpperCase(), r.kind === 'does' ? '#2F80FF' : '#8E8E93');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left';
  c.fillText(r.kind === 'ours' ? 'Why pay a million dollars for whale vomit?…' : r.kind === 'does' ? 'Spray once in the morning. That’s it. ›' : 'Our product. It has features. ›', 30, 1090);
  if (r.kind !== 'ours') { rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.textAlign = 'left'; }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.6, 7);
}
const swipeAt = (t) => {                             // four quick flicks; each lump ad is on screen for a moment
  let f = 0;
  for (let i = 0; i < REELS.length - 1; i++) f += eio((t - (K.sell - 0.15 - (REELS.length - 2 - i) * 0.33)) / 0.15);
  return f - 0.03 * bump(t, K.sell + 0.05, 0.3);
};
function feedUI(c, t) {
  const f = swipeAt(t), i0 = Math.floor(f), off = (f - i0) * 1280;
  for (let j = 0; j < 2; j++) { const r = REELS[i0 + j]; if (!r) continue; c.save(); c.translate(0, j * 1280 - off); c.beginPath(); c.rect(0, 0, 600, 1280); c.clip(); reelPage(c, r, t); c.restore(); }
  const lk = t - K.does2;
  if (lk > 0 && lk < 0.9) { c.save(); c.globalAlpha = lk < 0.6 ? 1 : 1 - (lk - 0.6) / 0.3; c.fillStyle = WHT; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.translate(300, 560); const s0 = back(clamp(lk / 0.25)) * (1 + 0.15 * clamp((lk - 0.4) / 0.5)); c.scale(s0, s0); heart(c, 0, 0, 110); c.restore(); }
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
};

// ---------- the pitch ----------
const PITCH = [[['We scale businesses', WHT, 's1'], ['with ads like this.', GREY, 's2']],
  [['DM us the word', WHT, 'd1'], ['teardown', null, 'd2'], ['for a free ad review.', GREY, 'd3']]];
function pitchLines(x, t, lines, Y0) {
  setF(x, '600 130px Logo', -4); const fs = 130 * Math.min(1, 830 / Math.max(...lines.map(([str]) => x.measureText(str).width)));
  lines.forEach(([str, col, k], i) => {
    const Y = Y0 + i * fs * 1.2, k2 = (t - K[k] + 0.04) / 0.38, f = '600 ' + fs + 'px Logo';
    if (!col && k2 > 0) { setF(x, f, -fs * 0.03); const w = x.measureText(str).width + fs * 0.5; x.fillStyle = WHT; x.fillRect(540 - w / 2, Y - fs * 0.84, w * expo(k2 / 0.6), fs * 1.1); }
    rise(x, str, 540, Y, f, col || INK, k2, -fs * 0.03);
  });
}
S.pitch = (x, t) => {
  stage(x, true);
  x.save(); zoomAt(x, 540, 900, 1 + 0.03 * clamp((t - T0.pitch) / 4));
  const ka = ease((t - K.d1 + 0.18) / 0.2);
  if (ka < 1) { x.save(); x.globalAlpha = 1 - ka; x.translate(0, -120 * ka); pitchLines(x, t, PITCH[0], 860); x.restore(); }
  pitchLines(x, t, PITCH[1], 780);
  x.restore();
  pill(x, '@mezmedia_0', 540, 1300, 40, false, (t - K.handle) / 0.3, { f: 'Body', w: 600 });
};

// ---------- captions at the top: the phrase builds word by word (the Face ID reel's) ----------
function selBox(x, X0, Y0, w, h, k) {
  if (k <= 0) return; x.save(); x.globalAlpha *= k; x.strokeStyle = BLUE; x.lineWidth = 4; x.strokeRect(X0, Y0, w, h);
  [[X0, Y0], [X0 + w, Y0 + h]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 10, 0, TAU); x.fillStyle = WHT; x.fill(); x.lineWidth = 4; x.stroke(); });
  x.restore();
}
const CAPY = 250, CAPS = 76;
window.captions = (t) => {
  const c = CH.find((q) => t >= q.s && t < q.e); if (!c) return;
  const top = t >= T0.feed ? 1215 : CAPY;
  const fade = clamp((c.e - t) / 0.12) * clamp((t - c.s + 1 / FPS) / 0.06) * (t >= T0.feed && t < T0.pitch ? clamp((t - T0.feed - 0.32) / 0.15) : 1);
  g.save(); g.globalAlpha = fade * 0.55; const wq = g.createLinearGradient(0, top - 190, 0, top + 230); wq.addColorStop(0, 'rgba(0,0,0,0)'); wq.addColorStop(0.45, 'rgba(0,0,0,1)'); wq.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = wq; g.fillRect(0, top - 190, W, 420); g.restore();
  g.save(); g.textBaseline = 'alphabetic'; setF(g, '800 ' + CAPS + 'px Logo', -CAPS * 0.03);
  const sp = g.measureText(' ').width + 6;
  const said = c.rows.flat().filter((w) => w.s <= t + 1 / FPS), cur = said[said.length - 1];
  c.rows.forEach((row, ri) => {
    const ws = row.map((w) => g.measureText(w.w.replace(/'/g, '’')).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (row.length - 1);
    let X0 = 540 - tw / 2; const Y = top + ri * CAPS * 1.18;
    row.forEach((w, i) => {
      const str = w.w.replace(/'/g, '’'), k = clamp((t + 1 / FPS - w.s) / 0.08);
      if (k > 0) {
        g.globalAlpha = fade * k;
        if (w.hl) { const bx = X0 - 12, by = Y - CAPS * 0.86, bw = ws[i] + 24, bh = CAPS * 1.12;
          g.save(); g.fillStyle = 'rgba(47,128,255,.18)'; g.fillRect(bx, by, bw * expo(k), bh); g.restore(); selBox(g, bx, by, bw, bh, clamp(k * 2) * fade); }
        g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 18; g.fillStyle = w === cur || w.hl ? WHT : 'rgba(255,255,255,.5)';
        g.save(); const sc = 1.12 - 0.12 * back(k); g.translate(X0 + ws[i] / 2, Y - CAPS * 0.3); g.scale(sc, sc); g.translate(-(X0 + ws[i] / 2), -(Y - CAPS * 0.3));
        g.textAlign = 'left'; g.fillText(str, X0, Y); g.restore(); g.shadowBlur = 0;
      }
      X0 += ws[i] + sp;
    });
  });
  g.restore();
};
window.overlay = null;
