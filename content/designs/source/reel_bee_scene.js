// Browser-side scene for reel_bee.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// 1 unit = 1 cm: a honeybee diving onto a forearm and stinging; a hive box in a garden (y = 1000); honeycomb
// (y = 2000); the barbed stinger, huge, beside a harpoon (y = 3000); a cutaway of the skin with the stinger hooked in
// and the bee tearing free (y = 4000, magnified). Everything is our own illustration.

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

// ---------- the bee (1 unit = 1 cm; head at +x, about 1.4 long) ----------
const furTex = (() => {
  const [c, x] = mkc(256, 256); x.fillStyle = '#9A6424'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) { const a0 = RN(i + 3000) * TAU, l = 3 + 7 * RN(i + 3001), x0 = 256 * RN(i + 3002), y0 = 256 * RN(i + 3003); x.strokeStyle = RN(i + 3004) < 0.5 ? 'rgba(235,190,110,.5)' : 'rgba(70,40,15,.45)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + l * Math.cos(a0), y0 + l * Math.sin(a0)); x.stroke(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(2, 2); return t0;
})();
const stripeTex = (() => {
  const [c, x] = mkc(64, 512); const B = [[0, 0.16, '#2A1C10'], [0.16, 0.3, '#D9992B'], [0.3, 0.44, '#1E140C'], [0.44, 0.58, '#DFA233'], [0.58, 0.72, '#1E140C'], [0.72, 0.84, '#D2902A'], [0.84, 1, '#1A110A']];
  B.forEach(([a, b, col]) => { x.fillStyle = col; x.fillRect(0, a * 512, 64, (b - a) * 512 + 1); });
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${RN(i + 3100) < 0.5 ? '255,220,150' : '0,0,0'},${0.12 + 0.15 * RN(i + 3101)})`; x.fillRect(64 * RN(i + 3102), 512 * RN(i + 3103), 1, 3 + 4 * RN(i + 3104)); }
  return tex(c);
})();
const wingTex = (() => {
  const [c, x] = mkc(256, 128); x.clearRect(0, 0, 256, 128); x.fillStyle = 'rgba(225,235,245,.55)'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = 'rgba(60,45,30,.85)'; x.lineWidth = 2.2; [[0, 64, 256, 40], [0, 64, 200, 100], [40, 60, 150, 20], [90, 50, 160, 96], [140, 44, 210, 70]].forEach(([a, b, c0, d]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c0) / 2, (b + d) / 2 - 12, c0, d); x.stroke(); });
  return tex(c);
})();
const furM = MAT('#FFFFFF', { map: furTex, r: 0.95 }), darkChitin = MAT('#1E150D', { r: 0.35, m: 0.1 }), eyeM = MAT('#17110B', { r: 0.12, m: 0.2, env: 1.6 });
const stripeM = MAT('#FFFFFF', { map: stripeTex, r: 0.7 });
const wingM = new X.MeshStandardMaterial({ map: wingTex, color: '#FFFFFF', transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1, side: X.DoubleSide, depthWrite: false });
const wingShape = (L, Wd) => { const s0 = new X.Shape(); s0.moveTo(0, 0); s0.bezierCurveTo(-L * 0.25, Wd * 0.9, -L * 0.85, Wd * 0.75, -L, Wd * 0.15); s0.bezierCurveTo(-L * 0.9, -Wd * 0.3, -L * 0.3, -Wd * 0.25, 0, 0); return s0; };
function makeBee() {
  const G = new X.Group(), U = {};
  const head = new X.Mesh(new X.SphereGeometry(0.16, 24, 16), darkChitin); head.scale.set(0.85, 1, 1.05); head.position.set(0.52, 0.03, 0); G.add(head);
  [1, -1].forEach((sd) => { const e0 = new X.Mesh(new X.SphereGeometry(1, 20, 14), eyeM); e0.scale.set(0.075, 0.13, 0.06); e0.position.set(0.53, 0.05, sd * 0.115); G.add(e0);
    const cv = new X.CatmullRomCurve3([v3([0.63, 0.1, sd * 0.04]), v3([0.72, 0.22, sd * 0.07]), v3([0.8, 0.24, sd * 0.1]), v3([0.92, 0.17, sd * 0.14])]); G.add(new X.Mesh(new X.TubeGeometry(cv, 16, 0.011, 6, false), darkChitin)); });
  const thx = new X.Mesh(new X.SphereGeometry(0.22, 28, 20), furM); thx.position.set(0.25, 0.04, 0); G.add(thx);
  const fz = new X.Mesh(new X.SphereGeometry(0.245, 24, 16), new X.MeshStandardMaterial({ map: furTex, color: '#E2AE5C', transparent: true, opacity: 0.45, roughness: 1, depthWrite: false })); fz.position.copy(thx.position); G.add(fz);
  // the abdomen hangs from a pivot, so it can curl under to sting
  const ABD = new X.Group(); ABD.position.set(0.07, 0.0, 0); G.add(ABD); U.abd = ABD;
  const prof = [[0, 0], [0.12, -0.02], [0.21, -0.12], [0.25, -0.28], [0.24, -0.45], [0.19, -0.62], [0.1, -0.75], [0.0, -0.8]].map(([a, b]) => new X.Vector2(a, b));
  const ab = new X.Mesh(new X.LatheGeometry(prof, 32), stripeM); ab.rotation.z = -Math.PI / 2; ab.scale.set(1, 1, 0.92); ABD.add(ab);
  const st = new X.Mesh(new X.ConeGeometry(0.022, 0.22, 10), darkChitin); st.rotation.z = Math.PI / 2; st.position.set(-0.82, 0, 0); ABD.add(st); U.stinger = st;
  // wings: two pairs, with ghost copies for the blur of a beat
  U.wings = [];
  [[0.7, 0.2, 0.08], [0.48, 0.14, 0.05]].forEach(([L, Wd, dz], wi) => [1, -1].forEach((sd) => { const piv = new X.Group(); piv.position.set(0.3 - wi * 0.05, 0.22, sd * dz); G.add(piv);
    const ghosts = [0, 1, 2].map((gi) => { const w0 = new X.Mesh(new X.ShapeGeometry(wingShape(L, Wd)), wingM); w0.rotation.x = sd > 0 ? Math.PI / 2 : -Math.PI / 2; const hold = new X.Group(); hold.add(w0); piv.add(hold); return hold; });
    U.wings.push({ piv, ghosts, sd }); }));
  // legs: three pairs, the hind ones with pollen
  U.legs = [];
  [[0.36, 0.1], [0.25, 0.12], [0.13, 0.12]].forEach(([lx, lz], li) => [1, -1].forEach((sd) => {
    const pts = [v3([lx, -0.12, sd * 0.06]), v3([lx + 0.06 * (1 - li), -0.2, sd * (lz + 0.1)]), v3([lx - 0.05 * li, -0.33, sd * (lz + 0.18)])];
    const leg = new X.Mesh(new X.TubeGeometry(new X.CatmullRomCurve3(pts), 10, 0.014, 6, false), darkChitin); G.add(leg); U.legs.push(leg);
    if (li === 2) { const pol = new X.Mesh(new X.SphereGeometry(0.05, 12, 10), MAT('#F2B623', { r: 0.8 })); pol.position.copy(pts[1]).lerp(pts[2], 0.45); G.add(pol); }
  }));
  G.userData = U; return G;
}
// wings: a fast beat while flying (three ghosts spread over the stroke), folded back when still
function setWings(bee, t, flying) {
  bee.userData.wings.forEach(({ piv, ghosts, sd }, i) => {
    ghosts.forEach((g0, gi) => { g0.visible = flying || gi === 0; });
    if (flying) { ghosts.forEach((g0, gi) => { const ph = t * 190 + gi * 2.1 + i * 0.4; g0.rotation.set(sd * 0.95 * Math.sin(ph), 0.35, 0); g0.children[0].material = wingM; }); }
    else { ghosts[0].rotation.set(sd * -0.05, -0.15 * sd + 0.0, 0); ghosts[0].rotation.y = 0.25; }
  });
}
// a cheap bee for crowds: a sprite of a striped body with blurred wings
const beeSpriteTex = (() => {
  const [c, x] = mkc(128, 128); x.clearRect(0, 0, 128, 128);
  x.fillStyle = 'rgba(230,240,250,.45)'; [[-1, 1]].forEach(() => { x.beginPath(); x.ellipse(52, 40, 26, 14, -0.5, 0, TAU); x.fill(); x.beginPath(); x.ellipse(76, 40, 26, 14, 0.5, 0, TAU); x.fill(); });
  x.save(); x.beginPath(); x.ellipse(64, 72, 20, 30, 0, 0, TAU); x.clip(); ['#2A1C10', '#DFA233', '#1E140C', '#DFA233', '#1E140C'].forEach((col, i) => { x.fillStyle = col; x.fillRect(40, 42 + i * 13, 50, 13); }); x.restore();
  x.fillStyle = '#B07A30'; x.beginPath(); x.arc(64, 44, 15, 0, TAU); x.fill(); x.fillStyle = '#1E150D'; x.beginPath(); x.arc(64, 28, 10, 0, TAU); x.fill();
  return tex(c);
})();
const makeSwarm = (n, parent) => Array.from({ length: n }, (_, i) => { const s0 = new X.Sprite(new X.SpriteMaterial({ map: beeSpriteTex, transparent: true, depthWrite: false })); s0.userData = { a: RN(i + 3200) * TAU, r: RN(i + 3201), h: RN(i + 3202), sp: 0.6 + 0.8 * RN(i + 3203) }; parent.add(s0); return s0; });

// ---------- the arm, close up (the skin at the top is y = 4) ----------
const ARM = new X.Group(); scene.add(ARM);
const skinTex = (() => {
  const [c, x] = mkc(1024, 1024); x.fillStyle = '#E2AE8E'; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(170,110,85,${0.12 + 0.12 * RN(i + 3300)})`; x.lineWidth = 1.5; x.beginPath(); const y0 = 1024 * RN(i + 3301), x0 = 1024 * RN(i + 3302); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + 60, y0 + 20 * (RN(i + 3303) - 0.5), x0 + 140 * RN(i + 3304) + 40, y0 + 30 * (RN(i + 3305) - 0.5)); x.stroke(); }
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(150,90,70,${0.15 + 0.2 * RN(i + 3310)})`; x.beginPath(); x.arc(1024 * RN(i + 3311), 1024 * RN(i + 3312), 0.8 + 1.4 * RN(i + 3313), 0, TAU); x.fill(); }
  for (let i = 0; i < 6000; i++) { const v = RN(i + 3320) < 0.5 ? '255,225,205' : '190,130,105'; x.fillStyle = `rgba(${v},${0.06 + 0.08 * RN(i + 3321)})`; x.fillRect(1024 * RN(i + 3322), 1024 * RN(i + 3323), 2, 2); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(4, 1); return t0;
})();
const skinM = MAT('#FFFFFF', { map: skinTex, r: 0.55, env: 0.5 });
{
  const arm = new X.Mesh(new X.CylinderGeometry(4, 4, 70, 72, 1), skinM); arm.rotation.z = Math.PI / 2; ARM.add(arm);
  const hairM = MAT('#5A3A26', { r: 0.6 });
  for (let i = 0; i < 70; i++) { const a0 = (RN(i + 3400) - 0.5) * 1.6, xh = (RN(i + 3401) - 0.5) * 16, L = 0.25 + 0.35 * RN(i + 3402); const h = new X.Mesh(new X.CylinderGeometry(0.006, 0.01, L, 5), hairM);
    h.position.set(xh, 4 * Math.cos(a0) + L * 0.4, 4 * Math.sin(a0)); h.rotation.set(a0 + 0.9, 0, 0.5 * (RN(i + 3403) - 0.5)); ARM.add(h); }
}
const HERO = makeBee(); ARM.add(HERO);
const WELT = new X.Mesh(new X.SphereGeometry(0.26, 24, 12, 0, TAU, 0, Math.PI / 2), MAT('#E39A88', { r: 0.5 })); WELT.scale.set(1, 0.12, 1); WELT.position.set(-0.62, 3.99, 0); ARM.add(WELT);
const LEFT = new X.Group(); LEFT.position.set(-0.62, 4.0, 0); ARM.add(LEFT);        // what is left in the skin: the stinger and its sac
{ const s0 = new X.Mesh(new X.CylinderGeometry(0.004, 0.012, 0.16, 8), darkChitin); s0.position.y = 0.06; s0.rotation.z = 0.35; LEFT.add(s0); const sac = new X.Mesh(new X.SphereGeometry(0.035, 14, 10), MAT('#E7B8A0', { r: 0.4, e: '#3A1C10', ei: 0.3 })); sac.position.set(-0.04, 0.15, 0); LEFT.add(sac); }
const SCENT = Array.from({ length: 46 }, (_, i) => { const s0 = new X.Sprite(glowMat('#FFD84A', 0.6)); s0.material.toneMapped = false; s0.userData = { a: RN(i + 3500) * TAU, r: RN(i + 3501), ph: RN(i + 3502) }; ARM.add(s0); return s0; });
const MARK = new X.Mesh(new X.RingGeometry(0.75, 0.9, 64), new X.MeshBasicMaterial({ color: '#FFD84A', transparent: true, opacity: 0, side: X.DoubleSide, toneMapped: false })); MARK.rotation.x = -Math.PI / 2; MARK.position.set(-0.62, 4.03, 0); ARM.add(MARK);
const MARK2 = MARK.clone(); MARK2.material = MARK.material.clone(); ARM.add(MARK2);
const ASWARM = makeSwarm(44, ARM);
// a banana, rising out of the scent
let BANANA;
{
  const cv = new X.QuadraticBezierCurve3(v3([-1.1, 0.2, 0]), v3([0, -0.75, 0]), v3([1.1, 0.2, 0]));
  const g0 = new X.TubeGeometry(cv, 48, 0.27, 8, false), pos = g0.attributes.position, seg = 48, rs = 8;
  for (let i = 0; i <= seg; i++) { const u = i / seg, ctr = cv.getPointAt(u), k = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.02) / 0.96))), 0.35) * 0.82 + 0.18; for (let j = 0; j <= rs; j++) { const id = i * (rs + 1) + j; const p0 = v3([pos.getX(id), pos.getY(id), pos.getZ(id)]).sub(ctr).multiplyScalar(k).add(ctr); pos.setXYZ(id, p0.x, p0.y, p0.z); } }
  g0.computeVertexNormals();
  BANANA = new X.Group(); const b0 = new X.Mesh(g0, MAT('#F7D53D', { r: 0.4, e: '#3A2A00', ei: 0.3 })); BANANA.add(b0);
  const stem = new X.Mesh(new X.CylinderGeometry(0.045, 0.06, 0.28, 10), MAT('#6B5A2A', { r: 0.7 })); stem.position.set(-1.2, 0.33, 0); stem.rotation.z = 0.7; BANANA.add(stem); const tip = new X.Mesh(new X.SphereGeometry(0.05, 8, 6), MAT('#3A2A14', { r: 0.6 })); tip.position.set(1.12, 0.2, 0); BANANA.add(tip);
  BANANA.position.set(-0.62, 6.2, 0); BANANA.visible = false; ARM.add(BANANA);
}

// ---------- the hive (y = 1000): a wooden box at the edge of a garden, bees at its entrance ----------
const HIVE = new X.Group(); HIVE.position.set(0, 1000, 0); HIVE.visible = false; scene.add(HIVE);
const woodTex = (() => { const [c, x] = noiseCanvas(512, 512, '#EFE1B4', 0.08, 12000, 71); for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(160,130,80,${0.08 + 0.1 * RN(i + 3600)})`; x.lineWidth = 2; x.beginPath(); const y0 = 512 * RN(i + 3601); x.moveTo(0, y0); for (let k = 0; k <= 512; k += 32) x.lineTo(k, y0 + 6 * Math.sin(k / 60 + i)); x.stroke(); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; return t0; })();
{
  const wm = MAT('#FFFFFF', { map: woodTex, r: 0.75 });
  [[0, 12], [0, 37]].forEach(([a, b]) => { const bx = new X.Mesh(new X.BoxGeometry(51, 24, 41), wm); bx.position.set(a, b + 6, 0); HIVE.add(bx); const hd = new X.Mesh(new X.BoxGeometry(14, 2, 1), MAT('#BFA878', { r: 0.8 })); hd.position.set(0, b + 10, 20.6); HIVE.add(hd); });
  const lid = new X.Mesh(new X.BoxGeometry(55, 5, 45), MAT('#C9CDD2', { m: 0.6, r: 0.4 })); lid.position.set(0, 64.5, 0); HIVE.add(lid);
  const base = new X.Mesh(new X.BoxGeometry(51, 3, 50), wm); base.position.set(0, 4.5, 4.5); HIVE.add(base);
  const slot = new X.Mesh(new X.PlaneGeometry(40, 1.6), MAT('#120C06', { r: 1 })); slot.position.set(0, 6.9, 20.55); HIVE.add(slot);
  const stand = new X.Mesh(new X.BoxGeometry(56, 3, 46), MAT('#6B4A2E', { r: 0.9 })); stand.position.set(0, 1.5, 0); HIVE.add(stand);
  const grassTex = (() => { const [c, x] = noiseCanvas(512, 512, '#4E7A2E', 0.2, 20000, 73); for (let i = 0; i < 3000; i++) { x.strokeStyle = `rgba(${RN(i + 3700) < 0.5 ? '120,170,70' : '40,70,25'},.5)`; x.lineWidth = 1.5; const x0 = 512 * RN(i + 3701), y0 = 512 * RN(i + 3702); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + 4 * (RN(i + 3703) - 0.5), y0 - 8 - 8 * RN(i + 3704)); x.stroke(); } const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(10, 10); return t0; })();
  const ground = new X.Mesh(new X.PlaneGeometry(1200, 1200), MAT('#FFFFFF', { map: grassTex, r: 0.95 })); ground.rotation.x = -Math.PI / 2; HIVE.add(ground);
}
const HBEES = Array.from({ length: 9 }, (_, i) => { const b0 = makeBee(); b0.scale.setScalar(1.6); b0.position.set(-18 + 4.4 * i + 1.2 * RN(i + 3800), 6.0 + 0.5, 22.5 + 3 * RN(i + 3801)); b0.rotation.y = Math.PI / 2 + (RN(i + 3802) - 0.5) * 2.4; HIVE.add(b0); return b0; });
const HSWARM = makeSwarm(60, HIVE);
const HSUN = new X.DirectionalLight('#FFD9A0', 0); HSUN.position.set(-200, 1300, 400); HSUN.target.position.set(0, 1000, 0); scene.add(HSUN, HSUN.target);

