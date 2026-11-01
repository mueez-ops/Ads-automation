// Browser-side scene for reel_equals.js. Runs as a module after three.js (imported as X), the 2D kit and the phone engine
// (reel_phone_kit.js), whose globals it uses: W, H, g, IMG, clamp, lerp, sstep, ease, expo, eio, back, bump, jolt, mkc,
// rrx, setF, pill, phone, P, stage, rise, zoomAt, vignette, mixc, INK, WHT, GREY... It fills S and replaces the kit's
// captions with the Face ID reel's: at the top, building word by word.
// One study in 1557 (1 unit = 1 m): a desk against the back wall under a leaded window, a candle, an inkwell, an open
// book whose right page is written as the scene runs, a closed copy of The Whetstone of Witte; Robert Recorde in a black
// gown and a flat cap, writing with a quill. Two more sets far from it: twin gold lines running to infinity in the dark
// (y = 100) and a calculator on a clean desk (y = 200).

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

// ---------- the study, 1557: a desk under a leaded window, a candle, an open book, a quill, Robert Recorde ----------
const ROOM = new X.Group(); scene.add(ROOM);
const plankTex = (() => {
  const [c, x] = noiseCanvas(512, 512, '#4A3020', 0.1, 12000, 11);
  for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(${RN(i + 500) < 0.5 ? '78,50,30' : '38,24,14'},.4)`; x.fillRect(0, i * 64, 512, 64); x.fillStyle = 'rgba(15,9,5,.85)'; x.fillRect(0, i * 64, 512, 3); }
  for (let i = 0; i < 320; i++) { x.strokeStyle = `rgba(22,13,7,${0.12 + 0.2 * RN(i + 600)})`; x.lineWidth = 1; const y0 = 512 * RN(i + 601); x.beginPath(); x.moveTo(0, y0); x.bezierCurveTo(170, y0 + 8 * (RN(i + 602) - 0.5), 340, y0 + 8 * (RN(i + 603) - 0.5), 512, y0); x.stroke(); }
  const t0 = tex(c); t0.wrapS = t0.wrapT = X.RepeatWrapping; return t0;
})();
const wallTex = (() => {
  const [c, x] = noiseCanvas(512, 512, '#3E362F', 0.12, 16000, 12);
  x.fillStyle = '#2B1D13'; x.fillRect(0, 300, 512, 212);
  for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(12,7,4,.75)'; x.lineWidth = 5; x.strokeRect(12 + i * 84, 322, 68, 168); x.strokeStyle = 'rgba(90,60,38,.35)'; x.lineWidth = 2; x.strokeRect(18 + i * 84, 328, 56, 156); }
  x.fillStyle = '#21160E'; x.fillRect(0, 292, 512, 12);
  const t0 = tex(c); t0.wrapS = X.RepeatWrapping; t0.repeat.set(3, 1); return t0;
})();
const floorTex = plankTex.clone(); floorTex.needsUpdate = true; floorTex.repeat.set(4, 4);
const FLOOR = new X.Mesh(new X.PlaneGeometry(10, 10), MAT('#FFFFFF', { map: floorTex, r: 0.8 })); FLOOR.rotation.x = -Math.PI / 2; ROOM.add(FLOOR);
const WALL = new X.Mesh(new X.PlaneGeometry(9, 4), MAT('#FFFFFF', { map: wallTex, r: 0.95 })); WALL.position.set(0, 2, -1.25); ROOM.add(WALL);
const WALL2 = new X.Mesh(new X.PlaneGeometry(9, 4), MAT('#FFFFFF', { map: wallTex, r: 0.95 })); WALL2.position.set(-2.3, 2, 0); WALL2.rotation.y = Math.PI / 2; ROOM.add(WALL2);
// a leaded window with the moon behind it
const winTex = (() => {
  const [c, x] = mkc(256, 320), q = x.createRadialGradient(170, 90, 10, 150, 140, 260); q.addColorStop(0, '#DCE8FF'); q.addColorStop(0.18, '#7E97C4'); q.addColorStop(1, '#1A2643'); x.fillStyle = q; x.fillRect(0, 0, 256, 320);
  x.strokeStyle = 'rgba(25,22,20,.95)'; x.lineWidth = 4;
  for (let k = -12; k < 12; k++) { x.beginPath(); x.moveTo(k * 40, 0); x.lineTo(k * 40 + 320, 320); x.stroke(); x.beginPath(); x.moveTo(k * 40 + 320, 0); x.lineTo(k * 40, 320); x.stroke(); }
  return tex(c);
})();
const WIN = new X.Mesh(new X.PlaneGeometry(0.62, 0.78), new X.MeshBasicMaterial({ map: winTex })); WIN.position.set(0.72, 1.62, -1.24); ROOM.add(WIN);
const darkWood = MAT('#2A1B10', { r: 0.7 }), wood = MAT('#5A3A22', { r: 0.6, map: plankTex });
[[0, 0.42, 0.72, 0.06], [0, -0.42, 0.72, 0.06], [0.34, 0, 0.06, 0.9], [-0.34, 0, 0.06, 0.9], [0, 0, 0.03, 0.78], [0, 0, 0.62, 0.03]].forEach(([a, b, w, h]) => { const m = new X.Mesh(new X.BoxGeometry(w, h, 0.05), darkWood); m.position.set(0.72 + a, 1.62 + b, -1.22); ROOM.add(m); });
const sill = new X.Mesh(new X.BoxGeometry(0.8, 0.04, 0.14), darkWood); sill.position.set(0.72, 1.2, -1.18); ROOM.add(sill);
const MOONW = new X.Sprite(glowMat('#BFD3FF', 0.5)); MOONW.scale.setScalar(1.3); MOONW.position.set(0.85, 1.8, -1.3); ROOM.add(MOONW);
// a shelf of books
{
  const S0 = new X.Group(); S0.position.set(-1.25, 0, -1.08); ROOM.add(S0);
  [[0, 0.9, 0.95, 1.8, 0.03, 0, -0.14], [-0.46, 0.9, 0.03, 1.8, 0.3, 0, 0], [0.46, 0.9, 0.03, 1.8, 0.3, 0, 0]].forEach(([a, b, w, h, d]) => { const m = new X.Mesh(new X.BoxGeometry(w, h, d), darkWood); m.position.set(a, b, -0.14 + (d > 0.1 ? 0.14 : 0)); S0.add(m); });
  for (let s = 0; s < 4; s++) {
    const y0 = 0.15 + s * 0.44; const sh = new X.Mesh(new X.BoxGeometry(0.92, 0.03, 0.3), darkWood); sh.position.set(0, y0, 0); S0.add(sh);
    let xx = -0.43;
    for (let i = 0; i < 16 && xx < 0.4; i++) {
      const w0 = 0.035 + 0.035 * RN(s * 40 + i), h0 = 0.22 + 0.12 * RN(s * 40 + i + 7), col = ['#5B1E1A', '#2E3B22', '#4A3018', '#1F2A3A', '#6B4A22', '#3A1414'][Math.floor(RN(s * 40 + i + 11) * 6)];
      const bk = new X.Mesh(new X.BoxGeometry(w0, h0, 0.2), MAT(col, { r: 0.75 })); bk.position.set(xx + w0 / 2, y0 + 0.015 + h0 / 2, 0.02); bk.rotation.z = RN(s * 40 + i + 13) < 0.12 ? 0.18 : 0; S0.add(bk); xx += w0 + 0.004;
    }
  }
}
// the desk
const DESK_Y = 0.79;
{
  const top = new X.Mesh(new X.BoxGeometry(1.5, 0.06, 0.82), MAT('#FFFFFF', { map: plankTex, r: 0.55, env: 0.6 })); top.position.set(0, DESK_Y - 0.03, -0.55); ROOM.add(top);
  [[-0.68, -0.9], [0.68, -0.9], [-0.68, -0.2], [0.68, -0.2]].forEach(([a, b]) => { const l = new X.Mesh(new X.BoxGeometry(0.07, DESK_Y - 0.06, 0.07), darkWood); l.position.set(a, (DESK_Y - 0.06) / 2, b); ROOM.add(l); });
}
// the candle
const CANDLE = new X.Group(); CANDLE.position.set(-0.45, DESK_Y, -0.66); ROOM.add(CANDLE);
const brass = MAT('#C9A050', { m: 1, r: 0.3 });
{
  const dish = new X.Mesh(new X.CylinderGeometry(0.07, 0.08, 0.015, 28), brass); dish.position.y = 0.008; CANDLE.add(dish);
  const cup = new X.Mesh(new X.CylinderGeometry(0.03, 0.025, 0.04, 20), brass); cup.position.y = 0.035; CANDLE.add(cup);
  const wax = new X.Mesh(new X.CylinderGeometry(0.022, 0.024, 0.16, 20), MAT('#EFE6D2', { r: 0.6, e: '#FFB066', ei: 0.08 })); wax.position.y = 0.13; CANDLE.add(wax);
  const wick = new X.Mesh(new X.CylinderGeometry(0.0015, 0.0015, 0.012, 6), MAT('#111')); wick.position.y = 0.216; CANDLE.add(wick);
}
const FLAME = new X.Mesh(new X.SphereGeometry(0.012, 12, 10), new X.MeshBasicMaterial({ color: '#FFE2A0' })); FLAME.scale.set(1, 2.3, 1); FLAME.position.set(0, 0.238, 0); CANDLE.add(FLAME);
const FGLOW = new X.Sprite(glowMat('#FFB45A', 0.9)); FGLOW.scale.setScalar(0.32); FGLOW.position.set(0, 0.24, 0); CANDLE.add(FGLOW);
const CLIGHT = new X.PointLight('#FFB25E', 4.5, 4, 1.4); CLIGHT.position.set(0, 0.26, 0); CANDLE.add(CLIGHT);
// the inkwell
{ const iw = new X.Mesh(new X.CylinderGeometry(0.035, 0.045, 0.05, 20), MAT('#15171A', { r: 0.15, m: 0.2, env: 1.4 })); iw.position.set(0.42, DESK_Y + 0.025, -0.58); ROOM.add(iw);
  const ring = new X.Mesh(new X.TorusGeometry(0.02, 0.005, 6, 16), brass); ring.rotation.x = Math.PI / 2; ring.position.set(0.42, DESK_Y + 0.052, -0.58); ROOM.add(ring); }
// paper on the desk, a closed copy of the book
const parchTex = (seed) => noiseCanvas(480, 640, '#E8DABC', 0.1, 9000, seed);
const coverTex = (() => {
  const [c, x] = noiseCanvas(400, 560, '#4A2414', 0.16, 9000, 21);
  x.strokeStyle = '#C9A050'; x.lineWidth = 6; x.strokeRect(22, 22, 356, 516); x.lineWidth = 2; x.strokeRect(34, 34, 332, 492);
  x.fillStyle = '#E2BC62'; x.textAlign = 'center'; setF(x, 'italic 54px Serif', 0); x.fillText('The', 200, 170); setF(x, 'italic 64px Serif', 0); x.fillText('Whetstone', 200, 240); setF(x, 'italic 54px Serif', 0); x.fillText('of Witte', 200, 305);
  x.beginPath(); x.moveTo(110, 345); x.lineTo(290, 345); x.stroke(); setF(x, 'italic 46px Serif', 0); x.fillText('1557', 200, 420);
  return tex(c);
})();
const COVER = new X.Group(); COVER.position.set(0.5, DESK_Y, -0.76); COVER.rotation.y = -0.25; ROOM.add(COVER);
{ const b = new X.Mesh(new X.BoxGeometry(0.26, 0.05, 0.36), [MAT('#3A1C0F', { r: 0.7 }), MAT('#3A1C0F', { r: 0.7 }), MAT('#FFFFFF', { map: coverTex, r: 0.6 }), MAT('#3A1C0F'), MAT('#E6D8B8'), MAT('#E6D8B8')]); b.position.y = 0.025; COVER.add(b); }

// ---------- the open book: two pages whose ink is drawn as the scene runs ----------
const BOOK = new X.Group(); BOOK.position.set(0, DESK_Y, -0.45); ROOM.add(BOOK);
const PW = 0.3, PD = 0.4, PX = 480, PY = 640, SC = PW / PX;   // page size (m), canvas size (px)
{ const cov = new X.Mesh(new X.BoxGeometry(0.66, 0.02, 0.43), MAT('#3A1C0F', { r: 0.7 })); cov.position.y = 0.006; BOOK.add(cov);
  const blk = new X.Mesh(new X.BoxGeometry(0.62, 0.02, 0.4), MAT('#E3D3B0', { r: 0.9 })); blk.position.y = 0.02; BOOK.add(blk); }
function pageMesh(side, texr) {
  const geo = new X.PlaneGeometry(PW, PD, 16, 1); const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const u = (pos.getX(i) + PW / 2) / PW, sp = side > 0 ? 1 - u : u; pos.setZ(i, 0.018 * sp * sp); }
  geo.computeVertexNormals();
  const m = new X.Mesh(geo, new X.MeshStandardMaterial({ map: texr, roughness: 0.92 })); m.rotation.x = -Math.PI / 2; m.position.set(side * (PW / 2 + 0.005), 0.031, 0); BOOK.add(m); return m;
}
const LPc = parchTex(31), RPc = parchTex(32);
const LPT = tex(LPc[0]), RPT = tex(RPc[0]);
const LPAGE = pageMesh(-1, LPT), RPAGE = pageMesh(1, RPT);
const RIGHT_BASE = (() => { const [c, x] = parchTex(32); const q = x.createRadialGradient(240, 320, 120, 240, 320, 420); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(90,60,20,.35)'); x.fillStyle = q; x.fillRect(0, 0, PX, PY); return c; })();
// the equations he writes, in his words: every one needs "is equalle to"
const EQS = ['14.x. + 15. is equalle to 71.', '20.x. - 18. is equalle to 102.', '26.x. + 10. is equalle to 9.x. + 213.', '19.x. + 192. is equalle to 10.x. + 108.',
  '18.x. + 24. is equalle to 8.x. + 2.', '34.x. - 12. is equalle to 40.x. - 480.', '6.x. + 9. is equalle to 3.x. + 27.', '12.x. - 5. is equalle to 4.x. + 19.', '9.x. + 2. is equalle to 47.'];
const LINE0 = 86, LH = 50, MARG = 34, INK = '#2B1C10';
function inkFont(x) { setF(x, 'italic 33px Serif', 0); x.fillStyle = INK; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; }
// how much he has written by time t (characters), and the twin lines
const writeRate = (t) => t < K.equals ? 26 * t : t < K.docL ? 26 * K.equals + 17 * (t - K.equals) : t < K.a3 ? 26 * K.equals + 17 * (K.docL - K.equals) + 22 * (t - K.docL) : null;
const LONGY = LINE0 + 7 * LH + 30;                    // the line with his long sign
const longK = (t) => clamp((t - K.drew) / 0.38) * 0.5 + clamp((t - K.drew - 0.42) / 0.38) * 0.5;   // two strokes
let rightKey = '';
function drawRight(t) {
  const n = writeRate(t), stop = n === null, chars = stop ? 1e9 : Math.floor(n), lk = longK(t), modern = t >= K.way + 0.25;
  const key = (stop ? 'S' : chars) + '|' + lk.toFixed(2) + '|' + modern;
  if (key === rightKey) return; rightKey = key;
  const x = RPc[1]; x.drawImage(RIGHT_BASE, 0, 0); inkFont(x);
  let left = stop ? 9999 : chars, nib = null;
  for (let i = 0; i < 7 && left > 0; i++) {
    const s = EQS[i], k = Math.min(s.length, left); left -= k;
    x.fillText(s.slice(0, k), MARG, LINE0 + i * LH);
    if (k < s.length || left <= 0) nib = [MARG + x.measureText(s.slice(0, k)).width, LINE0 + i * LH];
  }
  if (t >= K.linesL - 0.3) {                          // the new way: two long lines in place of the words
    x.fillText('14.x. + 15.', MARG, LONGY); const x0 = MARG + x.measureText('14.x. + 15. ').width, x1 = PX - 120;
    x.strokeStyle = INK; x.lineCap = 'round'; x.lineWidth = 4.5;
    [0, 1].forEach((j) => { const k = clamp(lk * 2 - j); if (k <= 0) return; x.beginPath(); x.moveTo(x0, LONGY - 16 + j * 14); x.lineTo(lerp(x0, x1, k), LONGY - 16 + j * 14 + 0.6 * j); x.stroke(); });
    if (lk >= 1) x.fillText('71.', x1 + 12, LONGY);
    if (modern) { setF(x, 'italic 33px Serif', 0); x.fillText('14x + 15 = 71', MARG + 40, LONGY + 70); }
  }
  RPT.needsUpdate = true; return nib;
}
const LEFT_BASE = (() => { const [c, x] = parchTex(31); inkFont(x); for (let i = 0; i < 10; i++) x.fillText(EQS[(i + 3) % EQS.length], MARG, LINE0 - 20 + i * LH); return c; })();
LPc[1].drawImage(LEFT_BASE, 0, 0); LPT.needsUpdate = true;
RPc[1].drawImage(RIGHT_BASE, 0, 0); RPT.needsUpdate = true;
// where a point of the right page's canvas is in the world
const pageWorld = (px, py) => BOOK.localToWorld(v3([PW / 2 + 0.005 - PW / 2 + px * SC, 0.033 + 0.018 * Math.pow(1 - px / PX, 2), -PD / 2 + py * SC]));
// pages that flip on "again, and again, and again"
const fullTex = (() => { const [c, x] = parchTex(41); inkFont(x); for (let i = 0; i < 11; i++) x.fillText(EQS[i % EQS.length], MARG, LINE0 - 20 + i * LH); return tex(c); })();
const FLIPS = Array.from({ length: 9 }, () => {
  const g0 = new X.Group(); g0.position.set(0, 0.034, 0); BOOK.add(g0);
  const m = new X.Mesh(new X.PlaneGeometry(PW, PD), new X.MeshStandardMaterial({ map: fullTex, roughness: 0.92, side: X.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.x = PW / 2 + 0.005; g0.add(m); g0.visible = false; return g0;
});

// ---------- the quill ----------
const featherTex = (() => {
  const [c, x] = mkc(64, 256); x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 64, 256);
  x.fillStyle = '#F2EEE6'; x.beginPath(); x.moveTo(32, 4); x.bezierCurveTo(62, 40, 60, 170, 36, 252); x.lineTo(28, 252); x.bezierCurveTo(4, 170, 2, 40, 32, 4); x.fill();
  x.strokeStyle = 'rgba(150,140,125,.55)'; x.lineWidth = 1; for (let i = 0; i < 70; i++) { const y0 = 10 + i * 3.4; x.beginPath(); x.moveTo(32, y0 + 6); x.lineTo(i % 2 ? 6 : 58, y0); x.stroke(); }
  x.strokeStyle = '#B8AE9C'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 2); x.lineTo(32, 254); x.stroke();
  return tex(c);
})();
const QUILL = new X.Group(); ROOM.add(QUILL);          // its origin is the nib; +y runs up the shaft
{
  const shaft = new X.Mesh(new X.CylinderGeometry(0.0022, 0.003, 0.34, 8), MAT('#E8E0CC', { r: 0.5 })); shaft.position.y = 0.17; QUILL.add(shaft);
  const nib = new X.Mesh(new X.ConeGeometry(0.003, 0.02, 8), MAT('#231812', { r: 0.3 })); nib.rotation.x = Math.PI; nib.position.y = 0.006; QUILL.add(nib);
  const vane = new X.Mesh(new X.PlaneGeometry(0.06, 0.24), new X.MeshStandardMaterial({ map: featherTex, transparent: true, alphaTest: 0.3, side: X.DoubleSide, roughness: 0.8 })); vane.position.y = 0.22; QUILL.add(vane);
}

// ---------- Robert Recorde: a man in a black gown and a flat cap, at the desk, facing the book (-z) ----------
const skin = MAT('#E2B794', { r: 0.6 }), gown = MAT('#17161A', { r: 0.85 }), hairM = MAT('#3A2618', { r: 0.85 }), white = MAT('#F1EEE6', { r: 0.6 });
const MAN = new X.Group(); MAN.position.set(0, 0.47, 0.34); ROOM.add(MAN);                 // pivots at the seat
const TORSO = new X.Group(); MAN.add(TORSO);
{
  const prof = [[0, 0], [0.24, 0.0], [0.25, 0.12], [0.235, 0.32], [0.2, 0.52], [0.13, 0.64], [0.06, 0.68], [0, 0.69]].map(([a, b]) => new X.Vector2(a, b));
  const body = new X.Mesh(new X.LatheGeometry(prof, 32), gown); body.scale.set(1, 1, 0.82); TORSO.add(body);
  const stool = new X.Mesh(new X.BoxGeometry(0.42, 0.06, 0.36), darkWood); stool.position.set(0, -0.03, 0.04); MAN.add(stool);
  [[-0.17, -0.13], [0.17, -0.13], [-0.17, 0.2], [0.17, 0.2]].forEach(([a, b]) => { const l = new X.Mesh(new X.BoxGeometry(0.04, 0.44, 0.04), darkWood); l.position.set(a, -0.26, b); MAN.add(l); });
  const ruff = new X.Mesh(new X.TorusGeometry(0.07, 0.028, 10, 28), white); ruff.rotation.x = Math.PI / 2; ruff.position.y = 0.68; TORSO.add(ruff);
}
const HG = new X.Group(); HG.position.set(0, 0.8, 0); TORSO.add(HG);                     // the head; the face looks along -z
const EYES = [], BROWS = [];
let MOUTH_O, MOUTH_LINE, MOUTH_SMILE;
{
  const head = new X.Mesh(new X.SphereGeometry(0.105, 32, 22), skin); head.scale.set(0.95, 1.08, 0.98); HG.add(head);
  const hair = new X.Mesh(new X.SphereGeometry(0.108, 28, 18), hairM); hair.scale.set(0.97, 1.02, 0.98); hair.position.set(0, 0.012, 0.022); HG.add(hair);
  const capB = new X.Mesh(new X.CylinderGeometry(0.104, 0.106, 0.05, 28), gown); capB.position.set(0, 0.085, 0.01); HG.add(capB);
  const capT = new X.Mesh(new X.CylinderGeometry(0.15, 0.14, 0.025, 32), gown); capT.position.set(0, 0.112, 0.012); capT.rotation.x = 0.08; HG.add(capT);
  [-1, 1].forEach((sd) => {
    const E = new X.Group(); E.position.set(sd * 0.036, 0.016, -0.09); HG.add(E); EYES.push(E);
    const w0 = new X.Mesh(new X.SphereGeometry(0.018, 16, 12), MAT('#F7F4EE', { r: 0.3 })); w0.scale.set(1.1, 0.78, 0.6); E.add(w0);
    const p0 = new X.Mesh(new X.SphereGeometry(0.0085, 12, 8), MAT('#120F0E', { r: 0.2 })); p0.position.set(0, -0.001, -0.009); E.add(p0);
    const b0 = new X.Mesh(new X.BoxGeometry(0.038, 0.006, 0.008), hairM); b0.position.set(sd * 0.036, 0.047, -0.094); HG.add(b0); BROWS.push(b0);
    const ear = new X.Mesh(new X.SphereGeometry(1, 12, 8), skin); ear.scale.set(0.012, 0.03, 0.022); ear.position.set(sd * 0.1, 0.0, 0.0); HG.add(ear);
  });
  const nose = new X.Mesh(new X.SphereGeometry(0.02, 12, 10), skin); nose.scale.set(0.85, 1.05, 1.15); nose.position.set(0, -0.012, -0.104); HG.add(nose);
  const mus = new X.Mesh(new X.CapsuleGeometry(0.009, 0.05, 4, 8), hairM); mus.rotation.z = Math.PI / 2; mus.position.set(0, -0.042, -0.098); HG.add(mus);
  const goat = new X.Mesh(new X.SphereGeometry(0.034, 14, 10), hairM); goat.scale.set(1, 1.2, 0.8); goat.position.set(0, -0.095, -0.075); HG.add(goat);
  MOUTH_LINE = new X.Mesh(new X.BoxGeometry(0.034, 0.006, 0.01), MAT('#4A1C1A', { r: 0.6 })); MOUTH_LINE.position.set(0, -0.06, -0.098); HG.add(MOUTH_LINE);
  MOUTH_O = new X.Mesh(new X.SphereGeometry(0.014, 12, 8), MAT('#3A1212', { r: 0.6 })); MOUTH_O.scale.set(1, 1.2, 0.5); MOUTH_O.position.set(0, -0.062, -0.097); HG.add(MOUTH_O);
  MOUTH_SMILE = new X.Mesh(new X.TorusGeometry(0.02, 0.0045, 6, 16, Math.PI), MAT('#4A1C1A', { r: 0.6 })); MOUTH_SMILE.rotation.z = Math.PI; MOUTH_SMILE.position.set(0, -0.05, -0.099); HG.add(MOUTH_SMILE);
}
// arms: gown sleeves from the shoulders; the right hand holds the quill, the left rests on the desk
const limb = (r, m) => { const g0 = new X.Mesh(new X.CylinderGeometry(r, r * 0.9, 1, 14), m); ROOM.add(g0); return g0; };
const placeLimb = (mesh, a, b) => { mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.scale.set(1, a.distanceTo(b), 1); mesh.quaternion.setFromUnitVectors(v3([0, 1, 0]), b.clone().sub(a).normalize()); };
const ball = (r, m) => { const b = new X.Mesh(new X.SphereGeometry(r, 14, 10), m); ROOM.add(b); return b; };
const RUP = limb(0.052, gown), RFO = limb(0.046, gown), LUP = limb(0.052, gown), LFO = limb(0.046, gown);
const RJ = [ball(0.052, gown), ball(0.046, gown)], LJ = [ball(0.052, gown), ball(0.046, gown)];
const handM = MAT('#C99A78', { r: 0.6 }), RFIST = ball(0.026, handM), LFIST = ball(0.028, handM), RCUFF = new X.Mesh(new X.CylinderGeometry(0.05, 0.05, 0.03, 16), white), LCUFF = new X.Mesh(new X.CylinderGeometry(0.05, 0.05, 0.03, 16), white);
ROOM.add(RCUFF, LCUFF);
RFIST.scale.set(1, 0.85, 1.3); LFIST.scale.set(1.2, 0.7, 1.35);

// ---------- the gold "=": two bars ----------
const gold = MAT('#E7B34A', { m: 1, r: 0.22, env: 1.6 });
const bar = () => { const m = new X.Mesh(new X.CapsuleGeometry(0.022, 0.2, 8, 16), gold); m.rotation.z = Math.PI / 2; return m; };
const EQ = new X.Group(); ROOM.add(EQ); const EQA = bar(), EQB = bar(); EQA.position.y = 0.04; EQB.position.y = -0.04; EQ.add(EQA, EQB); EQ.visible = false;
const EQGLOW = new X.Sprite(glowMat('#FFC861', 0)); EQGLOW.scale.setScalar(0.7); EQ.add(EQGLOW);
// the three words that become the two lines
const wordTex = (str) => { const [c, x] = mkc(256, 96); x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 256, 96); rrx(x, 6, 10, 244, 76, 18); x.fillStyle = '#EADCBE'; x.fill(); inkFont(x); x.textAlign = 'center'; setF(x, 'italic 50px Serif', 0); x.fillText(str, 128, 64); return tex(c); };
const WORDS = ['is', 'equalle', 'to'].map((s0, i) => { const m = new X.Mesh(new X.PlaneGeometry(0.16, 0.06), new X.MeshBasicMaterial({ map: wordTex(s0), transparent: true, side: X.DoubleSide })); ROOM.add(m); m.visible = false; return m; });

// ---------- "No two things can be more equal": twin lines running to infinity, in the dark ----------
const VOID = new X.Group(); VOID.position.set(0, 100, 0); VOID.visible = false; scene.add(VOID);
const railMat = new X.MeshBasicMaterial({ color: '#FFC861' });
const RAILS = [0.16, -0.16].map((y0) => { const m = new X.Mesh(new X.BoxGeometry(0.035, 0.035, 400), railMat); m.position.set(0, y0, -198); VOID.add(m); return m; });
for (let i = 0; i < 46; i++) [0.16, -0.16].forEach((y0) => { const s0 = new X.Sprite(glowMat('#FFB84A', 0.5)); s0.scale.setScalar(0.4); s0.position.set(0, y0, 1 - i * 4.4); VOID.add(s0); });

// ---------- "Now it's on every calculator": a calculator on a clean desk ----------
const CALC = new X.Group(); CALC.position.set(0, 200, 0); CALC.visible = false; scene.add(CALC);
const keyTex = (() => {
  const [c, x] = mkc(400, 520); x.fillStyle = '#26282D'; x.fillRect(0, 0, 400, 520);
  const K0 = [['C', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '', '.', '']];
  K0.forEach((row, r) => row.forEach((s0, cI) => {
    if (r === 4 && cI === 1) return; if (r === 4 && cI === 3) return;
    const w0 = r === 4 && cI === 0 ? 180 : 82, X0 = 12 + cI * 97, Y0 = 12 + r * 102;
    rrx(x, X0, Y0, w0, 88, 40); x.fillStyle = cI === 3 ? '#F29A2E' : r === 0 ? '#A5A7AD' : '#3D4047'; x.fill();
    x.fillStyle = r === 0 && cI < 3 ? '#16171A' : '#FFFFFF'; setF(x, '600 44px Body', 0); x.textAlign = 'center'; x.fillText(s0, X0 + w0 / 2, Y0 + 60);
  }));
  return tex(c);
})();
const screenC = mkc(400, 150), SCRT = tex(screenC[0]);
function drawScreen(str) { const x = screenC[1]; x.fillStyle = '#1B2A22'; x.fillRect(0, 0, 400, 150); const q = x.createLinearGradient(0, 0, 0, 150); q.addColorStop(0, 'rgba(160,220,180,.08)'); q.addColorStop(1, 'rgba(0,0,0,.2)'); x.fillStyle = q; x.fillRect(0, 0, 400, 150); x.fillStyle = '#BFF5CC'; setF(x, '400 92px Mono', 0); x.textAlign = 'right'; x.fillText(str, 380, 112); SCRT.needsUpdate = true; }
drawScreen('2+2');
let EQKEY, FINGER;
{
  const sh = new X.Shape(); const rr = 0.03, w0 = 0.2, h0 = 0.32; sh.moveTo(-w0 / 2 + rr, -h0 / 2); sh.lineTo(w0 / 2 - rr, -h0 / 2); sh.quadraticCurveTo(w0 / 2, -h0 / 2, w0 / 2, -h0 / 2 + rr); sh.lineTo(w0 / 2, h0 / 2 - rr); sh.quadraticCurveTo(w0 / 2, h0 / 2, w0 / 2 - rr, h0 / 2); sh.lineTo(-w0 / 2 + rr, h0 / 2); sh.quadraticCurveTo(-w0 / 2, h0 / 2, -w0 / 2, h0 / 2 - rr); sh.lineTo(-w0 / 2, -h0 / 2 + rr); sh.quadraticCurveTo(-w0 / 2, -h0 / 2, -w0 / 2 + rr, -h0 / 2);
  const body = new X.Mesh(new X.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4 }), MAT('#2E3036', { r: 0.4, m: 0.3 })); body.rotation.x = -Math.PI / 2; CALC.add(body);
  const keys = new X.Mesh(new X.PlaneGeometry(0.17, 0.221), new X.MeshStandardMaterial({ map: keyTex, roughness: 0.5 })); keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.0275, 0.04); CALC.add(keys);
  const scr = new X.Mesh(new X.PlaneGeometry(0.17, 0.064), new X.MeshBasicMaterial({ map: SCRT })); scr.rotation.x = -Math.PI / 2; scr.position.set(0, 0.0275, -0.112); CALC.add(scr);
  EQKEY = new X.Group(); EQKEY.position.set(-0.085 + 344 * 0.221 / 520, 0.03, 0.04 - 0.221 / 2 + 464 * 0.221 / 520); CALC.add(EQKEY);   // where the keypad leaves the = key out
  const kb = new X.Mesh(new X.CylinderGeometry(0.0178, 0.0178, 0.008, 24), MAT('#F29A2E', { r: 0.4 })); EQKEY.add(kb);
  [0.0035, -0.0035].forEach((dz) => { const l = new X.Mesh(new X.BoxGeometry(0.014, 0.002, 0.0025), MAT('#FFFFFF')); l.position.set(0, 0.005, dz); EQKEY.add(l); });
  const desk2 = new X.Mesh(new X.PlaneGeometry(6, 6), MAT('#D9D6D0', { r: 0.6 })); desk2.rotation.x = -Math.PI / 2; desk2.position.y = -0.007; CALC.add(desk2);
  FINGER = new X.Group(); CALC.add(FINGER);
  const f0 = new X.Mesh(new X.CapsuleGeometry(0.011, 0.07, 6, 12), MAT('#C99A78', { r: 0.6 })); f0.position.y = 0.045; FINGER.add(f0);
  const nail = new X.Mesh(new X.SphereGeometry(0.008, 10, 8), MAT('#F2D2C0', { r: 0.3 })); nail.scale.set(1, 0.4, 1.4); nail.position.set(0, 0.012, 0.008); FINGER.add(nail);
}
const KEY2 = new X.PointLight('#FFFFFF', 0, 3, 1.2); KEY2.position.set(0.25, 200.5, 0.3); scene.add(KEY2);

// ---------- the camera: a new set-up on almost every line ----------
scene.updateMatrixWorld(true);
const VIEW = {
  nib0: [[-0.08, 0.17, 0.26], [-0.035, 0.0, 0.0], 40], nib1: [[-0.07, 0.15, 0.23], [-0.03, 0.0, 0.0], 38],   // nib*: from the nib, which they follow
  eq0: [[-0.18, 1.12, 0.06], [-0.155, 0.91, -0.45], 40], eq1: [[-0.17, 1.08, 0.0], [-0.155, 0.91, -0.45], 39],
  face0: [[0.1, 1.27, -0.5], [0.0, 1.24, 0.15], 34], face1: [[0.08, 1.265, -0.44], [0.0, 1.24, 0.15], 33],
  page0: [[-0.35, 1.7, 0.3], [0.12, 0.81, -0.47], 34], page1: [[-0.3, 1.64, 0.24], [0.12, 0.81, -0.47], 32],   // over his left shoulder
  room0: [[1.9, 1.5, 0.9], [0.0, 1.05, -0.2], 44], room1: [[1.7, 1.42, 0.78], [0.0, 1.05, -0.2], 42],
  cover0: [[0.62, 1.3, -0.3], [0.5, 0.81, -0.76], 36], cover1: [[0.6, 1.22, -0.36], [0.5, 0.81, -0.76], 34],
  flip0: [[0.02, 1.22, -0.02], [0.0, 0.8, -0.47], 40], flip1: [[0.02, 1.16, -0.1], [0.0, 0.8, -0.47], 38],
  pile0: [[0.9, 2.15, 1.45], [0.0, 0.85, -0.25], 44], pile1: [[0.8, 2.0, 1.3], [0.0, 0.85, -0.25], 42],
  draw0: [[-0.08, 1.0, -0.15], [0.17, 0.81, -0.36], 38], draw1: [[-0.05, 0.97, -0.18], [0.17, 0.81, -0.36], 37],
  lift0: [[0.25, 1.08, 0.12], [0.18, 0.9, -0.36], 40], lift1: [[0.23, 1.06, 0.06], [0.18, 0.92, -0.36], 39],
  rail0: [[0.5, 100.12, 1.0], [0, 100, -20], 50], rail1: [[0.36, 100.08, -2.2], [0, 100, -24], 50],
  long0: [[0.15, 1.12, -0.08], [0.15, 0.82, -0.335], 46], long1: [[0.15, 1.1, -0.1], [0.15, 0.82, -0.335], 45],
  calc0: [[0.25, 200.62, 0.55], [0.0, 200.02, 0.0], 32], calc1: [[0.22, 200.56, 0.5], [0.0, 200.02, 0.0], 31],
  key0: [[0.22, 200.3, 0.4], [0.05, 200.03, 0.0], 30], key1: [[0.2, 200.27, 0.36], [0.05, 200.03, 0.01], 29],
  words0: [[0.0, 1.22, 0.55], [0.0, 0.98, -0.45], 40], words1: [[0.0, 1.18, 0.45], [0.0, 0.99, -0.45], 39],
};
function cutAt(t) { let i = 0; while (i < CUTS.length - 1 && t >= CUTS[i + 1][0]) i++; return i; }
const shotName = (t) => CUTS[cutAt(t)][1].replace(/\d+$/, '');
function camAt(t) {
  if (DEBUGCAM) return [...DEBUGCAM[0], ...DEBUGCAM[1], DEBUGCAM[2]];
  const i = cutAt(t), [t0, a, b] = CUTS[i], t1 = i < CUTS.length - 1 ? CUTS[i + 1][0] : T0.feed;
  const u = clamp((t - t0) / Math.max(0.05, t1 - t0)), k = 0.6 * ease(u) + 0.4 * u, A = VIEW[a], B = VIEW[b];
  const out = [...lerp3(A[0], B[0], k), ...lerp3(A[1], B[1], k), lerp(A[2], B[2], k)];
  if (/^nib/.test(a)) { const q = QUILL.position; [0, 1, 2, 3, 4, 5].forEach((j) => { out[j] += [q.x, q.y, q.z][j % 3]; }); }
  return out;
}
const tmpV = new X.Vector3();
function project(p) { tmpV.set(...p).project(cam); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H, tmpV.z < 1]; }

// ---------- the timeline of the world ----------
const QDIR = v3([0.2, 0.78, 0.46]).normalize(), QREST = v3([0.42, DESK_Y + 0.05, -0.58]);
let lastNib = [MARG, LINE0];
function pose(t) {   // how he looks: [eyes open, brows (+ angry), mouth: 0 line, 1 O, 2 smile, head down, lean]
  const drop = ease((t - K.a3 + 0.02) / 0.14) * (1 - ease((t - K.linesL + 0.12) / 0.2)), idea = ease((t - K.linesL + 0.12) / 0.2);
  const annoyed = clamp((t - K.sickL + 0.1) / 0.2) * (1 - idea);
  const eyes = idea > 0.5 ? 1.25 : lerp(1, 0.5, annoyed) * (1 - 0.85 * drop);
  const mouth = idea > 0.5 ? 2 : (t > K.sick - 0.05 && t < K.sick + 0.4) ? 1 : 0;
  return { eyes, brows: annoyed * (1 - drop) - 0.6 * idea, mouth, drop, idea };
}
function setWorld(t) {
  const name = shotName(t), inVoid = name === 'rail', inCalc = name === 'calc' || name === 'key';
  ROOM.visible = !inVoid && !inCalc; VOID.visible = inVoid; CALC.visible = inCalc; KEY2.intensity = inCalc ? 4 : 0;
  const hideMan = name === 'lift' || name === 'words';                          // the camera stands where he sits
  [MAN, RUP, RFO, LUP, LFO, ...RJ, ...LJ, RFIST, LFIST, RCUFF, LCUFF].forEach((m) => { m.visible = !hideMan; }); QUILL.visible = !hideMan;
  hemi.intensity = inCalc ? 0.9 : 0.32; sun.intensity = inCalc ? 1.6 : 0.55; rim.intensity = inCalc ? 0.8 : 0.9;
  // the candle
  const fl = 0.86 + 0.08 * Math.sin(t * 23) + 0.05 * Math.sin(t * 37 + 1) + 0.03 * Math.sin(t * 61);
  CLIGHT.intensity = 5 * fl; FLAME.scale.set(1, 2.3 * (0.9 + 0.1 * fl), 1); FGLOW.material.opacity = 0.8 * fl; FLAME.position.x = 0.0015 * Math.sin(t * 17);
  // the page he is writing, and the quill
  const nib = drawRight(t); if (nib) lastNib = nib;
  const P = pose(t);
  let tip, dir = QDIR.clone();
  if (t < K.a3) { const w = pageWorld(lastNib[0], lastNib[1]); tip = w.add(v3([0.0025 * Math.sin(t * 57), 0.0018 * (1 + Math.sin(t * 31)), 0.002 * Math.sin(t * 43)])); }
  else if (t < K.drew - 0.15) { const k = ease((t - K.a3) / 0.2); tip = pageWorld(300, 520).lerp(v3([0.2, DESK_Y + 0.045, -0.18]), k); dir = QDIR.clone().lerp(v3([0.9, 0.08, 0.4]).normalize(), k).normalize(); }
  else if (t < K.drew + 0.9) { const lk = longK(t), j = lk < 0.5 ? 0 : 1, k = clamp(lk * 2 - j), x0 = MARG + 168, x1 = PX - 120; tip = pageWorld(lerp(x0, x1, k), LONGY - 16 + j * 14).add(v3([0, 0.0015 * Math.sin(t * 40), 0])); }
  else { const k = ease((t - K.drew - 0.9) / 0.3); tip = pageWorld(PX - 110, LONGY - 8).lerp(QREST, k); dir = QDIR.clone().lerp(v3([0.1, 1, 0.2]).normalize(), k).normalize(); }
  QUILL.position.copy(tip); QUILL.quaternion.setFromUnitVectors(v3([0, 1, 0]), dir);
  // him: lean, head, face
  TORSO.rotation.x = -0.2 - 0.5 * P.drop + 0.08 * P.idea + 0.015 * Math.sin(t * 1.4); TORSO.rotation.z = 0.02 * Math.sin(t * 1.1);
  HG.rotation.x = -0.32 - 0.55 * P.drop + 0.24 * bump(t, K.sick, 0.6) + 0.12 * P.idea; HG.rotation.y = 0.04 * Math.sin(t * 0.9);
  EYES.forEach((E) => E.scale.set(1, Math.max(0.1, P.eyes), 1));
  BROWS.forEach((b0, i) => { const sd = i ? 1 : -1; b0.rotation.z = sd * 0.42 * P.brows * -1; b0.position.y = 0.047 + 0.014 * P.idea - 0.006 * clamp(P.brows); });
  MOUTH_LINE.visible = P.mouth === 0; MOUTH_O.visible = P.mouth === 1; MOUTH_SMILE.visible = P.mouth === 2;
  scene.updateMatrixWorld(true);
  // arms
  const shR = TORSO.localToWorld(v3([0.19, 0.6, 0.02])), shL = TORSO.localToWorld(v3([-0.19, 0.6, 0.02]));
  const grip = t < K.a3 || t >= K.drew - 0.15 && t < K.drew + 1.2 ? QUILL.position.clone().add(dir.clone().multiplyScalar(0.07)) : v3([0.22, DESK_Y + 0.04, -0.12]).lerp(v3([0.2, DESK_Y + 0.05, -0.05]), P.drop);
  const wristR = grip.clone().add(v3([0.03, 0.03, 0.06])), elbR = shR.clone().add(wristR).multiplyScalar(0.5).add(v3([0.12, -0.14, 0.04]));
  placeLimb(RUP, shR, elbR); placeLimb(RFO, elbR, wristR); RJ[0].position.copy(shR); RJ[1].position.copy(elbR);
  RFIST.position.copy(grip); RCUFF.position.copy(wristR); RCUFF.quaternion.setFromUnitVectors(v3([0, 1, 0]), wristR.clone().sub(elbR).normalize());
  const handL = v3([-0.24, DESK_Y + 0.025, -0.24]).add(v3([0, 0, 0.1 * P.drop])), wristL = handL.clone().add(v3([-0.02, 0.01, 0.07])), elbL = shL.clone().add(wristL).multiplyScalar(0.5).add(v3([-0.12, -0.13, 0.05]));
  placeLimb(LUP, shL, elbL); placeLimb(LFO, elbL, wristL); LJ[0].position.copy(shL); LJ[1].position.copy(elbL);
  LFIST.position.copy(handL); LCUFF.position.copy(wristL); LCUFF.quaternion.setFromUnitVectors(v3([0, 1, 0]), wristL.clone().sub(elbL).normalize());
  // the book of the title drops onto the desk
  COVER.position.y = DESK_Y + 0.18 * (1 - ease((t - K.book + 0.16) / 0.16)) * (t < K.book + 0.1 ? 1 : 0);
  // pages flip on "again, and again"
  FLIPS.forEach((f, i) => { const t0 = K.wrote + (K.a2 - K.wrote) * i / FLIPS.length, u = (t - t0) / 0.24; f.visible = u > 0 && u < 1; if (f.visible) f.rotation.z = Math.PI * ease(u); });
  // the gold "=": slammed down in the hook; lifted off the page on "Why two lines?"; made from the three words
  EQ.visible = false; EQGLOW.material.opacity = 0;
  if (t >= K.equals - 0.14 && t < K.sickL) {
    const k = clamp((t - K.equals + 0.14) / 0.14), land = t > K.equals ? Math.exp(-(t - K.equals) / 0.08) * Math.cos((t - K.equals) * 40) : 0;
    EQ.visible = true; EQ.position.set(-0.155, DESK_Y + 0.085 + 0.3 * (1 - k) * (1 - k) + 0.012 * land, -0.45); EQ.rotation.set(0, 0.25 * (1 - k), 0); EQ.scale.set(0.6, 0.6 * (1 - 0.18 * Math.max(0, land)), 0.6);
    EQGLOW.material.opacity = 0.5 * Math.exp(-Math.max(0, t - K.equals) / 0.25);
  } else if (t >= K.why2L && t < K.equalL) {
    const k = ease((t - K.why2L) / 0.55), c0 = pageWorld((MARG + 168 + PX - 120) / 2, LONGY - 9);
    EQ.visible = true; EQ.position.copy(c0).add(v3([0, 0.008 + 0.1 * k, 0.02 * k])); EQ.rotation.set(-Math.PI / 2 * (1 - k), 0, 0); EQ.scale.setScalar(lerp(0.42, 0.6, k));
    EQGLOW.material.opacity = 0.6 * k;
  } else if (t >= K.two - 0.05 && t < T0.feed) {
    const k = ease((t - K.two + 0.05) / 0.22);
    EQ.visible = k > 0.4; EQ.position.set(0.0, DESK_Y + 0.21, -0.45); EQ.rotation.set(0, 0, 0); EQ.scale.setScalar(lerp(0.5, 1.15, back(clamp((t - K.lines2 + 0.06) / 0.25))));
    EQGLOW.material.opacity = 0.7 * Math.exp(-Math.max(0, t - K.lines2) / 0.4);
  }
  // the three words
  WORDS.forEach((m, i) => {
    const pop = back(clamp((t - K.threeL - 0.1 - 0.12 * i) / 0.22)), squash = ease((t - K.two + 0.02) / 0.2);
    m.visible = t >= K.threeL && t < K.lines2 + 0.05 && pop > 0.01 && squash < 0.98;
    m.position.set(lerp((i - 1) * 0.15, 0, squash), DESK_Y + 0.21 + 0.006 * Math.sin(t * 5 + i), -0.45); m.scale.set(pop * (1 - 0.6 * squash), pop * (1 - squash), 1);
  });
  // the rails: the camera flies, the lines never meet
  // the calculator: the finger comes down on "=" and the answer shows
  if (inCalc) {
    const press = bump(t, K.calc + 0.08, 0.32), fy = 0.03 + 0.012 + 0.11 * (1 - ease((t - K.calc + 0.3) / 0.38)) - 0.005 * press;
    FINGER.position.set(EQKEY.position.x + 0.002, fy, EQKEY.position.z + 0.02); FINGER.rotation.set(-0.35, 0, 0.1);
    EQKEY.position.y = 0.03 - 0.004 * press;
    const shown = t >= K.calc + 0.1 ? '4' : '2+2'; if (shown !== drawScreen.last) { drawScreen(shown); drawScreen.last = shown; }
  }
  const c0 = camAt(t); cam.position.set(c0[0], c0[1], c0[2]); cam.lookAt(c0[3], c0[4], c0[5]); cam.fov = c0[6]; cam.updateProjectionMatrix();
}

// ---------- 2D: backdrop, the stamp, the pile of "is equalle to", small print ----------
function backdrop(x, t) {
  const n = shotName(t);
  if (n === 'rail') { const q = x.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#04050B'); q.addColorStop(0.5, '#0C1230'); q.addColorStop(1, '#030308'); x.fillStyle = q; x.fillRect(0, 0, W, H);
    x.fillStyle = '#FFFFFF'; for (let i = 0; i < 140; i++) { x.globalAlpha = 0.25 + 0.6 * RN(i + 900) * (0.6 + 0.4 * Math.sin(t * 3 + i)); const s0 = 1 + 2.5 * RN(i + 901); x.fillRect(W * RN(i + 902), H * RN(i + 903), s0, s0); } x.globalAlpha = 1; return; }
  if (n === 'calc' || n === 'key') { const q = x.createRadialGradient(540, 700, 60, 540, 900, 1300); q.addColorStop(0, '#F4F2EE'); q.addColorStop(1, '#BDBAB4'); x.fillStyle = q; x.fillRect(0, 0, W, H); return; }
  x.fillStyle = '#120C08'; x.fillRect(0, 0, W, H);
}
function stamp1557(x, t) {
  const a = win(t, K.n1557 - 0.08, K.welsh - 0.12, 0.15, 0.1); if (a <= 0) return;
  const s0 = lerp(1.6, 1, ease(clamp((t - K.n1557 + 0.08) / 0.18)));
  x.save(); x.globalAlpha = a; x.fillStyle = 'rgba(70,45,20,.22)'; x.fillRect(0, 0, W, H);
  x.translate(540, 1420); x.scale(s0, s0); x.rotate(-0.06); x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 30;
  setF(x, 'italic 250px Serif', 0); x.fillStyle = '#F1E2C2'; x.fillText('1557', 0, 80); x.restore();
}
function pileNotes(x, t) {                            // "again, and again, and AGAIN": the phrase piles up over everything
  if (t < K.a1 - 0.05 || t > K.linesL + 0.25) return;
  const n = Math.min(46, Math.floor((t - K.a1 + 0.05) * 30)), wipe = ease((t - K.linesL + 0.05) / 0.3);
  for (let i = 0; i < n; i++) {
    const X0 = 60 + 960 * RN(i + 700), Y0 = 330 + 1300 * RN(i + 701), r0 = (RN(i + 702) - 0.5) * 0.5, s0 = (0.8 + 0.5 * RN(i + 703)) * back(clamp((t - K.a1 - i / 30 + 0.05) / 0.12));
    x.save(); x.translate(X0 + wipe * (X0 < 540 ? -900 : 900), Y0 - wipe * 300); x.rotate(r0 + wipe * (X0 < 540 ? -0.8 : 0.8)); x.scale(s0, s0);
    rrx(x, -150, -44, 300, 74, 10); x.fillStyle = '#EADCBE'; x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 18; x.fill(); x.shadowBlur = 0;
    setF(x, 'italic 44px Serif', 0); x.fillStyle = '#2B1C10'; x.textAlign = 'center'; x.fillText('is equalle to', 0, 10); x.restore();
  }
}
function railText(x, t) {                             // "can't be more equal": the lines never meet
  const a = win(t, K.equalW - 0.1, K.longerL - 0.04, 0.2, 0.1); if (a <= 0) return;
  x.save(); x.globalAlpha = a; x.textAlign = 'center'; setF(x, 'italic 70px Serif', 0); x.fillStyle = '#FFE2A8'; x.shadowColor = 'rgba(255,190,90,.8)'; x.shadowBlur = 30;
  x.fillText('“noe .2. thynges, can be', 540, 1430); x.fillText('moare equalle”', 540, 1510); x.restore();
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
function three(x, t) {
  setWorld(t); backdrop(x, t);
  const shake = jolt(t, K.equals, 10) + jolt(t, K.book, 8) + jolt(t, K.a3, 12) + jolt(t, K.calc + 0.08, 6) + jolt(t, K.lines2, 8);
  x.save(); x.translate(shake, shake * 0.4);
  R3.render(scene, cam); x.drawImage(glc, 0, 0);
  if (ROOM.visible) {
    label(x, HG.localToWorld(v3([0, 0.14, 0])).toArray(), 40, 230, 'Robert Recorde, a Welsh doctor', win(t, K.welsh - 0.12, K.math - 0.08, 0.25, 0.1));
    label(x, pageWorld(MARG + 170, LINE0 + 2 * LH - 12).toArray(), 40, 330, '“is equalle to”', win(t, K.isq - 0.1, K.docL - 0.05, 0.25, 0.1));
    label(x, COVER.localToWorld(v3([0, 0.05, 0])).toArray(), -40, 320, 'his algebra book, 1557', win(t, K.book - 0.12, K.againL - 0.05, 0.25, 0.1));
    label(x, pageWorld((MARG + 168 + PX - 120) / 2, LONGY - 9).toArray(), -40, -330, 'his sign, 1557', win(t, K.way - 0.08, K.calcL - 0.05, 0.2, 0.1), { bg: GOLD, fg: '#1D1D1F' });
    label(x, pageWorld(MARG + 200, LONGY + 62).toArray(), 40, 300, 'today', win(t, K.way + 0.3, K.calcL - 0.05, 0.2, 0.1));
  }
  if (VOID.visible) label(x, [0.0, 100.16, -4.0], 40, -360, 'Gemowe lines: “twins”', win(t, K.equalL + 0.3, K.longerL - 0.05, 0.25, 0.1), { bg: GOLD, fg: '#1D1D1F' });
  x.restore();
  stamp1557(x, t); pileNotes(x, t); railText(x, t);
  flash(x, t, K.equals, 0.35, 0.18); flash(x, t, K.linesL - 0.1, 0.25, 0.25); flash(x, t, K.lines2, 0.3, 0.2);
  const FP = [[K.docL, K.linesL, 'Robert Recorde (c. 1510–1558), Welsh physician and mathematician. The equals sign first appears in his algebra book The Whetstone of Witte (London, 1557) (MAA Convergence; Wikipedia, “Robert Recorde”).'],
    [K.linesL, K.longerL, '“…to auoide the tediouse repetition of these woordes : is equalle to : I will sette … a paire of paralleles, or Gemowe lines of one lengthe … bicause noe .2. thynges, can be moare equalle.” The Whetstone of Witte, 1557.'],
    [K.longerL, T0.feed, 'He drew the sign much longer than it is today (MAA Convergence); it became the standard around 1700 (Wikipedia, “Equals sign”). Scenes are illustrations.']];
  FP.forEach(([a, b, str]) => smallPrint(x, str, win(t, a + 0.15, b - 0.05, 0.3, 0.15)));
}
S.study = three;

// ---------- the switch: our reel in a phone; flicks past ads that say too much; it stops on one that says it in two lines ----------
const PHN = { cy: 610, s: 0.62 };
let FRZ = null;
function frozen() { if (!FRZ) { const [c, x] = mkc(1080, 1920); three(x, T0.feed - 1 / FPS); FRZ = c; } return FRZ; }
function bottleShape(c, X0, Y0, s, col) {
  c.save(); c.translate(X0, Y0); c.scale(s, s); c.fillStyle = col; rrx(c, -70, -150, 140, 290, 34); c.fill(); rrx(c, -42, -198, 84, 56, 12); c.fill();
  c.fillStyle = 'rgba(255,255,255,.2)'; rrx(c, -50, -120, 22, 220, 11); c.fill(); c.restore();
}
const WORDY = [
  'Introducing our revolutionary, all-new, premium bottle, crafted with care from the finest materials for people who demand more from every single sip, with advanced double-wall technology, a sleek modern finish and a lifetime of',
  'Why settle for ordinary? Our award-winning team spent years perfecting every last detail so that you can enjoy unbeatable quality, unmatched style and exceptional value, all backed by our industry-leading',
  'LIMITED TIME ONLY!!! Save up to 30%* on selected items when you spend over $50. *Terms and conditions apply. See website for full details. While stocks last. Excludes sale items, gift cards and',
];
const REELS = [{ kind: 'ours' }, { kind: 'wordy', i: 0, name: 'brand_a' }, { kind: 'wordy', i: 1, name: 'brand_b' }, { kind: 'wordy', i: 2, name: 'brand_c' }, { kind: 'two', name: 'yourbrand' }];
function wrapText(c, str, X0, Y0, maxW, lh) { let line = '', y = Y0; str.split(' ').forEach((w) => { const tl = line ? line + ' ' + w : w; if (c.measureText(tl).width > maxW && line) { c.fillText(line, X0, y); line = w; y += lh; } else line = tl; }); c.fillText(line + '…', X0, y); }
function reelPage(c, r, t) {                         // one full-screen reel, 600 x 1280
  if (r.kind === 'ours') c.drawImage(frozen(), -60, 0, 720, 1280);
  else if (r.kind === 'two') {
    const q = c.createLinearGradient(0, 0, 0, 1280); q.addColorStop(0, '#EAF3FF'); q.addColorStop(1, '#C3D8EE'); c.fillStyle = q; c.fillRect(0, 0, 600, 1280);
    bottleShape(c, 300, 430, 1.0, '#2F5D8A');
    c.save(); c.textAlign = 'center'; c.fillStyle = '#10243A'; setF(c, '800 52px Logo', -1); c.fillText('Cold for 24 hours.', 300, 720); c.fillText('Fits your cup holder.', 300, 788); c.restore();
  } else {
    c.fillStyle = '#ECECEF'; c.fillRect(0, 0, 600, 1280); bottleShape(c, 300, 290, 0.62, '#9EA2A8');
    c.save(); c.fillStyle = '#3A3A3C'; setF(c, '600 31px Body', 0); c.textAlign = 'left'; wrapText(c, WORDY[r.i], 36, 470, 528, 41); c.restore();
  }
  const q = c.createLinearGradient(0, 760, 0, 1280); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = q; c.fillRect(0, 860, 600, 420);
  rail(c, r.kind === 'two' ? t - K.lines3 : -1);
  if (r.kind === 'ours') acct(c, 'mezmedia_0', null, 'm.', '#111');
  else acct(c, r.name, 'Sponsored', r.name[0].toUpperCase(), r.kind === 'two' ? '#2F80FF' : '#8E8E93');
  setF(c, '500 26px Body', 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'left';
  c.fillText(r.kind === 'ours' ? 'Why would anyone invent the equals sign?…' : r.kind === 'two' ? 'Cold all day. That’s it. ›' : 'Read more about our story… ›', 30, 1090);
  if (r.kind !== 'ours') { rrx(c, 24, 1118, 552, 90, 18); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); setF(c, '700 34px Body', 0); c.fillStyle = INK; c.fillText('Shop now', 54, 1176); c.textAlign = 'right'; c.fillText('›', 548, 1177); c.textAlign = 'left'; }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, 1254, 600, 7); c.fillStyle = WHT; c.fillRect(0, 1254, 600 * 0.6, 7);
}
const swipeAt = (t) => {                             // four flicks; each wordy ad is on screen for a moment
  let f = 0;
  for (let i = 0; i < REELS.length - 1; i++) f += eio((t - (K.sayL - 0.18 - (REELS.length - 2 - i) * 0.34)) / 0.16);
  return f - 0.03 * bump(t, K.sayL + 0.02, 0.3);
};
function feedUI(c, t) {
  const f = swipeAt(t), i0 = Math.floor(f), off = (f - i0) * 1280;
  for (let j = 0; j < 2; j++) { const r = REELS[i0 + j]; if (!r) continue; c.save(); c.translate(0, j * 1280 - off); c.beginPath(); c.rect(0, 0, 600, 1280); c.clip(); reelPage(c, r, t); c.restore(); }
  const lk = t - K.lines3;
  if (lk > 0 && lk < 0.9) { c.save(); c.globalAlpha = lk < 0.6 ? 1 : 1 - (lk - 0.6) / 0.3; c.fillStyle = WHT; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.translate(300, 560); const s0 = back(clamp(lk / 0.25)) * (1 + 0.15 * clamp((lk - 0.4) / 0.5)); c.scale(s0, s0); heart(c, 0, 0, 110); c.restore(); }
}
S.feed = (x, t) => {
  stage(x, true);
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
