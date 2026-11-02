// Browser-side scene for reel_cup.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, mixc, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// A street (1 unit = 1 m): a hatchback on fire at night, then its burnt shell at dawn with a tumbler untouched in the
// cupholder; a cutaway of the cup with ice still inside (y = 100); in the morning a new SUV with a red bow rolls in.

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
const RN = (n) => { let h = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };   // hashed: no lines in the noise
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = RN(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * RN(seed * 100000 + i + 7)})`; x.fillRect(RN(seed * 100000 + i + 3) * w, RN(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};

// ---------- a street at night: asphalt, a kerb, a streetlight; later the morning ----------
const SITE = new X.Group(); scene.add(SITE);
const WINM = new X.MeshBasicMaterial({ color: '#FFD9A0' });
const asphTex = (() => {
  const [c, x] = noiseCanvas(512, 512, '#2E2F31', 0.16, 26000, 61);
  for (let i = 0; i < 10; i++) { x.fillStyle = `rgba(10,10,10,${0.1 + 0.15 * RN(i + 620)})`; x.beginPath(); x.ellipse(512 * RN(i + 621), 512 * RN(i + 622), 30 + 70 * RN(i + 623), 15 + 40 * RN(i + 624), RN(i + 625) * 3, 0, TAU); x.fill(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(12, 12); return t0;
})();
const GROUND = new X.Mesh(new X.PlaneGeometry(80, 80), MAT('#FFFFFF', { map: asphTex, r: 0.9, env: 0.3 })); GROUND.rotation.x = -Math.PI / 2; SITE.add(GROUND);
{
  const kerb = new X.Mesh(new X.BoxGeometry(40, 0.14, 0.3), MAT('#9A9C9E', { r: 0.8 })); kerb.position.set(0, 0.07, -2.0); SITE.add(kerb);
  const walk = new X.Mesh(new X.BoxGeometry(40, 0.12, 2.5), MAT('#7C7E80', { r: 0.85 })); walk.position.set(0, 0.06, -3.4); SITE.add(walk);
  for (let i = -3; i <= 3; i++) { const line = new X.Mesh(new X.PlaneGeometry(1.6, 0.12), new X.MeshStandardMaterial({ color: '#D8D2B8', roughness: 0.8 })); line.rotation.x = -Math.PI / 2; line.position.set(i * 3.4, 0.005, 2.6); SITE.add(line); }
  const pole = new X.Mesh(new X.CylinderGeometry(0.07, 0.09, 5.2, 12), MAT('#3A3C40', { m: 0.6, r: 0.4 })); pole.position.set(-3.2, 2.6, -2.6); SITE.add(pole);
  const arm = new X.Mesh(new X.BoxGeometry(1.3, 0.08, 0.1), MAT('#3A3C40', { m: 0.6, r: 0.4 })); arm.position.set(-2.6, 5.15, -2.6); SITE.add(arm);
  const lampH = new X.Mesh(new X.BoxGeometry(0.5, 0.12, 0.26), new X.MeshBasicMaterial({ color: '#FFE6B0' })); lampH.position.set(-2.0, 5.08, -2.6); SITE.add(lampH);
  // houses with pitched roofs and lit windows; trees between them
  [[-9.5, -9, 4.0, '#3B3F4A'], [-3.8, -10, 3.4, '#4A4038'], [2.6, -9.5, 4.4, '#3A4450'], [8.6, -10, 3.6, '#46423C']].forEach(([a, b, h0, col]) => {
    const hs = new X.Mesh(new X.BoxGeometry(4.6, h0, 4), MAT(col, { r: 0.9 })); hs.position.set(a, h0 / 2, b); SITE.add(hs);
    const tri = new X.Shape(); tri.moveTo(-2.65, 0); tri.lineTo(2.65, 0); tri.lineTo(0, 1.5); tri.lineTo(-2.65, 0);
    const roof = new X.Mesh(new X.ExtrudeGeometry(tri, { depth: 4.4, bevelEnabled: false }), MAT('#24262B', { r: 0.8 })); roof.position.set(a, h0, b - 2.2); SITE.add(roof);
    for (let k = 0; k < 2; k++) { const w0 = new X.Mesh(new X.PlaneGeometry(0.8, 1.0), WINM); w0.position.set(a - 1.2 + k * 2.4, h0 * 0.62, b + 2.01); SITE.add(w0); }
    const door = new X.Mesh(new X.PlaneGeometry(0.9, 1.9), MAT('#2A211C', { r: 0.7 })); door.position.set(a, 0.95, b + 2.01); SITE.add(door);
  });
  [[-6.6, -6.0], [-0.4, -6.4], [5.8, -6.2], [12, -6.0]].forEach(([a, b], j) => {
    const tr = new X.Mesh(new X.CylinderGeometry(0.12, 0.16, 2.2, 10), MAT('#4A3A2C', { r: 0.9 })); tr.position.set(a, 1.1, b); SITE.add(tr);
    const fo = new X.Mesh(new X.IcosahedronGeometry(1.3, 1), MAT(['#2F5A34', '#3A6A3A'][j % 2], { r: 0.9 })); fo.position.set(a, 2.9, b); fo.scale.set(1, 1.15, 1); SITE.add(fo);
  });
}
const STREET = new X.PointLight('#FFD9A0', 14, 12, 1.4); STREET.position.set(-2.0, 4.9, -2.6); SITE.add(STREET);
// ---------- the car: a hatchback with its glass gone; painted while it burns, a grey-rust shell by dawn ----------
const charTex = (() => {
  const [c, x] = noiseCanvas(512, 512, '#1B1714', 0.2, 30000, 63);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${RN(i + 640) < 0.5 ? '70,58,48' : '10,8,6'},${0.3 + 0.5 * RN(i + 641)})`; x.beginPath(); x.arc(512 * RN(i + 642), 512 * RN(i + 643), 2 + 14 * RN(i + 644), 0, TAU); x.fill(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(3, 3); return t0;
})();
const emberTex = (() => { const [c, x] = mkc(512, 512); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 420; i++) { x.fillStyle = `rgba(255,${80 + 100 * RN(i + 660)},20,${0.4 + 0.6 * RN(i + 661)})`; x.beginPath(); x.arc(512 * RN(i + 662), 512 * RN(i + 663), 1 + 3 * RN(i + 664), 0, TAU); x.fill(); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(3, 3); return t0; })();
const charM = new X.MeshStandardMaterial({ color: '#FFFFFF', map: charTex, roughness: 0.95, metalness: 0.1, emissive: '#FF6A1A', emissiveMap: emberTex, emissiveIntensity: 0.0, side: X.DoubleSide });
const burntTex = (() => {
  const [c, x] = noiseCanvas(512, 512, '#4D4642', 0.16, 40000, 67);
  x.filter = 'blur(10px)';
  for (let i = 0; i < 70; i++) { const r0 = RN(i + 940); x.fillStyle = r0 < 0.5 ? `rgba(120,58,24,${0.12 + 0.2 * RN(i + 941)})` : r0 < 0.8 ? `rgba(16,13,12,${0.15 + 0.25 * RN(i + 941)})` : `rgba(170,164,156,${0.08 + 0.12 * RN(i + 941)})`; x.beginPath(); x.ellipse(512 * RN(i + 942), 512 * RN(i + 943), 20 + 60 * RN(i + 944), 10 + 30 * RN(i + 945), RN(i + 946) * 3, 0, TAU); x.fill(); }
  x.filter = 'none';
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${RN(i + 1500) < 0.5 ? '150,80,40' : '200,196,190'},${0.08 + 0.18 * RN(i + 1501)})`; x.fillRect(512 * RN(i + 1502), 512 * RN(i + 1503), 1 + 2 * RN(i + 1504), 1 + 2 * RN(i + 1505)); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(0.9, 0.9); return t0;
})();
const burntM = new X.MeshStandardMaterial({ color: '#FFFFFF', map: burntTex, roughness: 0.92, metalness: 0.25, envMapIntensity: 0.6, side: X.DoubleSide });
const paintM = new X.MeshPhysicalMaterial({ color: '#2B4270', metalness: 0.5, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 0.35, side: X.DoubleSide });
const CAR = new X.Group(); CAR.position.set(0, 0, 0.4); SITE.add(CAR);
const BODY = [], TRIM = [], WHEELS = [];
const rimM = MAT('#9EA3A8', { m: 0.9, r: 0.3 });
let CUP;
{
  // the side: one panel with wheel arches and two window openings, both sides
  const sideShape = () => {
    const s = new X.Shape(); s.moveTo(-2.1, 0.34); s.lineTo(-1.76, 0.34); s.absarc(-1.35, 0.36, 0.41, Math.PI, 0, true); s.lineTo(0.94, 0.34); s.absarc(1.35, 0.36, 0.41, Math.PI, 0, true);
    [[2.05, 0.34], [2.16, 0.6], [2.08, 0.86], [0.95, 1.0], [0.28, 1.44], [-1.5, 1.48], [-2.02, 1.12], [-2.12, 0.62], [-2.1, 0.34]].forEach(([a, b]) => s.lineTo(a, b));
    [[[0.78, 1.05], [0.31, 1.37], [-0.42, 1.39], [-0.42, 1.06]], [[-0.56, 1.06], [-0.56, 1.39], [-1.45, 1.41], [-1.84, 1.1]]].forEach((pts) => { const h0 = new X.Path(); pts.forEach(([a, b], i) => (i ? h0.lineTo(a, b) : h0.moveTo(a, b))); h0.closePath(); s.holes.push(h0); });
    return s;
  };
  [0.86, -0.91].forEach((z0) => { const sd = new X.Mesh(new X.ExtrudeGeometry(sideShape(), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 16 }), paintM); sd.position.z = z0; CAR.add(sd); BODY.push(sd); });
  const slab = (w, h, d, p, rz = 0, m = paintM, body = true) => { const s0 = new X.Mesh(new X.BoxGeometry(w, h, d), m); s0.position.set(...p); s0.rotation.z = rz; CAR.add(s0); if (body) BODY.push(s0); return s0; };
  slab(1.16, 0.05, 1.8, [1.515, 0.93, 0], -0.123);          // hood
  slab(0.08, 0.5, 1.8, [2.11, 0.6, 0]);                      // nose
  slab(1.82, 0.05, 1.84, [-0.61, 1.465, 0], -0.022);         // roof
  slab(0.07, 0.8, 1.8, [-2.09, 0.73, 0], 0.06);              // tailgate under the (gone) rear window
  slab(4.1, 0.05, 1.76, [0, 0.36, 0], 0, charM, false);      // floor
  const trim = (w, h, d, p, m) => { const s0 = new X.Mesh(new X.BoxGeometry(w, h, d), m); s0.position.set(...p); s0.userData.night = m; CAR.add(s0); TRIM.push(s0); return s0; };
  const bump0 = MAT('#17181B', { r: 0.6 });
  trim(0.14, 0.17, 1.84, [2.13, 0.42, 0], bump0); trim(0.14, 0.17, 1.84, [-2.14, 0.44, 0], bump0);
  [0.6, -0.6].forEach((z0) => { trim(0.05, 0.1, 0.36, [2.13, 0.78, z0], MAT('#E8ECF0', { m: 0.3, r: 0.15 })); trim(0.05, 0.15, 0.26, [-2.13, 0.95, z0 * 1.12], MAT('#B0141C', { r: 0.3 })); });
  // wheels
  [[-1.35, 0.78], [1.35, 0.78], [-1.35, -0.78], [1.35, -0.78]].forEach(([a, b]) => {
    const W0 = new X.Group(); W0.position.set(a, 0.34, b); CAR.add(W0); WHEELS.push(W0);
    const ty = new X.Mesh(new X.CylinderGeometry(0.33, 0.33, 0.22, 28), MAT('#121212', { r: 0.85 })); ty.rotation.x = Math.PI / 2; W0.add(ty);
    const rm = new X.Mesh(new X.CylinderGeometry(0.2, 0.2, 0.23, 20), rimM); rm.rotation.x = Math.PI / 2; W0.add(rm);
  });
  // the cabin: seats, a console with the cupholder, the dash, the wheel
  [[-0.62, 0.42], [-0.62, -0.42]].forEach(([a, b]) => { slab(0.5, 0.16, 0.48, [a, 0.6, b], 0, charM, false); slab(0.12, 0.62, 0.48, [a - 0.3, 0.92, b], 0.22, charM, false); });
  slab(0.5, 0.16, 1.5, [-1.45, 0.6, 0], 0, charM, false); slab(0.12, 0.58, 1.5, [-1.74, 0.9, 0], 0.2, charM, false);
  slab(0.78, 0.36, 0.24, [-0.1, 0.59, 0], 0, charM, false);   // the console; its top at y 0.77
  slab(0.42, 0.3, 1.66, [0.62, 0.9, 0], 0, charM, false);     // the dash
  const ring = new X.Mesh(new X.TorusGeometry(0.056, 0.011, 8, 32), MAT('#2A2622', { r: 0.7, m: 0.4 })); ring.rotation.x = Math.PI / 2; ring.position.set(-0.05, 0.775, 0); CAR.add(ring);
  const wheel = new X.Mesh(new X.TorusGeometry(0.17, 0.025, 8, 24), charM); wheel.rotation.order = 'ZYX'; wheel.rotation.set(0, -Math.PI / 2, -0.45); wheel.position.set(0.36, 1.02, 0.42); CAR.add(wheel);
}
// the cup: a tall tumbler (narrow foot for the cupholder), a handle, a lid and a straw
const CUPPROF = [[0, 0], [0.034, 0], [0.037, 0.008], [0.038, 0.1], [0.044, 0.112], [0.049, 0.28], [0.051, 0.3], [0, 0.3]];
const cupM = MAT('#E7A2B4', { m: 0.35, r: 0.38, env: 1.1 }), lidM = MAT('#EFB6C4', { m: 0.2, r: 0.4 }), strawM = MAT('#F2C6D1', { r: 0.45 });
function makeCup() {
  const G = new X.Group();
  G.add(new X.Mesh(new X.LatheGeometry(CUPPROF.map(([a, b]) => new X.Vector2(a, b)), 48), cupM));
  const lid = new X.Mesh(new X.CylinderGeometry(0.0525, 0.0525, 0.022, 48), lidM); lid.position.y = 0.311; G.add(lid);
  const top = new X.Mesh(new X.CylinderGeometry(0.044, 0.05, 0.012, 48), lidM); top.position.y = 0.328; G.add(top);
  const straw = new X.Mesh(new X.CylinderGeometry(0.0055, 0.0055, 0.17, 12), strawM); straw.position.set(0.012, 0.37, 0); straw.rotation.z = -0.1; G.add(straw);
  const hc = new X.Curve(); hc.getPoint = (u) => v3([0.049 + 0.042 * Math.pow(Math.sin(Math.PI * u), 0.45), 0.282 - 0.14 * u, 0]);
  G.add(new X.Mesh(new X.TubeGeometry(hc, 36, 0.0095, 10, false), cupM));
  return G;
}
CUP = makeCup(); CUP.position.set(-0.05, 0.70, 0.0); CAR.add(CUP);
const CUPGLOW = new X.PointLight('#FFF1DC', 0, 1.6, 1.5); CUPGLOW.position.set(0.15, 1.2, 0.55); CAR.add(CUPGLOW);
// ---------- fire: tongues of flame out of every opening, smoke, embers ----------
const flameTex = [0, 1, 2].map((v) => {
  const [c, x] = mkc(128, 256); x.filter = 'blur(4px)';
  const q = x.createLinearGradient(0, 248, 0, 8); q.addColorStop(0, 'rgba(255,250,225,1)'); q.addColorStop(0.3, 'rgba(255,214,110,.95)'); q.addColorStop(0.65, 'rgba(255,128,36,.75)'); q.addColorStop(1, 'rgba(230,60,10,0)');
  const w0 = 36 + 6 * v, tx = 64 + [0, -18, 15][v];
  x.fillStyle = q; x.beginPath(); x.moveTo(64, 244); x.bezierCurveTo(64 - w0 * 1.5, 236, 64 - w0 * 0.9, 118, tx, 10); x.bezierCurveTo(64 + w0 * 0.9, 114, 64 + w0 * 1.5, 236, 64, 244); x.fill();
  return tex(c);
});
const NFL = 190;
const FLAMES = Array.from({ length: NFL }, (_, i) => { const s0 = new X.Sprite(new X.SpriteMaterial({ map: flameTex[i % 3], color: '#FF9A40', transparent: true, opacity: 0.8, blending: X.AdditiveBlending, depthWrite: false, toneMapped: false })); s0.center.set(0.5, 0.06); SITE.add(s0); return s0; });
const CABGLOW = [[-1.2, 1.15, 0.9], [0.2, 1.15, 0.9], [-1.2, 1.15, -0.1], [0.2, 1.15, -0.1], [-0.5, 1.2, 0.4], [0.7, 1.15, 0.4], [1.5, 1.05, 0.4], [-0.5, 1.6, 0.4]].map((p0) => { const s0 = new X.Sprite(glowMat('#FF7A20', 0.5)); s0.material.toneMapped = false; s0.position.set(...p0); SITE.add(s0); return s0; });
const smokeTex = (() => { const [c, x] = mkc(256, 256); for (let i = 0; i < 9; i++) { const cx = 128 + 64 * (RN(i + 960) - 0.5), cy = 128 + 64 * (RN(i + 961) - 0.5), r0 = 46 + 40 * RN(i + 962); const q = x.createRadialGradient(cx, cy, 0, cx, cy, r0); q.addColorStop(0, 'rgba(255,255,255,.5)'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 256, 256); } return tex(c); })();
const SMOKE = Array.from({ length: 44 }, (_, i) => { const s0 = new X.Sprite(new X.SpriteMaterial({ map: smokeTex, color: '#2A2522', transparent: true, opacity: 0.5, depthWrite: false })); s0.material.rotation = RN(i + 970) * TAU; SITE.add(s0); return s0; });
const EMBERS = Array.from({ length: 90 }, () => { const s0 = new X.Sprite(new X.SpriteMaterial({ map: glowTex, color: '#FFB347', transparent: true, blending: X.AdditiveBlending, depthWrite: false, toneMapped: false })); SITE.add(s0); return s0; });
const FIREBALL = Array.from({ length: 14 }, (_, i) => { const s0 = new X.Sprite(new X.SpriteMaterial({ map: flameTex[i % 3], color: '#FFB050', transparent: true, blending: X.AdditiveBlending, depthWrite: false, toneMapped: false })); s0.center.set(0.5, 0.2); SITE.add(s0); return s0; });
const FIRE1 = new X.PointLight('#FF7A1A', 0, 14, 1.3), FIRE2 = new X.PointLight('#FFB347', 0, 9, 1.3), FIRE3 = new X.PointLight('#FF8A30', 0, 7, 1.4);
FIRE1.position.set(-0.4, 1.8, 0.4); FIRE2.position.set(1.5, 1.4, 0.4); FIRE3.position.set(-0.2, 1.25, 2.1); SITE.add(FIRE1, FIRE2, FIRE3);
// ---------- the new car: a taller SUV, pearl white, with a red ribbon and bow ----------
const NEWCAR = new X.Group(); SITE.add(NEWCAR);
const pearl = new X.MeshPhysicalMaterial({ color: '#F2F1EC', metalness: 0.3, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2 });
const glassN = MAT('#141A22', { r: 0.05, m: 0.4, env: 1.6, side: X.DoubleSide }), bowM = MAT('#D7192A', { r: 0.35, m: 0.1, env: 0.8 }), blackM = MAT('#1A1C20', { r: 0.6 });
const HEADM = MAT('#FFFFFF', { e: '#FFF4D8', ei: 1.0, r: 0.1 });
const NWHEELS = [];
{
  const suv = new X.Shape(); suv.moveTo(-2.25, 0.4); suv.lineTo(-1.84, 0.4); suv.absarc(-1.4, 0.42, 0.44, Math.PI, 0, true); suv.lineTo(0.96, 0.4); suv.absarc(1.4, 0.42, 0.44, Math.PI, 0, true);
  [[2.2, 0.4], [2.3, 0.74], [2.22, 1.06], [1.05, 1.2], [0.45, 1.7], [-1.75, 1.74], [-2.22, 1.44], [-2.3, 0.74], [-2.25, 0.4]].forEach(([a, b]) => suv.lineTo(a, b));
  const body = new X.Mesh(new X.ExtrudeGeometry(suv, { depth: 1.84, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 20 }), pearl); body.position.z = -0.92; NEWCAR.add(body);
  [[[0.93, 1.23], [0.46, 1.63], [-0.52, 1.66], [-0.52, 1.24]], [[-0.66, 1.24], [-0.66, 1.66], [-1.7, 1.69], [-2.08, 1.45], [-2.1, 1.25]]].forEach((pts) => {
    const s0 = new X.Shape(); pts.forEach(([a, b], i) => (i ? s0.lineTo(a, b) : s0.moveTo(a, b)));
    [0.986, -0.986].forEach((z0) => { const w0 = new X.Mesh(new X.ShapeGeometry(s0), glassN); w0.position.z = z0; NEWCAR.add(w0); });
  });
  const quad = (pts, m) => { const gq = new X.BufferGeometry(); gq.setAttribute('position', new X.Float32BufferAttribute(pts.flat(), 3)); gq.setIndex([0, 1, 2, 0, 2, 3]); gq.computeVertexNormals(); const q0 = new X.Mesh(gq, m); NEWCAR.add(q0); return q0; };
  quad([[1.083, 1.24, 0.86], [1.083, 1.24, -0.86], [0.483, 1.74, -0.86], [0.483, 1.74, 0.86]], glassN);
  quad([[-1.778, 1.784, 0.82], [-1.778, 1.784, -0.82], [-2.248, 1.484, -0.82], [-2.248, 1.484, 0.82]], glassN);
  const part = (w, h, d, p, m) => { const s0 = new X.Mesh(new X.BoxGeometry(w, h, d), m); s0.position.set(...p); NEWCAR.add(s0); return s0; };
  [0.62, -0.62].forEach((z0) => { part(0.06, 0.12, 0.5, [2.3, 0.98, z0 * 1.06], HEADM); part(0.05, 0.16, 0.3, [-2.3, 1.08, z0 * 1.12], MAT('#C0141C', { e: '#FF2020', ei: 0.3, r: 0.3 })); part(0.18, 0.11, 0.12, [0.92, 1.27, z0 > 0 ? 1.06 : -1.06], pearl); part(2.0, 0.04, 0.05, [-0.65, 1.84, z0 * 1.16], blackM); });
  part(0.04, 0.32, 1.08, [2.33, 0.68, 0], MAT('#C9CDD2', { m: 1, r: 0.2 })); part(0.05, 0.26, 1.0, [2.345, 0.68, 0], blackM); part(0.02, 0.12, 0.5, [2.37, 0.47, 0], MAT('#F4F4F2', { r: 0.4 })); part(0.1, 0.12, 1.9, [2.31, 0.47, 0], blackM); part(0.1, 0.12, 1.9, [-2.28, 0.5, 0], blackM);
  [[-1.4, 0.86], [1.4, 0.86], [-1.4, -0.86], [1.4, -0.86]].forEach(([a, b]) => {
    const W0 = new X.Group(); W0.position.set(a, 0.38, b); NEWCAR.add(W0); NWHEELS.push(W0);
    const ty = new X.Mesh(new X.CylinderGeometry(0.37, 0.37, 0.26, 32), MAT('#121214', { r: 0.8 })); ty.rotation.x = Math.PI / 2; W0.add(ty);
    const rm = new X.Mesh(new X.CylinderGeometry(0.24, 0.24, 0.27, 6), MAT('#C9CDD2', { m: 1, r: 0.25 })); rm.rotation.x = Math.PI / 2; W0.add(rm);
    const hub = new X.Mesh(new X.CylinderGeometry(0.07, 0.07, 0.28, 16), MAT('#7A7E84', { m: 1, r: 0.3 })); hub.rotation.x = Math.PI / 2; W0.add(hub);
  });
  // the ribbon over the roof and down the sides, and the bow
  part(0.18, 0.025, 2.04, [-0.6, 1.765, 0], bowM); [1, -1].forEach((sd) => part(0.18, 1.3, 0.02, [-0.6, 1.11, sd * 1.0], bowM));
  // the bow: four ribbon loops (open bands) round a knot, two tails down the roof
  const bowD = MAT('#D7192A', { r: 0.35, m: 0.1, env: 0.8, side: X.DoubleSide }), BOWP = new X.Group(); BOWP.position.set(-0.6, 1.86, 0); NEWCAR.add(BOWP);
  [[1, 0.3, 1.0], [-1, 0.3, 1.0], [1, 0.95, 0.82], [-1, 0.95, 0.82]].forEach(([sd, tilt, sc]) => {
    const piv = new X.Group(); piv.rotation.x = -sd * tilt; BOWP.add(piv);
    const lg = new X.CylinderGeometry(0.2, 0.2, 0.17, 40, 1, true); lg.rotateZ(Math.PI / 2);
    const lp = new X.Mesh(lg, bowD); lp.scale.set(1, 0.5 * sc, 1.2 * sc); lp.position.set(0, 0.02, sd * 0.24 * sc); piv.add(lp);
  });
  [1, -1].forEach((sd) => { const tail = new X.Mesh(new X.BoxGeometry(0.15, 0.012, 0.55), bowD); tail.position.set(0.12, -0.08, sd * 0.24); tail.rotation.set(sd * 0.25, sd * 0.5, 0); BOWP.add(tail); });
  const knot = new X.Mesh(new X.SphereGeometry(0.09, 16, 12), bowM); knot.scale.set(1.1, 0.9, 1.2); BOWP.add(knot);
}
NEWCAR.visible = false;

// ---------- the cutaway: a quarter of the cup cut away, ice still floating inside (y = 100) ----------
const ICESET = new X.Group(); ICESET.position.set(0, 100, 0); ICESET.visible = false; scene.add(ICESET);
const CUBES = [];
const S5 = 5, WEDGE = Math.PI / 4;                     // the cut-out quarter faces the camera (+z)
let WATERTOP;
{
  const OUT = CUPPROF.slice(1, -1), INN = [[0.03, 0.03], [0.033, 0.1], [0.04, 0.115], [0.045, 0.2995]], wl = 0.22;
  const V = (P) => P.map(([a, b]) => new X.Vector2(a * S5, b * S5)), ARC = 2 * Math.PI - 2 * WEDGE;
  const lathe = (P, m) => new X.Mesh(new X.LatheGeometry(V(P), 64, WEDGE, ARC), m);
  ICESET.add(lathe([[0, 0], ...OUT], new X.MeshStandardMaterial({ color: '#E7A2B4', metalness: 0.35, roughness: 0.38, side: X.DoubleSide })));
  ICESET.add(lathe([[0, 0.03], ...INN], new X.MeshStandardMaterial({ color: '#C3C8CE', metalness: 0.9, roughness: 0.28, side: X.DoubleSide })));
  // the two cut faces: in (r, y), turned to the two edges of the cut
  const faces = (poly, m) => [WEDGE, -WEDGE].forEach((ph) => { const sh = new X.Shape(); poly.forEach(([a, b], i) => (i ? sh.lineTo(a * S5, b * S5) : sh.moveTo(a * S5, b * S5)));
    const f = new X.Mesh(new X.ShapeGeometry(sh), m); f.rotation.y = ph - Math.PI / 2; ICESET.add(f); });
  faces([[0, 0], ...OUT, ...INN.slice().reverse(), [0, 0.03]], new X.MeshStandardMaterial({ color: '#D5D9DE', metalness: 0.6, roughness: 0.35, side: X.DoubleSide }));
  const rW = (y) => (y < 0.1 ? 0.03 + 0.003 * (y - 0.03) / 0.07 : y < 0.115 ? 0.033 + 0.007 * (y - 0.1) / 0.015 : 0.04 + 0.005 * (y - 0.115) / 0.185);
  faces([[0, 0.03], [0.03, 0.03], [0.033, 0.1], [0.04, 0.115], [rW(wl), wl], [0, wl]], new X.MeshStandardMaterial({ color: '#8FCDF4', transparent: true, opacity: 0.28, roughness: 0.08, depthWrite: false, side: X.DoubleSide }));
  const wm = new X.MeshStandardMaterial({ color: '#8CCBF2', transparent: true, opacity: 0.3, roughness: 0.08, depthWrite: false, side: X.DoubleSide });
  const wbody = new X.Mesh(new X.CylinderGeometry(rW(wl) * S5, rW(0.115) * S5, (wl - 0.115) * S5, 64, 1, true, WEDGE, ARC), wm); wbody.position.y = (wl + 0.115) / 2 * S5; ICESET.add(wbody);
  WATERTOP = new X.Mesh(new X.CircleGeometry(rW(wl) * S5, 64, -WEDGE, ARC), new X.MeshStandardMaterial({ color: '#CFEFFF', transparent: true, opacity: 0.45, roughness: 0.05, depthWrite: false, side: X.DoubleSide }));
  WATERTOP.rotation.x = -Math.PI / 2; WATERTOP.position.y = wl * S5; ICESET.add(WATERTOP);
  // ice: most cubes floating at the surface, two lower down
  const iceM = () => new X.MeshStandardMaterial({ color: '#EEF9FF', transparent: true, opacity: 0.88, roughness: 0.06, metalness: 0.05, envMapIntensity: 2, emissive: '#A8DCFF', emissiveIntensity: 0.3 });
  [[-0.1, 1.06, -0.06], [0.07, 1.09, -0.05], [0.0, 1.04, -0.17], [-0.15, 0.98, -0.15], [0.14, 1.0, -0.14], [-0.03, 0.9, 0.0], [0.09, 0.82, -0.08], [-0.08, 0.66, -0.1], [0.05, 0.5, -0.06]].forEach((b, i) => {
    const c0 = new X.Mesh(new X.BoxGeometry(0.135, 0.135, 0.135), iceM()); c0.userData.base = v3(b); c0.userData.rot = v3([RN(i + 703) * 3, RN(i + 704) * 3, RN(i + 705) * 3]);
    c0.position.copy(c0.userData.base); c0.rotation.setFromVector3(c0.userData.rot); ICESET.add(c0); CUBES.push(c0);
  });
  // the lid (cut the same way) and the straw down into the water
  const lidC = new X.Mesh(new X.CylinderGeometry(0.0525 * S5, 0.0525 * S5, 0.022 * S5, 64, 1, false, WEDGE, ARC), new X.MeshStandardMaterial({ color: '#EFB6C4', roughness: 0.4, metalness: 0.2, side: X.DoubleSide })); lidC.position.y = 0.311 * S5; ICESET.add(lidC);
  faces([[0, 0.3], [0.0525, 0.3], [0.0525, 0.322], [0, 0.322]], MAT('#E9A9B9', { r: 0.45, side: X.DoubleSide }));
  const strawC = new X.Mesh(new X.CylinderGeometry(0.0055 * S5, 0.0055 * S5, 0.42 * S5, 16), MAT('#F2C6D1', { r: 0.45 })); strawC.position.set(0.05, 0.23 * S5, -0.09); strawC.rotation.z = -0.08; ICESET.add(strawC);
}
const ICEKEY = new X.PointLight('#FFFFFF', 0, 6, 1.2); ICEKEY.position.set(0.7, 101.5, 1.6); scene.add(ICEKEY);
const ICEBACK = new X.Sprite(new X.SpriteMaterial({ map: glowTex, color: '#3F8CFF', transparent: true, opacity: 0.35, blending: X.AdditiveBlending, depthWrite: false, toneMapped: false })); ICEBACK.position.set(0, 100.9, -1.5); ICEBACK.scale.set(3.4, 3.4, 1); scene.add(ICEBACK);
// ---------- the camera: a new set-up on almost every line ----------
scene.updateMatrixWorld(true);
const CUPW = CUP.localToWorld(v3([0, 0.2, 0])).toArray();
const VIEW = {
  fire0: [[4.6, 1.6, 6.6], [0, 1.15, 0.4], 40], fire1: [[3.7, 1.4, 5.3], [0, 1.2, 0.4], 40],
  flame0: [[3.6, 0.5, 3.4], [0.6, 1.25, 0.6], 42], flame1: [[3.3, 0.52, 3.1], [0.5, 1.3, 0.6], 42],
  side0: [[-5.2, 1.3, 3.6], [0.2, 1.3, 0.4], 38], side1: [[-4.7, 1.25, 3.3], [0.3, 1.3, 0.4], 38],
  inside0: [[0.38, 1.1, 0.88], CUPW, 44], inside1: [[0.33, 1.06, 0.8], CUPW, 42],
  blast0: [[3.7, 0.8, -3.7], [0, 1.6, 0.4], 46], blast1: [[3.4, 0.9, -3.3], [0, 1.7, 0.4], 44],
  shell0: [[4.6, 1.6, 6.6], [0, 1.05, 0.4], 40], shell1: [[4.1, 1.5, 5.9], [0, 1.0, 0.4], 40],
  console0: [[0.6, 1.95, 3.0], CUPW, 34], console1: [[0.5, 1.88, 2.75], CUPW, 32],
  hero0: [[0.3, 1.2, 1.12], CUPW, 32], hero1: [[0.24, 1.17, 0.98], CUPW, 30],
  ice0: [[0.15, 101.3, 2.9], [0, 100.85, 0], 36], ice1: [[0.1, 101.2, 2.5], [0, 100.9, 0], 34],
  views0: [[0.3, 1.2, 1.12], CUPW, 32], views1: [[0.27, 1.19, 1.06], CUPW, 31],
  suv0: [[11.0, 1.1, 8.6], [6.2, 1.0, 3.2], 40], suv1: [[10.2, 1.0, 7.9], [5.6, 1.0, 3.2], 40],
  suvb0: [[12.8, 0.8, 5.4], [6.2, 1.05, 3.3], 32], suvb1: [[12.2, 0.82, 5.2], [6.2, 1.07, 3.3], 31],
  bow0: [[6.2, 3.6, 6.6], [4.0, 1.9, 3.2], 34], bow1: [[5.9, 3.3, 6.0], [4.0, 1.9, 3.2], 34],
  keys0: [[22.0, 3.0, 5.2], [2.4, 1.1, 1.6], 26], keys1: [[20.5, 2.9, 5.0], [2.4, 1.1, 1.6], 26],
};
function cutAt(t) { let i = 0; while (i < CUTS.length - 1 && t >= CUTS[i + 1][0]) i++; return i; }
const shotName = (t) => CUTS[cutAt(t)][1].replace(/\d+$/, '');
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  const i = cutAt(t), [t0, a, b] = CUTS[i], t1 = i < CUTS.length - 1 ? CUTS[i + 1][0] : T0.feed;
  const u = clamp((t - t0) / Math.max(0.05, t1 - t0)), k = 0.6 * ease(u) + 0.4 * u, A = VIEW[a], B = VIEW[b];
  return [...lerp3(A[0], B[0], k), ...lerp3(A[1], B[1], k), lerp(A[2], B[2], k)];
}
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }

// ---------- the timeline of the world ----------
function phase(t) { return t < K.shellL ? 'night' : t < K.replyL ? 'dawn' : 'day'; }
// one tongue of flame: which opening it comes out of, where it is in its short life
function flameAt(i, t) {
  const grp = i < 60 ? 0 : i < 85 ? 1 : i < 125 ? 2 : i < 150 ? 3 : 4, life = 0.55 + 0.35 * RN(i * 7 + 1), tt = t / life + RN(i * 7 + 2), n = Math.floor(tt), u = tt - n, r = (k) => RN(i * 131 + n * 17 + k);
  let p, v, sz;
  if (grp === 0) { const sd = r(1) < 0.5 ? 1 : -1, xw = r(2) < 0.55 ? lerp(-0.4, 0.7, r(3)) : lerp(-1.8, -0.6, r(3)); p = [xw, lerp(1.08, 1.3, r(4)), sd * 0.92]; v = [-0.35, 1.7, sd * 0.45]; sz = 0.4 + 0.9 * r(5) * r(6) + 0.3 * r(7); }
  else if (grp === 1) { p = [lerp(0.35, 0.85, r(1)), lerp(1.02, 1.3, r(2)), lerp(-0.7, 0.7, r(3))]; v = [0.15, 1.8, 0]; sz = 0.5 + 0.5 * r(4); }
  else if (grp === 2) { p = [lerp(-1.5, 0.25, r(1)), 1.5, lerp(-0.75, 0.75, r(2))]; v = [-0.45, 2.3, 0]; sz = 0.55 + 1.3 * r(3) * r(4) + 0.3 * r(5); }
  else if (grp === 3) { p = [lerp(1.0, 1.95, r(1)), 0.97, lerp(-0.6, 0.6, r(2))]; v = [-0.15, 1.3, 0]; sz = 0.35 + 0.35 * r(3); }
  else { const s2 = [[-0.62, 0.42], [-0.62, -0.42], [-1.45, 0.35], [-1.45, -0.35], [0.62, 0.3]][Math.floor(r(1) * 5)]; p = [s2[0] + 0.15 * (r(2) - 0.5), 0.72, s2[1] + 0.15 * (r(3) - 0.5)]; v = [0, 1.0, 0]; sz = 0.3 + 0.25 * r(4); }
  const age = u * life, w = 0.06 * Math.sin(t * 9 + i);
  return [p[0] + v[0] * age + w, p[1] + v[1] * age * (1 - 0.3 * u), p[2] + v[2] * age + 0.4, u, sz, grp];
}
const FCOL = [new X.Color('#FFE08A'), new X.Color('#FF8A2A'), new X.Color('#E2401A')], tmpC = new X.Color(), SMK = [new X.Color('#4A2C1E'), new X.Color('#1C1918')];
let SUVX = 15;
function setWorld(t) {
  const name = shotName(t), ph = phase(t), ice = name === 'ice', fire = ph === 'night', dawn = ph === 'dawn';
  const boost = 1 + 1.3 * bump(t, K.fire + 0.04, 0.6), fl = 0.8 + 0.12 * Math.sin(t * 19) + 0.08 * Math.sin(t * 31 + 1), dim = name === 'inside' ? 0.4 : 1;
  SITE.visible = !ice; ICESET.visible = ice; ICEBACK.visible = ice; ICEKEY.intensity = ice ? 7 : 0;
  hemi.intensity = ice ? 0.8 : fire ? 0.16 : dawn ? 0.6 : 1.0; hemi.color.set(dawn ? '#BFD2FF' : '#CFE8FF');
  sun.intensity = ice ? 1.6 : fire ? 0.1 : dawn ? 1.1 : 2.4; sun.color.set(ph === 'day' ? '#FFF0D8' : '#FFC79A');
  if (dawn) sun.position.set(-34, 10, 22); else sun.position.set(-20, 40, 18);
  rim.intensity = fire ? 0.35 : 1.2; STREET.intensity = fire ? 12 : 0;
  WINM.color.set(fire ? '#FFD9A0' : dawn ? '#E8C08A' : '#9DB7D6');
  // the car: paint while it burns, the shell after
  BODY.forEach((m) => { m.material = fire ? paintM : burntM; }); TRIM.forEach((m) => { m.material = fire ? m.userData.night : charM; }); rimM.color.set(fire ? '#9EA3A8' : '#5E5752');
  FIRE1.intensity = fire ? 30 * fl * boost * dim : 0; FIRE2.intensity = fire ? 14 * (1.6 - fl) * dim : 0; FIRE3.intensity = fire ? 9 * fl * boost * dim : 0;
  charM.emissiveIntensity = fire ? 1.3 * fl : dawn ? 0.15 : 0;
  FLAMES.forEach((s0, i) => {
    s0.visible = fire; if (!fire) return;
    const [px, py, pz, u, sz, grp] = flameAt(i, t), core = i % 4 === 0;
    if (name === 'inside' && (grp === 1 || (pz > 0.45 && px > -0.45))) { s0.visible = false; return; }
    const k = sz * boost * (core ? 0.6 : 1) * (0.55 + 1.1 * u) * Math.pow(1 - u * u, 0.8);
    s0.position.set(px, py, pz); s0.scale.set(0.62 * k, k, 1);
    tmpC.copy(FCOL[0]).lerp(FCOL[1], clamp(u * 1.6)).lerp(FCOL[2], clamp((u - 0.5) * 2)); if (core) tmpC.set('#FFF2C8'); s0.material.color.copy(tmpC);
    s0.material.opacity = (core ? 0.9 : 0.7) * sstep(u / 0.12) * Math.pow(1 - u, 1.2);
  });
  CABGLOW.forEach((s0, i) => { s0.visible = fire && name !== 'inside'; s0.material.opacity = 0.42 * boost * (0.75 + 0.25 * Math.sin(t * 17 + i * 2)); s0.scale.setScalar((i === 7 ? 2.6 : 1.5) * (0.9 + 0.1 * Math.sin(t * 11 + i))); });
  FIREBALL.forEach((s0, i) => {
    const u = (t - K.fire + 0.02) / 0.7; s0.visible = fire && u > 0 && u < 1; if (!s0.visible) return;
    const a0 = RN(i + 980) * TAU, r0 = 0.3 + 0.8 * RN(i + 981), k = (1.4 + 1.6 * RN(i + 983)) * (0.5 + u);
    s0.position.set(-0.5 + Math.cos(a0) * r0 * u * 1.4, 1.4 + 2.2 * u + 0.4 * RN(i + 982), 0.4 + Math.sin(a0) * r0 * u); s0.scale.set(0.7 * k, k, 1);
    s0.material.opacity = 0.62 * Math.pow(1 - u, 1.5); s0.material.color.set(u < 0.3 ? '#FFD890' : '#FF7A28');
  });
  SMOKE.forEach((s0, i) => {
    const life = 4 + 1.5 * RN(i + 821), u = (t / life + RN(i + 820)) % 1, on = fire || (dawn && i % 2 === 0); s0.visible = on && !ice; if (!s0.visible) return;
    const x0 = lerp(-1.6, 0.6, RN(i + 822)), z0 = 0.4 + (RN(i + 823) - 0.5) * 1.0;
    if (fire) { s0.position.set(x0 - 1.2 * u, 2.1 + 4.2 * u, z0 + 0.3 * u); s0.scale.setScalar(1.0 + 3.0 * u); s0.material.opacity = 0.6 * sstep(u / 0.15) * (1 - u); s0.material.color.copy(SMK[0]).lerp(SMK[1], clamp(u * 2)); }
    else { s0.position.set(x0 * 0.6 - 0.5 * u, 1.2 + 2.6 * u, z0); s0.scale.setScalar(0.4 + 1.6 * u); s0.material.opacity = 0.28 * sstep(u / 0.2) * (1 - u); s0.material.color.set('#9A9590'); }
  });
  EMBERS.forEach((s0, i) => {
    const life = 1.4 + RN(i + 830), u = (t / life + RN(i + 831)) % 1; s0.visible = fire; if (!fire) return;
    s0.position.set(-1.6 + 3.2 * RN(i + 832) + 0.3 * Math.sin(t * 3 + i) - 0.6 * u, 1.0 + 3.6 * u, 0.4 + (RN(i + 833) - 0.5) * 1.8 + 0.2 * Math.cos(t * 2 + i));
    s0.scale.setScalar(0.04 + 0.03 * RN(i + 834)); s0.material.opacity = (1 - u) * (0.6 + 0.4 * Math.sin(t * 20 + i));
  });
  CUPGLOW.intensity = name === 'console' || name === 'hero' || name === 'views' ? 3.2 : 0;
  // the ice bobs, then rattles on "ice"
  const rat = bump(t, K.ice, 0.35) + 0.6 * bump(t, K.ice + 0.35, 0.3);
  CUBES.forEach((c0, i) => { const b = c0.userData.base, r0 = c0.userData.rot, bob = 0.012 * Math.sin(t * 2.2 + i * 1.3);
    c0.position.set(b.x + 0.03 * rat * Math.sin(t * 60 + i), b.y + bob + 0.025 * rat * Math.abs(Math.sin(t * 47 + i * 2)), b.z);
    c0.rotation.set(r0.x + 0.4 * rat * Math.sin(t * 30 + i) + 0.05 * Math.sin(t * 1.7 + i), r0.y + 0.04 * Math.sin(t * 1.3 + i), r0.z); });
  WATERTOP.position.y = 0.22 * S5 + 0.006 * rat * Math.sin(t * 40);
  // the new SUV rolls in and stops in front of the shell; its lights flash on "replace"
  NEWCAR.visible = ph === 'day'; const kc = ease((t - K.replyL + 0.4) / 1.4); SUVX = lerp(15, 4.6, kc);
  NEWCAR.position.set(SUVX, 0, 3.2); NWHEELS.forEach((w0) => { w0.rotation.z = (15 - SUVX) / 0.37; });
  HEADM.emissiveIntensity = 1.0 + 2.4 * (bump(t, K.replace + 0.1, 0.14) + bump(t, K.replace + 0.34, 0.14));
  const c0 = camAt(t); if (name === 'suv' && !DEBUGCAM) c0[3] = lerp(c0[3], SUVX, 0.75);
  cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.updateProjectionMatrix();
}

// ---------- 2D: backdrop, her video in a phone, confetti ----------
function backdrop(x, t) {
  const n = shotName(t), ph = phase(t), q = x.createLinearGradient(0, 0, 0, H);
  if (n === 'ice') { q.addColorStop(0, '#1B1F2A'); q.addColorStop(1, '#07080C'); }
  else if (ph === 'night') { q.addColorStop(0, '#04050A'); q.addColorStop(0.6, '#140C10'); q.addColorStop(1, '#2A1408'); }
  else if (ph === 'dawn') { q.addColorStop(0, '#6E86AE'); q.addColorStop(0.55, '#C8B8C2'); q.addColorStop(1, '#F2C8A8'); }
  else { q.addColorStop(0, '#5E9BE8'); q.addColorStop(0.6, '#A8CCF2'); q.addColorStop(1, '#E8F2FA'); }
  x.fillStyle = q; x.fillRect(0, 0, W, H);
}
let HEROFR = null;
function heroFrame() { if (!HEROFR) { const [c, x] = mkc(1080, 1920); three(x, K.stanley + 0.5, true); HEROFR = c; } return HEROFR; }
const fmtViews = (n) => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n));
function viewsPhone(x, t) {                           // her video, in a phone, and its views climbing
  if (shotName(t) !== 'views') return;
  const k = ease((t - K.viewsL) / 0.35), sc = 0.62 + 0.04 * clamp((t - K.viewsL) / 2);
  x.save(); x.fillStyle = `rgba(0,0,0,${0.55 * k})`; x.fillRect(0, 0, W, H); x.restore();
  if (!IMG.vidscr) IMG.vidscr = mkc(1200, 2560)[0];
  phone(x, P(540, lerp(1500, 860, k), sc), 'vidscr', { frame: 'frameDark', shadow: 1, over: (c) => {
    c.drawImage(heroFrame(), -60, 0, 720, 1280);
    const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420);
    rail(c, t - K.millions); acct(c, 'a customer', null, 'a', '#8E8E93');
    const v = 6e7 * Math.pow(clamp((t - K.viewsL - 0.2) / 1.5), 1.6), done = t >= K.viewsL + 1.7;
    c.save(); rrx(c, 150, 70, 300, 92, 46); c.fillStyle = 'rgba(0,0,0,.6)'; c.fill(); setF(c, '800 52px Logo', -1); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText((done ? '60M+' : fmtViews(v)) + ' views', 300, 133); c.restore();
  } });
}
function confetti(x, t) {
  const u = t - K.did; if (u < 0 || u > 1.4) return;
  const cols = ['#FF3B30', '#FFCC00', '#34C759', '#2F80FF', '#FF2D55', '#FFFFFF'];
  for (let i = 0; i < 90; i++) {
    const a0 = RN(i + 900) * TAU, sp = 700 + 900 * RN(i + 901), X0 = 540 + Math.cos(a0) * sp * u, Y0 = 820 + Math.sin(a0) * sp * u * 0.7 + 900 * u * u;
    x.save(); x.globalAlpha = clamp(1.4 - u); x.translate(X0, Y0); x.rotate(u * 9 + i); x.fillStyle = cols[i % cols.length]; x.fillRect(-9, -4, 18, 8); x.restore();
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
function flash(x, t, t0, a = 0.85, d = 0.2) { const u = t - t0; if (u < -0.04 || u > d) return; x.fillStyle = 'rgba(255,248,235,' + (u < 0 ? (u + 0.04) / 0.04 : 1 - u / d) * a + ')'; x.fillRect(0, 0, W, H); }





// ---------- the 3D shot ----------
function three(x, t, clean = false) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, K.fire, 10) + jolt(t, K.ice, 6) + jolt(t, K.did, 8);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  const n = shotName(t), scr = x.createLinearGradient(0, 0, 0, 600), sa = phase(t) === 'night' && n !== 'ice' ? 0.62 : 0.3;
  scr.addColorStop(0, `rgba(0,0,0,${sa})`); scr.addColorStop(0.55, `rgba(0,0,0,${sa * 0.5})`); scr.addColorStop(1, 'rgba(0,0,0,0)'); if (!clean) { x.fillStyle = scr; x.fillRect(-40, -40, W + 80, 640); }
  if (clean) { x.restore(); return; }
  if (n === 'console' || n === 'hero') label(x, CUP.localToWorld(v3([0.09, 0.22, 0])).toArray(), 60, -240, 'her Stanley cup', win(t, K.stanley - 0.1, K.iceL - 0.05, 0.25, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  if (n === 'ice') label(x, CUBES[3].getWorldPosition(new X.Vector3()).toArray(), -40, 330, 'still ice inside', win(t, K.ice - 0.05, K.viewsL - 0.05, 0.25, 0.1), { bg: BLUE, fg: WHT });
  if (n === 'keys') label(x, [-0.6, 1.48, 0.4], 0, -250, 'her burnt car', win(t, K.did + 0.15, T0.feed, 0.2, 0.1), { dark: true });
  if (n === 'keys') label(x, NEWCAR.localToWorld(v3([2.3, 0.9, 0])).toArray(), 0, 260, 'a brand new SUV', win(t, K.did - 0.1, T0.feed, 0.2, 0.1), { bg: RED, fg: WHT });
  x.restore();
  viewsPhone(x, t); confetti(x, t);
  flash(x, t, K.fire, 0.3, 0.16); flash(x, t, K.did, 0.35, 0.2);
  const FP = [[K.cupL, K.replyL, 'In 2023 a TikTok user posted her burnt-out car: her Stanley cup had survived in the cupholder with ice still inside, and the video drew tens of millions of views (Scripps News; CarAdvice).'],
    [K.replyL, T0.feed, 'Stanley’s president, Terence Reilly, replied that the company would replace her vehicle; it bought her a new SUV (Scripps News). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; then a customer's video, which becomes the ad: sponsored, money behind it ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
function custPage(c, t) {
  c.drawImage(heroFrame(), -60, 0, 720, 1280);
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420);
  rail(c, -1);
  const spons = t >= K.money - 0.1;
  acct(c, 'a customer', spons ? 'Sponsored' : null, 'a', '#8E8E93');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Filmed on a phone. No studio. ›', 30, 1090);
  const pk = ease((t - K.proof + 0.05) / 0.25);
  if (pk > 0) { c.save(); c.globalAlpha = pk; c.strokeStyle = '#34C759'; c.lineWidth = 12; c.strokeRect(10, 10, 580, 1260); c.restore(); pill(c, 'a real customer’s proof', 300, 140, 32, false, (t - K.proof) / 0.25, { f: 'Body', w: 700, bg: '#34C759', fg: WHT }); }
  if (spons) { const k = ease((t - K.money + 0.1) / 0.25); c.save(); c.globalAlpha = k; c.translate(0, 110 * (1 - k)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); setF(c, '700 34px Body', 0); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore(); }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * clamp((t - K.ad) / 4), 7);
}
const swipeAt = (t) => eio((t - (K.ad + 0.05)) / 0.18);
function feedUI(c, t) {
  const f = swipeAt(t), off = f * 1280;
  if (f < 1) { c.save(); c.translate(0, -off); c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c, -1); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Why would a company buy a stranger a new…', 30, 1090); c.restore(); }
  if (f > 0) { c.save(); c.translate(0, 1280 - off); custPage(c, t); c.restore(); }
}
function coins(x, t) {                                // money behind it: coins stack up behind the phone
  const k0 = t - K.money + 0.05; if (k0 < 0) return;
  for (let i = 0; i < 14; i++) {
    const u = clamp((k0 - i * 0.05) / 0.35); if (u <= 0) continue; const side = i % 2 ? 1 : -1, X0 = 540 + side * (250 + 40 * (i % 3)), Y0 = lerp(1900, 1080 - 34 * Math.floor(i / 2), back(u));
    x.save(); x.translate(X0, Y0); x.scale(1, 0.42); x.beginPath(); x.arc(0, 0, 70, 0, TAU); x.fillStyle = '#C9921E'; x.fill(); x.restore();
    x.save(); x.translate(X0, Y0 - 12); x.scale(1, 0.42); x.beginPath(); x.arc(0, 0, 70, 0, TAU); x.fillStyle = '#F2C14E'; x.fill(); x.strokeStyle = '#B07A12'; x.lineWidth = 6; x.stroke(); x.restore();
    setF(x, '800 44px Logo', 0); x.fillStyle = '#8A5A08'; x.textAlign = 'center'; x.fillText('$', X0, Y0 + 2);
  }
}
S.feed = (x, t) => {
  stage(x, true); coins(x, t);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
};

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