// ---------- the comb (y = 2000): hexagonal cells, some full of honey, bees walking on it ----------
const COMB = new X.Group(); COMB.position.set(0, 2000, 0); COMB.visible = false; scene.add(COMB);
{
  const cellG = new X.CylinderGeometry(0.31, 0.31, 1.0, 6, 1, true), waxM = MAT('#E7A93A', { r: 0.45, m: 0.05, side: X.DoubleSide }), honeyM = MAT('#C9780F', { r: 0.12, m: 0.1, e: '#5A2E05', ei: 0.4, env: 1.4 });
  const N = 15, cells = new X.InstancedMesh(cellG, waxM, N * N), mt = new X.Matrix4(); let k = 0;
  for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) { const x0 = (q - N / 2) * 0.56 + (r % 2) * 0.28, z0 = (r - N / 2) * 0.485; mt.makeRotationY(Math.PI / 6); mt.setPosition(x0, 0, z0); cells.setMatrixAt(k++, mt);
    if (RN(r * 31 + q + 3900) < 0.55) { const hn = new X.Mesh(new X.CircleGeometry(0.29, 6), honeyM); hn.rotation.set(-Math.PI / 2, 0, Math.PI / 6); hn.position.set(x0, 0.35 + 0.1 * RN(r * 31 + q + 3901), z0); COMB.add(hn); } }
  COMB.add(cells);
  const back = new X.Mesh(new X.PlaneGeometry(12, 12), MAT('#B9781E', { r: 0.6 })); back.rotation.x = -Math.PI / 2; back.position.y = -0.45; COMB.add(back);
}
const CBEES = Array.from({ length: 6 }, (_, i) => { const b0 = makeBee(); b0.position.set(-2.5 + 1.1 * i, 0.82, -1.2 + 2.2 * RN(i + 3950)); b0.rotation.y = RN(i + 3951) * TAU; COMB.add(b0); return b0; });
const CKEY = new X.PointLight('#FFE2A8', 0, 30, 1.2); CKEY.position.set(2, 2008, 5); scene.add(CKEY);

