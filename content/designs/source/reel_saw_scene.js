// Browser-side scene for reel_saw.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, kf, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, mixc, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// One world, one camera. A table saw at the origin: the table top at y = 0, the blade turning in the y-z plane with
// its top running toward the operator's side (+z); a board with a hot dog lying across it is fed into the blade (-z).
// Under the table (seen in X-ray): the arbor carrying the blade, the motor, and behind the blade the brake cartridge
// whose spring fires an aluminum pawl into the teeth. Far down a road (-z): three generic tool factories and, at the
// end, the inventor's own company. Units: 1 = 10 cm (a 10-inch blade has a radius of 1.27).

const BLUE = '#2F80FF', RED = '#FF3B30', GREEN = '#34C759';
const v3 = (a) => new X.Vector3(...a);
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / Math.max(fi, 1e-4)) * (1 - clamp((t - b) / Math.max(fo, 1e-4)));
const kk = (t, t0, d = 0.3) => clamp((t - t0) / d);
const tex = (c) => { const t = new X.CanvasTexture(c); t.colorSpace = X.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------- renderer, a studio environment for the metal, lights ----------
const glc = document.getElementById('gl');
const R3 = new X.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0);
R3.toneMapping = X.ACESFilmicToneMapping; R3.toneMappingExposure = 1.0; R3.outputColorSpace = X.SRGBColorSpace;
const scene = new X.Scene();
scene.fog = new X.Fog(0x07080c, 40, 270);
const cam = new X.PerspectiveCamera(40, W / H, 0.03, 900);
{
  const env = new X.Scene();
  const [c, x] = mkc(256, 256), q = x.createLinearGradient(0, 0, 0, 256);
  q.addColorStop(0, '#5A606B'); q.addColorStop(0.45, '#20232A'); q.addColorStop(1, '#08090C'); x.fillStyle = q; x.fillRect(0, 0, 256, 256);
  env.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), new X.MeshBasicMaterial({ map: tex(c), side: X.BackSide })));
  const panel = (w, h, pos, v) => { const m = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshBasicMaterial({ color: new X.Color(v, v, v), side: X.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(34, 12, [0, 32, 8], 5); panel(10, 34, [-36, 8, 6], 2.4); panel(16, 9, [24, 10, -28], 1.8); panel(20, 6, [0, 6, 40], 1.2);
  const pm = new X.PMREMGenerator(R3); scene.environment = pm.fromScene(env, 0.035).texture;
}
const hemi = new X.HemisphereLight('#DCE6FF', '#17181D', 0.55); scene.add(hemi);
const key = new X.DirectionalLight('#FFF3E3', 2.3); key.position.set(-7, 13, 9); scene.add(key);
const rim = new X.DirectionalLight('#7FA8FF', 1.8); rim.position.set(6, 7, -11); scene.add(rim);
const MAT = (c, o = {}) => new X.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMapIntensity: o.env ?? 1 });
const glowTex = (() => { const [c, x] = mkc(128, 128); const q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.25, 'rgba(170,205,255,.8)'); q.addColorStop(1, 'rgba(60,120,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return tex(c); })();
const glowMat = (c, op = 1) => new X.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, blending: X.AdditiveBlending, depthWrite: false });
const noiseCanvas = (w, h, base, amp, n = 9000, seed = 1) => {
  const [c, x] = mkc(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = R(seed * 100000 + i) < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${amp * R(seed * 100000 + i + 7)})`; x.fillRect(R(seed * 100000 + i + 3) * w, R(seed * 100000 + i + 5) * h, 2, 2); }
  return [c, x];
};

// ---------- the floor ----------
const FLOOR_Y = -8.95;
{
  const [c, x] = noiseCanvas(512, 512, '#14161B', 0.08, 14000, 2);
  x.strokeStyle = 'rgba(120,140,190,.10)'; x.lineWidth = 2; for (let i = 0; i <= 512; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; t0.repeat.set(90, 90);
  const fl = new X.Mesh(new X.PlaneGeometry(900, 900), MAT('#FFFFFF', { map: t0, r: 0.85, env: 0.4 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, FLOOR_Y, -150); scene.add(fl);
  const [sc, sx] = mkc(256, 256), q = sx.createRadialGradient(128, 128, 10, 128, 128, 128); q.addColorStop(0, 'rgba(0,0,0,.75)'); q.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = q; sx.fillRect(0, 0, 256, 256);
  const sh = new X.Mesh(new X.PlaneGeometry(14, 12), new X.MeshBasicMaterial({ map: tex(sc), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, FLOOR_Y + 0.02, 0); scene.add(sh);
}

// ---------- the saw: table, fence, cabinet (these turn to X-ray) ----------
const XR = [];                                       // materials that go see-through, with their edges drawn in blue
const xmat = (m) => { XR.push(m); return m; };
const EDGES = new X.Group(); scene.add(EDGES);
const edgeMat = new X.LineBasicMaterial({ color: '#6FA8FF', transparent: true, opacity: 0, depthWrite: false });
function solid(geo, mat, pos, parent = scene, edges = true) {
  const m = new X.Mesh(geo, mat); m.position.set(...pos); parent.add(m);
  if (edges) { const e = new X.LineSegments(new X.EdgesGeometry(geo, 30), edgeMat); e.position.set(...pos); EDGES.add(e); }
  return m;
}
const SAW = new X.Group(); scene.add(SAW);
const ironT = (() => { const [c, x] = noiseCanvas(512, 512, '#8A9099', 0.05, 9000, 3); x.strokeStyle = 'rgba(255,255,255,.035)'; x.lineWidth = 2; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(256, 256, 20 + i * 9, 0, TAU); x.stroke(); } return tex(c); })();
const TOP = solid(new X.BoxGeometry(7.0, 0.35, 6.0), xmat(MAT('#FFFFFF', { map: ironT, m: 0.65, r: 0.36 })), [0, -0.175, 0], SAW);
{
  const [c, x] = mkc(128, 512); x.fillStyle = '#26292F'; x.fillRect(0, 0, 128, 512); x.fillStyle = '#060708'; x.fillRect(60, 40, 8, 432);
  x.fillStyle = '#3A3E46'; [[20, 30], [108, 30], [20, 482], [108, 482]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 6, 0, TAU); x.fill(); });
  solid(new X.BoxGeometry(0.9, 0.02, 3.4), xmat(MAT('#FFFFFF', { map: tex(c), m: 0.3, r: 0.5 })), [0, 0.006, 0.1], SAW, false);
  [-1.6, 1.6].forEach((sx) => solid(new X.BoxGeometry(0.2, 0.02, 6.0), xmat(MAT('#0D0E11', { r: 0.8 })), [sx, 0.004, 0], SAW, false));
}
solid(new X.BoxGeometry(0.34, 0.62, 6.3), xmat(MAT('#C7CCD4', { m: 0.8, r: 0.28 })), [0.73, 0.31, 0.1], SAW);         // the fence (the board rides on it)
solid(new X.BoxGeometry(7.6, 0.4, 0.34), xmat(MAT('#B8BDC6', { m: 0.8, r: 0.3 })), [0, -0.45, 3.2], SAW);              // the fence rail
const CAB = solid(new X.BoxGeometry(5.4, 8.25, 4.8), xmat(MAT('#2A2E35', { m: 0.35, r: 0.5 })), [0, -4.47, 0], SAW);
solid(new X.BoxGeometry(5.9, 0.35, 5.3), xmat(MAT('#1C1F25', { m: 0.3, r: 0.6 })), [0, FLOOR_Y + 0.175, 0], SAW);       // the base
{
  const pad = solid(new X.BoxGeometry(1.1, 0.5, 0.22), xmat(MAT('#D3261B', { r: 0.4 })), [-1.6, -1.25, 2.55], SAW);      // the paddle switch
  const wheel = solid(new X.CylinderGeometry(0.62, 0.62, 0.18, 32), xmat(MAT('#C7CCD4', { m: 0.8, r: 0.3 })), [0.6, -3.3, 2.5], SAW); wheel.rotation.x = Math.PI / 2;
  const hub = solid(new X.CylinderGeometry(0.1, 0.1, 0.5, 16), xmat(MAT('#1A1C20', { r: 0.5 })), [0.6, -3.3, 2.75], SAW, false); hub.rotation.x = Math.PI / 2;
}

// ---------- the blade ----------
const RB = 1.27, NT = 40, BC = [0, -0.55, 0];          // radius, teeth, centre (on the arbor)
function bladeShape(R, n, h, chip = []) {
  const s0 = new X.Shape(), st = TAU / n;
  for (let i = 0; i < n; i++) {
    const a = i * st, P2 = (r, aa) => [r * Math.cos(aa), r * Math.sin(aa)];
    const pts = chip.includes(i) ? [P2(R - h, a), P2(R - h * 0.55, a + 0.3 * st), P2(R - h * 0.8, a + 0.7 * st)]
      : [P2(R - h, a), P2(R, a + 0.08 * st), P2(R - 0.022, a + 0.62 * st), P2(R - h * 0.75, a + 0.86 * st)];
    pts.forEach(([x0, y0], j) => (i === 0 && j === 0 ? s0.moveTo(x0, y0) : s0.lineTo(x0, y0)));
  }
  s0.closePath();
  const hole = new X.Path(); hole.absarc(0, 0, 0.08, 0, TAU, true); s0.holes.push(hole);
  return s0;
}
const bladeT = (() => {
  const [c, x] = mkc(1024, 1024), S2 = 1024 / (2 * RB), cx = 512;
  const q = x.createRadialGradient(cx, cx, 0, cx, cx, 512); q.addColorStop(0, '#9AA0A8'); q.addColorStop(0.5, '#6E747C'); q.addColorStop(0.86, '#8A9098'); q.addColorStop(1, '#C9CED5');
  x.fillStyle = q; x.fillRect(0, 0, 1024, 1024);
  x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 1.5; for (let r = 30; r < 500; r += 4) { x.beginPath(); x.arc(cx, cx, r, 0, TAU); x.stroke(); }
  x.fillStyle = '#20242B'; x.beginPath(); x.arc(cx, cx, 0.42 * S2, 0, TAU); x.fill();                          // the coated centre
  x.strokeStyle = '#0B0D10'; x.lineWidth = 7; x.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.3; x.beginPath(); x.moveTo(cx + Math.cos(a) * 0.98 * S2, cx + Math.sin(a) * 0.98 * S2); x.lineTo(cx + Math.cos(a + 0.12) * 0.82 * S2, cx + Math.sin(a + 0.12) * 0.82 * S2); x.stroke(); }
  setF(x, '700 34px Body', 0); x.fillStyle = 'rgba(255,255,255,.85)'; x.textAlign = 'center';
  x.save(); x.translate(cx, cx); x.rotate(-0.4); x.fillText('40T', 0, -0.25 * S2); x.restore();
  x.fillStyle = '#C9CED5'; x.beginPath(); x.arc(cx, cx, 0.16 * S2, 0, TAU); x.fill();
  const t0 = tex(c); t0.repeat.set(-1 / (2 * RB), 1 / (2 * RB)); t0.offset.set(0.5, 0.5); return t0;
})();
const bladeMat = MAT('#FFFFFF', { map: bladeT, m: 0.8, r: 0.3 });
function bladeMesh(chip) {
  const geo = new X.ExtrudeGeometry(bladeShape(RB, NT, 0.1, chip), { depth: 0.022, bevelEnabled: false, curveSegments: 3 });
  geo.translate(0, 0, -0.011); geo.rotateY(Math.PI / 2);
  const g0 = new X.Group(); g0.add(new X.Mesh(geo, bladeMat));
  const tips = new X.InstancedMesh(new X.BoxGeometry(0.036, 0.03, 0.05), MAT('#DADDE2', { m: 0.6, r: 0.25 }), NT - chip.length);
  const m4 = new X.Matrix4(), qq = new X.Quaternion(), e = new X.Euler(); let n = 0;
  for (let i = 0; i < NT; i++) {
    if (chip.includes(i)) continue;
    const a = (i + 0.06) * TAU / NT, th = Math.PI - a;            // shape angle a sits at world angle pi - a
    qq.setFromEuler(e.set(th, 0, 0)); m4.compose(v3([0, Math.sin(th) * (RB - 0.016), Math.cos(th) * (RB - 0.016)]), qq, v3([1, 1, 1])); tips.setMatrixAt(n++, m4);
  }
  g0.add(tips); return g0;
}
const ARBOR = new X.Group(); ARBOR.position.set(...BC); scene.add(ARBOR);       // drops after the stop
const BLADE = bladeMesh([]); ARBOR.add(BLADE);
const BLUR = (() => {                                // the blade at full speed: a disc you can see through
  const [c, x] = mkc(512, 512), cx = 256, k = 256 / RB;
  const q = x.createRadialGradient(cx, cx, 0, cx, cx, 256);
  q.addColorStop(0, 'rgba(40,44,52,.95)'); q.addColorStop(0.18, 'rgba(60,64,72,.9)'); q.addColorStop(0.42, 'rgba(120,126,136,.55)'); q.addColorStop(0.86, 'rgba(150,156,166,.5)');
  q.addColorStop(0.925, 'rgba(205,210,218,.72)'); q.addColorStop(0.985, 'rgba(225,230,236,.35)'); q.addColorStop(1, 'rgba(225,230,236,0)');
  x.fillStyle = q; x.beginPath(); x.arc(cx, cx, 256, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.08)'; for (let r = 40; r < 236; r += 9) { x.lineWidth = 1 + R(r) * 2; x.beginPath(); x.arc(cx, cx, r, 0, TAU); x.stroke(); }
  x.fillStyle = '#C9CED5'; x.beginPath(); x.arc(cx, cx, 0.16 * k, 0, TAU); x.fill();
  const m = new X.Mesh(new X.CircleGeometry(RB + 0.012, 96), new X.MeshStandardMaterial({ map: tex(c), transparent: true, metalness: 0.25, roughness: 0.42, envMapIntensity: 1.3, side: X.DoubleSide, depthWrite: false }));
  m.rotation.y = Math.PI / 2; ARBOR.add(m); return m;
})();
const GLINT = [0, 1].map((i) => { const s0 = new X.Sprite(glowMat('#FFFFFF', 0.8)); s0.scale.setScalar(0.32); ARBOR.add(s0); return s0; });
// the signal: a ring of blue light round the teeth, and sparks of it running round
const RING = (() => {
  const [c, x] = mkc(1024, 8); x.fillStyle = '#9CC4FF'; for (let i = 0; i < 1024; i += 64) x.fillRect(i, 0, 40, 8);
  const t0 = tex(c); t0.wrapS = X.RepeatWrapping; t0.repeat.set(3, 1);
  const m = new X.Mesh(new X.TorusGeometry(RB + 0.05, 0.016, 8, 240), new X.MeshBasicMaterial({ map: t0, color: '#7FB0FF', transparent: true, opacity: 0, blending: X.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.rotation.y = Math.PI / 2; ARBOR.add(m); return m;
})();
const SPARK = Array.from({ length: 10 }, () => { const s0 = new X.Sprite(glowMat('#8FBBFF', 0)); s0.scale.setScalar(0.22); ARBOR.add(s0); return s0; });
// under the table: arbor shaft, bracket, pulley, belt, motor (they ride down with the blade)
const INNER = new X.Group(); ARBOR.add(INNER);
{
  const steel = MAT('#9AA0A8', { m: 0.8, r: 0.32 }), dark = MAT('#30343B', { m: 0.4, r: 0.5 });
  const shaft = new X.Mesh(new X.CylinderGeometry(0.08, 0.08, 1.9, 16), steel); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.8; INNER.add(shaft);
  const nut = new X.Mesh(new X.CylinderGeometry(0.17, 0.17, 0.08, 6), steel); nut.rotation.z = Math.PI / 2; nut.position.x = -0.06; INNER.add(nut);
  const br = new X.Mesh(new X.BoxGeometry(0.5, 1.2, 0.7), dark); br.position.set(1.05, -0.45, 0); INNER.add(br);
  const pul = new X.Mesh(new X.CylinderGeometry(0.28, 0.28, 0.22, 24), steel); pul.rotation.z = Math.PI / 2; pul.position.x = 1.62; INNER.add(pul);
  const motor = new X.Mesh(new X.CylinderGeometry(0.62, 0.62, 2.0, 32), MAT('#3A4049', { m: 0.5, r: 0.4 })); motor.rotation.z = Math.PI / 2; motor.position.set(0.9, -3.0, 0.6); INNER.add(motor);
  const mp = new X.Mesh(new X.CylinderGeometry(0.2, 0.2, 0.22, 24), steel); mp.rotation.z = Math.PI / 2; mp.position.set(1.62, -3.0, 0.6); INNER.add(mp);
  const belt = new X.Mesh(new X.TubeGeometry(new X.CatmullRomCurve3([[1.62, 0.28, 0], [1.62, -1.5, 0.45], [1.62, -3.2, 0.62], [1.62, -2.85, 0.75], [1.62, -1.4, 0.2], [1.62, -0.25, -0.05]].map(v3), true), 80, 0.03, 6, true), MAT('#111214', { r: 0.8 }));
  INNER.add(belt);
}
// the brake cartridge behind the blade: a case, a spring, the aluminum pawl that fires into the teeth
const TH_B = (240 * Math.PI) / 180;                  // where the pawl meets the teeth (0 = front, 90 = top): low behind the blade
const CART = new X.Group(); ARBOR.add(CART);
CART.position.set(0, Math.sin(TH_B) * (RB + 0.62), Math.cos(TH_B) * (RB + 0.62)); CART.rotation.x = Math.atan2(Math.cos(TH_B), Math.sin(TH_B));   // its +y points out from the blade
const CASE_MAT = MAT('#E8A23A', { r: 0.45, m: 0.1 }); let CASE_SIDE = null;
{
  const [c, x] = mkc(256, 128); x.fillStyle = '#E8A23A'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#16181C'; x.fillRect(0, 84, 256, 44);
  x.fillStyle = '#16181C'; setF(x, '800 30px Logo', 0); x.textAlign = 'center'; x.fillText('BRAKE', 128, 60);
  x.fillStyle = '#E8A23A'; setF(x, '600 20px Body', 0); x.fillText('single-use', 128, 114);
  CART.add(new X.Mesh(new X.BoxGeometry(0.26, 0.55, 1.25), CASE_MAT));
  const side = new X.MeshStandardMaterial({ map: tex(c), roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }); CASE_SIDE = side;
  const dec = new X.Mesh(new X.PlaneGeometry(1.2, 0.5), side); dec.position.x = -0.132;
  dec.quaternion.setFromAxisAngle(v3([1, 0, 0]), Math.PI).multiply(new X.Quaternion().setFromAxisAngle(v3([0, 1, 0]), -Math.PI / 2)); CART.add(dec);   // on the case, reading left to right
}
const PAWL = new X.Mesh(new X.BoxGeometry(0.2, 0.3, 0.55), MAT('#DDE2EA', { m: 0.6, r: 0.22, e: '#9CC4FF', ei: 0 })); CART.add(PAWL);
const SPRING = (() => {
  const pts = []; for (let i = 0; i <= 160; i++) { const u = i / 160, a = u * 9 * TAU; pts.push(v3([Math.cos(a) * 0.07, u - 0.5, Math.sin(a) * 0.07])); }
  const m = new X.Mesh(new X.TubeGeometry(new X.CatmullRomCurve3(pts), 320, 0.012, 6), MAT('#D9DCE1', { m: 0.9, r: 0.2 })); CART.add(m); return m;
})();
const FIRE = new X.Sprite(glowMat('#FFD9A0', 0)); CART.add(FIRE);
const INNER_ALL = [INNER, CART];

// ---------- the board and the hot dog ----------
const BOARD = new X.Group(); scene.add(BOARD);
const BL = 3.2, HD_OFF = 2.0;                         // board length; the hot dog's centre sits 2.0 behind the leading edge
const TIP = HD_OFF - BL / 2 - 0.59;                  // its tip, pointing at the blade like a finger (board coordinates)
{
  const [c, x] = mkc(512, 128); x.fillStyle = '#D7B27E'; x.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 46; i++) { x.strokeStyle = `rgba(${120 + R(i) * 40},${80 + R(i + 1) * 30},${40},${0.12 + R(i + 2) * 0.22})`; x.lineWidth = 1 + R(i + 3) * 3; x.beginPath(); const y0 = R(i + 4) * 128; x.moveTo(0, y0); for (let k = 0; k <= 512; k += 32) x.lineTo(k, y0 + Math.sin(k / 70 + i) * 4); x.stroke(); }
  const wt = tex(c), wood = MAT('#FFFFFF', { map: wt, r: 0.72 }), end = MAT('#C49A63', { r: 0.8 });
  BOARD.add(new X.Mesh(new X.BoxGeometry(1.1, 0.18, BL), [end, end, wood, wood, end, end]));
}
const KERF = new X.Mesh(new X.BoxGeometry(0.035, 0.186, 1), MAT('#2A1E12', { r: 0.9 })); BOARD.add(KERF);
const HOTDOG = (() => {
  const m = new X.Mesh(new X.CapsuleGeometry(0.13, 0.92, 10, 24), new X.MeshPhysicalMaterial({ color: '#B4482F', roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.3, envMapIntensity: 0.8 }));
  m.rotation.x = Math.PI / 2; m.position.set(0, 0.22, HD_OFF - BL / 2); BOARD.add(m); return m;
})();
const NICK = new X.Mesh(new X.BoxGeometry(0.02, 0.06, 0.03), MAT('#E07A6A', { r: 0.6 })); NICK.position.set(0, 0.23, TIP + 0.012); NICK.visible = false; BOARD.add(NICK);
const BANDAGE = (() => {
  const [c, x] = mkc(256, 96); rrx(x, 4, 4, 248, 88, 40); x.fillStyle = '#E7C49B'; x.fill(); rrx(x, 88, 14, 80, 68, 10); x.fillStyle = '#F6E7D2'; x.fill();
  x.fillStyle = 'rgba(150,110,70,.35)'; for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(24 + (i % 3) * 18 + (i > 5 ? 160 : 0), 30 + Math.floor((i % 6) / 3) * 34, 3, 0, TAU); x.fill(); }
  const m = new X.Mesh(new X.PlaneGeometry(0.2, 0.075), new X.MeshBasicMaterial({ map: tex(c), transparent: true })); m.position.set(0, 0.22, TIP - 0.012); m.rotation.y = Math.PI;
  m.visible = false; BOARD.add(m); return m;
})();
// sawdust thrown off the teeth while the wood is cut
const DUST = (() => {
  const n = 900, geo = new X.BufferGeometry(); geo.setAttribute('position', new X.BufferAttribute(new Float32Array(3 * n), 3));
  const m = new X.Points(geo, new X.PointsMaterial({ color: '#E8CFA0', size: 0.03, transparent: true, opacity: 0.85, depthWrite: false })); scene.add(m);
  return { m, n, seeds: Array.from({ length: n }, (_, i) => ({ t: R(i * 7 + 11), vx: (R(i * 7 + 12) - 0.5) * 1.6, vy: 0.1 + R(i * 7 + 13) * 2.4, vz: 0.3 + R(i * 7 + 14) * 3.2, life: 0.4 + R(i * 7 + 15) * 0.7, y0: R(i * 7 + 16) * 0.12, z0: (R(i * 7 + 17) - 0.5) * 0.12 })) };
})();

// ---------- the brake and blade, lifted out (the cost) and flown to the tool companies ----------
const HERO = new X.Group(); scene.add(HERO); HERO.visible = false;
const HBLADE = bladeMesh([30, 31, 33]); HERO.add(HBLADE);
const HCART = CART.clone(); HCART.children.forEach((ch) => { if (ch.isSprite) ch.visible = false; }); HERO.add(HCART);
HCART.children[1].position.y = -0.31 - 0.2;        // its pawl, fired: jammed into the teeth, the spring let go
HCART.children[2].scale.y = 0.52; HCART.children[2].position.y = -0.08;

// ---------- the road, the tool companies, his own company ----------
const TOWN = new X.Group(); scene.add(TOWN);
{
  const [c, x] = mkc(64, 512); x.fillStyle = '#101216'; x.fillRect(0, 0, 64, 512); x.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 512; i += 64) x.fillRect(29, i, 6, 34);
  const t0 = tex(c); t0.wrapT = X.RepeatWrapping; t0.repeat.set(1, 12);
  const road = new X.Mesh(new X.PlaneGeometry(10, 210), MAT('#FFFFFF', { map: t0, r: 0.8, env: 0.3 })); road.rotation.x = -Math.PI / 2; road.position.set(0, FLOOR_Y + 0.02, -120); TOWN.add(road);
}
function factory(w, h, d, wall, glass, sign) {
  const f = new X.Group(), wallM = MAT(wall, { r: 0.6, m: 0.1, env: 1.4 });
  const body = new X.Mesh(new X.BoxGeometry(w, h, d), wallM); body.position.y = h / 2; f.add(body);
  const n = 4, tw = d / n, sh = new X.Shape(); sh.moveTo(0, 0); sh.lineTo(tw, 0); sh.lineTo(tw, h * 0.32); sh.closePath();
  for (let i = 0; i < n; i++) {
    const tg = new X.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); tg.rotateY(-Math.PI / 2); tg.translate(w / 2, 0, 0);
    const tooth = new X.Mesh(tg, wallM); tooth.position.set(0, h, d / 2 - tw * (i + 1)); f.add(tooth);
    const gl = new X.Mesh(new X.PlaneGeometry(w * 0.94, h * 0.3), new X.MeshBasicMaterial({ color: glass, toneMapped: false })); gl.position.set(0, h + h * 0.15, d / 2 - tw * (i + 1) + tw - 0.04); f.add(gl);
  }
  const [c, x] = mkc(512, 256); x.fillStyle = wall; x.fillRect(0, 0, 512, 256);
  x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(180, 110, 152, 146);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { if (i > 2 && i < 5) continue; x.fillStyle = glass; x.globalAlpha = 0.85; x.fillRect(22 + i * 60, 40 + r * 80, 36, 26); }
  x.globalAlpha = 1;
  if (sign) { x.fillStyle = sign; x.beginPath(); x.arc(256, 62, 38, 0, TAU); x.fill(); x.fillStyle = wall; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; x.beginPath(); x.moveTo(256 + Math.cos(a) * 26, 62 + Math.sin(a) * 26); x.lineTo(256 + Math.cos(a + 0.2) * 40, 62 + Math.sin(a + 0.2) * 40); x.lineTo(256 + Math.cos(a + 0.45) * 26, 62 + Math.sin(a + 0.45) * 26); x.fill(); } x.beginPath(); x.arc(256, 62, 8, 0, TAU); x.fill(); }
  const front = new X.Mesh(new X.PlaneGeometry(w, h), new X.MeshStandardMaterial({ map: tex(c), emissive: '#FFFFFF', emissiveMap: tex(c), emissiveIntensity: 0.75, roughness: 0.7 }));
  front.position.set(0, h / 2, d / 2 + 0.03); f.add(front);
  const ch = new X.Mesh(new X.CylinderGeometry(0.9, 1.1, h * 0.9, 16), wallM); ch.position.set(w * 0.32, h * 1.45, -d * 0.3); f.add(ch);
  return f;
}
const FACT = [[-10.5, -122], [10.5, -140], [-10.5, -158]].map(([x0, z0]) => { const f = factory(13, 8, 16, '#646B78', '#FFD27A'); f.position.set(x0, FLOOR_Y, z0); f.rotation.y = x0 < 0 ? 0.35 : -0.35; TOWN.add(f); return f; });
for (let i = 0; i < 9; i++) [-6, 6].forEach((x0) => {
  const z0 = -40 - i * 18, pole = new X.Mesh(new X.CylinderGeometry(0.12, 0.12, 6, 8), MAT('#2A2E35', { m: 0.5, r: 0.5 })); pole.position.set(x0, FLOOR_Y + 3, z0); TOWN.add(pole);
  const lamp = new X.Sprite(glowMat('#FFD9A0', 0.9)); lamp.scale.setScalar(2.4); lamp.position.set(x0, FLOOR_Y + 6.1, z0); TOWN.add(lamp);
});
const NEWF = factory(18, 10, 18, '#E9EEF6', '#8FC0FF', BLUE); NEWF.position.set(0, FLOOR_Y, -190); TOWN.add(NEWF);
const MINI = Array.from({ length: 5 }, () => {
  const m = new X.Group();
  m.add(new X.Mesh(new X.BoxGeometry(1.6, 1.5, 1.4), MAT('#3C4350', { m: 0.3, r: 0.5 }))); m.children[0].position.y = 0.75; m.scale.setScalar(1.7);
  const tp = new X.Mesh(new X.BoxGeometry(2.0, 0.12, 1.8), MAT('#8A9099', { m: 0.6, r: 0.4 })); tp.position.y = 1.56; m.add(tp);
  const d0 = new X.Mesh(new X.CircleGeometry(0.36, 24), MAT('#C9CED5', { m: 0.8, r: 0.3 })); d0.position.y = 1.62; d0.rotation.y = Math.PI / 2; m.add(d0);
  const gl = new X.Sprite(glowMat('#8FC0FF', 0.7)); gl.scale.setScalar(2.2); gl.position.y = 1.7; m.add(gl);
  m.visible = false; TOWN.add(m); return m;
});

// ---------- the camera: views, held or eased between ----------
const VIEW = {
  h0: [[-2.4, 1.5, 5.6], [0, 0.35, 1.25], 38], h1: [[-2.0, 1.3, 4.9], [0, 0.36, 1.2], 38], h2: [[-1.9, 1.25, 4.75], [0, 0.36, 1.2], 38],
  hero0: [[-12.5, 7.5, 17.5], [0, -3.2, 0.6], 40], hero1: [[-11.0, 6.4, 15.6], [0, -3.0, 0.5], 40],
  sig0: [[-7.4, 0.4, 1.6], [0, -0.55, 0.1], 40], sig1: [[-6.6, 1.2, 2.6], [0, -0.35, 0.4], 40],
  wood0: [[-3.2, 3.6, 6.2], [0, 0.0, 1.0], 40], wood1: [[-2.6, 2.8, 5.0], [0, 0.1, 1.0], 40],
  touch0: [[-1.3, 0.85, 2.1], [0, 0.33, 0.95], 34], touch1: [[-1.15, 0.8, 1.95], [0, 0.32, 0.94], 34],
  brk0: [[-8.2, -0.5, 0.3], [0, -1.0, -0.4], 40], brk1: [[-5.0, -1.4, -0.3], [0, -1.8, -0.75], 38],
  stp0: [[-7.6, 0.5, 1.0], [0, -0.6, 0.2], 40], stp1: [[-7.8, 1.6, 2.2], [0, -1.0, 0.4], 40],
  nick: [[-0.7, 0.85, 0.0], [0, 0.31, 0.95], 34],
  cost0: [[-5.2, 3.6, 5.6], [-0.3, 2.3, -0.6], 40], cost1: [[-4.8, 3.5, 5.2], [-0.3, 2.35, -0.6], 40],
  fac0: [[0, 20, -86], [0, 1.5, -142], 42], fac1: [[0, 18.5, -92], [0, 1.5, -145], 42],
  new0: [[0, 25, -122], [0, 5, -196], 40], new1: [[0, 23.5, -127], [0, 5, -196], 40],
};
const v = (name, t) => [t, ...VIEW[name][0], ...VIEW[name][1], VIEW[name][2]];
const CAM = [v('h0', 0), v('h1', K.bladeW + 0.3), v('h2', K.finger + 0.4), v('hero0', K.stopsW), v('hero1', K.signal - 0.1), v('sig0', K.tiny), v('sig1', K.woodW - 0.25),
  v('wood0', K.barely), v('wood1', K.instant - 0.15), v('touch0', K.touch - 0.05), v('touch1', K.brake - 0.1), v('brk0', K.spring + 0.1), v('brk1', K.into), v('brk1', K.stop - 0.05),
  v('stp0', K.dead + 0.2), v('stp1', K.blink - 0.1), v('stp1', K.nick - 0.12), v('nick', K.nick + 0.25), v('nick', K.cost - 0.12), v('cost0', K.cost + 0.1), v('cost0', K.brakeC), v('cost1', K.offeredW - 0.15),
  v('fac0', K.companies + 0.35), v('fac1', K.started - 0.05), v('new0', K.ownW + 0.2), v('new1', K.tense + 1)];
const HPATH = new X.CatmullRomCurve3([[0, 2.65, -0.35], [0.6, 4.6, -24], [-0.6, 7.2, -68], [0, 8.6, -108]].map(v3));
const flyU = (t) => eio((t - K.offeredW) / (K.companies - K.offeredW));
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  const base = kf(t, CAM), fw = win(t, K.offeredW - 0.25, K.companies - 0.05, 0.3, 0.4);
  if (fw <= 0) return base;
  const p = HPATH.getPointAt(clamp(flyU(t))), ahead = HPATH.getPointAt(clamp(flyU(t) + 0.06));
  const fol = [p.x + 2.6, p.y + 1.7, p.z + 6.8, ahead.x, ahead.y - 0.3, ahead.z, 44];
  return base.map((q, i) => lerp(q, fol[i], eio(fw)));
}
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }

// ---------- the timeline of the machine ----------
const W_SLOW = 1.1;                                  // the blade's turn in slow motion, rad/s on screen
function spin(t) {                                   // the blade's angle
  if (t < K.touch) return t * 2.4;
  const a0 = K.touch * 2.4;
  if (t < K.into) return a0 + W_SLOW * (t - K.touch);
  const D = K.dead - K.into, u = clamp((t - K.into) / D);
  return a0 + W_SLOW * (K.into - K.touch) + W_SLOW * D * (u - u * u / 2);
}
const xray = (t) => win(t, K.signal - 0.1, K.nick - 0.15, 0.45, 0.3);          // the table and cabinet go see-through
const zLead = (t) => {                               // where the board's leading edge is (z): mid-cut from the first frame,
  if (t < K.touch) return lerp(0.4, 1.524 - HD_OFF, t / K.touch);                // the hot dog's tip meets the teeth at the touch
  return 1.524 - HD_OFF - 0.0004 * (t - K.touch);
};
const pawlK = (t) => Math.pow(clamp((t - K.fires) / (K.into - K.fires)), 2.2);   // the pawl's travel into the teeth
const dropK = (t) => eio((t - K.drops) / (K.table - K.drops));
const liftK = (t) => eio((t - K.costs + 0.05) / 0.55);

function setWorld(t) {
  const c = camAt(t); cam.position.set(c[0], c[1], c[2]); cam.fov = c[6]; cam.updateProjectionMatrix(); cam.lookAt(c[3], c[4], c[5]);
  const town = t >= K.offered - 0.3, xr = xray(t);
  SAW.visible = ARBOR.visible = BOARD.visible = !town || t < K.companies + 0.2; TOWN.visible = town;
  const see = xr > 0.01;                             // opaque materials stay in the opaque pass, so the blade's blur draws over them
  XR.forEach((m) => { if (m.transparent !== see) { m.transparent = see; m.needsUpdate = true; } m.opacity = lerp(1, 0.13, xr); m.depthWrite = !see; });
  [CASE_MAT, CASE_SIDE].forEach((m) => { if (m.transparent !== see) { m.transparent = see; m.needsUpdate = true; } m.opacity = lerp(1, 0.42, xr); m.depthWrite = !see; });
  edgeMat.opacity = 0.75 * xr; EDGES.visible = xr > 0.01;
  INNER_ALL.forEach((o) => { o.visible = xr > 0.01 && t < K.costs + 0.1; });
  // the blade: a blur at full speed, then sharp and turning slowly once time slows at the touch
  const ang = spin(t), fast = 1 - clamp((t - K.touch) / 0.22);
  BLADE.rotation.x = ang; BLUR.material.opacity = fast; BLADE.visible = fast < 1 || xr > 0.01; BLUR.visible = fast > 0;
  BLADE.children.forEach((m) => { if (m.material) { m.material.transparent = fast > 0; m.material.opacity = 1 - fast * 0.85; } });
  GLINT.forEach((s0, i) => { const a = t * 1.7 + i * 2.1; s0.visible = fast > 0.05; s0.material.opacity = 0.55 * fast; s0.position.set(-0.03, Math.sin(a) * (RB - 0.04), Math.cos(a) * (RB - 0.04)); });
  ARBOR.position.y = BC[1] - 1.55 * dropK(t); ARBOR.visible = ARBOR.visible && t < K.costs + 0.1;
  // the signal: on from "tiny electrical signal", red and gone at the touch
  const sig = win(t, K.tiny - 0.2, K.touch + 0.5, 0.4, 0.4), hit = clamp((t - K.touch) / 0.15);
  RING.visible = sig > 0; RING.material.opacity = 0.9 * sig; RING.material.color.set(hit > 0 ? mixc('#7FB0FF', '#FF5A4E', hit) : '#7FB0FF');
  RING.material.map.offset.x = -t * 0.35 * (fast > 0.5 ? 1 : 0.05);
  SPARK.forEach((s0, i) => {
    const on = sig > 0 && t < K.touch + 0.6; s0.visible = on; if (!on) return;
    const a = (t < K.touch ? t * 2.6 : K.touch * 2.6) + i * TAU / SPARK.length;
    const intoDog = clamp((t - K.touch) / 0.5);
    const p0 = [0, Math.sin(a) * (RB + 0.05), Math.cos(a) * (RB + 0.05)], dog = [0, 0.86, 0.974];
    s0.position.set(lerp(p0[0], dog[0], intoDog * (i % 2)), lerp(p0[1], dog[1], intoDog * (i % 2)), lerp(p0[2], dog[2], intoDog * (i % 2)));
    s0.material.opacity = 0.85 * sig * (1 - intoDog * 0.6); s0.material.color.set(hit > 0 ? '#FF7A6E' : '#8FBBFF');
  });
  // the brake: the pawl fires into the teeth on "into", the spring behind it unloads
  const pk = pawlK(t); PAWL.position.y = -0.31 - 0.2 * pk; PAWL.material.emissiveIntensity = 0.35 * win(t, K.alum - 0.1, K.dead + 0.4, 0.3, 0.4) + 0.9 * Math.max(0, 1 - Math.abs(t - K.into) / 0.35);
  const sl0 = 0.32, sl = sl0 + 0.2 * pk; SPRING.scale.y = sl; SPRING.position.y = -0.16 - 0.2 * pk + sl / 2 + 0.02;
  FIRE.visible = t > K.into - 0.05 && t < K.into + 0.6; FIRE.position.set(0, -0.5, 0); FIRE.material.opacity = 1 - clamp((t - K.into) / 0.6); FIRE.scale.setScalar(0.9 + 1.4 * clamp((t - K.into) / 0.3));
  // the board feeds in; the kerf grows behind the blade; the hot dog gets its nick, then a bandage
  const zl = zLead(t); BOARD.position.set(0, 0.09, zl + BL / 2);
  const cut = clamp(1.039 - zl, 0, BL); KERF.visible = cut > 0.01; KERF.scale.z = Math.max(cut, 0.01); KERF.position.z = -BL / 2 + cut / 2;
  NICK.visible = t > K.touch + 0.05; BANDAGE.visible = t > K.nickW - 0.02; BANDAGE.scale.setScalar(back(clamp((t - K.nickW + 0.02) / 0.3)) || 0.001);
  // sawdust while the wood is cut (frozen when time slows)
  const d0 = -0.9, d1 = K.touch, pos = DUST.m.geometry.attributes.position; let shown = 0;
  DUST.seeds.forEach((s0, i) => {
    const ts = d0 + s0.t * (d1 - d0), tt = Math.min(t, d1 + (t - d1) * 0.002) - ts, live = t >= ts && tt < s0.life && t < K.nick;
    if (!live) { pos.setXYZ(i, 0, -50, 0); return; }
    shown++; pos.setXYZ(i, s0.vx * tt, 0.14 + s0.y0 + s0.vy * tt - 3.0 * tt * tt, 1.0 + s0.z0 + s0.vz * tt);
  });
  pos.needsUpdate = true; DUST.m.visible = shown > 0;
  // the cost: brake and blade lifted out, jammed together; then flown down the road
  const lk = liftK(t); HERO.visible = t > K.costs - 0.05 && t < K.started + 0.6;
  if (HERO.visible) {
    if (t < K.offeredW) {
      HERO.position.set(0, lerp(BC[1] - 1.55, 2.65, lk), lerp(0, -0.35, lk)); HERO.rotation.set(0, lerp(0, 0.55, lk) + 0.08 * Math.sin(t * 1.3), 0.06 * Math.sin(t * 0.9));
    } else if (t < K.companies) {
      const p = HPATH.getPointAt(clamp(flyU(t))); HERO.position.copy(p); HERO.rotation.set(0, 0.55 - flyU(t) * 0.55, 0);
    } else {
      const rej = eio((t - K.told) / 0.6), go = eio((t - K.started) / (K.ownW - K.started + 0.1));
      const p = [0, 8.6 - 1.6 * rej + 0.15 * Math.sin(t * 2.2), -108 + 3 * rej];
      HERO.position.set(lerp(p[0], 0, go), lerp(p[1], -6.4, go), lerp(p[2], -180, go)); HERO.rotation.set(0.35 * rej * (1 - go), 0, 0); HERO.scale.setScalar(1 - 0.8 * go);
    }
  }
  // his own company rises; saws roll out of it
  const up = eio((t - K.started) / (K.ownW - K.started)); NEWF.visible = up > 0; NEWF.scale.set(1, Math.max(up, 0.001), 1);
  MINI.forEach((m, i) => { const t0 = K.ownW + 0.15 + 0.16 * i, u = t - t0; m.visible = u > 0; if (u > 0) m.position.set(0, FLOOR_Y, -181 + u * 11); });
}

// ---------- 2D: backdrop, labels, small print ----------
function backdrop(x, t) {
  x.fillStyle = '#05060A'; x.fillRect(0, 0, W, H);
  const q = x.createRadialGradient(540, 700, 60, 540, 860, 1300); q.addColorStop(0, 'rgba(70,80,105,.55)'); q.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = q; x.fillRect(0, 0, W, H);
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
  x.globalAlpha = a * 0.8; setF(x, '500 25px Body', 0); x.fillStyle = '#A1A1A6'; x.textAlign = 'center';
  const words = str.split(' '), lines = ['']; words.forEach((w) => { const tl = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + w : w; if (x.measureText(tl).width > 960 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tl; });
  lines.forEach((l, i) => x.fillText(l, 540, 1832 - (lines.length - 1 - i) * 32)); x.restore();
}
function glass(x, X0, Y0, w, h, a) {                 // a dark glass panel
  x.save(); x.globalAlpha = a; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 40; rrx(x, X0, Y0, w, h, 34); x.fillStyle = 'rgba(14,16,22,.86)'; x.fill(); x.shadowBlur = 0;
  x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.14)'; x.stroke(); x.restore();
}
function chip(x, str, cx, cy, col, a, size = 34) {
  if (a <= 0) return; x.save(); x.globalAlpha = a; setF(x, '700 ' + size + 'px Body', 0); const w = x.measureText(str).width + size * 1.1;
  rrx(x, cx - w / 2, cy - size * 0.78, w, size * 1.56, size * 0.78); x.fillStyle = col; x.fill(); x.fillStyle = WHT; x.textAlign = 'center'; x.fillText(str, cx, cy + size * 0.35); x.restore();
}
// "about as salty and wet as a finger": the two side by side
function sausage(x, cx, cy, w, h, finger) {
  x.save(); x.translate(cx, cy);
  const q = x.createLinearGradient(0, -h / 2, 0, h / 2);
  if (finger) { q.addColorStop(0, '#F4C7A5'); q.addColorStop(0.55, '#E2A57F'); q.addColorStop(1, '#B9785A'); } else { q.addColorStop(0, '#D9694D'); q.addColorStop(0.55, '#B4482F'); q.addColorStop(1, '#7E2C1B'); }
  rrx(x, -w / 2, -h / 2, w, h, h / 2); x.fillStyle = q; x.fill();
  if (finger) {
    x.fillStyle = 'rgba(255,236,228,.95)'; rrx(x, w / 2 - h * 1.05, -h * 0.36, h * 0.82, h * 0.6, h * 0.24); x.fill();
    x.strokeStyle = 'rgba(120,60,40,.45)'; x.lineWidth = 3; [-0.05, 0.12].forEach((u) => { x.beginPath(); x.moveTo(u * w, -h * 0.38); x.quadraticCurveTo(u * w + 6, 0, u * w, h * 0.38); x.stroke(); });
  } else { x.fillStyle = 'rgba(255,255,255,.28)'; rrx(x, -w / 2 + h * 0.4, -h * 0.34, w - h * 0.8, h * 0.16, h * 0.08); x.fill(); }
  x.restore();
}
function compareCard(x, t) {
  const a = win(t, K.salty + 0.05, K.stops - 0.05, 0.25, 0.2); if (a <= 0) return;
  const s0 = back(clamp((t - K.salty - 0.05) / 0.35)); x.save(); x.translate(540, 1150); x.scale(lerp(0.9, 1, s0), lerp(0.9, 1, s0)); x.translate(-540, -1150);
  glass(x, 90, 900, 900, 500, a);
  x.globalAlpha = a; setF(x, '700 40px Body', 0); x.fillStyle = WHT; x.textAlign = 'center';
  sausage(x, 300, 1040, 300, 84, false); sausage(x, 780, 1040, 300, 74, true);
  x.fillText('hot dog', 300, 1146); x.fillText('finger', 780, 1146);
  setF(x, '800 92px Logo', 0); x.fillText('≈', 540, 1072);
  chip(x, 'same salt', 400, 1270, BLUE, clamp((t - K.saltyW + 0.05) / 0.25) * a); chip(x, 'same water', 690, 1270, BLUE, clamp((t - K.wet + 0.05) / 0.25) * a);
  x.restore();
}
// the blade's signal on a scope: steady through wood, it drops at the touch
function scope(x, t) {
  const a = win(t, K.tiny + 0.1, K.changes + 0.3, 0.3, 0.25); if (a <= 0) return;
  const X0 = 110, Y0 = 1360, w = 860, h = 300;
  glass(x, X0, Y0, w, h, a);
  x.save(); x.globalAlpha = a; setF(x, '700 30px Body', 0); x.fillStyle = 'rgba(255,255,255,.7)'; x.textAlign = 'left'; x.fillText('blade signal', X0 + 34, Y0 + 52);
  x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 2; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(X0 + i * w / 6, Y0 + 78); x.lineTo(X0 + i * w / 6, Y0 + h - 24); x.stroke(); }
  const hit = clamp((t - K.touch) / 0.08), cyc = 7, mid = Y0 + 170, tt = Math.min(t, K.touch + 0.1);
  x.beginPath();
  for (let i = 0; i <= 200; i++) {
    const u = i / 200, px = X0 + 34 + u * (w - 68), tAt = tt - (1 - u) * 1.2, dropped = t >= K.touch && tAt > K.touch - 0.02 ? 0.22 : 1;
    const amp = 70 * (t >= K.touch ? lerp(1, dropped, hit) : 1) * (1 + 0.04 * Math.sin(u * 40 + t * 9) * (t > K.woodW - 0.3 && t < K.touch ? 1 : 0));
    const py = mid + Math.sin(u * cyc * TAU - tt * 14) * amp; i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  const col = t >= K.touch ? RED : '#7FB0FF'; x.strokeStyle = col; x.lineWidth = 6; x.shadowColor = col; x.shadowBlur = 18; x.stroke(); x.restore();
  chip(x, 'wood: no change', X0 + w - 190, Y0 + 44, '#1F7A3A', win(t, K.barely - 0.1, K.skin - 0.05, 0.25, 0.2) * a, 28);
  chip(x, 'skin: it changes', X0 + w - 190, Y0 + 44, '#B3261E', clamp((t - K.touch) / 0.2) * a, 28);
}
// slow motion: a clock in milliseconds from the touch to the stop
function slowClock(x, t) {
  chip(x, 'slow motion', 540, 470, '#3A3F4B', win(t, K.touch + 0.05, K.changes + 0.4, 0.2, 0.2), 30);   // until the clock takes over from the scope
  const a = win(t, K.changes + 0.35, K.drops + 0.2, 0.25, 0.3); if (a <= 0) return;
  const ms = 4.6 * clamp((t - K.touch) / (K.dead - K.touch)), stopped = t >= K.dead;
  x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 30;
  if (!stopped) {
    setF(x, '800 120px Logo', -3); x.fillStyle = WHT; x.fillText(ms.toFixed(1) + ' ms', 540, 1560);
    x.restore(); chip(x, 'slow motion', 540, 1630, '#3A3F4B', a, 30); return;
  }
  x.restore();
  pill(x, 'stopped in under 5 ms', 540, 1530, 52, false, clamp((t - K.dead) / 0.3), { f: 'Body', w: 700, bg: RED, fg: WHT });
}
// faster than a blink: two bars to the same scale
function blinkCard(x, t) {
  const a = win(t, K.blink - 0.05, K.nick + 0.05, 0.2, 0.2); if (a <= 0) return;
  glass(x, 90, 1210, 900, 360, a);
  x.save(); x.globalAlpha = a; setF(x, '700 38px Body', 0); x.textAlign = 'left'; x.fillStyle = WHT;
  const full = 760, gk = ease(clamp((t - K.blink) / 0.45));
  x.fillText('the saw stops', 150, 1290); rrx(x, 150, 1310, Math.max(10, full * (5 / 120) * gk), 44, 10); x.fillStyle = RED; x.fill();
  x.fillStyle = WHT; x.fillText('you blink', 150, 1420); rrx(x, 150, 1440, full * gk, 44, 10); x.fillStyle = '#9CC4FF'; x.fill();
  setF(x, '600 30px Body', 0); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('under 5 ms', 150 + 40, 1342 + 0); x.textAlign = 'right'; x.fillText('about 100+ ms', 150 + full, 1530);
  x.restore();
}
// "safety doesn't sell": the line, big
function quote(x, t) {
  const a = win(t, K.safety - 0.1, L_SELL_E + 0.3, 0.2, 0.3); if (a <= 0) return;
  x.save(); x.globalAlpha = a * 0.55; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.restore();
  x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 40;
  setF(x, '800 124px Logo', -4); x.fillStyle = WHT;
  const w1 = clamp((t - K.safety + 0.05) / 0.2), w2 = clamp((t - K.sellW + 0.25) / 0.2);
  x.globalAlpha = a * w1; x.fillText('“Safety', 540, 980); x.globalAlpha = a * w2; x.fillText('doesn’t sell.”', 540, 1120);
  x.globalAlpha = a * w2; x.shadowBlur = 0; x.fillStyle = RED; rrx(x, 250, 1150, 580 * expo(clamp((t - K.sellW) / 0.3)), 12, 6); x.fill();
  setF(x, '600 34px Body', 0); x.fillStyle = 'rgba(255,255,255,.75)'; x.globalAlpha = a * w2; x.fillText('what he says the tool companies told him', 540, 1240);
  x.restore();
}
const L_SELL_E = LN.sell.e;
// a red X on each tool company as they say no
function noMarks(x, t) {
  FACT.forEach((f, i) => {
    const t0 = K.told + 0.16 * i, k = clamp((t - t0) / 0.25), a = k * (1 - clamp((t - K.started + 0.2) / 0.3)); if (a <= 0) return;
    const [px, py, vis] = project([f.position.x + (f.position.x < 0 ? 4.5 : -4.5), f.position.y + 5, f.position.z + 7]); if (!vis) return;
    x.save(); x.globalAlpha = a; x.translate(px, py); const sc = back(k); x.scale(sc, sc); x.strokeStyle = RED; x.lineWidth = 18; x.lineCap = 'round'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 16;
    x.beginPath(); x.moveTo(-46, -46); x.lineTo(46, 46); x.moveTo(46, -46); x.lineTo(-46, 46); x.stroke(); x.restore();
  });
}
function flash(x, t, t0, a = 0.85) { const u = t - t0; if (u < -0.06 || u > 0.2) return; x.fillStyle = 'rgba(255,255,255,' + (u < 0 ? (u + 0.06) / 0.06 : 1 - u / 0.2) * a + ')'; x.fillRect(0, 0, W, H); }

// ---------- the 3D shot ----------
function three(x, t) {
  setWorld(t); backdrop(x, t);
  x.save(); x.translate(jolt(t, K.into, 16) + jolt(t, K.table, 9) + jolt(t, K.single, 6), 0);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  // labels
  label(x, BOARD.localToWorld(v3([0.1, 0.35, HD_OFF - BL / 2 + 0.2])).toArray(), 60, -260, 'hot dog', win(t, K.hot - 0.05, K.salty - 0.1, 0.3, 0.2));
  label(x, [0, -0.55 + RB * 0.98, 0.25], 80, 250, 'spinning blade', win(t, K.stopsW - 0.1, K.signal, 0.3, 0.2));
  label(x, ARBOR.localToWorld(v3([0, RB + 0.05, 0])).toArray(), 0, 150, 'tiny electrical signal', win(t, K.tiny - 0.05, K.woodW - 0.2, 0.3, 0.2), { bg: BLUE, fg: WHT });
  label(x, BOARD.localToWorld(v3([-0.1, 0.35, TIP + 0.4])).toArray(), -40, -280, 'skin conducts', win(t, K.conducts - 0.1, K.touch + 0.1, 0.3, 0.2));
  label(x, CART.localToWorld(v3([0, 0.05, 0])).toArray(), -40, 330, 'spring', win(t, K.spring - 0.1, K.alum - 0.05, 0.3, 0.2));
  label(x, CART.localToWorld(v3([0, PAWL.position.y - 0.1, 0.2])).toArray(), -40, 300, 'aluminum brake', win(t, K.alum - 0.1, K.stop + 0.2, 0.3, 0.2), { bg: BLUE, fg: WHT });
  label(x, ARBOR.localToWorld(v3([0, RB * 0.75, 0.3])).toArray(), 60, 120, 'drops below the table', win(t, K.drops + 0.05, K.blink - 0.1, 0.3, 0.2));
  label(x, BOARD.localToWorld(v3([0, 0.3, TIP + 0.01])).toArray(), 0, -250, 'a nick', win(t, K.nickW - 0.1, K.cost - 0.3, 0.3, 0.12));
  if (HERO.visible && t < K.offeredW) {
    label(x, HCART.localToWorld(v3([0, 0.25, 0])).toArray(), 40, -300, 'single-use', win(t, K.single - 0.1, K.offered - 0.05, 0.3, 0.15), { bg: RED, fg: WHT });
    label(x, HBLADE.localToWorld(v3([0, RB * 0.55, 0.6])).toArray(), -40, 320, 'blade: usually ruined', win(t, K.ruined - 0.3, K.offered - 0.05, 0.3, 0.15));
  }
  if (TOWN.visible) {
    label(x, [0, FLOOR_Y + 10, -140], 0, -330, 'big tool companies', win(t, K.big - 0.05, K.told + 0.2, 0.3, 0.2));
    label(x, [0, FLOOR_Y + 13.5, -190], 0, -260, 'his own saw company', win(t, K.ownW - 0.05, 99, 0.3, 0.2), { bg: BLUE, fg: WHT });
  }
  noMarks(x, t);
  x.restore();
  compareCard(x, t); scope(x, t); slowClock(x, t); blinkCard(x, t); quote(x, t);
  flash(x, t, K.into, 0.5);
  const FP = [[0, K.signal, 'A hot dog has about the same salt and moisture as a finger, so it stands in for one in the famous demo (NPR, 2010).'],
    [K.signal, K.blink, 'How SawStop’s system works, per NPR, Woodcraft and ToolsToday. The clock is an illustration of “under 5 ms”.'],
    [K.blink, K.nick, 'A blink lasts roughly 100 to 150 milliseconds.'],
    [K.cost, K.offered, 'After it fires, the brake cartridge must be replaced, and the blade usually is too (Woodcraft, SawStop).'],
    [K.offered, K.tense, 'Inventor Steve Gass, a woodworker, physicist and patent attorney, speaking to NPR in 2010. Buildings are generic.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.saw = three;

// ---------- the tension: the colour drains, a heartbeat, a clock ----------
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, K.freeze); FRZ = c; } return FRZ; }
S.tense = (x, t) => {
  const tk = clamp((t - K.tense) / (T0.phone - K.tense)), hb = Math.max(...BEATS.map((q) => bump(t, q, 0.22)));
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.save(); zoomAt(x, 540, 960, 1 + 0.02 * hb + 0.03 * tk); x.translate(jolt(t, T0.phone - 0.28, 12), 0);
  x.filter = 'saturate(' + (1 - 0.85 * tk) + ') brightness(' + (1 - 0.3 * tk) + ') contrast(' + (1 + 0.12 * tk) + ')';
  x.drawImage(frozen(), 0, 0); x.filter = 'none'; x.restore();
  vignette(x, 0.75 * tk);
};

// ---------- the switch: the reel you were watching, in a phone; then it is your ad ----------
const PHN = { cy: 610, s: 0.62 };
function heart(c, X0, Y, r) { c.beginPath(); c.moveTo(X0, Y + r * 0.9); c.bezierCurveTo(X0 - r * 1.6, Y - r * 0.1, X0 - r * 0.8, Y - r * 1.3, X0, Y - r * 0.45); c.bezierCurveTo(X0 + r * 0.8, Y - r * 1.3, X0 + r * 1.6, Y - r * 0.1, X0, Y + r * 0.9); c.fill(); }
function rail(c) {
  c.save(); c.fillStyle = WHT; c.strokeStyle = WHT; c.lineWidth = 6; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10;
  heart(c, 544, 690, 32);
  c.beginPath(); c.arc(544, 806, 28, 0.35 * Math.PI, 2.25 * Math.PI); c.lineTo(522, 840); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(514, 902); c.lineTo(576, 880); c.lineTo(554, 942); c.lineTo(543, 914); c.closePath(); c.stroke();
  c.restore();
}
function acct(c, name, sub, a) {
  if (a <= 0) return; c.save(); c.globalAlpha = a; c.textAlign = 'left';
  c.beginPath(); c.arc(60, 1010, 31, 0, TAU); c.fillStyle = sub ? '#8E8E93' : '#111'; c.fill(); c.lineWidth = 3; c.strokeStyle = WHT; c.stroke();
  setF(c, '700 28px Logo', 0); c.fillStyle = WHT; c.textAlign = 'center'; c.fillText(sub ? 'Y' : 'm.', 60, 1020); c.textAlign = 'left';
  setF(c, '600 33px Body', 0); c.fillText(name, 106, sub ? 1004 : 1022);
  if (sub) { setF(c, '500 27px Body', 0); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(sub, 106, 1040); }
  else { const w = c.measureText(name).width; rrx(c, 122 + w, 988, 112, 46, 12); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke(); setF(c, '600 26px Body', 0); c.fillText('Follow', 138 + w, 1020); }
  c.restore();
}
function reelUI(c, t) {
  c.drawImage(frozen(), -60, 0, 720, 1280);
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = q; c.fillRect(0, 760, 600, 520);
  rail(c);
  const ad = ease((t - K.ad) / 0.35);
  acct(c, 'mezmedia_0', null, 1 - ad); acct(c, 'yourbrand', 'Sponsored', ad);
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left'; c.fillText('The saw that stops for a hot dog…', 30, 1090);
  if (ad > 0) {
    c.save(); c.globalAlpha = ad; c.translate(0, 50 * (1 - ad)); rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill();
    setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.8, 7);
  const kt = (t - T0.phone - 0.3) / 0.3;
  if (kt > 0) {
    const n = Math.round(NUM * clamp((t - K.watched) / (K.num34 - K.watched))), str = '0:' + String(n).padStart(2, '0');
    c.save(); c.globalAlpha = clamp(kt); setF(c, '600 46px Body', 0); const tw = c.measureText(str).width;
    rrx(c, 300 - tw / 2 - 62, 112, tw + 104, 80, 40); c.fillStyle = 'rgba(0,0,0,.62)'; c.fill();
    c.fillStyle = RED; c.beginPath(); c.arc(300 - tw / 2 - 28, 152, 12, 0, TAU); c.fill();
    c.fillStyle = WHT; c.textAlign = 'left'; c.fillText(str, 300 - tw / 2 - 2, 168); c.restore();
  }
}
S.phone = (x, t) => {
  stage(x, true);
  if (!IMG.reelscr) IMG.reelscr = mkc(1200, 2560)[0];
  const k = eio((t - T0.phone) / 0.6);
  phone(x, P(540, lerp(960, PHN.cy, k), PHN.s * Math.pow(1.8 / PHN.s, 1 - k)), 'reelscr', { frame: 'frameDark', shadow: k, over: (c) => reelUI(c, t) });
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
  const top = t >= T0.phone ? 1215 : CAPY;
  const fade = clamp((c.e - t) / 0.12) * clamp((t - c.s + 1 / FPS) / 0.06) * (t >= T0.phone && t < T0.pitch ? clamp((t - T0.phone - 0.32) / 0.15) : 1);
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

// ---------- overlay: the clock under the tension ----------
window.overlay = (t) => {
  if (t < T0.tense || t >= T0.phone) return;
  const kc = (t - K.tense - 0.1) / 0.25;
  if (kc > 0) {
    g.save(); g.globalAlpha = clamp(kc); setF(g, '600 64px Body', 0); const str = '0:' + String(Math.floor(t)).padStart(2, '0'), tw = g.measureText(str).width;
    rrx(g, 540 - tw / 2 - 86, 1506, tw + 140, 108, 54); g.fillStyle = 'rgba(0,0,0,.72)'; g.fill();
    g.fillStyle = (t * 2) % 1 < 0.6 ? RED : 'rgba(255,59,48,.35)'; g.beginPath(); g.arc(540 - tw / 2 - 40, 1560, 15, 0, TAU); g.fill();
    g.fillStyle = WHT; g.textAlign = 'left'; g.fillText(str, 540 - tw / 2 - 8, 1582); g.restore();
  }
};