// ---------- the barbed stinger, huge (y = 3000), and a harpoon beside it ----------
const BARB = new X.Group(); BARB.position.set(0, 3000, 0); BARB.visible = false; scene.add(BARB);
function lancetShape(L, w, nb) {                        // a long blade, the barbs pointing back from the tip
  const s0 = new X.Shape(); s0.moveTo(0, w / 2);
  for (let i = 0; i < nb; i++) { const x0 = L * (0.35 + 0.6 * i / nb), hw = w / 2 * (1 - (x0 / L) * 0.85); s0.lineTo(x0, hw); s0.lineTo(x0 + L * 0.03, hw + w * 0.22 * (1 - x0 / L)); s0.lineTo(x0 + L * 0.05, hw * 0.9); }
  s0.lineTo(L, 0);
  for (let i = nb - 1; i >= 0; i--) { const x0 = L * (0.35 + 0.6 * i / nb), hw = w / 2 * (1 - (x0 / L) * 0.85); s0.lineTo(x0 + L * 0.05, -hw * 0.9); s0.lineTo(x0 + L * 0.03, -hw - w * 0.22 * (1 - x0 / L)); s0.lineTo(x0, -hw); }
  s0.lineTo(0, -w / 2); s0.lineTo(0, w / 2); return s0;
}
const chitinM = new X.MeshStandardMaterial({ color: '#6A4422', roughness: 0.3, metalness: 0.15, envMapIntensity: 1.3 });
function makeStinger(L, w, nb, d) {
  const G = new X.Group(); G.add(new X.Mesh(lancetGeo(L, w, nb, d), chitinM));
  const shaft = new X.Mesh(new X.ConeGeometry(w * 0.36, L, 20), chitinM); shaft.rotation.z = -Math.PI / 2; shaft.position.set(L / 2, 0, -d * 0.2); G.add(shaft);
  return G;
}
const lancetGeo = (L, w, nb, d) => { const g0 = new X.ExtrudeGeometry(lancetShape(L, w, nb), { depth: d, bevelEnabled: true, bevelThickness: d * 0.3, bevelSize: d * 0.25, bevelSegments: 2 }); g0.translate(0, 0, -d / 2); return g0; };
{
  const big = makeStinger(12, 1.0, 9, 0.35); big.position.set(-6, 0, 0); big.rotation.x = 0.35; BARB.add(big);
  const harp = new X.Group(); harp.position.set(-6, -3.2, 0); BARB.add(harp); BARB.userData.harp = harp;
  const shaft = new X.Mesh(new X.CylinderGeometry(0.12, 0.12, 9, 16), MAT('#8C939B', { m: 1, r: 0.3 })); shaft.rotation.z = Math.PI / 2; shaft.position.x = 4.5; harp.add(shaft);
  const hd = new X.Mesh(new X.ConeGeometry(0.45, 2.2, 4), MAT('#B9C0C8', { m: 1, r: 0.25 })); hd.rotation.z = -Math.PI / 2; hd.position.x = 10.1; harp.add(hd);
  [1, -1].forEach((sd) => { const b0 = new X.Mesh(new X.BoxGeometry(1.4, 0.16, 0.16), MAT('#B9C0C8', { m: 1, r: 0.25 })); b0.position.set(9.0, sd * 0.45, 0); b0.rotation.z = sd * 0.55; harp.add(b0); });
}
const BKEY = new X.DirectionalLight('#FFF1DC', 0); BKEY.position.set(4, 3010, 10); BKEY.target.position.set(0, 3000, 0); scene.add(BKEY, BKEY.target);

// ---------- under the skin (y = 4000, 1 unit = 0.1 mm): the stinger hooked in, the bee pulling free ----------
const SECT = new X.Group(); SECT.position.set(0, 4000, 0); SECT.visible = false; scene.add(SECT);
const layerTex = (() => {
  const [c, x] = mkc(256, 512); const L0 = [[0, 0.07, '#F3CDB5'], [0.07, 0.6, '#E59082'], [0.6, 1, '#F4D486']];
  L0.forEach(([a, b, col]) => { x.fillStyle = col; x.fillRect(0, a * 512, 256, (b - a) * 512 + 1); });
  for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(200,100,95,${0.25 + 0.25 * RN(i + 4000)})`; x.lineWidth = 2; x.beginPath(); const y0 = 512 * (0.1 + 0.48 * RN(i + 4001)), x0 = 256 * RN(i + 4002); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + 20, y0 + 15 * (RN(i + 4003) - 0.5), x0 + 50, y0 + 20 * (RN(i + 4004) - 0.5)); x.stroke(); }
  for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(230,180,90,.7)'; x.lineWidth = 2; x.beginPath(); x.arc(256 * RN(i + 4010), 512 * (0.62 + 0.36 * RN(i + 4011)), 10 + 14 * RN(i + 4012), 0, TAU); x.stroke(); }
  return tex(c);
})();
let SBEE, SSTING, SSAC, STRANDS = [];
const VENOM = [];
{
  const blk = new X.Mesh(new X.BoxGeometry(34, 16, 14), [MAT('#E59082', { r: 0.6 }), MAT('#E59082', { r: 0.6 }), MAT('#FFFFFF', { map: skinTex, r: 0.55 }), MAT('#F4D486', { r: 0.7 }), MAT('#FFFFFF', { map: layerTex, r: 0.6 }), MAT('#E59082', { r: 0.6 })]);
  blk.scale.z = 0.5; blk.position.set(0, -8, -3.5); SECT.add(blk);
  SSTING = new X.Group(); SSTING.position.set(0, 0, 0); SSTING.rotation.z = -1.15; SECT.add(SSTING);
  const ln = makeStinger(9, 0.75, 8, 0.3); ln.position.set(-1.2, 0, 0.25); SSTING.add(ln);       // the tip ends up 7.8 deep along the stinger
  SSAC = new X.Group(); SECT.add(SSAC);
  const sac = new X.Mesh(new X.SphereGeometry(1.25, 28, 20), new X.MeshStandardMaterial({ color: '#F1C9A6', roughness: 0.25, metalness: 0, transparent: true, opacity: 0.85, emissive: '#6A3412', emissiveIntensity: 0.25 })); SSAC.add(sac);
  const gl = new X.Mesh(new X.SphereGeometry(0.75, 20, 14), MAT('#F7E3A0', { r: 0.4, e: '#7A5A10', ei: 0.3 })); gl.position.set(0.3, 0.6, 0.6); SSAC.add(gl);
  for (let i = 0; i < 3; i++) { const tb = new X.Mesh(new X.CylinderGeometry(0.16, 0.16, 1, 10), MAT(['#E9D6C0', '#D9A08A', '#F0E2C8'][i], { r: 0.5 })); SECT.add(tb); STRANDS.push(tb); }
  SBEE = makeBee(); SBEE.scale.setScalar(14); SECT.add(SBEE);
  for (let i = 0; i < 26; i++) { const d0 = new X.Mesh(new X.SphereGeometry(0.16, 10, 8), MAT('#E8E06A', { r: 0.2, e: '#7A6A10', ei: 0.6 })); d0.userData.ph = RN(i + 4100); SECT.add(d0); VENOM.push(d0); }
}
const SKEY = new X.PointLight('#FFF1DC', 0, 80, 1.2); SKEY.position.set(8, 4012, 18); scene.add(SKEY);
// ---------- the camera: a new set-up about every second ----------
scene.updateMatrixWorld(true);
const SITEP = [-0.62, 4.0, 0];                                   // where the sting goes in
const VIEW = {
  dive0: [[1.8, 5.2, 2.8], [-3, 6, -2], 38], dive1: [[1.6, 5.0, 2.5], [-1, 5, -0.7], 38],
  land0: [[2.4, 5.4, 4.2], [0, 4.4, 0], 34], land1: [[2.1, 5.2, 3.7], [0, 4.38, 0], 33],
  stab0: [[0.1, 4.35, 1.5], [-0.66, 4.06, 0], 30], stab1: [[0.0, 4.3, 1.32], [-0.66, 4.05, 0], 29],
  hive0: [[70, 1034, 150], [0, 1030, 0], 38], hive1: [[60, 1031, 130], [0, 1029, 0], 38],
  comb0: [[1.5, 2006, 5.5], [0, 2000.4, 0], 40], comb1: [[1.2, 2005.2, 4.6], [0, 2000.4, 0], 40],
  stinger0: [[3, 3001.4, 8.5], [0.5, 3000, 0], 40], stinger1: [[-0.5, 3001.1, 7.2], [0.8, 3000, 0], 40],
  harpoon0: [[1, 2999.6, 24], [0.5, 2998.6, 0], 40], harpoon1: [[0.6, 2999.4, 22], [0.5, 2998.6, 0], 40],
  section0: [[7, 4004, 30], [2.5, 4001, 0], 40], section1: [[6, 4003.6, 27], [2.5, 4001, 0], 40],
  tear0: [[8, 4005, 34], [3, 4002.5, 0], 42], tear1: [[8, 4005.5, 36], [3, 4003, 0], 42],
  pump0: [[2, 4001.5, 15], [0.2, 3999.8, 0], 40], pump1: [[1.6, 4001.2, 13.5], [0.2, 3999.6, 0], 40],
  timer0: [[0.8, 4000.8, 11], [0.6, 3999.2, 0], 38], timer1: [[0.6, 4000.6, 10], [0.6, 3999.0, 0], 37],
  scent0: [[0.55, 4.62, 2.1], [-0.62, 4.42, 0], 36], scent1: [[0.42, 4.68, 1.85], [-0.62, 4.5, 0], 35],
  banana0: [[0.9, 5.7, 4.6], [-0.62, 5.4, 0], 36], banana1: [[0.75, 5.8, 4.2], [-0.62, 5.6, 0], 35],
  mark0: [[6, 9, 10], [-0.6, 4.2, 0], 38], mark1: [[5, 8.2, 9], [-0.6, 4.2, 0], 38],
  swarm0: [[10, 1012, 90], [0, 1012, 20], 40], swarm1: [[8, 1011, 75], [0, 1012, 20], 40],
  attack0: [[4.2, 7.2, 8.2], [-0.6, 4.6, 0], 40], attack1: [[3.6, 6.6, 7.2], [-0.6, 4.6, 0], 40],
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
const wpos = (o, p = [0, 0, 0]) => o.localToWorld(v3(p)).toArray();

// ---------- the timeline of the world ----------
const LANDT = 0.85, P0 = [-3.6, 6.1, -2.7], P1 = [0, 4.33, 0];
function heroAt(t) {                                             // the flight in, the landing, the curl, the sting
  const u = clamp(t / LANDT), e = 1 - Math.pow(1 - u, 2.2), p = lerp3(P0, P1, e);
  p[1] += 1.2 * Math.sin(Math.PI * e) * (1 - e) + (t > LANDT ? 0.03 * bump(t, LANDT, 0.18) : 0);
  const yaw = lerp(-0.66, 0, sstep((t - 0.55) / 0.35)), curl = lerp(0, 0.38, sstep((t - 0.95) / 0.45)) + 0.05 * sstep((t - (K.kills - 0.06)) / 0.08);
  return { p, yaw, curl, flying: t < LANDT + 0.05 };
}
function setWorld(t) {
  const n = shotName(t), onArm = ['dive', 'land', 'stab', 'scent', 'banana', 'mark', 'attack'].includes(n), onHive = n === 'hive' || n === 'swarm', onComb = n === 'comb', onBarb = n === 'stinger' || n === 'harpoon', onSect = ['section', 'tear', 'pump', 'timer'].includes(n);
  ARM.visible = onArm; HIVE.visible = onHive; COMB.visible = onComb; BARB.visible = onBarb; SECT.visible = onSect;
  hemi.intensity = onBarb || onSect ? 0.35 : 0.8; hemi.color.set('#FFF1DC'); sun.intensity = onArm ? 2.0 : 0; sun.color.set('#FFE6C0'); sun.position.set(-20, 40, 18);
  rim.intensity = onBarb ? 1.6 : 0.9; HSUN.intensity = onHive ? 2.4 : 0; CKEY.intensity = onComb ? 14 : 0; BKEY.intensity = onBarb ? 2.6 : 0; SKEY.intensity = onSect ? 3.2 : 0;
  // the bee on the arm: in, down, curl, sting; gone once she has torn free
  const h = heroAt(t); HERO.visible = t < K.hiveL; HERO.position.set(...h.p); HERO.rotation.y = h.yaw; HERO.userData.abd.rotation.z = h.curl;
  const st = HERO.userData.stinger; st.position.x = -0.82 - 0.09 * sstep((t - (K.kills - 0.08)) / 0.1); setWings(HERO, t, h.flying);
  WELT.visible = t > K.kills; WELT.scale.set(1, 0.12, 1).multiplyScalar(onArm ? 0.15 + 0.85 * sstep((t - K.kills) / 1.2) * (t > K.smellL ? 1.25 : 1) : 1); WELT.scale.y = 0.2 * WELT.scale.x;
  LEFT.visible = t > K.smellL - 0.1;
  // the scent rises from the sting; the banana comes up out of it; the spot is marked
  SCENT.forEach((s0, i) => { const d = s0.userData, u = ((t - K.smell + 0.1) * 0.35 + d.ph) % 1, on = t > K.smell - 0.1 && onArm && n !== 'attack';
    s0.visible = on; if (!on) return; const k = clamp((t - K.smell + 0.1) / 0.5);
    const rise = n === 'scent' ? 1.5 : 2.6, spread = n === 'scent' ? 0.5 : 1; s0.position.set(SITEP[0] + spread * (0.2 + 0.9 * u) * d.r * Math.cos(d.a + u * 3) - 1.5 * u * u * (n === 'mark' ? 2 : 0.4), SITEP[1] + 0.12 + rise * u, SITEP[2] + spread * (0.2 + 0.9 * u) * d.r * Math.sin(d.a + u * 3));
    s0.scale.setScalar((n === 'scent' ? 0.22 + 0.8 * u : 0.35 + 1.1 * u)); s0.material.opacity = (n === 'banana' ? 0.22 : n === 'scent' ? 0.7 : 0.42) * k * Math.sin(Math.PI * u); });
  BANANA.visible = n === 'banana'; const bk = ease((t - K.bananas + 0.1) / 0.6); BANANA.position.set(-0.62, 4.9 + 0.9 * bk, 0); BANANA.rotation.set(0.45, 0.35 * Math.sin(t * 1.3), 0.15 * Math.sin(t * 2)); BANANA.scale.setScalar(0.35 + 0.5 * bk);
  const mk = t > K.marks - 0.1 ? 1 : 0; [MARK, MARK2].forEach((m, i) => { const u = ((t - K.marks) * 0.8 + i * 0.5) % 1; m.material.opacity = mk * (onArm ? 0.85 * (1 - u) : 0); m.scale.setScalar(0.6 + 1.6 * u); });
  // the swarm: out of the hive towards you, then down onto the mark
  HSWARM.forEach((s0, i) => { const d = s0.userData; if (n === 'hive') { const a = d.a + t * (1.2 + d.sp); s0.position.set(8 * d.r * Math.cos(a), 9 + 7 * d.h + 1.5 * Math.sin(t * 3 + i), 26 + 6 * d.r * Math.sin(a)); s0.scale.setScalar(1.6); s0.visible = i < 14; return; }
    const u = clamp((t - K.tagsL + 0.15 - 0.4 * d.r) / 1.0); s0.visible = n === 'swarm' && u > 0; s0.position.set((d.a - Math.PI) * 9 * u + 3 * Math.sin(t * 5 + i), 7 + 6 * d.h + 10 * u * (d.h - 0.3), 22 + 60 * u); s0.scale.setScalar(1.7); s0.material.rotation = 0.4 * Math.sin(t * 9 + i); });
  ASWARM.forEach((s0, i) => { const d = s0.userData, u = clamp((t - K.the2 + 0.1 - 0.5 * d.r) / 0.9), r = lerp(26, 0.8 + 1.2 * d.h, ease(u)), a = d.a + t * (2 + d.sp);
    s0.visible = n === 'attack' && t > K.the2 - 0.2; s0.position.set(SITEP[0] + r * Math.cos(a), SITEP[1] + 0.6 + r * 0.35 * d.h + 0.3 * Math.sin(t * 7 + i), SITEP[2] + r * Math.sin(a)); s0.scale.setScalar(1.2); s0.material.rotation = a; });
  HBEES.forEach((b0, i) => { setWings(b0, t, false); b0.position.x += 0; });
  CBEES.forEach((b0, i) => { setWings(b0, t, false); b0.position.x = -2.5 + 1.1 * i + 0.25 * Math.sin(t * 0.8 + i); });
  // under the skin: hooked in, the bee pulls away and tears free, the sac keeps pumping
  const ep = eio((t - K.rips + 0.12) / 0.4), snap = t > K.rips + 0.22;
  SSAC.position.set(-1.1, 2.2, 0); const pul = t > K.rips ? 1 + 0.12 * Math.max(0, Math.sin((t - K.rips) * 13)) : 1; SSAC.scale.setScalar(pul);
  SBEE.position.set(9.1 + 7 * ep, 8.1 + 6 * ep, 0); SBEE.userData.abd.rotation.z = 0.45; setWings(SBEE, t, ep > 0.05); SBEE.visible = n === 'section' || n === 'tear';
  const tip = wpos(SBEE.userData.abd, [-0.8, 0, 0]), sacTop = wpos(SSAC, [0, 1.1, 0]);
  STRANDS.forEach((tb, i) => { const a = v3(sacTop).add(v3([0.3 * (i - 1), 0, 0.25 * (i - 1)])), b = v3(tip).add(v3([0.2 * (i - 1), 0, 0.2 * (i - 1)])), len = a.distanceTo(b), show = (n === 'section' || n === 'tear') && !snap;
    tb.visible = show && len > 0.2; if (!tb.visible) return; tb.position.copy(a).lerp(b, 0.5).sub(v3([0, 4000, 0])); tb.scale.set(1 - 0.6 * clamp(len / 14), len, 1 - 0.6 * clamp(len / 14)); tb.lookAt(b.x, b.y, b.z); tb.rotateX(Math.PI / 2); });
  const flow = t > K.rips + 0.1;
  VENOM.forEach((d0, i) => { const u = ((t - K.rips) * 0.6 + d0.userData.ph) % 1; d0.visible = onSect && flow && n !== 'section'; if (!d0.visible) return; const along = lerp(-0.5, 7.6, u), off = 0.5 * Math.sin(i * 1.7) * u;
    d0.position.set(along * Math.cos(-1.15) + off, along * Math.sin(-1.15) - 0.2, 0.55 + 0.2 * Math.cos(i)); d0.scale.setScalar(0.8 + 0.6 * Math.sin(u * Math.PI)); });
  const c0 = camAt(t); if (n === 'dive' && !DEBUGCAM) { c0[3] = h.p[0]; c0[4] = h.p[1] + 0.2; c0[5] = h.p[2]; }
  cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.near = onArm ? 0.02 : 0.1; cam.updateProjectionMatrix();
}

// ---------- 2D: the backdrop (soft garden bokeh behind the macro shots) ----------
const BOKEH = {};
function bokeh(key, top, bot, cols, n) {
  if (!BOKEH[key]) { const [c, x] = mkc(1080, 1920), q = x.createLinearGradient(0, 0, 0, 1920); q.addColorStop(0, top); q.addColorStop(1, bot); x.fillStyle = q; x.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < n; i++) { const r0 = 40 + 160 * RN(i + 4200), cx = 1080 * RN(i + 4201), cy = 1920 * RN(i + 4202), g0 = x.createRadialGradient(cx, cy, 0, cx, cy, r0); const cc = cols[i % cols.length]; g0.addColorStop(0, cc + 'AA'); g0.addColorStop(0.7, cc + '55'); g0.addColorStop(1, cc + '00'); x.fillStyle = g0; x.beginPath(); x.arc(cx, cy, r0, 0, TAU); x.fill(); }
    BOKEH[key] = c; }
  return BOKEH[key];
}
function backdrop(x, t) {
  const n = shotName(t);
  if (['stinger', 'harpoon', 'section', 'tear', 'pump', 'timer'].includes(n)) { const r0 = x.createRadialGradient(540, 860, 80, 540, 900, 1200); r0.addColorStop(0, n === 'stinger' || n === 'harpoon' ? '#2A3240' : '#3A2420'); r0.addColorStop(1, '#07080B'); x.fillStyle = r0; x.fillRect(0, 0, W, H); return; }
  if (n === 'comb') { x.drawImage(bokeh('comb', '#3A2408', '#1A0F04', ['#E8A93A', '#F7D27A'], 26), 0, 0); return; }
  if (n === 'hive' || n === 'swarm') { x.drawImage(bokeh('hive', '#9CC7F0', '#E8D9A8', ['#FFFFFF', '#FFE6A8', '#B8E0A0'], 30), 0, 0); return; }
  x.drawImage(bokeh('garden', '#7FB86A', '#2E5A2A', ['#D8F09A', '#FFE680', '#9AD07A', '#FFFFFF'], 40), 0, 0);
}

const pillHalf = (str, size) => { setF(g, '600 ' + size + 'px Body', -size * 0.02); return (g.measureText(str).width + size * 1.05) / 2; };
function label(x, p3, dx, dy, str, k, o = {}) {
  if (k <= 0) return; const [ax, ay, vis] = project(p3); if (!vis || ax < 0 || ax > W || ay < 0 || ay > H) return;   // nothing for things out of shot
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
function timerPill(x, t) {                             // "for up to a minute": a stopwatch running to 60
  const k = ease((t - K.forW + 0.05) / 0.25); if (k <= 0) return; const s0 = Math.min(60, Math.floor(60 * clamp((t - K.forW) / 0.75)));
  x.save(); x.globalAlpha = k; x.translate(540, 1420 + 40 * (1 - k)); rrx(x, -190, -70, 380, 140, 70); x.fillStyle = 'rgba(0,0,0,.55)'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#FFD84A'; x.stroke();
  x.beginPath(); x.arc(-110, 0, 38, -Math.PI / 2, -Math.PI / 2 + TAU * s0 / 60); x.lineWidth = 10; x.strokeStyle = '#FFD84A'; x.stroke();
  setF(x, '800 70px Logo', -1); x.fillStyle = WHT; x.textAlign = 'left'; x.fillText(`0:${String(s0).padStart(2, '0')}`, -50, 26); x.restore();
}
function three(x, t, clean = false) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, K.kills, 10) + jolt(t, K.rips + 0.2, 8) + jolt(t, K.tags, 6);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  const n = shotName(t), scr = x.createLinearGradient(0, 0, 0, 600), sa = 0.34;
  scr.addColorStop(0, `rgba(0,0,0,${sa})`); scr.addColorStop(0.55, `rgba(0,0,0,${sa * 0.5})`); scr.addColorStop(1, 'rgba(0,0,0,0)'); if (!clean) { x.fillStyle = scr; x.fillRect(-40, -40, W + 80, 640); }
  if (clean) { x.restore(); return; }
  if (n === 'stab') label(x, wpos(HERO.userData.abd, [-0.95, 0, 0]), -80, 260, 'stinger', win(t, K.kills - 0.12, K.hiveL, 0.18, 0.08), { bg: GOLD, fg: '#1D1D1F' });
  if (n === 'stinger') label(x, [2.2, 3000.42, 0], 60, 260, 'barbs', win(t, K.barbs - 0.05, K.like, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  if (n === 'harpoon') { label(x, [-1.5, 3000.25, 0], -40, -220, 'her stinger', win(t, K.like, K.ripL, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' }); label(x, [2.0, 2996.8, 0], 40, 220, 'a harpoon', win(t, K.harpoon - 0.05, K.ripL, 0.2, 0.1), { bg: WHT, fg: INK }); }
  if (n === 'section') label(x, wpos(SSTING, [5.2, 0.35, 0]), 120, 150, 'barbs hook in', win(t, K.hooks, K.andR, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  if (n === 'tear') label(x, wpos(SSAC, [-0.6, 0.4, 0]), -150, -120, 'venom sac', win(t, K.rips + 0.15, K.pumpL, 0.2, 0.1), { bg: WHT, fg: INK });
  if (n === 'pump') label(x, wpos(SSTING, [6.5, 0, 0]), 110, 140, 'still pumping', win(t, K.pumping, K.forW, 0.2, 0.1), { bg: '#E8E06A', fg: '#1D1D1F' });
  if (n === 'scent') label(x, [SITEP[0], 4.7, 0], -80, 300, 'alarm scent', win(t, K.smell, K.likeS, 0.2, 0.1), { bg: '#FFD84A', fg: '#1D1D1F' });
  if (n === 'banana') label(x, wpos(BANANA, [0.6, 0, 0]), 80, 260, 'smells like bananas', win(t, K.bananas, K.that, 0.2, 0.1), { bg: '#FFD84A', fg: '#1D1D1F' });
  if (n === 'mark') label(x, [SITEP[0] + 0.85, 4.05, 0], 90, 230, 'marked', win(t, K.marks, K.tagsL, 0.2, 0.1), { bg: '#FFD84A', fg: '#1D1D1F' });
  x.restore();
  if (n === 'timer') timerPill(x, t);
  flash(x, t, K.kills, 0.3, 0.14); flash(x, t, K.rips + 0.2, 0.25, 0.12); flash(x, t, K.tags, 0.22, 0.12);
  const FP = [[K.hiveL, K.pumpL, 'Worker honeybees have barbed stingers: in skin the barbs catch, and the stinger tears free with the venom gland, so the bee dies (BBC Wildlife; UC Agriculture and Natural Resources).'],
    [K.pumpL, T0.feed, 'The stinger keeps pumping venom for about 45–60 seconds (UC ANR). The sting’s alarm pheromone, isopentyl acetate, smells like bananas and draws other bees (Bee Culture). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.site = three;

// ---------- the switch: our reel in a phone; a first ad tags who watched; the next ad finds them and sells ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
function coffee(c, t, cx, cy, s0) {                     // the product: a bag of coffee and a steaming cup (yourbrand is a placeholder)
  c.save(); c.translate(cx, cy); c.scale(s0, s0);
  rrx(c, -120, -200, 240, 330, 26); const q = c.createLinearGradient(-120, 0, 120, 0); q.addColorStop(0, '#5B3A22'); q.addColorStop(1, '#7A4E2C'); c.fillStyle = q; c.fill();
  rrx(c, -90, -80, 180, 120, 14); c.fillStyle = '#F4E9D8'; c.fill(); setF(c, '800 34px Logo', -1); c.fillStyle = '#3A2414'; c.textAlign = 'center'; c.fillText('yourbrand', 0, -12); setF(c, '600 22px Body', 0); c.fillText('house roast', 0, 22);
  c.translate(170, 90); rrx(c, -60, -70, 120, 110, 18); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 12; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(64, -20, 26, -1.2, 1.2); c.stroke();
  c.fillStyle = '#6B4226'; rrx(c, -50, -64, 100, 18, 8); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.beginPath(); const x0 = -24 + 24 * i; for (let k = 0; k <= 20; k++) { const yy = -80 - k * 5, xx = x0 + 8 * Math.sin(k * 0.5 + t * 4 + i); k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  c.restore();
}
function adOne(c, t) {
  const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#F6E2C8'); q.addColorStop(1, '#E2B98E'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
  coffee(c, t, 260, 560, 1.15 + 0.03 * Math.sin(t * 2));
  pill(c, 'ad 1', 300, 120, 34, true, 1, { f: 'Body', w: 700 });
  const g0 = c.createLinearGradient(0, 760, 0, 1280); g0.addColorStop(0, 'rgba(0,0,0,0)'); g0.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g0; c.fillRect(0, 860, 600, 420);
  rail(c, -1); acct(c, 'yourbrand', 'Sponsored', 'y', '#6B4226');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.92)'; c.textAlign = 'left'; c.fillText('Roasted this week. ›', 30, 1090);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 8); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * clamp((t - K.adL - 0.4) / 4), 8);
}
function adTwo(c, t) {
  const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#2A1A10'); q.addColorStop(1, '#5B3A22'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
  setF(c, '800 64px Logo', -2); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText('Still thinking', 300, 250); c.fillText('about it?', 300, 326);
  coffee(c, t, 250, 680, 1.0);
  pill(c, 'ad 2', 300, 120, 34, false, 1, { f: 'Body', w: 700, bg: '#FFD84A', fg: '#1D1D1F' });
  rail(c, -1); acct(c, 'yourbrand', 'Sponsored', 'y', '#6B4226');
  const k = ease((t - K.find + 0.1) / 0.25); c.save(); c.globalAlpha = k; c.translate(0, 110 * (1 - k)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); setF(c, '700 34px Body', 0); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore();
  const nk = ease((t - K.sell2 + 0.02) / 0.25);
  if (nk > 0) { c.save(); c.translate(0, -160 * (1 - nk)); rrx(c, 24, 40, 552, 120, 28); c.fillStyle = 'rgba(245,245,247,.97)'; c.fill(); c.beginPath(); c.arc(84, 100, 34, 0, TAU); c.fillStyle = '#34C759'; c.fill(); c.strokeStyle = WHT; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(68, 101); c.lineTo(80, 113); c.lineTo(102, 88); c.stroke();
    setF(c, '700 32px Body', 0); c.fillStyle = INK; c.textAlign = 'left'; c.fillText('New order', 136, 92); setF(c, '500 26px Body', 0); c.fillStyle = '#6E6E73'; c.fillText('from someone who watched ad 1', 136, 130); c.restore(); }
}
const swipeA = (t) => eio((t - (K.adL + 0.42)) / 0.2), swipeB = (t) => eio((t - (K.nextL - 0.02)) / 0.22);
function feedUI(c, t) {
  const fa = swipeA(t), fb = swipeB(t);
  if (fa < 1) { c.save(); c.translate(0, -fa * 1280); c.drawImage(frozen(), -60, 0, 720, 1280); const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420); rail(c, -1); acct(c, 'mezmedia_0', null, 'm.', '#111'); setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('Why would a bee sting you, if it…', 30, 1090); c.restore(); }
  if (fa > 0 && fb < 1) { c.save(); c.translate(0, 1280 * (1 - fa) - 1280 * fb); adOne(c, t); c.restore(); }
  if (fb > 0) { c.save(); c.translate(0, 1280 * (1 - fb)); adTwo(c, t); c.restore(); }
}
function person(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy - r * 0.25, r * 0.38, 0, TAU); x.fill(); x.beginPath(); x.ellipse(cx, cy + r * 0.62, r * 0.62, r * 0.42, 0, Math.PI, TAU); x.fill(); }
function audience(x, t) {                               // the people who watched ad 1, tagged; then the follow-up finds them
  const k = ease((t - K.itA + 0.05) / 0.3); if (k <= 0) return;
  x.save(); x.globalAlpha = k; x.translate(0, 40 * (1 - k));
  const N = 8, gap = 112, X0 = 540 - gap * (N - 1) / 2, Y = 1500;
  for (let i = 0; i < N; i++) {
    const tagged = [0, 2, 3, 5, 6, 7].indexOf(i), tk = tagged >= 0 ? clamp((t - K.tags2 - 0.09 * tagged) / 0.15) : 0, cx = X0 + gap * i;
    x.save(); x.beginPath(); x.arc(cx, Y, 46, 0, TAU); x.fillStyle = 'rgba(255,255,255,.1)'; x.fill(); x.clip(); person(x, cx, Y + 8, 60, tk > 0 ? mixHex('#8E8E93', '#FFD84A', tk).getStyle() : '#8E8E93'); x.restore();
    if (tk > 0) { x.beginPath(); x.arc(cx, Y, 46 + 8 * bump(t, K.tags2 + 0.09 * tagged, 0.3), 0, TAU); x.lineWidth = 6; x.strokeStyle = '#FFD84A'; x.stroke();
      const fk = clamp((t - K.find - 0.05 * tagged) / 0.2); if (fk > 0) { x.save(); x.globalAlpha = k * fk; x.beginPath(); x.arc(cx + 32, Y - 32, 15, 0, TAU); x.fillStyle = '#34C759'; x.fill(); x.restore(); } }
  }
  const lk = ease((t - K.tags2 + 0.05) / 0.25);
  if (lk > 0) pill(x, t < K.nextL ? 'tagged: watched ad 1' : 'shown ad 2', 540, 1610, 38, false, lk * 1.5, { f: 'Body', w: 700, bg: t < K.nextL ? '#FFD84A' : '#34C759', fg: t < K.nextL ? '#1D1D1F' : WHT });
  x.restore();
}
S.feed = (x, t) => {
  stage(x, true);
  if (!IMG.feedscr) IMG.feedscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.feed) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'feedscr', { frame: 'frameDark', shadow: k, over: (c) => feedUI(c, t) });
  audience(x, t);
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
